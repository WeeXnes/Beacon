<template>
  <div class="bg-base-200/50 backdrop-blur-md rounded-2xl p-6 border border-base-content/5 flex flex-col gap-4 transition-all hover:bg-base-200 hover:border-primary/20 group relative overflow-hidden">
    <!-- Content Container -->
    <div class="relative z-10 flex flex-col gap-4 h-full">
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-4">
          <!-- Creeper Face Icon as primary server icon -->
          <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-content transition-all duration-300">
            <Icon :name="server.project === 'velocity' ? 'lucide:arrow-right-left' : 'mdi:minecraft'" class="text-3xl" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-bold text-lg leading-none">{{ server.name }}</h3>
              <div v-if="server.project === 'velocity'" class="badge badge-xs badge-outline opacity-50 font-bold text-[8px]">PROXY</div>
            </div>
            <p class="text-xs text-base-content/50 mt-1">{{ server.version }}</p>
          </div>
        </div>
        <div 
          class="badge badge-sm font-bold border-none py-3 px-4"
          :class="{
            'bg-success/10 text-success': server.status === 'online',
            'bg-error/10 text-error': server.status === 'offline',
            'bg-warning/10 text-warning animate-pulse': ['starting', 'stopping'].includes(server.status)
          }"
        >
          {{ server.status }}
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 my-2">
        <div class="bg-base-300/50 rounded-xl p-3">
          <p class="text-[10px] uppercase tracking-wider font-bold text-base-content/40 mb-1">Players</p>
          <p class="font-bold text-sm">
            {{ server.status === 'online' ? (server.onlinePlayers?.length || 0) : 0 }} / {{ server.maxPlayers || '--' }}
          </p>
        </div>
        <div class="bg-base-300/50 rounded-xl p-3">
          <p class="text-[10px] uppercase tracking-wider font-bold text-base-content/40 mb-1">Max RAM</p>
          <p class="font-bold text-sm">{{ server.maxMemory }}GB</p>
        </div>
        <div class="bg-base-300/50 rounded-xl p-3">
          <p class="text-[10px] uppercase tracking-wider font-bold text-base-content/40 mb-1">CPU Usage</p>
          <p class="font-bold text-sm">{{ server.status === 'online' && server.stats ? server.stats.cpu + '%' : '--' }}</p>
        </div>
        <div class="bg-base-300/50 rounded-xl p-3">
          <p class="text-[10px] uppercase tracking-wider font-bold text-base-content/40 mb-1">Status</p>
          <p class="font-bold text-sm" :class="server.status === 'online' ? 'text-success' : 'text-base-content/40'">{{ server.status }}</p>
        </div>
      </div>

      <div v-if="server.status === 'online' && server.stats" class="space-y-2">
        <div class="flex justify-between text-[10px] uppercase font-bold text-base-content/40">
          <span>Real-time RAM</span>
          <span>{{ formatMemory(server.stats.memory) }}</span>
        </div>
        <progress class="progress progress-primary w-full h-1.5" :value="server.stats.memory" :max="server.maxMemory * 1024 * 1024 * 1024"></progress>
      </div>

      <div class="flex items-center gap-2 mt-auto">
        <NuxtLink :to="`/server/${server.name}`" class="btn btn-primary btn-sm flex-1 gap-2 rounded-xl">
          <Icon name="material-symbols:settings-input-component-rounded" />
          Manage
        </NuxtLink>
        <button 
          v-if="server.status === 'offline'" 
          @click="$emit('start', server.name)"
          class="btn btn-success btn-sm btn-square rounded-xl"
        >
          <Icon name="material-symbols:play-arrow-rounded" class="text-xl" />
        </button>
        <button 
          v-if="server.status === 'online'" 
          @click="$emit('stop', server.name)"
          class="btn btn-error btn-sm btn-square rounded-xl"
        >
          <Icon name="material-symbols:stop-rounded" class="text-xl" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MinecraftServer } from '~/types/MinecraftServer';

defineProps<{
  server: MinecraftServer
}>()

defineEmits(['start', 'stop'])

const formatMemory = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
</script>
