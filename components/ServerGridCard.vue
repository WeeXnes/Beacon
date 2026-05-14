<template>
  <div class="bg-base-200/50 backdrop-blur-md rounded-2xl p-6 border border-base-content/5 flex flex-col gap-4 transition-all hover:bg-base-200 hover:border-primary/20 group relative overflow-hidden">
    <!-- Content Container -->
    <div class="relative z-10 flex flex-col gap-4 h-full">
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-4">
          <!-- Creeper Face Icon as primary server icon -->
          <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-content transition-all duration-300">
            <Icon name="pixelarticons:creeper" class="text-3xl" />
          </div>
          <div>
            <h3 class="font-bold text-lg leading-none mb-1">{{ server.name }}</h3>
            <p class="text-xs text-base-content/50">{{ server.version }}</p>
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
          <p class="text-[10px] uppercase tracking-wider font-bold text-base-content/40 mb-1">Memory</p>
          <p class="font-bold text-sm">{{ server.maxMemory }}GB</p>
        </div>
        <div class="bg-base-300/50 rounded-xl p-3">
          <p class="text-[10px] uppercase tracking-wider font-bold text-base-content/40 mb-1">Players</p>
          <p class="font-bold text-sm">-- / --</p>
        </div>
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
</script>
