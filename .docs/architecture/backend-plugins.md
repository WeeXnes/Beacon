# Backend Plugins & Utilities

Beacon's backend runs on Nuxt Nitro. Nitro uses plugins to hook into system events and execute persistent background tasks (e.g. initialization checks, Discord bot management, and log file watchers).

---

## Nitro Plugins

All Nitro plugins are located in the `server/plugins/` directory and execute automatically upon backend startup.

### 1. System Initialization (01.init.ts)
This plugin is responsible for preparing the application environment.
*   **Directory Setup:** Verifies that required folders (`.mcservermanager`, `.mcservermanager/servers`, `.mcservermanager/backups`) exist, and recursively creates them if missing.
*   **Settings Loading:** Reads `settings.json` into memory.
*   **Java Auto-Discovery:** If the application is starting for the first time, it invokes `discoverJavaVersions()` to scan common system directories and saves the discovered runtimes.
*   **PID Validation:** Iterates over registered servers with saved PIDs and sends a test signal `0` (`process.kill(pid, 0)`). If active, the status is set to `online`, otherwise it resets the status to `offline` and clears the PID.

### 2. Discord Bot Lifecycle (02.discord.ts)
Handles initialization and interactions for the integrated Discord bot.
*   **Slash Command Registration:** Registers guild-scoped command paths `/start` and `/stop` with the Discord REST API, adding server autocomplete options.
*   **Presence Updates:** Dynamically sets the bot's status activity based on how many servers are currently online (e.g., Watching 1 Server running).
*   **Event Listeners:** Listens for slash command usage. When `/start` or `/stop` is called, it verifies the server name, triggers the power action via the `serverControl` utility, and replies back to the user.
*   **Rich Embed Notifications:** Provides the `sendServerStatusNotification()` helper, which posts status changes (starting in yellow, online in green, stopped in red) containing server details (motd, connection address, and version) directly to configured text channels.

### 3. Real-Time Log Watcher (03.logWatcher.ts)
Tracks live terminal log files for active servers without using CPU-heavy file polling.
*   **Mechanism:** Runs a `setInterval` loop every 5 seconds.
*   **Offset Map:** Uses a Map `lastProcessedLine` to store the last read byte offset of each server's log file.
*   **Chunk Streaming:** If the log file size is larger than the recorded offset, it opens a stream (`fs.createReadStream`) starting at the offset, reads the new content, updates the offset, and splits the new text into individual lines.
*   **Rotation Check:** If the file size is smaller than the recorded offset (meaning log files were cleared or rotated), it resets the offset map to the current file size.

---

## Server Utilities

Utility functions located inside `server/utils/` perform common operational tasks.

### Java Discovery (javaDiscovery.ts)
Automates detecting local Java installations to avoid manual typing.
*   **OS Paths:** Iterates through common path directories based on the operating system:
    *   **Linux:** `/usr/lib/jvm`
    *   **MacOS:** `/Library/Java/JavaVirtualMachines`
    *   **Windows:** `C:\Program Files\Java` & `C:\Program Files (x86)\Java`
*   **Executable Mapping:** Appends the standard binary path structure (`bin/java` or `bin/java.exe`).
*   **Version Parsing:** Runs `java -version` and extracts the major version string via regex (e.g., `"Java 17.0.2"`).

### Server Control (serverControl.ts)
Directs subprocess creation, console command input, and status monitoring.
*   **`startMinecraftServer(name)`**: Spawns a Java instance using `execa`.
    *   Accepts memory arguments (`-Xms`, `-Xmx`).
    *   Supports Forge 1.17+ startup arguments by checking for `user_jvm_args.txt` and libraries paths.
    *   Pipes stdout/stderr to extract player join logs (e.g. `[name] joined the game`) and online detection hooks (e.g. `Done`, `For help, type "help"`).
*   **`stopMinecraftServer(name)`**: Sends a command (`stop\n`) directly to the server's standard input (`stdin`). If the server doesn't respond or has no active handle, it sends a system `SIGTERM` to its PID.

### Action Auditing (audit.ts)
Writes admin activity logs to `~/.mcservermanager/audit.log`.
*   **Identity Resolution:** Parses JWT headers or API Token credentials to resolve who triggered an operation (e.g., `api-token:backup-script`, `admin`, or `anonymous`).
*   **Network Mapping:** Resolves the source client IP from `X-Forwarded-For` or the request socket.
*   **Format:** Appends records in the format:
    `[timestamp] [IP: ip] [USER: user] [ACTION: action] [STATUS: SUCCESS/FAILED] message`
