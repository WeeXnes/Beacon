<template>
  <div class="min-h-screen bg-base-100 text-base-content p-4 md:p-8">
    <div v-if="loading" class="flex items-center justify-center min-h-[60vh]">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <div v-else-if="error" class="max-w-md mx-auto mt-20 text-center space-y-6 bg-base-200/50 p-10 rounded-3xl border border-base-content/5">
      <div class="w-20 h-20 bg-error/10 text-error rounded-2xl flex items-center justify-center mx-auto">
        <Icon name="material-symbols:lock-outline" class="text-4xl" />
      </div>
      <div>
        <h1 class="text-2xl font-bold mb-2">Access Restricted</h1>
        <p class="text-base-content/60">{{ error }}</p>
      </div>
      <NuxtLink to="/" class="btn btn-primary rounded-xl px-8">Return Home</NuxtLink>
    </div>

    <div v-else-if="server" class="max-w-5xl mx-auto space-y-8">
      <!-- Header -->
      <div class="bg-base-200/50 backdrop-blur-md p-8 rounded-3xl border border-base-content/5 flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-6">
          <div class="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <Icon name="mdi:minecraft" class="text-4xl" />
          </div>
          <div>
            <h1 class="text-3xl font-bold tracking-tight">{{ server.name }}</h1>
            <p class="text-base-content/50 font-medium">Running {{ server.version }}</p>
          </div>
        </div>
        
        <div class="flex items-center gap-4">
          <div 
            class="badge badge-lg font-bold border-none py-4 px-6 rounded-xl"
            :class="server.status === 'online' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'"
          >
            <div class="w-2 h-2 rounded-full mr-3" :class="server.status === 'online' ? 'bg-success animate-pulse' : 'bg-error'"></div>
            {{ server.status.toUpperCase() }}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Players Column -->
        <div class="space-y-6">
          <div class="bg-base-200/50 backdrop-blur-md rounded-3xl border border-base-content/5 overflow-hidden shadow-xl">
            <div class="p-6 border-b border-base-content/5 flex items-center justify-between">
              <h3 class="font-bold flex items-center gap-2">
                <Icon name="material-symbols:group-rounded" class="text-primary" />
                Players ({{ server.onlinePlayers.length }}/{{ server.maxPlayers || '∞' }})
              </h3>
            </div>
            <div v-if="server.onlinePlayers.length === 0" class="p-12 text-center opacity-40">
              <p class="text-sm font-bold">No players online</p>
            </div>
            <div v-else class="p-4 space-y-2 max-h-[400px] overflow-y-auto">
              <div v-for="player in server.onlinePlayers" :key="player" class="bg-base-100/50 p-3 rounded-xl border border-base-content/5 flex items-center gap-3">
                <img :src="`https://minotar.net/avatar/${player}/32`" class="w-8 h-8 rounded-lg" />
                <span class="font-bold text-sm">{{ player }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Activity Column -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-black/90 rounded-3xl border border-white/5 overflow-hidden shadow-2xl flex flex-col h-[500px]">
            <div class="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/5">
              <div class="flex items-center gap-2">
                <Icon name="material-symbols:receipt-long-rounded" class="text-primary" />
                <span class="text-xs font-mono text-white/40 uppercase tracking-widest">Server Activity</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                </span>
                <span class="text-[10px] font-bold text-success/80">LIVE UPDATES</span>
              </div>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6 font-mono text-sm space-y-2 scrollbar-thin scrollbar-thumb-white/10">
              <div v-if="server.logs.length === 0" class="h-full flex items-center justify-center text-white/20 italic">
                No recent activity recorded
              </div>
              <div v-for="(line, i) in server.logs" :key="i" class="flex gap-4 group">
                <span class="text-white/20 select-none w-4 text-right text-[10px] mt-1">{{ i + 1 }}</span>
                <div class="flex-1">
                  <span v-if="line.includes(' joined the game')" class="text-success/80 font-bold">{{ line.split('INFO]: ')[1] }}</span>
                  <span v-else-if="line.includes(' left the game')" class="text-error/80 font-bold">{{ line.split('INFO]: ')[1] }}</span>
                  <span v-else-if="line.includes(' advancement ')" class="text-warning font-bold">🏆 {{ line.split('INFO]: ')[1] }}</span>
                  <span v-else-if="line.includes('> ')" class="text-white/80">
                    <span class="text-primary font-bold">{{ line.split('> ')[0].split('<')[1] }}:</span>
                    {{ line.split('> ')[1] }}
                  </span>
                  <span v-else class="text-white/40 italic">{{ line.split('INFO]: ')[1] }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="text-center opacity-30 text-[10px] font-bold tracking-[0.2em] uppercase py-8">
        Powered by Beacon Minecraft Manager
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const name = route.params.name as string
const server = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)
let pollTimer: any = null

const fetchStatus = async () => {
  try {
    const data = await $fetch<any>(`/api/public/server/${name}`)
    server.value = data
    error.value = null
  } catch (err: any) {
    error.value = err.statusMessage || 'Failed to load server status'
    if (pollTimer) clearInterval(pollTimer)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStatus()
  pollTimer = setInterval(fetchStatus, 5000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

useHead({
  title: server.value ? `${server.value.name} - Status` : 'Server Status',
  meta: [
    { name: 'description', content: 'Public status page for Minecraft server' }
  ]
})
</script>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
