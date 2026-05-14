<template>
  <div class="min-h-screen flex bg-base-100 font-sans text-base-content selection:bg-primary/30" data-theme="onedev">
    <AppSidebar v-if="!isLoginPage" />
    
    <div class="flex-1 flex flex-col min-w-0">
      <header v-if="!isLoginPage" class="h-16 border-b border-base-content/5 flex items-center justify-between px-8 bg-base-100/50 backdrop-blur-md sticky top-0 z-40">
        <div class="flex items-center gap-4">
          <h2 class="text-lg font-semibold capitalize">{{ routeName }}</h2>
        </div>
        
        <div class="flex items-center gap-4">
          <div class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-base-200 border border-base-content/5 text-sm">
            <span class="w-2 h-2 rounded-full bg-success"></span>
            <span class="opacity-70">System Healthy</span>
          </div>
          <button @click="logout" class="btn btn-ghost btn-sm gap-2">
            <Icon name="material-symbols:logout-rounded" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto">
        <NuxtPage />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { fetchServers } = useServers()

const isLoginPage = computed(() => route.path === '/login')
const routeName = computed(() => {
  if (route.path === '/') return 'Dashboard'
  if (route.path.startsWith('/server/')) return 'Server Details'
  return route.name?.toString().replace(/-/g, ' ') || ''
})

const logout = () => {
  const token = useCookie('token')
  token.value = null
  router.push('/login')
}

onMounted(async () => {
  const token = useCookie('token')
  if (!token.value && !isLoginPage.value) {
    router.push('/login')
  } else if (token.value) {
    await fetchServers()
  }
})
</script>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.2s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(1rem);
}
</style>
