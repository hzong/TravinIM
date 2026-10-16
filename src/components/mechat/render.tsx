import { RoleEnum, MessageTypeEnum, IMessage, StatusEnum } from '@/components/chat'
import { ITalkRecord } from '@/types/chat.ts'
import { components } from './components.tsx'

function render(extra: any, message: ITalkRecord, role: string) {
  const msgType = message.msgType
  return components[msgType]?.(extra, message, role) || <unknown-message msgType={msgType} />
}

export const formatChatMessage = (loginUserId: number, chat: ITalkRecord): IMessage => {
  const { msgId, fromId, sendTime, nickname, avatar, extra } = chat

  if (fromId == 0 || chat.msgType >= 1000) {
    return {
      msgId: msgId,
      role: RoleEnum.SYSTEM,
      type: MessageTypeEnum.CUSTOM,
      time: sendTime,
      render: () => render(extra, chat, RoleEnum.SYSTEM),
      status: StatusEnum.SENT
    }
  }

  if (chat.isRevoked == 1) {
    return {
      msgId: msgId,
      role: RoleEnum.SYSTEM,
      type: MessageTypeEnum.TEXT,
      time: sendTime,
      content: '此消息已被撤回',
      status: StatusEnum.SENT
    }
  }

  const role = fromId != loginUserId ? RoleEnum.ASSISTANT : RoleEnum.USER

  const quote = chat?.quote
    ? {
        quoteId: chat.quote?.quoteId || '',
        content: chat.quote?.content || ''
      }
    : undefined

  let status = StatusEnum.SENT
  if ([2, 3].includes(chat.status)) {
    status = chat.status == 2 ? StatusEnum.SENDING : StatusEnum.ERROR
  }

  return {
    role,
    msgId: msgId,
    type: MessageTypeEnum.CUSTOM,
    time: sendTime,
    name: nickname,
    avatar: avatar,
    quote: quote,
    render: () => render(extra, chat, role),
    status
  }
}
