import { storage } from './index'
import { setToken, deleteToken } from './auth'
import { rememberUserNo } from '@/utils/im-user-resolve'

/** 登录响应（Travin IM App API，camelCase） */
export interface ImAuthSession {
  accessToken: string
  expiresTime: number
  userId?: number
  userNo?: string
  appCode?: string
  mqttUsername?: string
  mqttClientId?: string
}

const IM_SESSION_KEY = 'IM_AUTH_SESSION'
const DEVICE_SUFFIX_KEY = 'IM_DEVICE_SUFFIX'

/** Web 端 8 位 deviceSuffix，与 JWT / Full JID 对齐 */
export function getOrCreateDeviceSuffix(): string {
  let suffix = storage.get(DEVICE_SUFFIX_KEY) as string
  if (suffix && suffix.length === 8) {
    return suffix
  }
  suffix = Math.random().toString(16).slice(2, 10).padEnd(8, '0').slice(0, 8)
  storage.set(DEVICE_SUFFIX_KEY, suffix, null)
  return suffix
}

export function getAppCode(): string {
  return import.meta.env.VITE_APP_CODE || 'xyim'
}

export function getImSession(): ImAuthSession | null {
  return storage.get(IM_SESSION_KEY) as ImAuthSession | null
}

export function clearImSession(): void {
  storage.remove(IM_SESSION_KEY)
  deleteToken()
}

/**
 * 写入 HTTP Bearer 与 MQTT 连接参数。
 * expiresTime 为服务端绝对毫秒时间戳。
 */
export function applyImAuthSession(data: ImAuthSession & Record<string, any>): void {
  const accessToken = data.accessToken ?? data.access_token
  let expiresTime = data.expiresTime
  if (!expiresTime && data.expires_in) {
    expiresTime = Date.now() + Number(data.expires_in) * 1000
  }
  const session: ImAuthSession = {
    accessToken,
    expiresTime: expiresTime!,
    userId: data.userId ?? data.userId,
    userNo: data.userNo ?? data.user_no,
    appCode: data.appCode ?? data.app_code,
    mqttUsername: data.mqttUsername ?? data.mqtt_username,
    mqttClientId: data.mqttClientId ?? data.mqtt_client_id
  }
  const ttlSec = Math.max(Math.floor((session.expiresTime - Date.now()) / 1000), 60)
  setToken(session.accessToken, ttlSec)
  storage.set(IM_SESSION_KEY, session, ttlSec)
  if (session.userNo && session.userId) {
    rememberUserNo(session.userNo, session.userId)
  }
}

/** 构建 Travin 登录/注册公共字段 */
export function buildImAuthRequest(password: string) {
  const resource = 'web'
  return {
    password,
    appCode: getAppCode(),
    resource,
    deviceSuffix: getOrCreateDeviceSuffix()
  }
}
