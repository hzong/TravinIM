/**
 * MQTT Envelope（camelCase payload，userNo）→ 旧版 WebSocket 事件（snake_case + bigint id）
 */

import { myUserNo, rememberUserNo, resolveUserIdByUserNo } from '@/utils/im-user-resolve'

function num(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function parseExtraQuote(extra: unknown, quote: unknown) {
  let extraObj: any = extra ?? {}
  if (typeof extraObj === 'string') {
    try {
      extraObj = JSON.parse(extraObj)
    } catch {
      extraObj = {}
    }
  }
  let quoteObj: any = quote ?? null
  if (typeof quoteObj === 'string') {
    try {
      quoteObj = JSON.parse(quoteObj)
    } catch {
      quoteObj = {}
    }
  }
  return { extra: extraObj, quote: quoteObj }
}

function resolveTalkIds(talkMode: number, fromRaw: unknown, toFromRaw: unknown) {
  const fromNo = fromRaw == null ? '' : String(fromRaw)
  const toFromNo = toFromRaw == null ? '' : String(toFromRaw)
  const myNo = myUserNo()

  if (talkMode === 2) {
    const groupId = /^\d+$/.test(toFromNo) ? Number(toFromNo) : num(toFromRaw)
    return {
      from_id: resolveUserIdByUserNo(fromNo),
      to_from_id: groupId,
      from_user_no: fromNo
    }
  }

  // 私聊：会话索引 to_from_id = 对方 bigint userId
  if (fromNo && myNo && fromNo === myNo) {
    const peerId = resolveUserIdByUserNo(toFromNo)
    return { from_id: resolveUserIdByUserNo(myNo), to_from_id: peerId, from_user_no: fromNo }
  }
  const peerId = resolveUserIdByUserNo(fromNo)
  if (fromNo && peerId) {
    rememberUserNo(fromNo, peerId)
  }
  return { from_id: peerId, to_from_id: peerId, from_user_no: fromNo }
}

/** im.message → EventTalk 入参 */
export function envelopeToTalkEvent(envelope: any) {
  const p = envelope?.payload ?? envelope
  const { extra, quote } = parseExtraQuote(p.extra, p.quote)
  const talkMode = num(p.talkMode)
  const ids = resolveTalkIds(talkMode, p.fromId, p.toId ?? p.toFromId)

  return {
    talk_mode: talkMode,
    to_from_id: ids.to_from_id,
    from_id: ids.from_id,
    from_user_no: ids.from_user_no,
    body: {
      msg_id: p.msgId || envelope?.msgId,
      msg_type: num(p.msgType),
      nickname: p.nickname,
      avatar: p.avatar,
      extra,
      quote,
      sequence: p.sequence,
      send_time: p.sendTime,
      is_revoked: num(p.isRevoked)
    }
  }
}

/** im.message.keyboard → EventKeyboard 入参 */
export function envelopeToKeyboardEvent(envelope: any) {
  const p = envelope?.payload ?? envelope
  const fromNo = p.fromId == null ? '' : String(p.fromId)
  return {
    from_id: resolveUserIdByUserNo(fromNo),
    from_user_no: fromNo
  }
}

/** im.message.revoke → EventRevoke 入参 */
export function envelopeToRevokeEvent(envelope: any) {
  const p = envelope?.payload ?? envelope
  const talkMode = num(p.talkMode)
  const ids = resolveTalkIds(talkMode, p.fromId, p.toId ?? p.toFromId)
  return {
    talk_mode: talkMode,
    to_from_id: ids.to_from_id,
    from_id: ids.from_id,
    msg_id: p.msgId,
    remark: p.remark || '[撤回了一条消息]'
  }
}

/** im.contact.apply */
export function envelopeToContactApplyEvent(envelope: any) {
  const p = envelope?.payload ?? envelope
  return {
    remark: p.remark,
    nickname: p.nickname,
    apply_time: envelope?.ts ? new Date(envelope.ts).toLocaleString() : ''
  }
}

export function envelopeToEventError(envelope: any) {
  const p = envelope?.payload ?? envelope
  return {
    error_code: p?.code ?? p,
    error_message: `错误码 ${p?.code ?? p}`
  }
}
