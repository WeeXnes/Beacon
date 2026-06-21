<template>
  <div class="min-h-screen flex items-center justify-center p-6 bg-base-100 font-sans text-base-content" data-theme="onedev">
    <div class="max-w-md w-full">
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 text-primary mb-6 border border-primary/20 shadow-xl shadow-primary/5">
          <Icon name="mdi:minecraft" class="text-5xl" />
        </div>
        <h1 class="text-4xl font-black tracking-tight mb-2">Welcome to Beacon</h1>
        <p class="text-base-content/50 font-medium">Set your administrator access key to begin.</p>
      </div>

      <div class="bg-base-200/50 backdrop-blur-xl rounded-[2.5rem] p-10 border border-base-content/5 shadow-2xl">
        <form @submit.prevent="handleSetup" class="space-y-6">
          <div class="form-control">
            <label class="label mb-1">
              <span class="label-text font-bold text-xs uppercase tracking-widest text-base-content/40">New Access Key</span>
            </label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-base-content/30 group-focus-within:text-primary transition-colors">
                <Icon name="material-symbols:lock-outline-rounded" class="text-xl" />
              </div>
              <input
                v-model="password"
                type="password"
                placeholder="At least 8 characters"
                class="input input-bordered w-full pl-12 rounded-2xl bg-base-100/50 border-none focus:ring-2 focus:ring-primary transition-all py-7 text-lg"
                required
                minlength="8"
              />
            </div>
          </div>

          <div class="form-control">
            <label class="label mb-1">
              <span class="label-text font-bold text-xs uppercase tracking-widest text-base-content/40">Confirm Access Key</span>
            </label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-base-content/30 group-focus-within:text-primary transition-colors">
                <Icon name="material-symbols:lock-outline-rounded" class="text-xl" />
              </div>
              <input
                v-model="confirmPassword"
                type="password"
                placeholder="Re-enter access key"
                class="input input-bordered w-full pl-12 rounded-2xl bg-base-100/50 border-none focus:ring-2 focus:ring-primary transition-all py-7 text-lg"
                required
              />
            </div>
          </div>

          <div v-if="error" class="alert alert-error rounded-2xl text-sm py-3 px-4">
            <Icon name="material-symbols:error-outline-rounded" class="text-xl" />
            <span>{{ error }}</span>
          </div>

          <button 
            type="submit" 
            class="btn btn-primary w-full rounded-2xl py-4 h-auto text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            :disabled="loading"
          >
            <span v-if="loading" class="loading loading-spinner"></span>
            <span v-else>Complete Setup</span>
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
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const router = useRouter()

const handleSetup = async () => {
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }
  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters long.'
    return
  }

  loading.value = true
  error.value = ''
  try {
    const response = await $fetch<{ status: string, error?: string }>('/api/setup', {
      method: 'POST',
      body: { password: password.value }
    })

    if (response.status === 'success') {
      const isOnboarded = useState<boolean | null>('is-onboarded')
      isOnboarded.value = true
      router.push('/login')
    } else {
      error.value = response.error || 'Failed to complete onboarding.'
    }
  } catch (err: any) {
    error.value = err.statusMessage || 'An error occurred during setup.'
  } finally {
    loading.value = false
  }
}
</script>
