<template>
  <div class="flex flex-col items-center justify-center py-16 px-6">
    <h1 class="text-4xl font-bold text-center mb-6">Minecraft Servers</h1>
    <div class="grid md:grid-cols-3 gap-6 w-full max-w-5xl mb-8">
      <div v-for="server in settings.servers" class="card bg-base-100 shadow-2xl p-6">
        <h2 class="text-xl font-bold text-center cursor-pointer" @click="editServerDialog(server)">
          {{ server.name }}
        </h2>
        <div class="mt-2 text-sm">
          <p><strong>Version:</strong> {{ server.version }}</p>
          <p><strong>Port</strong> {{ server.port }}</p>
          <p><strong>Memory:</strong> {{ server.minMemory }}-{{ server.maxMemory }}GB</p>
        </div>

        <div class="form-control mt-4 flex flex-row gap-2">
          <button @click="startServer(server)" class="btn btn-primary w-1/2">Start</button>
          <button @click="stopServer(server)" class="btn btn-error w-1/2">Stop</button>
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





  <input type="checkbox" id="editServerModal" class="modal-toggle" />
  <div class="modal" role="dialog">
    <div class="modal-box w-11/12 max-w-5xl">
      <h3 class="text-lg font-bold text-center">{{ editDialog.editedServer.name }}</h3>
      <div class="mockup-code w-full">
        <pre v-for="str in testrec.logs" data-prefix="$"><code>{{str}}</code></pre>
      </div>
    </div>
    <label class="modal-backdrop" for="editServerModal">Close</label>
  </div>



</template>




<script setup lang="ts">

import type {MinecraftServer} from "~/types/MinecraftServer";
import axios from 'axios';


const testrec = reactive({
  logs: [] as string[],
})

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



const getLogs = async () => {
  // @ts-ignore
  if(!editServerModal.checked)
    return

  try{
    const response = await axios.post('/api/getLogs', {
      name: editDialog.editedServer.name
    });
    //console.log(response)
    const strRet: string = response.data.logs;
    const stringArray = strRet.split('\n');
    //console.log(stringArray);
    testrec.logs.length = 0;
    stringArray.slice(-20).forEach(element => {
      testrec.logs.push(element);
    })
  }catch(error){
    console.error(`Error fetch: ${error}`);
  }
}


const editServerDialog = async (server: MinecraftServer) => {
  editDialog.editedServer = server

  // @ts-ignore
  //editServerModal.showModal()
  editServerModal.checked = true
}


const addServer = async () => {
  if(!settings.servers.some(server => server.name === addDialog.newServer.name)){
    settings.servers.push(addDialog.newServer)
    await syncServers()
  }
}

const deleteServer = async () => {
  let index = settings.servers.findIndex(item => item.name === editDialog.editedServer.name);
  settings.servers.splice(index, 1);
  await syncServers()
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