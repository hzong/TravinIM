<script lang="ts" setup>
import GroupLaunch from '@/components/group/GroupLaunch.vue'
import GroupPanel from '@/components/group/GroupPanel.vue'
import { useTalkStore, useUserStore } from '@/store'
import { Plus, Search } from '@icon-park/vue-next'
import GroupCard from './inner/GroupCard.vue'

import { fetchGroupList } from '@/apis/api'
import { fetchApi } from '@/apis/request'
import { useRouter } from 'vue-router'

const router = useRouter()
const userStore = useUserStore()
const talkStore = useTalkStore()
const isShowCreateGroupBox = ref(false)
const keywords = ref('')
const items = ref<any[]>([])

const params = reactive({
  isShow: false,
  groupId: 0
})

const tabIndex = ref('all')

const uid = userStore.uid

const filterCreator = computed(() => {
  return items.value.filter((item: any) => item.ownerId == uid)
})

const filter = computed((): any[] => {
  return items.value.filter((item: any) => {
    if (tabIndex.value == 'create' && item.ownerId != uid) {
      return false
    }

    if (tabIndex.value == 'join' && item.ownerId == uid) {
      return false
    }

    return (item.groupName || '').toLowerCase().indexOf(keywords.value.toLowerCase()) != -1
  })
})

const onLoadData = async () => {
  const [err, data] = await fetchApi(fetchGroupList, {})

  if (!err) {
    items.value = data.items || []
  }
}

const onShowGroup = (item: any) => {
  params.isShow = true
  params.groupId = item.groupId
}

const onToTalk = (item: any) => {
  talkStore.toTalk(2, item.groupId, router)
}

const onGroupCallBack = () => {
  isShowCreateGroupBox.value = false
  onLoadData()
  talkStore.loadTalkList()
}

onMounted(() => {
  onLoadData()
})
</script>

<template>
  <section id="drawer-target" class="el-container is-vertical h-full">
    <header class="el-header me-view-header border-bottom">
      <div>
        <n-tabs v-model:value="tabIndex">
          <n-tab name="all"> 全部群聊({{ items.length }}) </n-tab>
          <n-tab name="create"> 我创建的({{ filterCreator.length }}) </n-tab>
          <n-tab name="join"> 我加入的({{ items.length - filterCreator.length }}) </n-tab>
        </n-tabs>
      </div>

      <n-space>
        <n-input
          v-model:value.trim="keywords"
          placeholder="搜索"
          clearable
          style="max-width: 200px"
          round
        >
          <template #prefix>
            <n-icon :component="Search" />
          </template>
        </n-input>

        <n-button circle @click="isShowCreateGroupBox = true">
          <template #icon>
            <n-icon :component="Plus" />
          </template>
        </n-button>
      </n-space>
    </header>

    <main v-if="filter.length == 0" class="el-main flex-center">
      <n-empty description="暂无相关数据" />
    </main>

    <main v-else class="el-main me-scrollbar me-scrollbar-thumb pd-10" id="drawer-container">
      <div class="cards">
        <GroupCard
          v-for="item in filter"
          :key="item.groupId"
          :avatar="item.avatar"
          :username="item.groupName"
          :gender="item.gender"
          :motto="item.profile"
          flag="查看"
          :is-member="true"
          @click="onShowGroup(item)"
          @talk="onToTalk(item)"
        />
      </div>
    </main>
  </section>

  <GroupLaunch
    :group-id="0"
    v-if="isShowCreateGroupBox"
    @close="isShowCreateGroupBox = false"
    @on-submit="onGroupCallBack"
  />

  <n-drawer
    v-model:show="params.isShow"
    :width="400"
    placement="right"
    :trap-focus="false"
    :block-scroll="false"
    to="#drawer-target"
    show-mask="transparent"
  >
    <GroupPanel
      :group-id="params.groupId"
      @close="params.isShow = false"
      @to-talk="talkStore.toTalk(2, params.groupId, router)"
    />
  </n-drawer>
</template>

<style lang="less" scoped>
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  grid-gap: 12px;
  gap: 12px;
}
</style>
