<template>
  <div class="flex flex-col items-center justify-center py-16 px-6">
    <h1 class="text-4xl font-bold text-center mb-6">Minecraft Servers</h1>
    <div class="grid md:grid-cols-3 gap-6 w-full max-w-5xl mb-8">
      <div v-for="server in settings.servers" class="card bg-base-100 shadow-2xl p-6">
        <h2 class="text-xl font-bold text-center cursor-pointer" @click="showServerLogDialog(server)">
          {{ server.name }}
        </h2>

        <div class="mt-2 text-sm">
          <p><strong>Version:</strong> {{ server.version }}</p>
          <p><strong>Memory:</strong> {{ server.maxMemory }}GB</p>
        </div>

        <div class="form-control mt-4 flex flex-row gap-2">
          <button @click="startServer(server)" class="btn btn-primary w-1/3">Start</button>
          <button @click="showEditServerDialog(server)" class="btn btn-warning w-1/3">Edit</button>
          <button @click="stopServer(server)" class="btn btn-error w-1/3">Stop</button>

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





  <input type="checkbox" id="serverLogModal" class="modal-toggle" />
  <div class="modal" role="dialog">
    <div class="modal-box w-11/12 max-w-5xl">
      <h3 class="text-lg font-bold text-center">{{ serverLogDialog.selectedServer.name }}</h3>
      <div class="mockup-code w-full">
        <pre v-for="str in serverLogDialog.logs" data-prefix="$"><code>{{str}}</code></pre>
      </div>
      <div class="modal-action flex justify-between space-x-4">
        <!-- Start Button -->
        <button @click="startServer(serverLogDialog.selectedServer)" class="btn btn-primary">Start</button>

        <!-- Stop Button -->
        <button @click="stopServer(serverLogDialog.selectedServer)" class="btn btn-error">Stop</button>
      </div>
    </div>
    <label class="modal-backdrop" for="serverLogModal">Close</label>
  </div>



  <dialog id="editServerModal" class="modal">
    <div class="modal-box">
      <h3 class="text-lg font-bold">Edit Server: {{ editServerDialog.selectedServer.name }}</h3>

      <div class="grid grid-cols-2 gap-4">
        <!-- First row -->
        <label class="form-control w-full max-w-xs">
          <div class="label">
            <span class="label-text">Difficulty</span>
          </div>
          <input v-model="editServerDialog.properties['difficulty']" type="text" placeholder="Type here" class="input input-bordered w-full max-w-xs" />
        </label>

        <label class="form-control w-full max-w-xs">
          <div class="label">
            <span class="label-text">Server Port</span>
          </div>
          <input v-model="editServerDialog.properties['server-port']" type="text" placeholder="Type here" class="input input-bordered w-full max-w-xs" />
        </label>

        <!-- Second row (adding more elements) -->
        <label class="form-control w-full max-w-xs">
          <div class="label">
            <span class="label-text">Command Blocks</span>
          </div>
          <input v-model="editServerDialog.properties['enable-command-block']" type="text" placeholder="Type here" class="input input-bordered w-full max-w-xs" />
        </label>

        <label class="form-control w-full max-w-xs">
          <div class="label">
            <span class="label-text">Gamemode</span>
          </div>
          <input v-model="editServerDialog.properties['gamemode']" type="text" placeholder="Type here" class="input input-bordered w-full max-w-xs" />
        </label>

        <!-- Third row -->
        <label class="form-control w-full max-w-xs">
          <div class="label">
            <span class="label-text">Slots</span>
          </div>
          <input v-model="editServerDialog.properties['max-players']" type="text" placeholder="Type here" class="input input-bordered w-full max-w-xs" />
        </label>

        <label class="form-control w-full max-w-xs">
          <div class="label">
            <span class="label-text">PVP</span>
          </div>
          <input v-model="editServerDialog.properties['pvp']" type="text" placeholder="Type here" class="input input-bordered w-full max-w-xs" />
        </label>
      </div>



      <div class="modal-action flex justify-between space-x-4">
        <!-- Save Button -->
        <form method="dialog">
          <button class="btn btn-primary" @click="editServer">Save</button>
        </form>

        <!-- Delete Button -->
        <form method="dialog">
          <button class="btn btn-error" @click="deleteServer(editServerDialog.selectedServer)">Delete</button>
        </form>
      </div>

    </div>
  </dialog>



</template>




<script setup lang="ts">

import type {MinecraftServer} from "~/types/MinecraftServer";
import axios from 'axios';
import { stringify , parse } from 'ini'

const settings = reactive({
  servers: [] as MinecraftServer[],
})

const addDialog = reactive({
  newServer: {} as MinecraftServer
})

const serverLogDialog = reactive({
  selectedServer: {} as MinecraftServer,
  logs: [] as string[],
})

const editServerDialog = reactive({
  selectedServer: {} as MinecraftServer,
  properties: {} as { [p: string]: any }
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

const showServerLogDialog = async (server: MinecraftServer) => {
  serverLogDialog.selectedServer = server
  // @ts-ignore
  serverLogModal.checked = true
}

const getLogs = async () => {


  // @ts-ignore
  if(!serverLogModal.checked){
    if(serverLogDialog.logs.length != 0){
      serverLogDialog.logs.length = 0;
    }
    return
  }

  if(!serverLogDialog.selectedServer)
    return

  try{
    const response = await axios.post('/api/getLogs', {
      name: serverLogDialog.selectedServer.name
    });
    const strRet = response.data.logs;
    const stringArray = strRet.split('\n');
    serverLogDialog.logs.length = 0;
    stringArray.slice(-20).forEach((element: string) => {
      serverLogDialog.logs.push(element);
    })
  }catch(error){
    console.error(`Error fetch: ${error}`);
  }
}

const showEditServerDialog = async (server: MinecraftServer) => {
  editServerDialog.selectedServer = server
  await getProperties()
  // @ts-ignore
  editServerModal.showModal()
}

const getProperties = async () => {
  // @ts-ignore
  editServerModal.showModal()

  try{
    const response = await axios.post('/api/getProperties', {
      name: editServerDialog.selectedServer.name
    });
    console.log(response.data.properties)

    editServerDialog.properties = parse(response.data.properties)

  }catch(error){
    console.error(`Error fetch: ${error}`);
  }
}











const editServer = async () => {
  try {
    const response = await axios.post('/api/setProperties', {
      name: editServerDialog.selectedServer.name,
      properties: stringify(editServerDialog.properties)
    });
    console.log(response.data);
  } catch (error) {
    console.error(`Error `, error);
  }
}


const deleteServer = async (server: MinecraftServer) => {
  try {
    const response = await axios.post('/api/deleteServer', {
      name: server.name
    });
    console.log(response.data);
    await getServers()
  } catch (error) {
    console.error(`Error `, error);
  }
}

const addServer = async (server: MinecraftServer) => {
  try {
    const response = await axios.post('/api/addServer', {
      newServer: addDialog.newServer
    });
    console.log(response.data);
    await getServers()
  } catch (error) {
    console.error(`Error `, error);
  }
}




const startServer = async (server: MinecraftServer) => {
  try {
    const response = await axios.post('/api/startServer', {
      name: server.name
    });
    console.log(response.data);
  } catch (error) {
    console.error(`Error `, error);
  }
};

const stopServer = async (server: MinecraftServer) => {
  try {
    const response = await axios.post('/api/stopServer', {
      name: server.name
    });
    console.log(response.data);
  } catch (error) {
    console.error(`Error `, error);
  }
};



let intervalId: NodeJS.Timeout;


onMounted(async()=>{
  await getServers()
  intervalId = setInterval(getLogs, 500);
})

onBeforeUnmount(()=>{
  clearInterval(intervalId);
})


</script>


<style>
.icon {
  width: 5rem;  /* You can adjust this value based on your needs */
  height: 5rem; /* Set both width and height */
  object-fit: contain; /* Keep the aspect ratio of the icon */
}
</style>