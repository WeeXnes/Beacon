# Frontend Components & State

Beacon's frontend dashboard is a single-page application built on top of Nuxt 3. It organizes page views, UI components, and sharing states via custom composables.

---

## Page Views

The dashboard view routes correspond to files inside the `pages/` directory:

1.  **Dashboard Home (`pages/index.vue`):**
    The main landing view after authentication. It renders global server statistics (total memory/CPU usage) and a list of all registered servers in grid format using `ServerGridCard.vue`.
2.  **Login Screen (`pages/login.vue`):**
    Renders the password login screen. It prompts for the administrator password, sends it securely to the `/api/login` endpoint, and persists the returned JWT session token to local storage.
3.  **Onboarding Setup (`pages/setup.vue`):**
    Displayed automatically on the first start of the panel. Prompts the administrator to accept the Minecraft EULA, choose an admin password, scan for Java versions, and define global directory environments.
4.  **System Settings (`pages/settings.vue`):**
    Central administration panel. Provides sub-tabs to manage:
    *   **Java Runtimes:** View system runtimes or add custom paths.
    *   **Discord Bot Integration:** View credentials and channel IDs.
    *   **API Security Tokens:** Add and revoke external authorization keys.
    *   **Audit Logger:** Inspect the historical `audit.log` lines directly.
    *   **Reverse Proxy Routing:** Configure internal mapping parameters.
5.  **Server Controller (`pages/server/[name].vue`):**
    The control center for an individual Minecraft server instance. Features distinct functional tabs:
    *   **Console:** Live log text terminal stream with color outputs and command prompt.
    *   **Properties Configuration:** Toggles and input fields to alter `server.properties` or `velocity.toml` variables.
    *   **Files Explorer:** Interactive directory viewer powered by `FileManager.vue`.
    *   **Backups:** Manage zip snapshots.
    *   **Settings:** Configure JVM flags, allocate RAM, toggle public mod downloads, and enable Discord logging.
6.  **Public Mod Download (`pages/download/[name].vue`):**
    A public, token-free route. If `publicModDownload` is enabled for a server, players can visit this page to check available server modpacks and download mod zip files directly.

---

## UI Components

Reusable Vue components reside in the `components/` directory:

*   **`AppSidebar.vue`:**
    Renders the navigation column on the left. Lists all registered servers (with micro-indicator dots showing online/offline status) and provides shortcuts to Settings and Server Wizards.
*   **`ServerGridCard.vue`:**
    Displays individual server information panels. Shows memory utilization, CPU percentage, list of online player avatars, current version name, and start/stop controls.
*   **`FileManager.vue`:**
    Renders a directory viewer that supports navigating folder trees, viewing/saving files inside a built-in code editor, uploading files, creating directories, and deleting items.
*   **`VersionWizard.vue`:**
    An interactive wizard guiding the user to fetch server JARs. Supports choosing engines (e.g. Paper, Velocity, Vanilla), querying Minecraft versions, fetching files from remote repositories, and creating the server folder profile automatically.
*   **`StatCard.vue`:**
    A visualization component rendering circular or horizontal bars representing resource usage metrics (e.g. CPU core loads or memory usage bytes).

---

## Composables (Client State)

Client-side state management functions are defined inside `composables/`:

### 1. Backups Manager (`useBackups.ts`)
Encapsulates backend actions for zip archives:
*   `fetchBackups(serverName)`: Queries existing zip backups.
*   `createBackup(serverName)`: Invokes the backup generation process.
*   `restoreBackup(serverName, backupName)`: Decompresses the chosen zip back into the server root.
*   `deleteBackup(serverName, backupName)`: Removes backup files.

### 2. Log Streamer (`useConsole.ts`)
Manages console log synchronization:
*   Starts a polling mechanism (queries `/api/getLogs` every 2 seconds) to append new logs to the terminal view.
*   Parses incoming strings to detect player movements and server startup flags.
*   Formats raw text logs to render colored terminal lines.

### 3. Server List Store (`useServers.ts`)
Keeps track of registered servers and coordinates power operations:
*   Maintains a global reactive array of all servers.
*   `fetchServers()`: Retrieves the latest server state profiles.
*   `startServer(name)` & `stopServer(name)`: Dispatches power requests to the API.

### 4. Host Resource Monitor (`useSystemStats.ts`)
Monitors overall hardware loads:
*   Queries `/api/getSystemStats` to populate charts showing local machine CPU usage and free memory values.
