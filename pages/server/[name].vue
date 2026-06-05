<template>
  <div v-if="server" class="p-8 space-y-8 max-w-7xl mx-auto">
    <!-- Server Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-base-200/50 backdrop-blur-md p-8 rounded-3xl border border-base-content/5 relative z-20">
      <div class="flex items-center gap-6 relative z-10">
        <div class="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
          <Icon :name="server.project === 'velocity' ? 'lucide:arrow-right-left' : 'mdi:minecraft'" class="text-5xl" />
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
          <p class="text-base-content/50 font-medium">
            Running {{ server.version }} • {{ server.maxMemory }}GB RAM
            <span v-if="server.status === 'online' && server.project !== 'velocity'" class="ml-2 pl-2 border-l border-base-content/20 text-primary">
              <Icon name="material-symbols:group-rounded" class="w-4 h-4 inline mr-1" /> {{ server.onlinePlayers?.length || 0 }}/{{ server.maxPlayers || '--' }}
              <span v-if="server.stats">
                <Icon name="lucide:cpu" class="w-4 h-4 inline ml-2 mr-1" /> {{ server.stats.cpu }}%
                <Icon name="lucide:hard-drive" class="w-4 h-4 inline ml-2 mr-1" /> {{ formatBytes(server.stats.memory) }}
              </span>
            </span>
          </p>
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
        <div class="bg-base-200/50 backdrop-blur-md rounded-3xl border border-base-content/5 overflow-hidden shadow-xl">
          <div class="p-6 border-b border-base-content/5 flex items-center justify-between">
            <h3 class="font-bold flex items-center gap-2">
              <Icon name="material-symbols:terminal-rounded" class="text-primary" />
              Console Output
            </h3>
            <button @click="clearLogs" class="btn btn-ghost btn-sm text-base-content/50">Clear Logs</button>
          </div>
          
          <div ref="terminal" class="h-[400px] overflow-y-auto p-6 font-mono text-xs bg-base-100/50">
             <div v-for="(line, i) in logs" :key="i" class="mb-0.5 whitespace-pre-wrap break-all">
               <span class="text-base-content/30 mr-4">{{ new Date().toLocaleTimeString() }}</span>
               <span class="text-base-content/80">{{ line }}</span>
             </div>
          </div>
          
          <div class="p-4 bg-base-100 border-t border-base-content/5">
            <div class="flex gap-2">
              <input 
                v-model="commandInput" 
                @keyup.enter="handleSendCommand"
                type="text" 
                placeholder="Enter server command..." 
                class="input input-bordered w-full rounded-xl bg-base-200 border-base-content/10 font-mono text-sm"
              />
              <button @click="handleSendCommand" class="btn btn-primary rounded-xl px-6">Send</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'players'">
        <div class="bg-base-200/50 backdrop-blur-md rounded-3xl border border-base-content/5 overflow-hidden shadow-xl min-h-[400px]">
          <div class="p-6 border-b border-base-content/5 flex items-center justify-between">
            <h3 class="font-bold flex items-center gap-2">
              <Icon name="material-symbols:group-rounded" class="text-primary" />
              Online Players ({{ server.onlinePlayers?.length || 0 }})
            </h3>
          </div>
          <div v-if="!server.onlinePlayers || server.onlinePlayers.length === 0" class="flex flex-col items-center justify-center p-20 text-center opacity-40">
             <Icon name="material-symbols:person-off-rounded" class="text-6xl mb-4" />
             <p class="font-bold">No players online</p>
             <p class="text-xs">When players join, they will appear here.</p>
          </div>
          <div v-else class="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             <div v-for="player in server.onlinePlayers" :key="player" class="bg-base-100/50 p-4 rounded-2xl border border-base-content/5 flex items-center justify-between group">
                <div class="flex items-center gap-4">
                   <img :src="`https://minotar.net/avatar/${player}/40`" class="w-10 h-10 rounded-lg shadow-md" />
                   <span class="font-bold">{{ player }}</span>
                </div>
                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button @click="sendCommand(`op ${player}`)" class="btn btn-ghost btn-xs btn-square text-warning" title="Op Player">
                      <Icon name="material-symbols:shield-person-rounded" />
                   </button>
                   <button @click="sendCommand(`kick ${player}`)" class="btn btn-ghost btn-xs btn-square text-error" title="Kick Player">
                      <Icon name="material-symbols:logout-rounded" />
                   </button>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'marketplace'">
        <div class="bg-base-200/50 backdrop-blur-md rounded-3xl border border-base-content/5 overflow-hidden shadow-xl min-h-[500px] flex flex-col">
          <div class="p-6 border-b border-base-content/5 flex items-center justify-between bg-base-100/30">
            <div class="flex-1 max-w-md relative flex gap-2">
              <div class="relative flex-1">
                <Icon name="material-symbols:search-rounded" class="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input 
                  v-model="searchQuery" 
                  @keyup.enter="handleSearch"
                  type="text" 
                  placeholder="Search Modrinth (e.g. EssentialsX, Geyser, Lithium)..." 
                  class="input input-bordered w-full pl-12 rounded-2xl bg-base-100/50 border-base-content/5"
                />
              </div>
              <button @click="handleSearch" class="btn btn-primary rounded-xl" :disabled="searchLoading">
                <Icon v-if="!searchLoading" name="material-symbols:search-rounded" />
                <span v-else class="loading loading-spinner loading-xs"></span>
                Search
              </button>
            </div>
            <div class="flex items-center gap-2 text-xs font-bold opacity-40 px-4">
               <Icon name="simple-icons:modrinth" class="text-lg" />
               POWERED BY MODRINTH
            </div>
          </div>

          <div v-if="searchLoading" class="flex-1 flex items-center justify-center">
             <span class="loading loading-spinner loading-lg text-primary"></span>
          </div>

          <div v-else-if="searchResults.length === 0" class="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-40">
             <Icon name="material-symbols:category-rounded" class="text-6xl mb-4" />
             <p class="font-bold">Search for Plugins or Mods</p>
             <p class="text-xs">Enter a keyword above to browse compatible content.</p>
          </div>

          <div v-else class="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[600px]">
             <div v-for="hit in searchResults" :key="hit.project_id" class="bg-base-100/50 p-4 rounded-2xl border border-base-content/5 flex items-start gap-4 hover:border-primary/30 transition-colors group">
                <img :src="hit.icon_url" class="w-16 h-16 rounded-xl shadow-lg bg-base-300" v-if="hit.icon_url" />
                <div class="w-16 h-16 rounded-xl shadow-lg bg-base-300 flex items-center justify-center text-3xl" v-else>
                   <Icon name="material-symbols:extension-rounded" />
                </div>
                
                <div class="flex-1 min-w-0">
                   <div class="flex items-start justify-between gap-2">
                      <h4 class="font-bold text-sm truncate">{{ hit.title }}</h4>
                      <div class="flex items-center gap-1 text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
                         <Icon name="material-symbols:download-rounded" />
                         {{ (hit.downloads / 1000).toFixed(1) }}k
                      </div>
                   </div>
                   <p class="text-[10px] text-base-content/50 line-clamp-2 mt-1">{{ hit.description }}</p>
                   <div class="flex items-center gap-2 mt-3">
                      <button 
                        @click="installContent(hit)" 
                        class="btn btn-primary btn-xs rounded-lg gap-1"
                        :disabled="installLoading === hit.project_id"
                      >
                         <span v-if="installLoading === hit.project_id" class="loading loading-spinner loading-xs"></span>
                         <Icon v-else name="material-symbols:install-desktop-rounded" />
                         Install
                      </button>
                      <a :href="`https://modrinth.com/project/${hit.slug}`" target="_blank" class="btn btn-ghost btn-xs rounded-lg gap-1">
                         <Icon name="material-symbols:open-in-new-rounded" />
                         View
                      </a>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'proxy-mapping'">
        <div class="bg-base-200/50 backdrop-blur-md rounded-3xl border border-base-content/5 overflow-hidden shadow-xl min-h-[400px]">
          <div class="p-6 border-b border-base-content/5 flex items-center justify-between bg-base-100/30">
            <div class="flex flex-col">
              <h3 class="font-bold flex items-center gap-2">
                <Icon name="lucide:shuffle" class="text-primary" />
                Velocity Proxy Wizard
              </h3>
              <p class="text-[10px] opacity-50 uppercase tracking-widest font-bold mt-1">Configure Base Domain & Routing</p>
            </div>
            <button 
              @click="saveProxyMapping" 
              class="btn btn-primary btn-sm rounded-xl px-6"
              :disabled="mappingLoading"
            >
              <span v-if="mappingLoading" class="loading loading-spinner loading-xs"></span>
              Save Configuration
            </button>
          </div>
          
          <div v-if="mappingLoading && proxyMappings.length === 0" class="flex-1 flex items-center justify-center p-20">
             <span class="loading loading-spinner loading-lg text-primary"></span>
          </div>

          <div v-else class="p-6 space-y-8">
            <!-- Global Config -->
            <div class="bg-primary/5 border border-primary/10 p-6 rounded-2xl">
              <div class="flex items-center gap-4 mb-4">
                <div class="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <Icon name="lucide:globe" class="text-xl" />
                </div>
                <div>
                  <h4 class="font-bold">Global Base Domain</h4>
                  <p class="text-[10px] opacity-50 uppercase tracking-wider font-bold">Used for all hostname generation</p>
                </div>
              </div>
              <div class="form-control max-w-md">
                <div class="flex gap-2">
                  <input 
                    v-model="baseDomain" 
                    type="text" 
                    placeholder="weexnes.dev" 
                    class="input input-bordered w-full rounded-xl bg-base-100/50 border-base-content/5 text-sm font-mono"
                  />
                </div>
                <p class="text-[10px] opacity-40 mt-2">Example: <code>subdomain.{{ baseDomain || 'example.com' }}</code></p>
              </div>
            </div>

            <!-- Server Mappings -->
            <div class="space-y-4">
              <h4 class="font-bold text-sm uppercase tracking-widest opacity-40 flex items-center gap-2">
                <Icon name="mdi:server" />
                Backend Server Mappings
              </h4>
              
              <div v-if="proxyMappings.length === 0" class="text-center py-12 opacity-40 bg-base-100/30 rounded-3xl border border-dashed border-base-content/10">
                <Icon name="material-symbols:info-outline" class="text-4xl mb-2" />
                <p>No other servers found to map.</p>
              </div>

              <div v-else class="grid grid-cols-1 gap-4">
                <div v-for="mapping in proxyMappings" :key="mapping.serverName" class="bg-base-100/30 p-5 rounded-3xl border border-base-content/5 transition-all hover:border-primary/20 group">
                  <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <!-- Server Info -->
                    <div class="flex items-center gap-4 min-w-[200px]">
                      <div 
                        class="w-10 h-10 rounded-xl flex items-center justify-center text-xl border transition-colors"
                        :class="mapping.isMapped ? 'bg-primary/20 text-primary border-primary/20' : 'bg-base-content/5 text-base-content/20 border-base-content/5'"
                      >
                        <Icon name="mdi:minecraft" />
                      </div>
                      <div>
                        <p class="font-bold">{{ mapping.serverName }}</p>
                        <p class="text-[10px] font-mono opacity-40">{{ mapping.address }}</p>
                      </div>
                    </div>

                    <!-- Subdomain Wizard -->
                    <div class="flex-1 flex flex-col md:flex-row items-center gap-4">
                      <div class="form-control flex-1 w-full" v-if="mapping.isMapped">
                        <div class="flex items-center gap-2 bg-base-200/50 p-1.5 rounded-xl border border-base-content/5 group-hover:border-primary/20 transition-all">
                          <input 
                            v-model="mapping.subdomain" 
                            type="text" 
                            placeholder="subdomain" 
                            class="input input-ghost input-sm flex-1 font-mono text-sm focus:bg-transparent"
                          />
                          <span class="text-xs font-bold opacity-30 pr-3">.{{ baseDomain || 'domain' }}</span>
                        </div>
                      </div>
                      <div v-else class="flex-1 flex items-center justify-center text-[10px] font-bold opacity-20 uppercase tracking-widest">
                        Not Enabled
                      </div>

                      <div class="flex items-center gap-4 shrink-0">
                        <label class="label cursor-pointer justify-start gap-3 p-0" v-if="mapping.isMapped">
                          <input type="checkbox" v-model="mapping.isInTry" class="checkbox checkbox-primary checkbox-xs rounded-md" />
                          <span class="label-text text-[10px] font-bold opacity-60 uppercase">Fallback</span>
                        </label>
                        <div class="divider divider-horizontal m-0 h-4 self-center opacity-10" v-if="mapping.isMapped"></div>
                        <label class="label cursor-pointer gap-3 p-0">
                          <span class="label-text text-xs font-bold opacity-50 uppercase">{{ mapping.isMapped ? 'Enabled' : 'Disabled' }}</span>
                          <input type="checkbox" v-model="mapping.isMapped" class="toggle toggle-primary toggle-sm" />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Help Legend -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-base-content/5">
              <div class="flex gap-3 text-xs opacity-60">
                <Icon name="lucide:info" class="shrink-0 mt-1" />
                <p><strong>Subdomain @</strong>: Maps the server directly to your base domain (e.g. <code>weexnes.dev</code>).</p>
              </div>
              <div class="flex gap-3 text-xs opacity-60">
                <Icon name="lucide:alert-circle" class="shrink-0 mt-1" />
                <p><strong>Fallbacks</strong>: If enabled, Velocity will use this server as a default entry point if no other routing matches.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'backups'">
        <div class="bg-base-200/50 backdrop-blur-md rounded-3xl border border-base-content/5 overflow-hidden shadow-xl min-h-[400px]">
          <div class="p-6 border-b border-base-content/5 flex items-center justify-between bg-base-100/30">
            <h3 class="font-bold flex items-center gap-2">
              <Icon name="material-symbols:backup-rounded" class="text-primary" />
              Server Backups ({{ backups.length }})
            </h3>
            <button 
              @click="createBackup" 
              class="btn btn-primary btn-sm rounded-xl px-6 gap-2"
              :disabled="loadingBackups || server.status !== 'offline'"
            >
              <span v-if="loadingBackups" class="loading loading-spinner loading-xs"></span>
              <Icon v-else name="material-symbols:add-rounded" />
              Create Backup
            </button>
          </div>
          
          <div v-if="loadingBackups && backups.length === 0" class="flex-1 flex items-center justify-center p-20">
             <span class="loading loading-spinner loading-lg text-primary"></span>
          </div>

          <div v-else-if="backups.length === 0" class="flex flex-col items-center justify-center p-20 text-center opacity-40">
             <Icon name="material-symbols:backup-off-rounded" class="text-6xl mb-4" />
             <p class="font-bold">No backups found</p>
             <p class="text-xs">Backups will appear here once created. Server must be offline.</p>
          </div>

          <div v-else class="overflow-x-auto">
             <table class="table w-full">
                <thead>
                   <tr class="border-base-content/5">
                      <th class="bg-transparent">Date</th>
                      <th class="bg-transparent">Filename</th>
                      <th class="bg-transparent">Size</th>
                      <th class="bg-transparent text-right">Actions</th>
                   </tr>
                </thead>
                <tbody>
                   <tr v-for="backup in backups" :key="backup.name" class="border-base-content/5 hover:bg-base-content/5 transition-colors group">
                      <td>
                         <div class="flex flex-col">
                            <span class="font-bold">{{ new Date(backup.date).toLocaleDateString() }}</span>
                            <span class="text-xs opacity-50">{{ new Date(backup.date).toLocaleTimeString() }}</span>
                         </div>
                      </td>
                      <td class="font-mono text-[10px] opacity-70">{{ backup.name }}</td>
                      <td>{{ formatBytes(backup.size) }}</td>
                      <td class="text-right">
                         <div class="flex justify-end gap-2">
                            <button 
                              @click="restoreBackup(backup.name)" 
                              class="btn btn-ghost btn-xs rounded-lg gap-1 text-warning"
                              :disabled="loadingBackups || server.status !== 'offline'"
                              title="Restore Backup"
                            >
                               <Icon name="material-symbols:settings-backup-restore-rounded" />
                               Restore
                            </button>
                            <button 
                              @click="deleteBackup(backup.name)" 
                              class="btn btn-ghost btn-xs rounded-lg text-error"
                              :disabled="loadingBackups"
                              title="Delete Backup"
                            >
                               <Icon name="material-symbols:delete-rounded" />
                            </button>
                         </div>
                      </td>
                   </tr>
                </tbody>
             </table>
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
             <template v-for="(val, key) in properties" :key="key">
                <div class="form-control">
                  <label class="label"><span class="label-text font-bold text-xs uppercase tracking-wider text-base-content/50">{{ key }}</span></label>
                  <input v-if="typeof val !== 'boolean'" :value="val" @input="properties[key] = ($event.target as HTMLInputElement).value" class="input input-bordered rounded-xl bg-base-100/50 border-base-content/5" />
                  <input v-else type="checkbox" :checked="val" @change="properties[key] = ($event.target as HTMLInputElement).checked" class="toggle toggle-primary" />
                </div>
             </template>
          </div>
          <!-- Specialized sections for Velocity objects could go here, but Proxy Mapping handles the most important ones -->
          <div v-if="server?.project === 'velocity'" class="px-8 pb-8">
            <div class="alert alert-info rounded-2xl bg-primary/10 border-primary/20 text-primary py-3">
              <Icon name="lucide:info" />
              <span class="text-xs font-bold">Complex Velocity objects (servers, forced-hosts) are managed in the <span class="underline">Proxy Mapping</span> tab.</span>
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
                <input type="range" min="1" max="32" v-model="localSettings.maxMemory" class="range range-primary range-sm flex-1" />
                <span class="w-16 text-center font-bold bg-primary/10 text-primary py-1 rounded-lg">{{ localSettings.maxMemory }}GB</span>
              </div>
            </div>

            <div class="form-control max-w-md">
              <label class="label"><span class="label-text font-bold">Java Runtime</span></label>
              <select v-model="localSettings.javaVersionName" class="select select-bordered rounded-xl bg-base-100/50 border-base-content/5">
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
const { servers, startServer, stopServer, startPolling, stopPolling, fetchServers } = useServers()
const { logs, isLive, fetchLogs, sendCommand, reconnect } = useConsole(serverName)

const server = computed(() => servers.value.find(s => s.name === serverName))
const activeTab = ref('console')
const commandInput = ref('')
const terminal = ref<HTMLElement | null>(null)
const properties = ref<any>({})

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const { backups, loading: loadingBackups, fetchBackups, createBackup, deleteBackup, restoreBackup } = useBackups(serverName)

const tabs = computed(() => {
  const baseTabs = [
    { id: 'console', label: 'Console', icon: 'material-symbols:terminal-rounded' },
    { id: 'backups', label: 'Backups', icon: 'material-symbols:backup-rounded' },
    { id: 'properties', label: 'Properties', icon: 'material-symbols:settings-input-component-rounded' },
    { id: 'files', label: 'Files', icon: 'material-symbols:folder-open-rounded' },
    { id: 'settings', label: 'Server Settings', icon: 'material-symbols:tune-rounded' },
  ]

  const tabs = [...baseTabs.slice(0, 1)]
  const project = server.value?.project || ''
  const version = server.value?.version || ''
  
  const isVanilla = project === 'vanilla' || version.toLowerCase().includes('vanilla')
  const isVelocity = project === 'velocity'

  if (isVelocity) {
    tabs.push({ id: 'proxy-mapping', label: 'Proxy Mapping', icon: 'lucide:shuffle' })
  } else if (!isVanilla) {
    tabs.push({ id: 'players', label: 'Players', icon: 'material-symbols:group-rounded' })
    tabs.push({ id: 'marketplace', label: 'Marketplace', icon: 'material-symbols:shopping-cart-rounded' })
  } else {
    tabs.push({ id: 'players', label: 'Players', icon: 'material-symbols:group-rounded' })
  }

  return [...tabs, ...baseTabs.slice(1, 3), ...baseTabs.slice(3)]
})

const javaVersions = ref<any[]>([])
const searchResults = ref<any[]>([])
const searchLoading = ref(false)
const searchQuery = ref('')
const installLoading = ref<string | null>(null)

const localSettings = ref({
  maxMemory: 1,
  javaVersionName: undefined as string | undefined
})

// Initialize local settings from server data
watch(server, (newVal) => {
  if (newVal && activeTab.value !== 'settings') {
    localSettings.value = {
      maxMemory: newVal.maxMemory,
      javaVersionName: newVal.javaVersionName
    }
  }
}, { immediate: true, deep: true })

// Also sync if we just switched to settings tab to ensure we have latest data
watch(activeTab, (newTab) => {
  if (newTab === 'settings' && server.value) {
    localSettings.value = {
      maxMemory: server.value.maxMemory,
      javaVersionName: server.value.javaVersionName
    }
  }
})

const handleSearch = async () => {
  if (!searchQuery.value) return
  if (!server.value) return // Defensive check
  
  searchLoading.value = true
  try {
    let loader = ''
    let ver = ''
    
    if (server.value.version) {
        const parts = server.value.version.split(' ')
        loader = parts[0] || ''
        ver = parts[1] || ''
    }

    const data = await $fetch<any>(`/api/searchContent`, {
      query: {
        q: searchQuery.value,
        loader: loader,
        version: ver
      },
      headers: { Authorization: `Bearer ${useCookie('token').value}` }
    })
    searchResults.value = data.hits || []
  } catch (error) {
    console.error('Search failed:', error)
  } finally {
    searchLoading.value = false
  }
}

const installContent = async (project: any) => {
  installLoading.value = project.project_id
  try {
    let loader = ''
    let ver = ''
    
    if (server.value && server.value.version) {
        const parts = server.value.version.split(' ')
        loader = parts[0] || ''
        ver = parts[1] || ''
    }

    await $fetch('/api/installContent', {
      method: 'POST',
      body: {
        serverName: serverName,
        projectId: project.project_id,
        loader: loader,
        version: ver
      },
      headers: { Authorization: `Bearer ${useCookie('token').value}` }
    })
    alert(`Successfully installed ${project.title}`)
  } catch (error: any) {
    alert(`Installation failed: ${error.statusMessage || error.message}`)
  } finally {
    installLoading.value = null
  }
}

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
  if (!server.value) return
  
  // Update local server object with our changes
  server.value.maxMemory = localSettings.value.maxMemory
  server.value.javaVersionName = localSettings.value.javaVersionName

  try {
    await $fetch('/api/setServers', {
      method: 'POST',
      body: { servers: servers.value },
      headers: {
        Authorization: `Bearer ${useCookie('token').value}`
      }
    })
    alert('Settings saved successfully!')
  } catch (error) {
    console.error('Failed to save beacon settings:', error);
    alert('Failed to save settings')
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
  if (!server.value) return;
  try {
    const response = await $fetch<{ properties: string }>('/api/getProperties', {
      method: 'POST',
      body: { name: serverName },
      headers: {
        Authorization: `Bearer ${useCookie('token').value}`
      }
    })
    
    if (server.value.project === 'velocity') {
      try {
        const parsed = typeof response.properties === 'string' ? JSON.parse(response.properties) : response.properties;
        // Filter out complex objects like servers and forced-hosts
        properties.value = Object.fromEntries(
          Object.entries(parsed).filter(([_, val]) => typeof val !== 'object')
        );
      } catch (e) {
        properties.value = {}
      }
    } else {
      properties.value = parse(response.properties)
    }
  } catch (error) {
    console.error('Failed to fetch properties:', error)
  }
}

const saveProperties = async () => {
  try {
    let propsToSave = ''
    if (server.value?.project === 'velocity') {
      propsToSave = JSON.stringify(properties.value)
    } else {
      propsToSave = stringify(properties.value)
    }

    await $fetch('/api/setProperties', {
      method: 'POST',
      body: {
        name: serverName,
        properties: propsToSave
      },
      headers: {
        Authorization: `Bearer ${useCookie('token').value}`
      }
    })
  } catch (error) {
    console.error('Failed to save properties:', error)
  }
}

const proxyMappings = ref<any[]>([])
const mappingLoading = ref(false)
const baseDomain = ref('')

const fetchProxyMappings = async () => {
  if (server.value?.project !== 'velocity') return
  mappingLoading.value = true
  try {
    const data = await $fetch<any>(`/api/getProxyMapping?name=${serverName}`, {
      headers: { Authorization: `Bearer ${useCookie('token').value}` }
    })
    proxyMappings.value = data.mappings
    baseDomain.value = data.baseDomain
  } catch (error) {
    console.error('Failed to fetch proxy mappings:', error)
  } finally {
    mappingLoading.value = false
  }
}

const saveProxyMapping = async () => {
  // Validation
  const enabledMappings = proxyMappings.value.filter(m => m.isMapped)
  if (enabledMappings.some(m => !m.subdomain)) {
    alert('Please provide a subdomain for all enabled mappings.')
    return
  }
  if (!baseDomain.value) {
    alert('Please provide a base domain.')
    return
  }

  mappingLoading.value = true
  try {
    await $fetch('/api/setProxyMapping', {
      method: 'POST',
      body: {
        proxyName: serverName,
        mappings: proxyMappings.value,
        baseDomain: baseDomain.value
      },
      headers: { Authorization: `Bearer ${useCookie('token').value}` }
    })
    alert('Proxy mappings saved successfully!')
  } catch (error: any) {
    console.error('Failed to save proxy mappings:', error)
    alert(`Failed to save mappings: ${error.statusMessage || error.message}`)
  } finally {
    mappingLoading.value = false
  }
}

watch(activeTab, (newTab) => {
  if (newTab === 'proxy-mapping') {
    fetchProxyMappings()
  }
})

// Watch for status changes to trigger metadata refresh when server comes online
watch(() => server.value?.status, (newStatus, oldStatus) => {
  if (oldStatus === 'starting' && newStatus === 'online') {
    getProperties();
    fetchServers();
  }
})

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
  await fetchBackups()
  fetchLogs() // This starts the WS connection in useConsole
  startPolling(2000) // Poll every 2 seconds for player updates and status
})

onUnmounted(() => {
  // WS cleanup is handled in useConsole's onBeforeUnmount
  stopPolling()
})

watch(logs, () => {
  if (terminal.value) {
    nextTick(() => {
      terminal.value!.scrollTop = terminal.value!.scrollHeight
    })
  }
}, { deep: true })
</script>
