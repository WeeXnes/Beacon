# Minecraft Server Panel (Beacon)

Welcome to the developer documentation for the Minecraft Server Panel (Beacon), a sleek, modern, and self-hosted Minecraft server manager. Built on top of Nuxt 3 and styled using Tailwind CSS and DaisyUI, Beacon provides an intuitive web interface for hosting, configuring, and monitoring multiple Minecraft server instances dynamically.

---

## Key Features

*   **Multi-Server Instance Management:** Register, configure, launch, and gracefully shut down multiple Minecraft server instances from a single centralized web dashboard.
*   **Dynamic Logs & Terminal:** Stream Minecraft console outputs in real-time by polling local log files (logs/latest.log or server.log), and execute console commands on active servers directly from the web client.
*   **Complete Server Configurator:** Easily tweak vanilla and modded options (difficulty, game mode, max players, PVP, command blocks, ports, and memory configurations) through the interactive UI.
*   **Backup & Restore System:** Create automated or manual backups of server files, list existing backups, restore them at the click of a button, or delete them to reclaim storage.
*   **Advanced File Explorer:** Manage server files directly from the browser. Read, write, delete, and list directory trees within isolated Minecraft server roots.
*   **Discord Integration & Slash Commands:** Run status updates directly to Discord, send status change embeds, and start or stop Minecraft servers via Discord slash commands (/start, /stop) with server name autocompletion.
*   **API Tokens & External Control:** Generate API tokens to programmatically control servers from third-party scripts or external webhooks.
*   **Automated Java Discovery:** Automatically scan system paths to identify installed Java versions and map server instances to specific Java runtimes.

---

## Technology Stack

Beacon relies on modern frontend and backend technologies:

*   **Frontend Framework:** [Nuxt 3](https://nuxt.com/) (Vue 3, TypeScript) utilizing server-side rendering (SSR) capabilities and client-side page transitions.
*   **Styling & UI:** [Tailwind CSS](https://tailwindcss.com/) combined with [DaisyUI](https://daisyui.com/) components to create a responsive, modern dark-themed web panel.
*   **Backend Runtime:** [Node.js](https://nodejs.org/) served via Nuxt server routes (using the Nitro engine).
*   **Process Execution:** [execa](https://github.com/sindresorhus/execa) for executing and managing Minecraft Java processes asynchronously.
*   **Authentication:** JSON Web Tokens ([jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)) for session verification and [bcryptjs](https://github.com/dcodeIO/bcrypt.js/) for secure administrator password hashing.
*   **Discord API Integration:** [discord.js](https://discord.js.org/) for managing Discord bot clients, slash commands registration, and messaging hooks.
*   **Configuration Parsing:** [ini](https://github.com/npm/ini) and [smol-toml](https://github.com/alexmercerind/smol-toml) for reading and writing Minecraft server configuration files (server.properties and velocity.toml).

---

## Host Directories

All runtime files, configurations, backups, and Minecraft instances managed by the panel are stored in a dedicated folder inside the user's home directory:

*   **Main Configuration Directory:** `~/.mcservermanager`
*   **Main Settings File:** `~/.mcservermanager/settings.json`
*   **Minecraft Server Roots:** `~/.mcservermanager/servers/<server_name>`
*   **Backups Storage:** `~/.mcservermanager/backups`
