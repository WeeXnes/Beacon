<template>
  <div class="p-8 space-y-8 max-w-4xl mx-auto">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">System Settings</h1>
      <p class="text-base-content/50 text-lg">Configure your Beacon instance and global preferences.</p>
    </div>

    <div class="grid grid-cols-1 gap-8">
      <!-- General Settings -->
      <section class="bg-base-200/50 backdrop-blur-md rounded-3xl border border-base-content/5 overflow-hidden">
        <div class="p-6 border-b border-base-content/5">
          <h2 class="font-bold flex items-center gap-2">
            <Icon name="material-symbols:settings-suggest-outline-rounded" class="text-primary" />
            General Configuration
          </h2>
        </div>
        <div class="p-8 space-y-6">
          <div class="form-control">
            <div class="flex items-center justify-between">
              <div>
                <span class="font-bold">Auto-Accept EULA</span>
                <p class="text-xs text-base-content/50">Automatically accept the Minecraft EULA for new servers.</p>
              </div>
              <input type="checkbox" class="toggle toggle-primary" checked />
            </div>
          </div>
          
          <div class="divider"></div>

          <div class="form-control">
            <label class="label"><span class="label-text font-bold">Data Storage Path</span></label>
            <input type="text" value="~/.mcservermanager" class="input input-bordered rounded-xl bg-base-100/50" disabled />
            <label class="label"><span class="label-text-alt opacity-50">This is where your servers and settings are stored.</span></label>
          </div>
        </div>
      </section>

      <!-- Java Management -->
      <section class="bg-base-200/50 backdrop-blur-md rounded-3xl border border-base-content/5 overflow-hidden">
        <div class="p-6 border-b border-base-content/5 flex items-center justify-between">
          <h2 class="font-bold flex items-center gap-2">
            <Icon name="material-symbols:terminal-rounded" class="text-warning" />
            Java Runtime Management
          </h2>
          <div class="flex gap-2">
            <button @click="discoverJava" class="btn btn-ghost btn-sm rounded-lg gap-2" :disabled="scanning">
              <span v-if="scanning" class="loading loading-spinner loading-xs"></span>
              <Icon v-else name="material-symbols:search-rounded" />
              Scan System
            </button>
            <button @click="addJavaVersion" class="btn btn-primary btn-sm rounded-lg gap-2">
              <Icon name="material-symbols:add-rounded" />
              Add Version
            </button>
          </div>
        </div>
        <div class="p-8">
          <div v-if="javaVersions.length === 0" class="text-center py-8 bg-base-100/30 rounded-2xl border border-dashed border-base-content/10">
            <p class="text-base-content/40 text-sm">No custom Java versions added. System "java" will be used.</p>
          </div>
          <div v-else class="space-y-4">
            <div v-for="(java, index) in javaVersions" :key="index" class="flex items-center gap-4 bg-base-100/50 p-4 rounded-2xl border border-base-content/5">
              <div class="flex-1 space-y-1">
                <input v-model="java.name" placeholder="Name (e.g. Java 17)" class="input input-ghost input-xs font-bold w-full" />
                <input v-model="java.path" placeholder="Absolute path to binary" class="input input-ghost input-xs text-base-content/50 w-full" />
              </div>
              <button @click="removeJavaVersion(index)" class="btn btn-ghost btn-sm btn-square text-error">
                <Icon name="material-symbols:delete-outline-rounded" class="text-xl" />
              </button>
            </div>
          </div>
          <div v-if="javaVersions.length > 0" class="mt-6 flex justify-end">
            <button @click="saveJavaVersions" class="btn btn-primary btn-sm rounded-lg px-6" :disabled="saving">
              <span v-if="saving" class="loading loading-spinner loading-xs"></span>
              Save Java Config
            </button>
          </div>
        </div>
      </section>

      <!-- Security -->
      <section class="bg-base-200/50 backdrop-blur-md rounded-3xl border border-base-content/5 overflow-hidden">
        <div class="p-6 border-b border-base-content/5">
          <h2 class="font-bold flex items-center gap-2">
            <Icon name="material-symbols:security-rounded" class="text-error" />
            Security & Authentication
          </h2>
        </div>
        <div class="p-8 space-y-6">
          <div class="form-control">
            <label class="label"><span class="label-text font-bold">Update Access Key</span></label>
            <div class="flex gap-4">
              <input v-model="newPassword" type="password" placeholder="New Password" class="input input-bordered rounded-xl bg-base-100/50 flex-1" />
              <button @click="updatePassword" class="btn btn-primary rounded-xl px-8" :disabled="updatingPassword">
                <span v-if="updatingPassword" class="loading loading-spinner loading-xs"></span>
                Update
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Discord Integration -->
      <section class="bg-base-200/50 backdrop-blur-md rounded-3xl border border-base-content/5 overflow-hidden">
        <div class="p-6 border-b border-base-content/5">
          <h2 class="font-bold flex items-center gap-2">
            <Icon name="simple-icons:discord" class="text-[#5865F2]" />
            Discord Bot Integration
          </h2>
        </div>
        <div class="p-8 space-y-6">
          <div class="alert alert-info rounded-2xl bg-primary/10 border-primary/20 text-primary py-4">
            <Icon name="lucide:info" />
            <div class="text-xs font-bold uppercase tracking-wide">
              Changes to the Discord configuration require a full application restart to take effect.
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="form-control">
              <label class="label"><span class="label-text font-bold">Bot Token</span></label>
              <input v-model="discordConfig.token" type="password" placeholder="MTIz..." class="input input-bordered rounded-xl bg-base-100/50" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text font-bold">Client ID</span></label>
              <input v-model="discordConfig.clientId" type="text" placeholder="123456789..." class="input input-bordered rounded-xl bg-base-100/50" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text font-bold">Guild ID (Server ID)</span></label>
              <input v-model="discordConfig.guildId" type="text" placeholder="987654321..." class="input input-bordered rounded-xl bg-base-100/50" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text font-bold">Panel Base URL</span></label>
              <input v-model="panelUrl" type="text" placeholder="https://beacon.example.com" class="input input-bordered rounded-xl bg-base-100/50" />
              <label class="label"><span class="label-text-alt opacity-50">Used for mod downloads and external links.</span></label>
            </div>
          </div>
          <div class="flex justify-end">
            <button @click="saveDiscordConfig" class="btn btn-primary btn-sm rounded-lg px-6" :disabled="savingDiscord">
              <span v-if="savingDiscord" class="loading loading-spinner loading-xs"></span>
              Save Discord Config
            </button>
          </div>
        </div>
      </section>

      <!-- External API Access -->
      <section class="bg-base-200/50 backdrop-blur-md rounded-3xl border border-base-content/5 overflow-hidden">
        <div class="p-6 border-b border-base-content/5 flex items-center justify-between">
          <h2 class="font-bold flex items-center gap-2">
            <Icon name="material-symbols:api-rounded" class="text-primary" />
            External API Access
          </h2>
          <button @click="showTokenModal = true" class="btn btn-primary btn-sm rounded-lg gap-2">
            <Icon name="material-symbols:add-rounded" />
            Generate Token
          </button>
        </div>
        <div class="p-8">
          <div v-if="apiTokens.length === 0" class="text-center py-8 bg-base-100/30 rounded-2xl border border-dashed border-base-content/10">
            <p class="text-base-content/40 text-sm">No API tokens generated yet. Create one to allow external control.</p>
          </div>
          <div v-else class="space-y-4">
            <div v-for="token in apiTokens" :key="token.token" class="flex items-center gap-4 bg-base-100/50 p-4 rounded-2xl border border-base-content/5 group">
              <div class="flex-1 min-w-0">
                <p class="font-bold truncate">{{ token.name }}</p>
                <p class="text-[10px] uppercase font-bold opacity-30">Created: {{ new Date(token.createdAt).toLocaleDateString() }}</p>
              </div>
              <div class="flex items-center gap-2">
                <button @click="copyToken(token.token)" class="btn btn-ghost btn-sm btn-square text-primary" title="Copy Token">
                  <Icon name="material-symbols:content-copy-rounded" />
                </button>
                <button @click="deleteApiToken(token.token)" class="btn btn-ghost btn-sm btn-square text-error" title="Revoke Token">
                  <Icon name="material-symbols:delete-outline-rounded" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Token Modal -->
      <dialog :open="showTokenModal" class="modal modal-bottom sm:modal-middle bg-base-300/60 backdrop-blur-sm">
        <div class="modal-box bg-base-100 rounded-3xl border border-base-content/5 shadow-2xl">
          <h3 class="font-bold text-lg mb-4">Generate API Token</h3>
          <p class="text-sm opacity-50 mb-6">Give your token a name to identify it later (e.g. "Discord Bot", "Mobile App").</p>
          
          <div v-if="!generatedToken">
            <div class="form-control w-full">
              <label class="label"><span class="label-text font-bold">Token Name</span></label>
              <input v-model="newTokenName" @keyup.enter="generateToken" type="text" placeholder="External App Name" class="input input-bordered rounded-xl bg-base-200 border-base-content/5" />
            </div>
            <div class="modal-action">
              <button @click="showTokenModal = false; newTokenName = ''" class="btn btn-ghost rounded-xl">Cancel</button>
              <button @click="generateToken" class="btn btn-primary rounded-xl px-8" :disabled="!newTokenName || savingToken">
                <span v-if="savingToken" class="loading loading-spinner loading-xs"></span>
                Generate
              </button>
            </div>
          </div>
          
          <div v-else class="space-y-4">
            <div class="alert alert-warning rounded-2xl text-xs font-bold uppercase tracking-wide">
              <Icon name="lucide:alert-triangle" />
              Copy this token now! It will not be shown again.
            </div>
            <div class="bg-base-200 p-4 rounded-xl font-mono text-xs break-all border border-base-content/5 flex items-center gap-4">
              <span class="flex-1">{{ generatedToken }}</span>
              <button @click="copyToken(generatedToken)" class="btn btn-primary btn-sm btn-square">
                <Icon name="material-symbols:content-copy-rounded" />
              </button>
            </div>
            <div class="modal-action">
              <button @click="closeTokenModal" class="btn btn-primary rounded-xl px-12 w-full">I've Saved It</button>
            </div>
          </div>
        </div>
      </dialog>

      <!-- About -->
      <div class="text-center p-8 space-y-4">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
          <Icon name="mdi:minecraft" class="text-2xl" />
        </div>
        <div>
          <p class="font-bold">Beacon Manager</p>
          <p class="text-xs text-base-content/30">Version 1.0.0-alpha • Built with Nuxt 3 & DaisyUI</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { JavaVersion, DiscordConfig, ApiToken } from '~/types/SettingsJsonFile';

const javaVersions = ref<JavaVersion[]>([]);
const discordConfig = ref<DiscordConfig>({
  enabled: false,
  token: '',
  clientId: '',
  guildId: ''
});
const panelUrl = ref('');
const apiTokens = ref<ApiToken[]>([]);

const showTokenModal = ref(false);
const newTokenName = ref('');
const generatedToken = ref('');
const savingToken = ref(false);

const newPassword = ref('');
const updatingPassword = ref(false);

const saving = ref(false);
const savingDiscord = ref(false);
const scanning = ref(false);

const fetchSettings = async () => {
  const token = useCookie('token').value;
  try {
    const javaData = await $fetch<JavaVersion[]>('/api/getJavaVersions', { headers: { Authorization: `Bearer ${token}` } });
    javaVersions.value = javaData || [];
    
    const discordData = await $fetch<any>('/api/getDiscordConfig', { headers: { Authorization: `Bearer ${token}` } });
    discordConfig.value = {
      enabled: discordData.enabled,
      token: discordData.token,
      clientId: discordData.clientId,
      guildId: discordData.guildId
    };
    panelUrl.value = discordData.panelUrl || '';

    const tokenData = await $fetch<ApiToken[]>('/api/getApiTokens', { headers: { Authorization: `Bearer ${token}` } });
    apiTokens.value = tokenData || [];
  } catch (error) {
    console.error('Failed to fetch settings:', error);
  }
};

const generateToken = async () => {
  if (!newTokenName.value) return;
  savingToken.value = true;
  try {
    const data = await $fetch<ApiToken>('/api/addApiToken', {
      method: 'POST',
      body: { name: newTokenName.value },
      headers: { Authorization: `Bearer ${useCookie('token').value}` }
    });
    generatedToken.value = data.token;
    await fetchSettings();
  } catch (error) {
    console.error('Failed to generate token:', error);
  } finally {
    savingToken.value = false;
  }
};

const deleteApiToken = async (token: string) => {
  if (!confirm('Are you sure you want to revoke this token? External apps using it will lose access.')) return;
  try {
    await $fetch('/api/deleteApiToken', {
      method: 'POST',
      body: { token },
      headers: { Authorization: `Bearer ${useCookie('token').value}` }
    });
    await fetchSettings();
  } catch (error) {
    console.error('Failed to delete token:', error);
  }
};

const copyToken = (text: string) => {
  navigator.clipboard.writeText(text);
  alert('Token copied to clipboard!');
};

const closeTokenModal = () => {
  showTokenModal.value = false;
  generatedToken.value = '';
  newTokenName.value = '';
};

const addJavaVersion = () => {
  javaVersions.value.push({ name: '', path: '' });
};

const discoverJava = async () => {
  scanning.value = true;
  try {
    const data = await $fetch<JavaVersion[]>('/api/discoverJavaVersions', {
      headers: {
        Authorization: `Bearer ${useCookie('token').value}`
      }
    });
    
    // Add only if not already in the list
    data.forEach(discovered => {
      const exists = javaVersions.value.some(v => v.path === discovered.path);
      if (!exists) {
        javaVersions.value.push(discovered);
      }
    });
  } catch (error) {
    console.error('Failed to discover Java versions:', error);
  } finally {
    scanning.value = false;
  }
};

const removeJavaVersion = (index: number) => {
  javaVersions.value.splice(index, 1);
};

const saveJavaVersions = async () => {
  saving.value = true;
  try {
    await $fetch('/api/setJavaVersions', {
      method: 'POST',
      body: { javaVersions: javaVersions.value },
      headers: {
        Authorization: `Bearer ${useCookie('token').value}`
      }
    });
  } catch (error) {
    console.error('Failed to save Java versions:', error);
  } finally {
    saving.value = false;
  }
};

const saveDiscordConfig = async () => {
  savingDiscord.value = true;
  try {
    await $fetch('/api/setDiscordConfig', {
      method: 'POST',
      body: { 
        discordConfig: discordConfig.value,
        panelUrl: panelUrl.value
      },
      headers: {
        Authorization: `Bearer ${useCookie('token').value}`
      }
    });
  } catch (error) {
    console.error('Failed to save Discord config:', error);
  } finally {
    savingDiscord.value = false;
  }
};

const updatePassword = async () => {
  if (!newPassword.value) {
    alert('Please enter a new password');
    return;
  }
  
  updatingPassword.value = true;
  try {
    const response = await $fetch<any>('/api/setPassword', {
      method: 'POST',
      body: { password: newPassword.value },
      headers: {
        Authorization: `Bearer ${useCookie('token').value}`
      }
    });
    
    if (response.status === 'success') {
      alert('Password updated successfully!');
      newPassword.value = '';
    } else {
      alert('Failed to update password: ' + response.message);
    }
  } catch (error) {
    console.error('Failed to update password:', error);
    alert('Failed to update password. Please check the console for details.');
  } finally {
    updatingPassword.value = false;
  }
};

onMounted(() => {
  fetchSettings();
});
</script>
