import { fetchMessageSend } from '@/apis/customize'
import { fetchApi } from '@/apis/request'
import * as chat from '@/constant/chat'
import { datetime } from '@/utils/datetime'
import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { nextTick } from 'vue'
import { useDialogueStore } from './dialogue'
import { useUserStore } from './user'

type IAsyncMessage = {
  msgId?: string // 消息ID
  reqId?: string // HTTP 幂等请求号，重试勿变
  type: string // 消息类型
  talkMode: number // 聊天类型
  toId: number // 聊天对象ID[群ID或者好友ID]
  sessionNo?: string
  quoteId: string // 引用消息ID
  body: any // 消息体
}

// 消息状态常量
const MESSAGE_STATUS_SENT = 1
const MESSAGE_STATUS_PENDING = 2
const MESSAGE_STATUS_FAILED = 3

const MAX_RETRIES = 6

// 编辑器草稿
export const useAsyncMessageStore = defineStore('async-message', () => {
  const { uid, nickname, avatar } = useUserStore()
  const dialogueStore = useDialogueStore()

  // 待推送消息ID
  let items: IAsyncMessage[] = []

  // 异步消息ID缓存
  const msgIdsSet = new Set<string>()
  // 添加待推送消息
  function addAsyncMessage(data: IAsyncMessage) {
    data.msgId = uuid()
    data.reqId = data.reqId || uuid()
    items.push(data)

    msgIdsSet.add(data.msgId)

    addRecordList(data)
    sendMessage(data)
  }

  async function sendMessage(message: IAsyncMessage, retryCount = 0) {
    try {
      const [err] = await fetchApi(fetchMessageSend, message)
      if (err) {
        if (retryCount < MAX_RETRIES) {
          await delay(delayStrategy(retryCount))
          await sendMessage(message, retryCount + 1)
        } else {
          console.error(`Failed to send message after ${MAX_RETRIES} retries`, message)
          updateMessageStatus(message.msgId!, MESSAGE_STATUS_FAILED)
          msgIdsSet.delete(message.msgId!)
        }
        return
      }

      // 更新对话记录状态
      updateMessageStatus(message.msgId!, MESSAGE_STATUS_SENT)

      // 发送成功后将消息从待推送列表中移除
      items = items.filter((item) => item.msgId !== message.msgId)
    } catch (error) {
      console.error('Error sending message', error, message)
    }
  }

  const msgTypeMap = {
    text: chat.ChatMsgTypeText,
    code: chat.ChatMsgTypeCode,
    image: chat.ChatMsgTypeImage,
    audio: chat.ChatMsgTypeAudio,
    video: chat.ChatMsgTypeVideo,
    file: chat.ChatMsgTypeFile,
    location: chat.ChatMsgTypeLocation,
    card: chat.ChatMsgTypeCard,
    forward: chat.ChatMsgTypeForward,
    login: chat.ChatMsgTypeLogin,
    vote: chat.ChatMsgTypeVote,
    mixed: chat.ChatMsgTypeMixed
  }

  // 推送到会话记录中
  async function addRecordList(data: IAsyncMessage) {
    const record = {
      msgId: data.msgId as string,
      sequence: 0,
      msgType: msgTypeMap[data.type],
      fromId: uid,
      nickname: nickname,
      avatar: avatar,
      isRevoked: 2,
      sendTime: datetime(),
      extra: data.body,
      quote: {},
      status: MESSAGE_STATUS_PENDING
    }

    if (data.quoteId) {
      const quote = dialogueStore.records.find((item) => item.msgId === data.quoteId)
      if (quote) {
        record.quote = {
          quoteId: quote.msgId,
          msgType: 1,
          nickname: quote.nickname,
          content: quote.extra.content ?? '查看消息'
        }
      }
    }

    dialogueStore.records.push(record)

    nextTick(() => {
      dialogueStore.scrollToBottom(false)
    })
  }

  // 更新消息状态
  function updateMessageStatus(msgId: string, status: number) {
    dialogueStore.records.forEach((item) => {
      if (item.msgId === msgId) {
        item.status = status
      }
    })
  }

  const msgIdsCache = {
    has(msgId: string): boolean {
      return msgIdsSet.has(msgId)
    },
    clear(msgId: string) {
      msgIdsSet.delete(msgId)
    }
  }

  return {
    addAsyncMessage,
    msgIdsCache
  }
})

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function delayStrategy(retryCount: number): number {
  return retryCount * 1500
}

function uuid(): string {
  // @ts-expect-error
  return uuidv4().replaceAll('-', '')
}
