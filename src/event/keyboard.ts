import Base from './base'

import { useDialogueStore } from '@/store'
import { resolveUserIdByUserNo } from '@/utils/im-user-resolve'

/**
 * 正在输入。对方 userNo 从 Envelope.from 解析，再对照当前会话的数字 toId。
 */
class Keyboard extends Base {
  private fromId = 0

  constructor(envelope: any) {
    super()
    const from = String(envelope?.from || '')
    const userNo = from.includes('@') ? from.slice(0, from.indexOf('@')) : from
    this.fromId = resolveUserIdByUserNo(userNo)
    this.handle()
  }

  private handle() {
    const params = this.getTalkParams()
    if (!params.index_name || params.talkMode != 1) {
      return false
    }
    if (params.toId != this.fromId) {
      return false
    }
    useDialogueStore().triggerKeyboard()
  }
}

export default Keyboard
