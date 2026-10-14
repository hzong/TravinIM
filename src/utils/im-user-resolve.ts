import { getImSession } from '@/utils/im-auth'

/** MQTT payload 使用 userNo，UI 仍用 bigint userId；登录与好友列表写入映射 */
const userNoToId = new Map<string, number>()
const idToUserNo = new Map<number, string>()

export function rememberUserNo(userNo: string, userId: number) {
  if (userNo && userId) {
    userNoToId.set(userNo, userId)
    idToUserNo.set(userId, userNo)
  }
}

export function resolveUserNoByUserId(userId: number): string {
  return idToUserNo.get(userId) || ''
}

export function resolveUserIdByUserNo(userNo: string | number | undefined): number {
  if (userNo === undefined || userNo === null || userNo === '') {
    return 0
  }
  if (typeof userNo === 'number') {
    return userNo
  }
  if (/^\d+$/.test(userNo)) {
    return Number(userNo)
  }
  return userNoToId.get(userNo) ?? 0
}

export function myUserNo(): string {
  return getImSession()?.userNo || ''
}
