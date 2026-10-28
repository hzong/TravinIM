import { fetchContactApplyUnreadNum, fetchGroupApplyUnreadNum, fetchUserSetting } from '@/apis/api'
import { createApi, fetchApi } from '@/apis/request'
import { clearImSession } from '@/utils/im-auth'
import { storage } from '@/utils'
import * as auth from '@/utils/auth.ts'
import { rememberUserNo } from '@/utils/im-user-resolve'
import { defineStore } from 'pinia'

interface IUserStoreState {
  uid: number
  nickname: string
  mobile: string
  email: string
  gender: number
  motto: string
  avatar: string
  online: boolean
  isQiye: boolean
  isContactApply: boolean
  isGroupApply: boolean
}

export const useUserStore = defineStore('user', {
  persist: true,
  state: (): IUserStoreState => {
    return {
      uid: 0, // 用户ID
      mobile: '',
      email: '',
      nickname: '', // 用户昵称
      gender: 0, // 性别
      motto: '', // 个性签名
      avatar: '',
      online: false, // 在线状态
      isQiye: false,
      isContactApply: false,
      isGroupApply: false
    }
  },
  getters: {},
  actions: {
    // 设置用户登录状态
    updateSocketStatus(status: boolean) {
      this.online = status
    },

    async logoutLogin() {
      const logout = createApi('/app-api/im/auth/logout')
      try {
        await logout({})
      } catch {
        /* 本地仍清掉登录态 */
      }
      this.$reset()
      storage.remove('userInfo')
      clearImSession()
      auth.deleteToken()
      location.reload()
    },

    loadSetting() {
      this.loadUserSetting()
      this.loadFriendApplyNum()
      this.loadGroupApplyUnread()
    },
    async loadUserSetting() {
      const [err, data] = await fetchApi(fetchUserSetting, {})
      if (err) return

      this.nickname = data.userInfo.nickname
      this.uid = data.userInfo.id
      const userNo = data.userInfo.userNo
      if (userNo && this.uid) {
        rememberUserNo(userNo, this.uid)
      }
      this.avatar = data.userInfo.avatar
      this.gender = data.userInfo.gender
      this.email = data.userInfo.email || ''
      this.motto = data.userInfo.motto

      storage.set('userInfo', data)
    },
    async loadFriendApplyNum() {
      const [err, data] = await fetchApi(fetchContactApplyUnreadNum, {})

      if (!err) {
        this.isContactApply = data.num > 0
      }
    },
    async loadGroupApplyUnread() {
      const [err, data] = await fetchApi(fetchGroupApplyUnreadNum, {})

      if (!err) {
        this.isGroupApply = data.num > 0
      }
    }
  }
})
