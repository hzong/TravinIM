import { useUserStore, useDialogueStore } from '@/store'
import router from '@/router'

class Base {
  /**
   * 初始化
   */
  constructor() {}

  /**
   * 获取当前登录用户的ID
   */
  getAccountId(): number {
    return useUserStore().uid
  }

  getTalkParams(): { talkMode: number; toId: number; index_name: string } {
    const dialogueStore = useDialogueStore()

    const { talkMode, toId } = dialogueStore.target

    return {
      talkMode,
      toId,
      index_name: dialogueStore.index_name
    }
  }

  /**
   * 判断消息是否来自当前对话
   *
   * @param {Number} talkMode 聊天消息类型[1:私信;2:群聊;]
   * @param {Number} toId 发送者ID
   */
  isTalk(talkMode: number, toId: number): boolean {
    const params = this.getTalkParams()

    return params.toId == toId && talkMode == params.talkMode
  }

  /**
   * 判断用户是否打开对话页
   */
  isTalkPage(): boolean {
    return ['/message', '/'].includes(router.currentRoute.value.path)
  }
}

export default Base
