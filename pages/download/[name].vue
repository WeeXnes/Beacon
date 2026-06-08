<template>
  <div class="min-h-screen bg-base-300 flex items-center justify-center p-4">
    <div class="max-w-xl w-full">
      <!-- Loading State -->
      <div v-if="loading" class="bg-base-100/50 backdrop-blur-xl p-12 rounded-[2.5rem] shadow-2xl border border-base-content/5 text-center">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="mt-4 font-bold opacity-50 uppercase tracking-widest text-xs">Fetching Mod List...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-base-100/50 backdrop-blur-xl p-12 rounded-[2.5rem] shadow-2xl border border-base-content/5 text-center">
        <div class="w-20 h-20 bg-error/10 text-error rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Icon name="material-symbols:error-outline-rounded" class="text-5xl" />
        </div>
        <h1 class="text-2xl font-bold mb-2">Oops!</h1>
        <p class="text-base-content/60 mb-8">{{ error }}</p>
        <NuxtLink to="/" class="btn btn-ghost rounded-2xl">Return Home</NuxtLink>
      </div>

      <!-- Content -->
      <div v-else-if="data" class="bg-base-100 rounded-[2.5rem] shadow-2xl border border-base-content/5 overflow-hidden">
        <!-- Header -->
        <div class="bg-primary p-10 text-primary-content relative overflow-hidden">
          <Icon name="mdi:minecraft" class="absolute -right-8 -bottom-8 text-9xl opacity-10 rotate-12" />
          <div class="relative z-10">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <Icon name="material-symbols:extension-rounded" class="text-3xl" />
              </div>
              <div>
                <h1 class="text-2xl font-bold tracking-tight">{{ data.serverName }}</h1>
                <p class="text-xs font-bold uppercase tracking-widest opacity-70">{{ data.version }}</p>
              </div>
            </div>
            <p class="text-sm opacity-80 leading-relaxed max-w-sm">
              Download all required mods for this server in a single ZIP file.
            </p>
          </div>
        </div>

        <!-- Mod List -->
        <div class="p-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="font-bold flex items-center gap-2">
              <Icon name="material-symbols:list-alt-rounded" class="text-primary" />
              Included Mods ({{ data.mods.length }})
            </h2>
          </div>

          <div class="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            <div v-for="mod in data.mods" :key="mod.name" class="flex items-center justify-between p-4 bg-base-200/50 rounded-2xl border border-base-content/5 hover:border-primary/20 transition-colors group">
              <div class="flex items-center gap-3 min-w-0">
                <Icon name="material-symbols:deployed-code-rounded" class="text-xl text-primary/40 group-hover:text-primary transition-colors shrink-0" />
                <span class="text-xs font-medium truncate opacity-80">{{ mod.name }}</span>
              </div>
              <span class="text-[10px] font-bold opacity-30 shrink-0">{{ formatBytes(mod.size) }}</span>
            </div>
            
            <div v-if="data.mods.length === 0" class="py-12 text-center opacity-40">
              <Icon name="material-symbols:folder-off-rounded" class="text-5xl mb-3" />
              <p class="text-sm font-bold">No mods found in the folder</p>
            </div>
          </div>

          <div class="mt-8">
            <button 
              @click="downloadZip" 
              class="btn btn-primary btn-lg w-full rounded-[1.5rem] shadow-xl shadow-primary/20 gap-3"
              :disabled="data.mods.length === 0"
            >
              <Icon name="material-symbols:download-rounded" class="text-2xl" />
              Download Modpack (.zip)
            </button>
            <p class="text-[10px] text-center mt-4 opacity-40 font-bold uppercase tracking-widest">
              Generated Live from Server Assets
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const serverName = route.params.name as string;

const loading = ref(true);
const error = ref<string | null>(null);
const data = ref<any>(null);

const fetchModList = async () => {
  try {
    const res = await $fetch<any>(`/api/getModList?name=${serverName}`);
    data.value = res;
  } catch (err: any) {
    error.value = err.statusMessage || 'Failed to load mod list';
  } finally {
    loading.value = false;
  }
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const downloadZip = () => {
  window.location.href = `/api/downloadMods?name=${encodeURIComponent(serverName)}`;
};

onMounted(() => {
  fetchModList();
});

definePageMeta({
  layout: false
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(var(--p), 0.1);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--p), 0.2);
}
</style>
