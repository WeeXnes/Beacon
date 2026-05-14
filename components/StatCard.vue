<template>
  <div class="bg-base-200/50 backdrop-blur-md rounded-2xl p-6 border border-base-content/5 flex flex-col gap-1 transition-all hover:bg-base-200 hover:border-primary/20 group">
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium text-base-content/60">{{ title }}</span>
      <div 
        class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        :class="colorMap[color] || colorMap.primary"
      >
        <Icon :name="icon" class="text-xl block" />
      </div>
    </div>
    <div class="flex items-end gap-2">
      <span class="text-2xl font-bold tracking-tight">{{ value }}</span>
      <span v-if="trend" class="text-xs font-medium text-success mb-1 flex items-center gap-0.5">
        <Icon name="material-symbols:trending-up" />
        {{ trend }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  icon: string
  color: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'accent'
  trend?: string
}>()

const colorMap = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  info: 'bg-info/10 text-info',
  accent: 'bg-accent/10 text-accent'
}
</script>
