import { datetime } from './datetime'
import { rememberUserNo } from './im-user-resolve'
import music from '@/assets/music.mp3'

const audio = new Audio(music)

export const KEY_INDEX_NAME = 'send_message_index_name'

// 播放消息提示
export function playMusic(muted = false) {
  audio.currentTime = 0
  audio.muted = muted
  audio.play()
}

/**
 * 格式化聊天对话列表数据
 *
 * @param {Object} params
 */
export function formatTalkItem(params) {
  let options = {
    talkMode: 1,
    toId: 0,
    name: '未设置',
    remark: '',
    avatar: '',
    isDisturb: 0,
    isTop: 0,
    isRobot: 0,
    unreadNum: 0,
    content: '...',
    draftText: '',
    msgText: '',
    index_name: '',
    updatedAt: datetime()
  }

  const merged = {
    ...params,
    talkMode: params.talkMode ?? params.talkMode,
    toId: params.toId ?? params.toId,
    isDisturb: params.isDisturb ?? params.isDisturb,
    isTop: params.isTop ?? params.isTop,
    isRobot: params.isRobot ?? params.isRobot,
    unreadNum: params.unreadNum ?? params.unreadNum,
    msgText: params.msgText ?? params.msgText,
    updatedAt: params.updatedAt ?? params.updatedAt,
    sessionNo: params.sessionNo ?? params.sessionNo ?? ''
  }
  options = { ...options, ...merged }
  options.index_name = `${options.talkMode}_${options.toId}`

  const peerNo = params.peer_user_no ?? params.peerUserNo
  if (peerNo && options.toId) {
    rememberUserNo(peerNo, options.toId)
  }

  return options
}

/**
 * 获取需要打开的对话索引值
 *
 * @returns
 */
export function getCacheIndexName() {
  let index_name = sessionStorage.getItem(KEY_INDEX_NAME)

  if (index_name) {
    sessionStorage.removeItem(KEY_INDEX_NAME)
  }

  return index_name
}

/**
 * 获取需要打开的对话索引值
 *
 * @returns
 */
export function setCacheIndexName(type, id) {
  sessionStorage.setItem(KEY_INDEX_NAME, `${type}_${id}`)
}
