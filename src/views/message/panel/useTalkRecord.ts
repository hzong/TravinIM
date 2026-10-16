import { fetchMessageRecords } from '@/apis/api'
import { useDialogueStore } from '@/store'
import { ITalkRecord } from '@/types/chat'
import { safeParseJson } from '@/utils/common'

export function useTalkRecord() {
  const dialogueStore = useDialogueStore()

  const records = computed((): ITalkRecord[] => dialogueStore.records)

  let cursor = 0

  // 加载数据列表
  const loadChatRecord = async (): Promise<boolean> => {
    const { target: talk } = dialogueStore

    const request: {
      talkMode: number
      toId: number
      sessionNo?: string
      limit: number
      cursor?: number
    } = {
      talkMode: talk.talkMode,
      toId: talk.toId,
      sessionNo: talk.sessionNo,
      limit: 30
    }
    if (cursor > 0) {
      request.cursor = cursor
    }

    try {
      console.log('Loading talk records with request:', request)
      const data = await fetchMessageRecords(request)

      if (request.talkMode !== talk.talkMode || request.toId !== talk.toId) {
        console.error('Talk mode or toId changed')
        throw new Error('Talk mode or toId changed')
      }

      if (!request.cursor) {
        dialogueStore.clearDialogueRecord()
      }

      const list = data.items.map((item: any) => {
        item.extra = safeParseJson(item.extra || '{}')
        item.quote = safeParseJson(item.quote || '{}')
        item.status = 1
        return item
      })

      dialogueStore.unshiftDialogueRecord(list.reverse())
      cursor = data.cursor

      return data.items.length < request.limit ? false : true
    } catch (error) {
      console.error('Error loading talk records:', error)
      throw error
    }
  }

  // 重置对话记录
  const resetTalkRecord = (): void => {
    cursor = 0
    dialogueStore.clearDialogueRecord()
  }

  return { records, loadChatRecord, dialogueStore, resetTalkRecord }
}
