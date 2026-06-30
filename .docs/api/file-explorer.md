# 📂 File Explorer API Reference

These endpoints are used by the dashboard's File Manager UI to inspect, view, write, and delete files inside active Minecraft server directories.

---

## 🛡️ Directory Safety & Security

All file operations perform a strict security validation to prevent path traversal vulnerability attacks (e.g. attempting to read `/etc/passwd` using relative paths containing `..` or absolute paths):
1.  Resolves the base directory for the server: `~/.mcservermanager/servers/<server_name>`.
2.  Resolves the target path: `path.resolve(baseDir, subPath)`.
3.  Calculates the relative path using `path.relative(baseDir, targetDir)`.
4.  Validates that the relative path is safe (i.e. it does not start with `..` and is not absolute). If invalid, a `403 Forbidden` error is returned.

---

## 📡 File Operations Endpoints

### 1. List Directory Contents
Lists files and subdirectories located inside a specific server directory.

*   **URL:** `/api/listFiles`
*   **Method:** `POST`
*   **Authentication:** Bearer Session JWT
*   **Request Body:**
    ```json
    {
      "name": "Survival",
      "path": "plugins" // path relative to the server root directory (use "" for root)
    }
    ```
*   **Response (200 OK):**
    ```json
    [
      {
        "name": "Essentials",
        "isDirectory": true,
        "size": 4096,
        "lastModified": "2026-06-30T15:10:00.000Z"
      },
      {
        "name": "paper.yml",
        "isDirectory": false,
        "size": 12844,
        "lastModified": "2026-06-30T14:40:00.000Z"
      }
    ]
    ```

### 2. Read File Content
Reads and returns the text contents of a target file.

*   **URL:** `/api/readFile`
*   **Method:** `POST`
*   **Authentication:** Bearer Session JWT
*   **Request Body:**
    ```json
    {
      "name": "Survival",
      "path": "server.properties"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "content": "#Minecraft server properties\nmotd=A Beacon Server\npvp=true\n..."
    }
    ```

### 3. Write File Content
Creates a new text file or overwrites the contents of an existing one.

*   **URL:** `/api/writeFile`
*   **Method:** `POST`
*   **Authentication:** Bearer Session JWT
*   **Request Body:**
    ```json
    {
      "name": "Survival",
      "path": "banned-players.json",
      "content": "[\n  {\n    \"username\": \"Griefer\"\n  }\n]"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true
    }
    ```

### 4. Delete File or Directory
Permanently deletes a file or directory. If target is a directory, deletes it and all its contents recursively.

*   **URL:** `/api/deleteFile`
*   **Method:** `POST`
*   **Authentication:** Bearer Session JWT
*   **Request Body:**
    ```json
    {
      "name": "Survival",
      "path": "plugins/old_plugin.jar"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true
    }
    ```
