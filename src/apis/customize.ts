import { createApi } from './request'
import { v4 as uuidv4 } from 'uuid'

/**
 * 表情包上传接口
 */
export const fetchEmoticonCustomizeUpload = createApi<FormData, any>(
  '/api/v1/emoticon/customize/upload'
)

/**
 * 文章附件上传接口
 */
export const fetchArticleAnnexUpload = createApi<FormData, any>('/api/v1/article-annex/upload')

// 上传头像裁剪图片服务接口
export const fetchUploadImage = createApi<FormData, any>('/api/v1/upload/media-file')

// 查询大文件拆分信息服务接口
export const fetchUploadInitMultipart = createApi('/api/v1/upload/init-multipart')

// 文件拆分上传服务接口
export const fetchUploadMultipart = createApi<FormData, any>('/api/v1/upload/multipart')

/** Travin IM：camelCase + reqId 幂等 */
const messageSendApi = createApi<TravinMessageSendRequest, TravinMessageSendResponse>(
  '/app-api/im/message/send'
)

export interface ServTalkMessageSendRequest {
  type: string
  quote_id?: string
  body: any
  talk_mode: number
  to_from_id: number
  msg_id?: string
  /** 重试时必须保持不变 */
  req_id?: string
}

interface TravinMessageSendRequest {
  reqId: string
  msgId: string
  type: string
  talkMode: number
  toFromId: number
  body: any
  quoteId: string
}

interface TravinMessageSendResponse {
  msgId: string
  sequence: number
  sendTime: string
}

/** 适配旧调用方 snake_case，内部转 Travin 协议 */
export async function fetchMessageSend(req: ServTalkMessageSendRequest) {
  const reqId = req.req_id || uuidv4()
  const msgId = req.msg_id || uuidv4()
  return messageSendApi({
    reqId,
    msgId,
    type: req.type,
    talkMode: req.talk_mode,
    toFromId: req.to_from_id,
    body: req.body,
    quoteId: req.quote_id || ''
  })
}

/** 注册/找回密码：邮箱验证码 */
export const fetchImSendEmailCode = createApi<{ email: string; scene: string }, boolean>(
  '/app-api/im/auth/send-email-code'
)
