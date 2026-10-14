<script lang="ts" setup>
import { fetchAuthRegister } from '@/apis/api'
import { fetchImSendEmailCode } from '@/apis/customize'
import { sync } from '@/apis/request'
import ws from '@/connect'
import { useInject, useSmsLock } from '@/hooks'
import { useUserStore } from '@/store'
import { applyImAuthSession, buildImAuthRequest } from '@/utils/im-auth'

const { message } = useInject()
const userStore = useUserStore()

const { startCountdown, Countdown } = useSmsLock('REGISTER_EMAIL', 60)

const router = useRouter()
const formRef = ref()
const rules = {
  username: {
    required: true,
    trigger: ['blur', 'input'],
    message: '邮箱不能为空！'
  },
  password: {
    required: true,
    trigger: ['blur', 'input'],
    message: '密码不能为空！'
  },
  email_code: {
    required: true,
    trigger: ['blur', 'input'],
    message: '验证码不能为空！'
  }
}

const loading = ref(false)
const model = reactive({
  username: '',
  password: '',
  email_code: ''
})

const onRegister = async () => {
  const options = { loading }
  sync(async () => {
    const data = await fetchAuthRegister({
      email: model.username,
      emailCode: model.email_code,
      ...buildImAuthRequest(model.password)
    } as any)

    applyImAuthSession(data as any)
    ws.connect()
    message.success('注册成功，即将进入系统')
    userStore.loadSetting()
    router.push('/')
  }, options)
}

const onValidate = (e) => {
  e.preventDefault()

  formRef.value.validate((errors) => {
    !errors && onRegister()
  })
}

const onSendEmail = async () => {
  if (!model.username) {
    return window['$message'].warning('请先填写邮箱')
  }

  sync(
    async () => {
      await fetchImSendEmailCode({ email: model.username, scene: 'register' })
      startCountdown()
    },
    { loading, successText: '验证码已发送' }
  )
}
</script>

<template>
  <section class="el-container is-vertical login-box reister">
    <header class="el-header box-header">账号注册</header>

    <main class="el-main" style="padding: 3px">
      <n-form ref="formRef" size="large" :model="model" :rules="rules">
        <n-form-item path="username" :show-label="false">
          <n-input
            placeholder="请输入邮箱"
            v-model:value="model.username"
            @keydown.enter="onValidate"
          />
        </n-form-item>

        <n-form-item path="email_code" :show-label="false">
          <n-input
            placeholder="邮箱验证码"
            v-model:value="model.email_code"
            :maxlength="6"
            @keydown.enter="onValidate"
          />
          <Countdown class="mt-l5" @click="onSendEmail" />
        </n-form-item>

        <n-form-item path="password" :show-label="false">
          <n-input
            placeholder="设置密码"
            type="password"
            show-password-on="click"
            v-model:value="model.password"
            @keydown.enter="onValidate"
          />
        </n-form-item>

        <n-button
          type="primary"
          size="large"
          block
          text-color="#ffffff"
          class="mt-t20"
          @click="onValidate"
          :loading="loading"
        >
          立即注册
        </n-button>
      </n-form>

      <div class="helper">
        <n-button text color="#409eff" @click="router.push('/auth/forget')"> 找回密码 </n-button>
        <n-button text color="#409eff" @click="router.push('/auth/login')">
          已有账号，立即登录?
        </n-button>
      </div>
    </main>
  </section>
</template>

<style lang="less" scoped>
@import '@/assets/css/login.less';
</style>
