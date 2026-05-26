<template>
  <div class="p-8 space-y-8 max-w-7xl mx-auto">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">System Overview</h1>
        <p class="text-base-content/50">Monitor and manage all your Minecraft instances from one place.</p>
      </div>
      <button @click="showWizard = true" class="btn btn-primary gap-2 rounded-2xl shadow-lg shadow-primary/20">
        <Icon name="material-symbols:add-rounded" class="text-xl" />
        New Server
      </button>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard 
        title="Online" 
        :value="onlineCount" 
        icon="material-symbols:check-circle-rounded" 
        color="success" 
      />
      <StatCard 
        title="Offline" 
        :value="offlineCount" 
        icon="material-symbols:cancel-rounded" 
        color="error" 
      />
      <StatCard 
        title="Memory Usage" 
        :value="`${systemStats.memory.used} / ${systemStats.memory.total} GB`" 
        icon="material-symbols:memory-rounded" 
        color="warning" 
      />
      <StatCard 
        title="CPU Usage" 
        :value="`${systemStats.cpu.percent}%`" 
        icon="material-symbols:settings-input-component-rounded" 
        color="info" 
      />
    </div>

    <!-- Servers Section -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold flex items-center gap-2">
          <Icon name="material-symbols:list-alt-rounded" class="text-primary" />
          Active Instances
        </h2>
      </div>

      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="i in 3" :key="i" class="h-64 rounded-2xl bg-base-200/50 animate-pulse border border-base-content/5"></div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ServerGridCard 
          v-for="server in servers" 
          :key="server.name" 
          :server="server"
          @start="startServer"
          @stop="stopServer"
        />

        <!-- Add Server Placeholder -->
        <button 
          @click="showWizard = true"
          class="group border-2 border-dashed border-base-content/10 rounded-2xl flex flex-col items-center justify-center gap-4 min-h-[16rem] transition-all hover:border-primary/40 hover:bg-primary/5"
        >
          <div class="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <Icon name="material-symbols:add-rounded" class="text-3xl" />
          </div>
          <div class="text-center">
            <p class="font-bold">Add Instance</p>
            <p class="text-xs text-base-content/40">Deploy a new server jar</p>
          </div>
        </button>
      </div>
    </div>

    <VersionWizard v-if="showWizard" @close="showWizard = false" @installed="handleInstalled" />
  </div>
</template>

<script setup lang="ts">
import type { MinecraftServer } from "~/types/MinecraftServer";

const { servers, loading, startServer, stopServer, fetchServers } = useServers()
const { stats: systemStats, fetchStats } = useSystemStats()

const onlineCount = computed(() => servers.value.filter(s => s.status === 'online').length)
const offlineCount = computed(() => servers.value.filter(s => s.status === 'offline').length)
const showWizard = ref(false)

let statsInterval: NodeJS.Timeout

onMounted(() => {
  fetchStats()
  statsInterval = setInterval(fetchStats, 5000)
})

onUnmounted(() => {
  clearInterval(statsInterval)
})

const handleInstalled = async () => {
  showWizard.value = false;
  await fetchServers();
}
</script>