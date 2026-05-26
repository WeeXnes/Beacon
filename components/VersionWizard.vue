<script setup lang="ts">
const emit = defineEmits(['installed', 'close']);

const step = ref(1);
const loading = ref(false);
const error = ref('');

const versions = ref<string[]>([]);
const selectedVersion = ref('');
const serverName = ref('');
const maxMemory = ref(2);
const javaVersionName = ref<string | undefined>(undefined);
const uploadFile = ref<File | null>(null);
const javaVersions = ref<any[]>([]);

const fetchJavaVersions = async () => {
  try {
    javaVersions.value = await $fetch('/api/getJavaVersions', {
      headers: { Authorization: `Bearer ${useCookie('token').value}` }
    });
  } catch (error) {
    console.error('Failed to fetch Java versions:', error);
  }
};

const fetchVersions = async () => {
  loading.value = true;
  try {
    const data = await $fetch<{ versions: string[] }>('/api/getVersions', {
        headers: { Authorization: `Bearer ${useCookie('token').value}` }
    });
    versions.value = data.versions;
    if (versions.value.length > 0) {
      selectedVersion.value = versions.value[0];
    }
    step.value = 2; // Step 2 is PaperMC config
  } catch (e: any) {
    error.value = 'Failed to fetch versions.';
  } finally {
    loading.value = false;
  }
};

const onFileChange = (event: any) => {
  const file = event.target.files[0];
  if (file) {
    uploadFile.value = file;
  }
};

const installManual = async () => {
  if (!serverName.value || !uploadFile.value) {
    error.value = 'Please fill all fields and select a JAR file.';
    return;
  }

  loading.value = true;
  error.value = '';
  try {
    const formData = new FormData();
    formData.append('newServer', JSON.stringify({
      name: serverName.value,
      version: 'Manual',
      jarName: uploadFile.value.name,
      maxMemory: maxMemory.value,
      javaVersionName: javaVersionName.value
    }));
    formData.append('file', uploadFile.value);

    await $fetch('/api/addServer', {
      method: 'POST',
      body: formData,
      headers: { Authorization: `Bearer ${useCookie('token').value}` }
    });
    emit('installed');
  } catch (e: any) {
    error.value = 'Upload failed.';
  } finally {
    loading.value = false;
  }
};

const install = async () => {
  if (!serverName.value) {
    error.value = 'Please enter a server name.';
    return;
  }
  
  loading.value = true;
  error.value = '';
  try {
    await $fetch('/api/installVersion', {
      method: 'POST',
      body: {
        name: serverName.value,
        version: selectedVersion.value,
        project: 'paper',
        maxMemory: maxMemory.value
      },
      headers: { Authorization: `Bearer ${useCookie('token').value}` }
    });
    emit('installed');
  } catch (e: any) {
    error.value = e.statusMessage || 'Installation failed.';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchJavaVersions();
});
</script>

<template>
  <div class="modal modal-open">
    <div class="modal-box max-w-md bg-base-100 rounded-3xl border border-base-content/5 shadow-2xl">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-bold flex items-center gap-2">
          <Icon name="lucide:plus-circle" class="text-primary" />
          Create New Server
        </h3>
        <button @click="emit('close')" class="btn btn-sm btn-circle btn-ghost">✕</button>
      </div>

      <!-- Step 1: Select Type -->
      <div v-if="step === 1" class="space-y-6">
        <p class="text-base-content/60">Choose the type of Minecraft server you want to install.</p>
        <div class="grid grid-cols-1 gap-3">
          <button @click="fetchVersions" class="btn btn-outline btn-lg h-24 flex flex-col gap-1 items-start px-6 rounded-2xl border-base-content/10 hover:border-primary hover:bg-primary/5 group">
            <div class="flex items-center gap-2 text-primary font-bold">
              <Icon name="simple-icons:papermc" />
              PaperMC
            </div>
            <span class="text-xs text-base-content/40 font-normal">High-performance server with plugin support.</span>
          </button>
          
          <button @click="step = 3" class="btn btn-outline btn-lg h-24 flex flex-col gap-1 items-start px-6 rounded-2xl border-base-content/10 hover:border-primary hover:bg-primary/5 group">
            <div class="flex items-center gap-2 text-primary font-bold">
              <Icon name="lucide:upload" />
              Manual JAR Upload
            </div>
            <span class="text-xs text-base-content/40 font-normal">Upload your own server.jar or paper.jar file.</span>
          </button>

          <div class="btn btn-outline btn-lg h-24 flex flex-col gap-1 items-start px-6 rounded-2xl border-base-content/10 opacity-50 cursor-not-allowed">
             <div class="flex items-center gap-2 font-bold">
              <Icon name="mdi:minecraft" />
              Vanilla (Coming Soon)
            </div>
            <span class="text-xs font-normal">Official Minecraft server software.</span>
          </div>
        </div>
      </div>

      <!-- Step 2: PaperMC Configure -->
      <div v-if="step === 2" class="space-y-4">
        <div class="form-control w-full">
          <label class="label"><span class="label-text font-bold">Server Name</span></label>
          <input v-model="serverName" type="text" placeholder="My Awesome Server" class="input input-bordered rounded-xl bg-base-200/50 border-base-content/5" />
        </div>

        <div class="form-control w-full">
          <label class="label"><span class="label-text font-bold">Version</span></label>
          <select v-model="selectedVersion" class="select select-bordered rounded-xl bg-base-200/50 border-base-content/5">
            <option v-for="v in versions" :key="v" :value="v">{{ v }}</option>
          </select>
        </div>

        <div class="form-control w-full">
          <label class="label"><span class="label-text font-bold">Memory (GB)</span></label>
          <div class="flex items-center gap-4">
            <input type="range" min="1" max="16" v-model="maxMemory" class="range range-primary range-sm flex-1" />
            <span class="w-12 text-center font-bold">{{ maxMemory }}G</span>
          </div>
        </div>

        <div v-if="error" class="alert alert-error text-sm py-2 rounded-xl">
          <Icon name="lucide:alert-circle" />
          <span>{{ error }}</span>
        </div>

        <div class="modal-action mt-8">
          <button @click="step = 1" class="btn btn-ghost rounded-xl">Back</button>
          <button @click="install" class="btn btn-primary px-8 rounded-xl shadow-lg shadow-primary/20" :disabled="loading">
            <span v-if="loading" class="loading loading-spinner"></span>
            Install Server
          </button>
        </div>
      </div>

      <!-- Step 3: Manual Upload Configure -->
      <div v-if="step === 3" class="space-y-4">
        <div class="form-control w-full">
          <label class="label"><span class="label-text font-bold">Server Name</span></label>
          <input v-model="serverName" type="text" placeholder="Custom Server" class="input input-bordered rounded-xl bg-base-200/50 border-base-content/5" />
        </div>

        <div class="form-control w-full">
          <label class="label"><span class="label-text font-bold">Server JAR File</span></label>
          <input type="file" accept=".jar" class="file-input file-input-bordered w-full rounded-xl bg-base-200/50 border-base-content/5" @change="onFileChange" />
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
                <label class="label"><span class="label-text font-bold">Memory (GB)</span></label>
                <input type="number" v-model="maxMemory" class="input input-bordered rounded-xl bg-base-200/50 border-base-content/5" />
            </div>
            <div class="form-control">
                <label class="label"><span class="label-text font-bold">Java Runtime</span></label>
                <select v-model="javaVersionName" class="select select-bordered rounded-xl bg-base-200/50 border-base-content/5">
                    <option :value="undefined">System Default</option>
                    <option v-for="java in javaVersions" :key="java.name" :value="java.name">{{ java.name }}</option>
                </select>
            </div>
        </div>

        <div v-if="error" class="alert alert-error text-sm py-2 rounded-xl">
          <Icon name="lucide:alert-circle" />
          <span>{{ error }}</span>
        </div>

        <div class="modal-action mt-8">
          <button @click="step = 1" class="btn btn-ghost rounded-xl">Back</button>
          <button @click="installManual" class="btn btn-primary px-8 rounded-xl shadow-lg shadow-primary/20" :disabled="loading">
            <span v-if="loading" class="loading loading-spinner"></span>
            Upload & Create
          </button>
        </div>
      </div>

      <div v-if="loading && step >= 2" class="absolute inset-0 bg-base-100/50 backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-3xl">
         <div class="loading loading-infinity loading-lg text-primary"></div>
         <p class="mt-4 font-bold animate-pulse">{{ step === 2 ? 'Downloading JAR file...' : 'Uploading JAR file...' }}</p>
         <p class="text-xs text-base-content/40 mt-1">This may take a minute depending on your connection.</p>
      </div>
    </div>
  </div>
</template>