import { NAvatar } from 'naive-ui'
import { useTalkStore, useUserStore } from '@/store'
import { notifyIcon } from '@/constant/default'
import MqttSocket from '@/plugins/mqtt-socket.ts'
import EventTalk from '@/event/talk.ts'
import EventKeyboard from '@/event/keyboard.ts'
import EventRevoke from '@/event/revoke.ts'
import { isLogin } from '@/utils/auth.ts'
import { rememberUserNo, resolveUserIdByUserNo } from '@/utils/im-user-resolve.ts'

class Connect {
  private conn: MqttSocket

  constructor() {
    this.conn = new MqttSocket({
      onError: () => {},
      onOpen: () => {
        useUserStore().updateSocketStatus(true)
        useTalkStore().loadTalkList()
      },
      onClose: () => {
        useUserStore().updateSocketStatus(false)
      },
      onKicked: () => {
        useUserStore().logoutLogin()
      }
    })

    this.bindEvents()
  }

  connect(): void {
    if (!isLogin()) {
      window.location.reload()
      return
    }
    this.conn.connection()
  }

  disconnect(): void {
    this.conn.close()
  }

  isConnect() {
    return this.conn.connect?.readyState === 1
  }

  emit(event: string, data: any) {
    this.conn.emit(event, data)
  }

  /** 消息已达回执（IM_MQTT §5.4） */
  emitMessageReceivedAck(chatMsgId: string) {
    if (!chatMsgId) return
    this.conn.emit('ack', { ackId: chatMsgId, status: 'received' })
  }

  bindEvents() {
    this.onImMessage()
    this.onImMessageKeyboard()
    this.onImMessageRevoke()
    this.onImContactApply()
    this.onImGroupApply()
    this.onImUserProfileUpdate()
    this.onEventError()
  }

  onImUserProfileUpdate() {
    this.conn.on('im.user.profile.update', (envelope: any) => {
      const p = envelope?.payload ?? envelope
      const userNo = p.userId || p.userNo
      if (!userNo) return
      const uid = resolveUserIdByUserNo(userNo)
      if (uid) {
        rememberUserNo(userNo, uid)
      }
      const talkStore = useTalkStore()
      talkStore.items.forEach((item) => {
        if (item.talkMode !== 1 || !uid || item.toId !== uid) return
        talkStore.updateItem({
          index_name: item.index_name,
          name: p.nickname || item.name,
          avatar: p.avatar || item.avatar
        })
      })
    })
  }

  onImMessage() {
    this.conn.on('im.message', (envelope: any) => new EventTalk(envelope))
  }

  onImMessageKeyboard() {
    this.conn.on('im.message.keyboard', (envelope: any) => new EventKeyboard(envelope))
  }

  onImMessageRevoke() {
    this.conn.on('im.message.revoke', (envelope: any) => new EventRevoke(envelope))
  }

  onImContactApply() {
    this.conn.on('im.contact.apply', (envelope: any) => {
      const payload = envelope?.payload ?? {}
      window['$notification']?.create({
        title: '好友申请通知',
        content: payload.remark,
        description: `申请人: ${payload.nickname}`,
        meta: envelope?.ts ? new Date(envelope.ts).toLocaleString() : '',
        avatar: () =>
          h(NAvatar, {
            size: 'small',
            round: true,
            src: notifyIcon,
            style: 'background-color:#fff;'
          }),
        duration: 10000
      })

      useUserStore().isContactApply = true
    })
  }

  onImGroupApply() {
    this.conn.on('im.group.apply', () => {
      window['$notification']?.create({
        title: '入群申请通知',
        content: '有新的入群申请，请注意查收',
        avatar: () =>
          h(NAvatar, {
            size: 'small',
            round: true,
            src: notifyIcon,
            style: 'background-color:#fff;'
          }),
        duration: 10000
      })

      useUserStore().isGroupApply = true
    })
  }

  onEventError() {
    this.conn.on('event_error', (envelope: any) => {
      const code = envelope?.payload?.code
      console.error('MQTT event_error:', code)
      window['$message']?.error(`错误代码: ${code}`)
    })
  }
}

export default new Connect()
