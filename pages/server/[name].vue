<template>
  <div v-if="server" class="p-8 space-y-8 max-w-7xl mx-auto">
    <!-- Server Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-base-200/50 backdrop-blur-md p-8 rounded-3xl border border-base-content/5 relative z-20">
      <div class="flex items-center gap-6 relative z-10">
        <div class="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
          <Icon name="mdi:minecraft" class="text-5xl" />
        </div>
        <div>
          <div class="flex items-center gap-3 mb-1">
            <h1 class="text-3xl font-bold tracking-tight">{{ server.name }}</h1>
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
          <p class="text-base-content/50 font-medium">Running {{ server.version }} • {{ server.maxMemory }}GB RAM</p>
        </div>
      </div>

      <div class="flex items-center gap-3 relative z-10">
        <button 
          v-if="server.status === 'offline'" 
          @click="startServer(server.name)"
          class="btn btn-success gap-2 rounded-xl px-6 shadow-lg shadow-success/20"
        >
          <Icon name="material-symbols:play-arrow-rounded" class="text-xl" />
          Start Server
        </button>
        <button 
          v-if="server.status === 'online'" 
          @click="stopServer(server.name)"
          class="btn btn-error gap-2 rounded-xl px-6 shadow-lg shadow-error/20"
        >
          <Icon name="material-symbols:stop-rounded" class="text-xl" />
          Stop Server
        </button>
        <div class="dropdown dropdown-end">
          <button tabindex="0" class="btn btn-ghost btn-square rounded-xl bg-base-content/5">
            <Icon name="material-symbols:more-vert" class="text-xl" />
          </button>
          <ul tabindex="0" class="dropdown-content z-50 menu p-2 shadow-2xl bg-base-100 border border-base-content/5 rounded-2xl w-52 mt-2">
            <li><button class="text-error" @click="handleDelete"><Icon name="material-symbols:delete-rounded" /> Delete Server</button></li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Tabs Navigation -->
    <div class="flex gap-2 p-1 bg-base-200/50 rounded-2xl border border-base-content/5 w-fit">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        class="px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
        :class="activeTab === tab.id ? 'bg-primary text-primary-content shadow-lg shadow-primary/20' : 'hover:bg-base-content/5 text-base-content/60'"
      >
        <Icon :name="tab.icon" class="text-lg" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="min-h-[500px]">
      <div v-if="activeTab === 'console'" class="space-y-4">
        <div class="bg-black/90 rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
          <div class="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/5">
            <div class="flex gap-1.5">
              <div class="w-3 h-3 rounded-full bg-error/50"></div>
              <div class="w-3 h-3 rounded-full bg-warning/50"></div>
              <div class="w-3 h-3 rounded-full bg-success/50"></div>
            </div>
            <span class="text-xs font-mono text-white/40 uppercase tracking-widest">Live Terminal</span>
            <button @click="clearLogs" class="text-xs text-white/40 hover:text-white transition-colors">Clear</button>
          </div>
          <div ref="terminal" class="h-[400px] overflow-y-auto p-6 font-mono text-sm space-y-1 scrollbar-thin scrollbar-thumb-white/10">
            <div v-for="(line, i) in logs" :key="i" class="flex gap-4 group">
              <span class="text-white/20 select-none w-4 text-right">{{ i + 1 }}</span>
              <span class="text-white/80 break-all">{{ line }}</span>
            </div>
          </div>
          <div class="p-4 bg-white/5 border-t border-white/5 flex gap-4">
            <Icon name="material-symbols:chevron-right" class="text-primary text-2xl" />
            <input 
              v-model="commandInput" 
              @keyup.enter="handleSendCommand"
              type="text" 
              placeholder="Enter a server command..." 
              class="bg-transparent border-none outline-none flex-1 text-white font-mono placeholder:text-white/20"
            />
            <kbd class="kbd kbd-sm bg-white/10 border-none text-white/40">ENTER</kbd>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'properties'">
        <div class="bg-base-200/50 backdrop-blur-md rounded-3xl border border-base-content/5 overflow-hidden shadow-xl">
          <div class="p-6 border-b border-base-content/5 flex items-center justify-between">
            <h3 class="font-bold">Server Configuration</h3>
            <button @click="saveProperties" class="btn btn-primary btn-sm rounded-xl px-6">Save Changes</button>
          </div>
          <div class="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             <div v-for="(val, key) in properties" :key="key" class="form-control">
                <label class="label"><span class="label-text font-bold text-xs uppercase tracking-wider text-base-content/50">{{ key }}</span></label>
                <input v-if="typeof val !== 'boolean'" v-model="properties[key]" class="input input-bordered rounded-xl bg-base-100/50 border-base-content/5" />
                <input v-else type="checkbox" v-model="properties[key]" class="toggle toggle-primary" />
             </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'files'">
        <FileManager :server-name="serverName" />
      </div>

      <div v-if="activeTab === 'settings'">
        <div class="bg-base-200/50 backdrop-blur-md rounded-3xl border border-base-content/5 overflow-hidden shadow-xl">
          <div class="p-6 border-b border-base-content/5 flex items-center justify-between">
            <h3 class="font-bold">Beacon Server Settings</h3>
            <button @click="saveBeaconSettings" class="btn btn-primary btn-sm rounded-xl px-6">Save Settings</button>
          </div>
          <div class="p-8 space-y-8">
            <div class="form-control max-w-md">
              <label class="label"><span class="label-text font-bold">Max Allocated RAM (GB)</span></label>
              <div class="flex items-center gap-6">
                <input type="range" min="1" max="32" v-model="server.maxMemory" class="range range-primary range-sm flex-1" />
                <span class="w-16 text-center font-bold bg-primary/10 text-primary py-1 rounded-lg">{{ server.maxMemory }}GB</span>
              </div>
            </div>

            <div class="form-control max-w-md">
              <label class="label"><span class="label-text font-bold">Java Runtime</span></label>
              <select v-model="server.javaVersionName" class="select select-bordered rounded-xl bg-base-100/50 border-base-content/5">
                <option :value="undefined">System Default (java)</option>
                <option v-for="java in javaVersions" :key="java.name" :value="java.name">{{ java.name }}</option>
              </select>
              <label class="label">
                <span class="label-text-alt text-base-content/40">Select which Java version to use for this instance.</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { parse, stringify } from 'ini'

const route = useRoute()
const router = useRouter()
const serverName = route.params.name as string
const { servers, startServer, stopServer } = useServers()
const { logs, fetchLogs, sendCommand } = useConsole(serverName)

const server = computed(() => servers.value.find(s => s.name === serverName))
const activeTab = ref('console')
const commandInput = ref('')
const terminal = ref<HTMLElement | null>(null)
const properties = ref<any>({})

const tabs = [
  { id: 'console', label: 'Console', icon: 'material-symbols:terminal-rounded' },
  { id: 'properties', label: 'Properties', icon: 'material-symbols:settings-input-component-rounded' },
  { id: 'files', label: 'Files', icon: 'material-symbols:folder-open-rounded' },
  { id: 'settings', label: 'Server Settings', icon: 'material-symbols:tune-rounded' },
  { id: 'backups', label: 'Backups', icon: 'material-symbols:history-rounded' },
]

const javaVersions = ref<any[]>([])

const fetchJavaVersions = async () => {
  try {
    javaVersions.value = await $fetch('/api/getJavaVersions', {
      headers: {
        Authorization: `Bearer ${useCookie('token').value}`
      }
    })
  } catch (error) {
    console.error('Failed to fetch Java versions:', error);
  }
}

const saveBeaconSettings = async () => {
  try {
    await $fetch('/api/setServers', {
      method: 'POST',
      body: { servers: servers.value },
      headers: {
        Authorization: `Bearer ${useCookie('token').value}`
      }
    })
  } catch (error) {
    console.error('Failed to save beacon settings:', error);
  }
}

const handleSendCommand = async () => {
  if (!commandInput.value.trim()) return
  await sendCommand(commandInput.value)
  commandInput.value = ''
}

const clearLogs = () => {
  logs.value = []
}

const getProperties = async () => {
  try {
    const response = await $fetch<{ properties: string }>('/api/getProperties', {
      method: 'POST',
      body: { name: serverName },
      headers: {
        Authorization: `Bearer ${useCookie('token').value}`
      }
    })
    properties.value = parse(response.properties)
  } catch (error) {
    console.error('Failed to fetch properties:', error)
  }
}

const saveProperties = async () => {
  try {
    await $fetch('/api/setProperties', {
      method: 'POST',
      body: {
        name: serverName,
        properties: stringify(properties.value)
      },
      headers: {
        Authorization: `Bearer ${useCookie('token').value}`
      }
    })
  } catch (error) {
    console.error('Failed to save properties:', error)
  }
}

const handleDelete = async () => {
  if (!confirm('Are you sure you want to delete this server? This action cannot be undone.')) return
  try {
    await $fetch('/api/deleteServer', {
      method: 'POST',
      body: { name: serverName },
      headers: {
        Authorization: `Bearer ${useCookie('token').value}`
      }
    })
    router.push('/')
  } catch (error) {
    console.error('Failed to delete server:', error)
  }
}

onMounted(async () => {
  await getProperties()
  await fetchJavaVersions()
  fetchLogs() // This starts the WS connection in useConsole
})

onUnmounted(() => {
  // WS cleanup is handled in useConsole's onBeforeUnmount
})

watch(logs, () => {
  if (terminal.value) {
    nextTick(() => {
      terminal.value!.scrollTop = terminal.value!.scrollHeight
    })
  }
}, { deep: true })
</script>
