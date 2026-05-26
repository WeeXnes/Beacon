<script setup lang="ts">
const props = defineProps<{
  serverName: string;
}>();

const currentPath = ref('');
const files = ref<any[]>([]);
const loading = ref(false);
const editingFile = ref<{ name: string; path: string; content: string } | null>(null);

const fetchFiles = async () => {
  loading.ref = true;
  try {
    const data = await $fetch('/api/listFiles', {
      method: 'POST',
      body: { name: props.serverName, path: currentPath.value },
      headers: { Authorization: `Bearer ${useCookie('token').value}` }
    });
    files.value = data as any[];
  } catch (error) {
    console.error('Failed to list files:', error);
  } finally {
    loading.value = false;
  }
};

const navigateTo = (folderName: string) => {
  if (folderName === '..') {
    const parts = currentPath.value.split('/').filter(p => p !== '');
    parts.pop();
    currentPath.value = parts.join('/');
  } else {
    currentPath.value = currentPath.value ? `${currentPath.value}/${folderName}` : folderName;
  }
  fetchFiles();
};

const deleteFile = async (fileName: string) => {
  if (!confirm(`Are you sure you want to delete ${fileName}?`)) return;
  
  try {
    const filePath = currentPath.value ? `${currentPath.value}/${fileName}` : fileName;
    await $fetch('/api/deleteFile', {
      method: 'POST',
      body: { name: props.serverName, path: filePath },
      headers: { Authorization: `Bearer ${useCookie('token').value}` }
    });
    fetchFiles();
  } catch (error) {
    console.error('Failed to delete file:', error);
  }
};

const editFile = async (fileName: string) => {
  try {
    const filePath = currentPath.value ? `${currentPath.value}/${fileName}` : fileName;
    const { content } = await $fetch<{ content: string }>('/api/readFile', {
      method: 'POST',
      body: { name: props.serverName, path: filePath },
      headers: { Authorization: `Bearer ${useCookie('token').value}` }
    });
    editingFile.value = { name: fileName, path: filePath, content };
  } catch (error) {
    console.error('Failed to read file:', error);
  }
};

const saveFile = async (newContent: string) => {
  if (!editingFile.value) return;
  try {
    await $fetch('/api/writeFile', {
      method: 'POST',
      body: { name: props.serverName, path: editingFile.value.path, content: newContent },
      headers: { Authorization: `Bearer ${useCookie('token').value}` }
    });
    editingFile.value = null;
    fetchFiles();
  } catch (error) {
    console.error('Failed to save file:', error);
  }
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleString();
};

onMounted(() => {
  fetchFiles();
});
</script>

<template>
  <div class="card bg-base-200 shadow-xl overflow-hidden">
    <div class="card-body p-0">
      <div class="flex items-center justify-between p-4 bg-base-300">
        <div class="flex items-center gap-2 overflow-hidden">
          <Icon name="lucide:folder" class="w-5 h-5 text-primary" />
          <span class="text-sm font-mono truncate">/{{ currentPath }}</span>
        </div>
        <button @click="fetchFiles" class="btn btn-sm btn-ghost" :disabled="loading">
          <Icon name="lucide:refresh-cw" :class="{ 'animate-spin': loading }" />
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="table table-zebra w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Size</th>
              <th>Last Modified</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="currentPath !== ''" class="hover cursor-pointer" @click="navigateTo('..')">
              <td>
                <div class="flex items-center gap-2 text-primary">
                  <Icon name="lucide:corner-left-up" />
                  <span>..</span>
                </div>
              </td>
              <td>-</td>
              <td>-</td>
              <td></td>
            </tr>
            <tr v-for="file in files" :key="file.name" class="hover">
              <td class="cursor-pointer" @click="file.isDirectory ? navigateTo(file.name) : editFile(file.name)">
                <div class="flex items-center gap-2">
                  <Icon :name="file.isDirectory ? 'lucide:folder' : 'lucide:file-text'" 
                        :class="file.isDirectory ? 'text-primary' : 'text-base-content/70'" />
                  <span :class="{ 'font-bold': file.isDirectory }">{{ file.name }}</span>
                </div>
              </td>
              <td class="text-xs opacity-70">{{ file.isDirectory ? '-' : formatSize(file.size) }}</td>
              <td class="text-xs opacity-70">{{ formatDate(file.lastModified) }}</td>
              <td class="text-right">
                <div class="flex justify-end gap-1">
                  <button v-if="!file.isDirectory" @click="editFile(file.name)" class="btn btn-xs btn-ghost text-info">
                    <Icon name="lucide:edit-3" />
                  </button>
                  <button @click="deleteFile(file.name)" class="btn btn-xs btn-ghost text-error">
                    <Icon name="lucide:trash-2" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="files.length === 0 && !loading">
              <td colspan="4" class="text-center py-8 opacity-50 italic">Directory is empty</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- File Editor Modal -->
    <div v-if="editingFile" class="modal modal-open">
      <div class="modal-box w-11/12 max-w-5xl h-5/6 flex flex-col p-0 overflow-hidden bg-base-100">
        <div class="flex items-center justify-between p-4 border-b border-base-300">
          <h3 class="font-bold flex items-center gap-2">
            <Icon name="lucide:edit-3" class="text-info" />
            Editing: {{ editingFile.name }}
          </h3>
          <button @click="editingFile = null" class="btn btn-sm btn-circle btn-ghost">✕</button>
        </div>
        
        <div class="flex-grow p-0">
          <textarea v-model="editingFile.content" 
                    class="w-full h-full p-4 font-mono text-sm bg-base-300 focus:outline-none resize-none"
                    spellcheck="false"></textarea>
        </div>

        <div class="p-4 border-t border-base-300 flex justify-end gap-2">
          <button @click="editingFile = null" class="btn btn-ghost">Cancel</button>
          <button @click="saveFile(editingFile.content)" class="btn btn-primary">Save Changes</button>
        </div>
      </div>
    </div>
  </div>
</template>