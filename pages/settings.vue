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
              <input type="password" placeholder="New Password" class="input input-bordered rounded-xl bg-base-100/50 flex-1" />
              <button class="btn btn-primary rounded-xl px-8">Update</button>
            </div>
          </div>
        </div>
      </section>

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
// Settings logic can be added here
</script>
