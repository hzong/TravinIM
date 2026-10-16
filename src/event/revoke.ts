import Base from './base'
import { useDialogueStore, useTalkStore } from '@/store'
import { datetime } from '@/utils/datetime'
import { myUserNo, resolveUserIdByUserNo } from '@/utils/im-user-resolve'

class Revoke extends Base {
  fromId = 0
  toId = 0
  talkMode = 0
  msgId = ''
  fromUserNo = ''

  constructor(envelope: any) {
    super()
    const payload = envelope?.payload ?? {}
    this.talkMode = Number(payload.talkMode) || 0
    this.fromUserNo = payload.fromId == null ? '' : String(payload.fromId)
    this.fromId = resolveUserIdByUserNo(this.fromUserNo)
    const toRaw = payload.toId == null ? '' : String(payload.toId)
    if (this.talkMode === 2) {
      this.toId = Number(toRaw) || 0
    } else if (this.fromUserNo && this.fromUserNo === myUserNo()) {
      this.toId = resolveUserIdByUserNo(toRaw)
    } else {
      this.toId = this.fromId
    }
    this.msgId = payload.msgId || ''
    this.handle()
  }

  isCurrSender(): boolean {
    return this.fromUserNo ? this.fromUserNo === myUserNo() : this.fromId == this.getAccountId()
  }

  getIndexName(): string {
    if (this.talkMode == 2) {
      return `${this.talkMode}_${this.toId}`
    }
    const peerId = this.isCurrSender() ? this.toId : this.fromId
    return `${this.talkMode}_${peerId}`
  }

  handle() {
    useTalkStore().updateItem({
      index_name: this.getIndexName(),
      msgText: '[撤回了一条消息]',
      updatedAt: datetime()
    })
    if (!this.isTalk(this.talkMode, this.toId)) {
      return
    }
    useDialogueStore().updateDialogueRecord({
      msgId: this.msgId,
      isRevoked: 1
    })
  }
}

export default Revoke
