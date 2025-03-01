<template>
  <div class="flex flex-col items-center justify-center py-16 px-6">
    <h1 class="text-4xl font-bold text-center mb-6">Minecraft Servers</h1>
    <div class="grid md:grid-cols-3 gap-6 w-full max-w-5xl mb-8">
      <div v-for="server in settings.servers" class="card bg-base-100 shadow-2xl p-6" @click="editServerDialog(server)">
        <h2 class="text-xl font-bold text-center">
          {{ server.name }}
        </h2>
        <div class="mt-2 text-sm">
          <p><strong>Version:</strong> {{ server.version }}</p>
          <p><strong>Port</strong> {{ server.port }}</p>
          <p><strong>Slots:</strong> {{ server.maxPlayers }}</p>
          <p><strong>Max Memory:</strong> {{ server.maxMemory }}</p>
        </div>
      </div>

      <div class="card bg-base-100 shadow-2xl p-6 cursor-pointer" onclick="addServerModal.showModal()">
        <h2 class="text-xl font-bold text-center">
          Add Server
        </h2>
        <div class="mt-2 text-sm flex justify-center">
          <Icon name="material-symbols:add" class="icon" />
        </div>
      </div>
    </div>
  </div>

  <dialog id="addServerModal" class="modal">
    <div class="modal-box">
      <h3 class="text-lg font-bold">Add a new Server</h3>

      <label class="form-control w-full max-w-xs">
        <div class="label">
          <span class="label-text">Server Name</span>
        </div>
        <input v-model="addDialog.newServer.name" type="text" placeholder="Type here" class="input input-bordered w-full max-w-xs" />
      </label>
      <label class="form-control w-full max-w-xs">
        <div class="label">
          <span class="label-text">Port</span>
        </div>
        <input v-model="addDialog.newServer.port" type="text" placeholder="Type here" class="input input-bordered w-full max-w-xs" />
      </label>
      <label class="form-control w-full max-w-xs">
        <div class="label">
          <span class="label-text">Max Players</span>
        </div>
        <input v-model="addDialog.newServer.maxPlayers" type="text" placeholder="Type here" class="input input-bordered w-full max-w-xs" />
      </label>
      <label class="form-control w-full max-w-xs">
        <div class="label">
          <span class="label-text">Version</span>
        </div>
        <input v-model="addDialog.newServer.version" type="text" placeholder="Type here" class="input input-bordered w-full max-w-xs" />
      </label>
      <label class="form-control w-full max-w-xs">
        <div class="label">
          <span class="label-text">Jar Download URL</span>
        </div>
        <input v-model="addDialog.newServer.jar_url" type="text" placeholder="Type here" class="input input-bordered w-full max-w-xs" />
      </label>
      <label class="form-control w-full max-w-xs">
        <div class="label">
          <span class="label-text"></span>
        </div>
        <div class="dropdown dropdown-bottom dropdown-center">
          <div tabindex="0" role="button" class="btn m-1">Difficuly: {{addDialog.newServer.difficulty}}</div>
          <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
            <li @click="setNewServerDifficulty('peaceful')"><a>Peaceful</a></li>
            <li @click="setNewServerDifficulty('easy')"><a>Easy</a></li>
            <li @click="setNewServerDifficulty('normal')"><a>Normal</a></li>
            <li @click="setNewServerDifficulty('hard')"><a>Hard</a></li>
          </ul>
        </div>


      </label>
      <label class="form-control w-full max-w-xs">
        <div class="label">
          <span class="label-text">Spawn Protection</span>
        </div>
        <input v-model="addDialog.newServer.spawnProtection" type="text" placeholder="Type here" class="input input-bordered w-full max-w-xs" />
      </label>
      <label class="form-control w-full max-w-xs">
        <div class="label">
          <span class="label-text">Render Distance</span>
        </div>
        <input v-model="addDialog.newServer.viewDistance" type="text" placeholder="Type here" class="input input-bordered w-full max-w-xs" />
      </label>


      <label class="form-control w-full max-w-xs">
        <div class="label">
          <span class="label-text">JVM Min Memory</span>
        </div>
        <input v-model="addDialog.newServer.minMemory" type="text" placeholder="Type here" class="input input-bordered w-full max-w-xs" />
      </label>


      <label class="form-control w-full max-w-xs">
        <div class="label">
          <span class="label-text">JVM Max Memory</span>
        </div>
        <input v-model="addDialog.newServer.maxMemory" type="text" placeholder="Type here" class="input input-bordered w-full max-w-xs" />
      </label>


      <div class="modal-action">
        <form method="dialog">
          <button class="btn" @click="addServer">Add</button>
        </form>
      </div>
    </div>
  </dialog>

  <dialog id="editServerModal" class="modal">
    <div class="modal-box w-11/12 max-w-5xl">
      <h3 class="text-lg font-bold">{{ editDialog.editedServer.name }}</h3>
      <p class="py-4"> blablabla </p>
      <div class="modal-action">
        <form method="dialog">
          <!-- if there is a button, it will close the modal -->
          <button @click="deleteServer" class="btn">Delete</button>
          <button @click="startServer" class="btn">Save Changes</button>
        </form>
      </div>
    </div>
  </dialog>


</template>




<script setup lang="ts">

import type {MinecraftServer} from "~/types/MinecraftServer";
import axios from 'axios';


const settings = reactive({
  servers: [] as MinecraftServer[],
})

const addDialog = reactive({
  newServer: {} as MinecraftServer
})

const editDialog = reactive({
  editedServer: {} as MinecraftServer
})


const getServers = async () => {
  try{
    settings.servers = await $fetch('/api/getServers')
    settings.servers.forEach((server) => {
      console.log(server.name)
    })
  }catch(error){
    console.error(`Error fetch: ${error}`);
  }
}


const editServerDialog = async (server: MinecraftServer) => {
  editDialog.editedServer = server
  // @ts-ignore
  editServerModal.showModal()
}


const addServer = async () => {
  if(!settings.servers.some(server => server.name === addDialog.newServer.name)){
    addDialog.newServer.logs = ["Server Created via Webui"]
    settings.servers.push(addDialog.newServer)
    await syncServers()
  }
}

const deleteServer = async () => {
  let index = settings.servers.findIndex(item => item.name === editDialog.editedServer.name);
  settings.servers.splice(index, 1);
  await syncServers()
}

const setNewServerDifficulty = async (newDiff: "peaceful" | "easy" | "normal" | "hard") => {
  addDialog.newServer.difficulty = newDiff;
}

const syncServers = async () => {
  try {
    const response = await axios.post('/api/setServers', {
      serverList: settings.servers
    });
    console.log(response.data);
  } catch (error) {
    console.error(`Error `, error);
  }
};


const startServer = async () => {
  try {
    const response = await axios.post('/api/startServer', {
      name: editDialog.editedServer.name
    });
    console.log(response.data);
  } catch (error) {
    console.error(`Error `, error);
  }
};





onMounted(async()=>{
  await getServers()
})

</script>


<style>
.icon {
  width: 5rem;  /* You can adjust this value based on your needs */
  height: 5rem; /* Set both width and height */
  object-fit: contain; /* Keep the aspect ratio of the icon */
}
</style>