<script lang="ts" setup>
import { fetchAuthForget } from '@/apis/api'
import { fetchImSendEmailCode } from '@/apis/customize'
import { fetchApi } from '@/apis/request'
import { useSmsLock } from '@/hooks'

// 初始化短信按钮锁
const { startCountdown, Countdown } = useSmsLock('FORGET_EMAIL', 60)

const router = useRouter()
const formRef = ref()
const rules = {
  email_code: {
    required: true,
    trigger: ['blur', 'input'],
    message: '验证码不能为空！'
  },
  username: {
    required: true,
    trigger: ['blur', 'input'],
    message: '邮箱不能为空！'
  },
  password: {
    required: true,
    trigger: ['blur', 'input'],
    message: '密码不能为空！'
  }
}

const loading = ref(false)
const model = reactive({
  username: '',
  password: '',
  email_code: ''
})

const onForget = async () => {
  const [err] = await fetchApi(
    fetchAuthForget,
    {
      email: model.username,
      password: model.password,
      email_code: model.email_code
    },
    { loading, successText: '密码修改成功' }
  )

  if (err) return

  setTimeout(() => {
    router.push('/auth/login')
  }, 500)
}

const onValidate = (e: Event) => {
  e.preventDefault()

  formRef.value.validate((errors) => {
    !errors && onForget()
  })
}

// 发送短信
const onSendSms = async () => {
  if (!model.username.includes('@')) {
    return window['$message'].warning('请正确填写邮箱')
  }

  const [err] = await fetchApi(
    fetchImSendEmailCode,
    {
      email: model.username,
      scene: 'forget'
    },
    { loading, successText: '验证码已发送' }
  )

  if (err) return
  startCountdown()
}
</script>

<template>
  <section class="el-container is-vertical login-box forget">
    <header class="el-header box-header">找回密码</header>

    <main class="el-main" style="padding: 3px">
      <n-form ref="formRef" size="large" :model="model" :rules="rules">
        <n-form-item path="username" :show-label="false">
          <n-input
            placeholder="邮箱"
            v-model:value="model.username"
            :maxlength="128"
            @keydown.enter="onValidate"
          />
        </n-form-item>

        <n-form-item path="email_code" :show-label="false">
          <n-input
            placeholder="邮箱验证码"
            :maxlength="6"
            v-model:value="model.email_code"
            @keydown.enter="onValidate"
          />

          <Countdown @click="onSendSms" class="mt-l5" />
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
          立即找回
        </n-button>
      </n-form>

      <div class="helper">
        <n-button text color="#409eff" @click="router.push('/auth/register')"> 注册账号 </n-button>
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
