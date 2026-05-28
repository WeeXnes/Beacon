<template>
  <div class="w-full h-full relative group">
    <svg :viewBox="`0 0 ${width} ${height}`" class="w-full h-full" preserveAspectRatio="none">
      <!-- Gradient -->
      <defs>
        <linearGradient :id="`gradient-${color}`" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" :style="`stop-color: var(--${color-hex}); stop-opacity: 0.2`" />
          <stop offset="100%" :style="`stop-color: var(--${color-hex}); stop-opacity: 0`" />
        </linearGradient>
      </defs>

      <!-- Area -->
      <path
        :d="areaPath"
        :fill="`url(#gradient-${color})`"
        class="transition-all duration-500"
      />

      <!-- Line -->
      <path
        :d="linePath"
        fill="none"
        :stroke="strokeColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="transition-all duration-500"
      />

      <!-- Dots for latest points -->
      <circle
        v-if="points.length > 0"
        :cx="points[points.length - 1].x"
        :cy="points[points.length - 1].y"
        r="3"
        :fill="strokeColor"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  data: number[]
  max: number
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
}>()

const width = 200
const height = 60

const colorMap = {
  primary: '#570df8',
  secondary: '#f000b8',
  success: '#36d399',
  warning: '#fbbd23',
  error: '#f87272',
  info: '#3abff8'
}

const strokeColor = computed(() => colorMap[props.color])
const colorHex = computed(() => props.color) // Just for the gradient ID

const points = computed(() => {
  if (!props.data || props.data.length < 2) return []
  const xStep = width / (props.data.length - 1)
  return props.data.map((val, i) => ({
    x: i * xStep,
    y: height - (val / props.max) * height
  }))
})

const linePath = computed(() => {
  if (points.value.length < 2) return ''
  return points.value.reduce((acc, point, i) => {
    return acc + (i === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`)
  }, '')
})

const areaPath = computed(() => {
  if (points.value.length < 2) return ''
  const path = linePath.value
  return `${path} L ${points.value[points.value.length - 1].x} ${height} L ${points.value[0].x} ${height} Z`
})
</script>
