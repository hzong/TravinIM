import { fetchTalkSessionDelete, fetchTalkSessionDisturb, fetchTalkSessionTop } from '@/apis/api'
import { fetchApi } from '@/apis/request'
import { useContact, useGroup, useInject } from '@/hooks'
import { IDropdownOption, useCommonContextMenu } from '@/hooks/useCommonContextMenu.ts'
import { useDialogueStore, useTalkStore } from '@/store'
import { ISession } from '@/types/chat'
import { renderIcon } from '@/utils/common'
import {
  ArrowDown,
  ArrowUp,
  Clear,
  CloseRemind,
  Delete,
  EditTwo,
  IdCard,
  Remind
} from '@icon-park/vue-next'

export function useSessionMenu() {
  const dialogueStore = useDialogueStore()
  const talkStore = useTalkStore()
  const { message, toShowUserInfo } = useInject()

  const { onDeleteContact: onDeleteContact2, onChangeContactRemark } = useContact()
  const { onSignOutGroup: onSignOutGroup2 } = useGroup()
  const { menu, ContextMenuElement } = useCommonContextMenu(onContextMenuTalkHandle)

  // 当前会话索引
  const indexName = computed(() => dialogueStore.index_name)

  const onContextMenu = (e: any, item: ISession) => {
    const options: IDropdownOption[] = []

    if (item.talkMode === 1 && item.isRobot !== 1) {
      options.push({
        icon: renderIcon(IdCard),
        label: '好友信息',
        key: 'info'
      })

      options.push({
        icon: renderIcon(EditTwo),
        label: '修改备注',
        key: 'remark'
      })
    }

    options.push({
      icon: renderIcon(item.isTop === 1 ? ArrowDown : ArrowUp),
      label: item.isTop === 1 ? '取消置顶' : '会话置顶',
      key: 'top'
    })

    options.push({
      icon: renderIcon(item.isDisturb === 1 ? CloseRemind : Remind),
      label: item.isDisturb === 1 ? '关闭免打扰' : '开启免打扰',
      key: 'disturb'
    })

    options.push({
      type: 'divider'
    })

    if (item.talkMode == 1 && item.isRobot !== 1) {
      options.push({
        icon: renderIcon(Delete),
        label: '删除好友',
        key: 'delete_contact'
      })
    }

    if (item.talkMode === 2) {
      options.push({
        icon: renderIcon(Delete),
        label: '退出群聊',
        key: 'signout_group'
      })
    }

    options.push({
      icon: renderIcon(Clear),
      label: '移除会话',
      key: 'remove'
    })

    options && menu.show(e, options, item)
  }

  const onDeleteTalk = (index_name = '') => {
    talkStore.delItem(index_name)

    index_name === indexName.value && dialogueStore.$reset()
  }

  const onUserInfo = (item: ISession) => {
    toShowUserInfo(item.toId)
  }

  // 移除会话
  const onRemoveTalk = async (item: ISession) => {
    const [err] = await fetchApi(fetchTalkSessionDelete, {
      talkMode: item.talkMode,
      toId: item.toId,
      sessionNo: item.sessionNo
    })

    if (!err) {
      onDeleteTalk(item.index_name)
    }
  }

  // 设置消息免打扰
  const onSetDisturb = async (item: ISession) => {
    const [err] = await fetchApi(fetchTalkSessionDisturb, {
      talkMode: item.talkMode,
      toId: item.toId,
      sessionNo: item.sessionNo,
      action: item.isDisturb === 1 ? 0 : 1
    })

    if (!err) {
      talkStore.updateItem({
        index_name: item.index_name,
        isDisturb: item.isDisturb === 1 ? 0 : 1
      })
    }
  }

  // 置顶会话
  const onToTopTalk = async (item: ISession) => {
    if (item.isTop !== 1 && talkStore.topItems.length >= 18) {
      return message.warning('置顶最多不能超过18个会话')
    }

    const [err] = await fetchApi(fetchTalkSessionTop, {
      talkMode: item.talkMode,
      toId: item.toId,
      sessionNo: item.sessionNo,
      action: item.isTop === 1 ? 0 : 1
    })

    if (!err) {
      talkStore.updateItem({
        index_name: item.index_name,
        isTop: item.isTop === 1 ? 0 : 1
      })
    }
  }

  // 移除联系人
  const onDeleteContact = (item: ISession) => {
    onDeleteContact2(
      {
        userId: item.toId,
        nickname: item.name,
        remark: item.remark
      },
      () => {
        onDeleteTalk(item.index_name)
      }
    )
  }

  // 退出群聊
  const onSignOutGroup = (item: ISession) => {
    onSignOutGroup2(
      {
        groupId: item.toId,
        name: item.name
      },
      () => {
        onDeleteTalk(item.index_name)
      }
    )
  }

  const onChangeRemark = (item: ISession) => {
    onChangeContactRemark(
      {
        userId: item.toId,
        remark: item.remark
      },
      ({ remark }) => {
        talkStore.updateItem({
          index_name: item.index_name,
          remark: remark
        })
      }
    )
  }

  // 注册回调事件
  const evnets = {
    info: onUserInfo,
    top: onToTopTalk,
    remove: onRemoveTalk,
    disturb: onSetDisturb,
    signout_group: onSignOutGroup,
    delete_contact: onDeleteContact,
    remark: onChangeRemark
  }

  // 会话列表右键菜单回调事件
  function onContextMenuTalkHandle(key: string, _: IDropdownOption) {
    const item = menu.getItem()
    evnets[key] && evnets[key](item)
  }

  return { onContextMenu, ContextMenuElement, onToTopTalk }
}
