<template>
  <div class="p-8 space-y-8 max-w-7xl mx-auto">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">System Overview</h1>
        <p class="text-base-content/50">Monitor and manage all your Minecraft instances from one place.</p>
      </div>
      <button onclick="addServerModal.showModal()" class="btn btn-primary gap-2 rounded-2xl shadow-lg shadow-primary/20">
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
        value="4.2 GB" 
        icon="material-symbols:memory-rounded" 
        color="warning" 
      />
      <StatCard 
        title="CPU Usage" 
        value="12%" 
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
          onclick="addServerModal.showModal()"
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

    <!-- Add Server Modal (Kept for now, but restyled) -->
    <dialog id="addServerModal" class="modal">
      <div class="modal-box rounded-3xl bg-base-100 border border-base-content/5 shadow-2xl p-0 overflow-hidden">
        <div class="bg-primary p-6 text-primary-content">
          <h3 class="text-xl font-bold flex items-center gap-2">
            <Icon name="material-symbols:add-circle-rounded" />
            Deploy New Server
          </h3>
          <p class="opacity-80 text-sm mt-1">Configure your new Minecraft instance settings.</p>
        </div>

        <div class="p-8 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label"><span class="label-text font-bold">Server Name</span></label>
              <input v-model="addDialog.newServer.name" type="text" placeholder="Survival 1.20" class="input input-bordered rounded-xl bg-base-200/50 border-none focus:ring-2 focus:ring-primary" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text font-bold">Version</span></label>
              <input v-model="addDialog.newServer.version" type="text" placeholder="1.20.1" class="input input-bordered rounded-xl bg-base-200/50 border-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text font-bold">Server JAR File</span></label>
            <input type="file" accept=".jar" class="file-input file-input-bordered rounded-xl bg-base-200/50 border-none" @change="onFileChange" />
            <label class="label"><span class="label-text-alt text-base-content/40">Select the paper.jar or server.jar file</span></label>
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text font-bold">Max Allocated RAM (GB)</span></label>
            <div class="flex items-center gap-4">
              <input type="range" min="1" max="16" v-model="addDialog.newServer.maxMemory" class="range range-primary range-sm flex-1" />
              <span class="w-16 text-center font-bold bg-primary/10 text-primary py-1 rounded-lg">{{ addDialog.newServer.maxMemory }}GB</span>
            </div>
          </div>
        </div>

        <div class="p-6 bg-base-200/50 flex justify-end gap-3">
          <form method="dialog">
            <button class="btn btn-ghost rounded-xl">Cancel</button>
          </form>
          <button class="btn btn-primary rounded-xl px-8 shadow-lg shadow-primary/20" @click="handleAddServer">Create Server</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import type { MinecraftServer } from "~/types/MinecraftServer";
import axios from 'axios';

const { servers, loading, startServer, stopServer, fetchServers } = useServers()

const onlineCount = computed(() => servers.value.filter(s => s.status === 'online').length)
const offlineCount = computed(() => servers.value.filter(s => s.status === 'offline').length)

const addDialog = reactive({
  newServer: {
    maxMemory: 2
  } as MinecraftServer,
  uploadFile: null as File | null
})

const onFileChange = (event: any) => {
  const file = event.target.files[0];
  if (file) {
    addDialog.newServer.jarName = file.name;
    addDialog.uploadFile = file;
  }
};

const handleAddServer = async () => {
  if (!addDialog.uploadFile) return;

  try {
    const formData = new FormData();
    formData.append('newServer', JSON.stringify(addDialog.newServer));
    formData.append('file', addDialog.uploadFile);

    await $fetch('/api/addServer', {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${useCookie('token').value}`
      }
    });

    await fetchServers();
    // @ts-ignore
    addServerModal.close();
  } catch (error) {
    console.error('Failed to add server:', error);
  }
}
</script>