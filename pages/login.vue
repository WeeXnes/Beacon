<template>
  <div class="min-h-screen flex items-center justify-center p-6 bg-base-100">
    <div class="max-w-md w-full">
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 text-primary mb-6 border border-primary/20 shadow-xl shadow-primary/5">
          <Icon name="pixelarticons:creeper" class="text-5xl" />
        </div>
        <h1 class="text-4xl font-black tracking-tight mb-2">Beacon</h1>
        <p class="text-base-content/50 font-medium">Authentication Required</p>
      </div>

      <div class="bg-base-200/50 backdrop-blur-xl rounded-[2.5rem] p-10 border border-base-content/5 shadow-2xl">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <div class="form-control">
            <label class="label mb-1">
              <span class="label-text font-bold text-xs uppercase tracking-widest text-base-content/40">Access Key</span>
            </label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-base-content/30 group-focus-within:text-primary transition-colors">
                <Icon name="material-symbols:lock-outline-rounded" class="text-xl" />
              </div>
              <input
                v-model="password"
                type="password"
                placeholder="••••••••••••"
                class="input input-bordered w-full pl-12 rounded-2xl bg-base-100/50 border-none focus:ring-2 focus:ring-primary transition-all py-7 text-lg"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            class="btn btn-primary w-full rounded-2xl py-4 h-auto text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            :disabled="loading"
          >
            <span v-if="loading" class="loading loading-spinner"></span>
            <span v-else>Unlock Dashboard</span>
          </button>
        </form>
      </div>

      <p class="text-center mt-10 text-sm text-base-content/30 font-medium">
        Self-hosted Minecraft Instance Manager
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const password = ref('')
const loading = ref(false)
const router = useRouter()

const handleLogin = async () => {
  loading.value = true
  try {
    const response = await $fetch<{ message: string, token: string }>('/api/login', {
      method: 'POST',
      body: { password: password.value }
    })

    if (response.message === 'Login successful!') {
      const token = useCookie('token')
      token.value = response.token
      router.push('/')
    }
  } catch (error) {
    console.error('Login error:', error)
  } finally {
    loading.value = false
  }
}
</script>