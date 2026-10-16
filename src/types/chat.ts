// 会话最后一条消息
export interface ISessionLastMessage {
  msgId: string // 消息ID
  sequence: number // 消息时序ID（消息排序）
  msgType: number // 消息类型
  userId: number // 发送者ID
  receiver_id: number // 接受者ID
  content: string // 消息内容
  mention: number[] // 提及列表
}

// 会话列表
export interface ISession {
  index_name: string // 索引名称
  talkMode: number // 聊天类型
  toId: number // 接收者id
  sessionNo?: string // 服务端会话号
  name: string // 昵称
  avatar: string // 头像
  remark: string // 备注
  isDisturb: number // 是否免打扰
  isRobot: number // 是否机器人
  isTop: number // 置顶
  unreadNum: number // 未读消息数
  updatedAt: string // 最后发送时间
  msgText?: string // 消息内容
  draftText?: string // 草稿文本
}

// 消息记录
export interface ITalkRecord {
  msgId: string // 消息ID
  sequence: number // 消息时序ID（消息排序）
  msgType: number // 消息类型
  fromId: number // 发送者id
  nickname: string // 昵称
  avatar: string // 头像
  isRevoked: number // 是否撤回
  sendTime: string // 发送时间
  extra: any // 消息内容
  quote: any // 消息内容
  status: number // 消息状态 1发送成功 2发送中 3发送失败
}

export interface ITalkRecordExtraText {
  content: string
  mentions?: number[]
}

export interface ITalkRecordExtraCode {
  lang: string
  code: string
}

export interface ITalkRecordExtraFile {
  drive: number
  name: string
  path: string
  size: number
}

export interface ITalkRecordExtraForward {
  msgIds: number[]
  receiver_id: number
  talk_type: number
  userId: number
  records: {
    nickname: string
    content: string
  }[]
}

export interface ITalkRecordExtraGroupNotice {
  owner_id: number
  owner_name: string
  title: number
  content: string
}

export interface ITalkRecordExtraVideo {
  cover: string
  url: string
  duration: number
  size: number
}

export interface ITalkRecordExtraMixed {
  items: {
    type: number
    content: string
    link: string
  }[]
}

export interface ITalkRecordExtraAudio {
  name: string
  size: number
  url: string
  duration: number
}

export interface ITalkRecordExtraLogin {
  ip: string
  address: string
  agent: string
  platform: string
  reason: string
  datetime: string
}

export interface ITalkRecordExtraImage {
  name: string
  size: number
  url: string
  width: number
  height: number
}

export interface ITalkRecordExtraVote {
  vote_id: number
}

export interface IVoteDetail {
  answer_mode: number
  answer_num: number
  answer_options: {
    key: string
    value: string
    progress: number
    num: number
    is_checked: boolean
  }[]
  answered_num: number
  answered_users: string[]
  is_anonymous: number
  title: string
  vote_id: number
  is_checked: boolean
  is_submit: boolean
}
