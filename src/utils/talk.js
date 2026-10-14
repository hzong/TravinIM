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
    talk_mode: 1,
    to_from_id: 0,
    name: '未设置',
    remark: '',
    avatar: '',
    is_disturb: 2,
    is_top: 2,
    is_robot: 2,
    unread_num: 0,
    content: '...',
    draft_text: '',
    msg_text: '',
    index_name: '',
    updated_at: datetime()
  }

  const merged = {
    ...params,
    talk_mode: params.talk_mode ?? params.talkMode,
    to_from_id: params.to_from_id ?? params.toFromId,
    is_disturb: params.is_disturb ?? params.isDisturb,
    is_top: params.is_top ?? params.isTop,
    is_robot: params.is_robot ?? params.isRobot,
    unread_num: params.unread_num ?? params.unreadNum,
    msg_text: params.msg_text ?? params.msgText,
    updated_at: params.updated_at ?? params.updatedAt
  }
  options = { ...options, ...merged }
  options.index_name = `${options.talk_mode}_${options.to_from_id}`

  const peerNo = params.peer_user_no ?? params.peerUserNo
  if (peerNo && options.to_from_id) {
    rememberUserNo(peerNo, options.to_from_id)
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
