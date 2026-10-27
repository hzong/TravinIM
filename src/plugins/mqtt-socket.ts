import mqtt, { type MqttClient } from 'mqtt'
import { v4 as uuidv4 } from 'uuid'
import { getToken } from '@/utils/auth.ts'
import { getAppCode, getImSession } from '@/utils/im-auth.ts'

type MqttCallback = (payload: any, raw?: string) => void

interface MqttSocketEvents {
  onOpen: () => void
  onClose: () => void
  onError: (err: Error) => void
  /** 认证被拒绝。调用方应清登录态，不要继续重连。 */
  onKicked: () => void
}

/**
 * 与 WsSocket 同构的 MQTT 封装：inbox 收 Envelope，outbox 发 ack/keyboard 等。
 */
export default class MqttSocket {
  /** 兼容 connect.ts 里对 WebSocket.readyState 的判断 */
  connect: { readyState: number } | null = null

  private client: MqttClient | null = null
  private onCallBacks: Record<string, MqttCallback> = {}
  private inboxTopic = ''
  private outboxTopic = ''
  private intentionalClose = false
  /** 已经因为认证失败停过一次，避免 error 和 disconnect 各清一次登录态。 */
  private authDenied = false

  constructor(
    private events: Partial<MqttSocketEvents> = {}
  ) {}

  on(event: string, callback: MqttCallback): this {
    this.onCallBacks[event] = callback
    return this
  }

  connection(): void {
    if (this.client?.connected) {
      return
    }
    const session = getImSession()
    const token = getToken()
    if (!session?.mqttClientId || !session?.mqttUsername || !token) {
      console.error('[MqttSocket] 缺少 mqttClientId / mqttUsername / token')
      return
    }

    const appCode = session.appCode || getAppCode()
    const userNo = session.userNo
    if (!userNo) {
      console.error('[MqttSocket] 缺少 userNo')
      return
    }

    this.inboxTopic = `im/${appCode}/user/${userNo}/inbox`
    this.outboxTopic = `im/${appCode}/user/${userNo}/outbox`

    const host = import.meta.env.VITE_MQTT_HOST || '127.0.0.1'
    const port = Number(import.meta.env.VITE_MQTT_PORT || 8084)
    const path = import.meta.env.VITE_MQTT_PATH || '/mqtt'
    const protocol = (import.meta.env.VITE_MQTT_PROTOCOL || 'wss') as 'wss' | 'ws'

    this.intentionalClose = false
    this.authDenied = false
    this.client = mqtt.connect({
      protocol,
      host,
      port,
      path,
      clientId: session.mqttClientId,
      username: session.mqttUsername,
      password: token,
      clean: true,
      reconnectPeriod: 3000,
      keepalive: 60
    })

    this.connect = { readyState: 0 }

    this.client.on('connect', () => {
      this.connect = { readyState: 1 }
      this.client?.subscribe(this.inboxTopic, { qos: 1 }, (err) => {
        if (err) {
          this.events.onError?.(err)
          return
        }
        this.events.onOpen?.()
      })
    })

    this.client.on('message', (_topic, buf) => {
      try {
        const envelope = JSON.parse(buf.toString())
        const event = envelope?.event
        if (event && this.onCallBacks[event]) {
          // 回调拿到完整 Envelope，由 connect 层做 snake_case 适配
          this.onCallBacks[event](envelope, buf.toString())
        } else if (event === 'event_error') {
          this.onCallBacks['event_error']?.(envelope, buf.toString())
        } else {
          console.warn(`[MqttSocket] 未绑定事件: ${event}`)
        }
      } catch (e) {
        console.error('[MqttSocket] 解析消息失败', e)
      }
    })

    this.client.on('close', () => {
      this.connect = null
      if (!this.intentionalClose) {
        this.events.onClose?.()
      }
    })

    this.client.on('error', (err) => {
      if (isAuthDeniedMessage(err?.message)) {
        this.stopAfterAuthDenied()
        return
      }
      this.events.onError?.(err)
    })

    // MQTT 5 的断开包。4/5 是 3.1 的拒绝码，134/135 是未授权或用户名密码错误。
    this.client.on('disconnect', (packet: { reasonCode?: number }) => {
      const code = packet?.reasonCode
      if (code === 4 || code === 5 || code === 134 || code === 135) {
        this.stopAfterAuthDenied()
      }
    })
  }

  /**
   * 认证失败就停掉自动重连。普通断线不走这里，仍按 3 秒重连。
   */
  private stopAfterAuthDenied(): void {
    if (this.authDenied || this.intentionalClose) {
      return
    }
    this.authDenied = true
    this.intentionalClose = true
    const client = this.client
    if (client) {
      client.options.reconnectPeriod = 0
      client.end(true)
    }
    this.client = null
    this.connect = null
    this.events.onKicked?.()
  }

  close(): void {
    this.intentionalClose = true
    this.client?.end(true)
    this.client = null
    this.connect = null
  }

  /**
   * 上行：包装为 MQTT Envelope 发到 outbox（与 IM_MQTT 一致）。
   */
  emit(event: string, payload: any): void {
    if (!this.client?.connected) {
      console.error('[MqttSocket] 未连接，无法 emit', event)
      return
    }
    if (event === 'pong' || event === 'ping') {
      return
    }
    const session = getImSession()
    const envelope: Record<string, unknown> = {
      ver: '1.0',
      event,
      ts: Date.now(),
      msgId: uuidv4(),
      from: session?.mqttUsername || '',
      payload: normalizeOutboxPayload(event, payload)
    }
    // ack：ackId 在 Envelope 根上，payload 仅 status（IM_MQTT §5.4）
    if (event === 'ack') {
      envelope.ackId = payload.ack_id ?? payload.ackId
      envelope.payload = { status: payload.status || 'received' }
    }
    this.client.publish(this.outboxTopic, JSON.stringify(envelope), { qos: 1 })
  }
}

/** CONNACK 拒绝文案。网络连不上不算被踢。 */
function isAuthDeniedMessage(message?: string): boolean {
  const text = (message || '').toLowerCase()
  return text.includes('not authorized')
    || text.includes('not authorised')
    || text.includes('bad user name')
    || text.includes('bad username')
}

/** keyboard 等上行字段转为 camelCase */
function normalizeOutboxPayload(event: string, payload: any) {
  if (event === 'ack') {
    return { status: payload.status || 'received' }
  }
  if (event === 'im.message.keyboard') {
    return {
      talkMode: payload.talkMode ?? payload.talkMode ?? 1,
      toId: payload.toId ?? payload.toId ?? payload.toId,
      action: payload.action || 'typing'
    }
  }
  return payload
}
