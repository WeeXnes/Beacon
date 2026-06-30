# Architecture Overview

Beacon is a self-contained Nuxt 3 web application. It integrates a server-side control panel engine (running in the Node/Nitro process) with a reactive, real-time client dashboard interface.

---

## System Architecture

The relationship and data flow between the system components operate as follows:

*   **Client Dashboard to Backend:** The web browser client communicates with the Nuxt/Nitro server backend via HTTP APIs protected by JWT authentication.
*   **Backend to Configuration Database:** The server backend reads and writes panel state changes directly to the `settings.json` flat-file configuration database.
*   **Backend to Minecraft Servers:** The backend spawns and interacts with the Minecraft server instances as child processes.
*   **Minecraft Servers to Log Files:** Active server processes output console logs to `latest.log` or `server.log` files on the local filesystem.
*   **Backend to Log Files:** The backend monitors active servers by polling the log files on the filesystem.

---

## Persistent Configuration Database

Rather than using a heavy relational database, Beacon utilizes a single, flat JSON file located at `~/.mcservermanager/settings.json`.

*   **Structure:** Defined by the `SettingsJsonFile` TypeScript interface.
*   **Dynamic Synchronization:** Whenever a server is added, deleted, started, stopped, or settings are altered, the global state is updated in memory and immediately written to disk via utility functions `loadJsonFile()` and `saveJsonFile()`.

### Folder Layout
All data is stored inside the local host's home folder:
*   `~/.mcservermanager/`: Root storage directory.
*   `~/.mcservermanager/settings.json`: Configuration store (EULA acceptance, server profiles, hashed password, JWT secret, discovered Java installations, Discord config, API tokens, and panel URL).
*   `~/.mcservermanager/servers/`: Directories for individual Minecraft server files.
*   `~/.mcservermanager/backups/`: Target storage for backup archive files.

---

## Process Model & Lifecycle

Beacon manages Minecraft servers as child processes of the main Nitro server.

### Spawning Subprocesses
When starting a server, the backend calls the `execa` package to execute the configured Java runtime with specified memory arguments (`-Xms`, `-Xmx`), pointing to the server's JAR file. It pipes the input stream (`stdin`) and parses the stdout/stderr streams to monitor logs in real time.

### Persistent Server Tracking (PID Re-attachment)
1.  When a server starts, its Process ID (`pid`) is saved to `~/.mcservermanager/settings.json`.
2.  If the panel is stopped or restarted, the actual Minecraft servers continue to run in the background as separate system processes.
3.  Upon restarting, the panel running `01.init.ts` scans the `settings.json` list of servers. For any server stored with an active `pid`, the panel sends signal `0` (`process.kill(server.pid, 0)`) to check if the process is still running.
4.  If the process is active, it restores the server status to `online` in the UI. If it has exited, it gracefully resets the status to `offline` and clears the `pid`.

---

## Authentication & Route Security

API endpoints are protected by the `server/middleware/auth.ts` middleware.

### Security Rules:
*   **Protected Routes:** All routes starting with `/api/` are intercepted.
*   **Unprotected Routes:** Exceptions include:
    *   `/api/login` (Admin login endpoint)
    *   `/api/onboardingStatus` (Checks if the admin password needs to be set up)
    *   `/api/setup` (First-start panel configuration)
    *   `/api/downloadMods` & `/api/getModList` (Allows modpacks download without session tokens)
    *   `/api/_nuxt_icon` (Component icons assets)
*   **Session Authorization:** Requires a bearer token (`Authorization: Bearer <JWT>`) signed with the panels' global JWT secret (`jwt_globals.secret`).
*   **External API Authorization:** Routes starting with `/api/external/` represent programmatic control scripts. Instead of verifying against a session JWT, the middleware checks the authorization token against the user-defined `apiTokens` in `settings.json`.
