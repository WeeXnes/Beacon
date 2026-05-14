<template>
  <aside class="w-64 bg-base-200/50 backdrop-blur-lg border-r border-base-content/10 flex flex-col h-screen sticky top-0 transition-all duration-300" :class="{ 'w-20': collapsed }">
    <div class="p-6 flex items-center gap-4 overflow-hidden whitespace-nowrap">
      <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
        <Icon name="mdi:minecraft" class="text-primary-content text-xl" />
      </div>
      <h1 v-if="!collapsed" class="text-xl font-bold tracking-tight">Beacon</h1>
    </div>

    <nav class="flex-1 px-3 space-y-1 mt-4 overflow-y-auto overflow-x-hidden">
      <NuxtLink 
        to="/" 
        class="flex items-center gap-4 px-3 py-3 rounded-xl transition-all hover:bg-base-content/5 group"
        active-class="bg-primary text-primary-content hover:bg-primary/90 shadow-lg shadow-primary/20"
      >
        <Icon name="material-symbols:dashboard-rounded" class="text-2xl shrink-0" />
        <span v-if="!collapsed" class="font-medium">Dashboard</span>
      </NuxtLink>

      <div class="pt-4 pb-2 px-3">
        <span v-if="!collapsed" class="text-xs font-semibold uppercase tracking-wider text-base-content/40">Servers</span>
        <div v-else class="h-px bg-base-content/10 mx-2"></div>
      </div>

      <NuxtLink 
        v-for="server in servers" 
        :key="server.name"
        :to="`/server/${server.name}`" 
        class="flex items-center gap-4 px-3 py-3 rounded-xl transition-all hover:bg-base-content/5 group"
        active-class="bg-base-content/10 text-primary border-l-4 border-primary rounded-l-none"
      >
        <div class="relative shrink-0">
          <Icon name="material-symbols:dns-rounded" class="text-2xl" />
          <span 
            class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-base-200"
            :class="{
              'bg-success': server.status === 'online',
              'bg-error': server.status === 'offline',
              'bg-warning animate-pulse': ['starting', 'stopping'].includes(server.status)
            }"
          ></span>
        </div>
        <span v-if="!collapsed" class="font-medium truncate">{{ server.name }}</span>
      </NuxtLink>
    </nav>

    <div class="p-3 border-t border-base-content/10">
      <NuxtLink 
        to="/settings" 
        class="flex items-center gap-4 px-3 py-3 rounded-xl transition-all hover:bg-base-content/5 group"
        active-class="bg-base-content/10 text-primary"
      >
        <Icon name="material-symbols:settings-rounded" class="text-2xl shrink-0" />
        <span v-if="!collapsed" class="font-medium">Settings</span>
      </NuxtLink>
      
      <button 
        @click="collapsed = !collapsed"
        class="w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all hover:bg-base-content/5 group mt-1"
      >
        <Icon 
          :name="collapsed ? 'material-symbols:chevron-right' : 'material-symbols:chevron-left'" 
          class="text-2xl shrink-0" 
        />
        <span v-if="!collapsed" class="font-medium">Collapse</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
const { servers } = useServers()
const collapsed = useState('sidebar-collapsed', () => false)
</script>
