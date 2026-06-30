# Server Management API Reference

These endpoints handle Minecraft server instance control, registration, status tracking, and resource stats.

---

## Server Power Controls

### 1. Start Server
Spawns the Java subprocess for a specific Minecraft server instance.

*   **URL:** `/api/startServer`
*   **Method:** `POST`
*   **Authentication:** Bearer Session JWT
*   **Request Body:**
    ```json
    {
      "name": "Survival"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Minecraft server started."
    }
    ```

### 2. Stop Server
Gracefully stops the server by executing `stop` in stdin, falling back to a SIGTERM kill.

*   **URL:** `/api/stopServer`
*   **Method:** `POST`
*   **Authentication:** Bearer Session JWT
*   **Request Body:**
    ```json
    {
      "name": "Survival"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Stop command sent to Minecraft server."
    }
    ```

### 3. Send Console Command
Sends a custom text command directly to a running server process (`stdin`).

*   **URL:** `/api/sendCommand`
*   **Method:** `POST`
*   **Authentication:** Bearer Session JWT
*   **Request Body:**
    ```json
    {
      "serverName": "Survival",
      "command": "op Antigravity"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Command OP Antigravity sent to server Survival"
    }
    ```

---

## Status & Information

### 1. Get All Servers
Returns a list of all registered Minecraft server instances.

*   **URL:** `/api/getServers`
*   **Method:** `GET`
*   **Authentication:** Bearer Session JWT
*   **Response (200 OK):**
    ```json
    [
      {
        "name": "Survival",
        "version": "1.20.6",
        "jarName": "paper-1.20.6.jar",
        "project": "paper",
        "maxMemory": 4,
        "status": "online",
        "pid": 12345,
        "onlinePlayers": ["Alice", "Bob"]
      }
    ]
    ```

### 2. Get Server Resource Stats
Queries CPU and Memory utilization of the running Minecraft process ID (`pid`).

*   **URL:** `/api/getServerStats`
*   **Method:** `POST`
*   **Authentication:** Bearer Session JWT
*   **Request Body:**
    ```json
    {
      "name": "Survival"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "cpu": 12, // normalized CPU load percent
      "memory": 2147483648 // memory bytes used
    }
    ```

---

## Server Registration

### 1. Register & Upload Server (Add Server)
Registers a new Minecraft server profile and uploads the initial executable JAR.

*   **URL:** `/api/addServer`
*   **Method:** `POST`
*   **Authentication:** Bearer Session JWT
*   **Headers:** `Content-Type: multipart/form-data`
*   **Multipart Fields:**
    *   `newServer`: A JSON string representation of the new server's profile data.
        *   *Format:*
            ```json
            {
              "name": "Survival-2",
              "version": "1.20.6",
              "jarName": "paper.jar",
              "maxMemory": 4,
              "project": "paper"
            }
            ```
    *   `file`: The binary `.jar` executable file.
*   **Response (200 OK):**
    ```json
    {
      "status": "success"
    }
    ```

### 2. Delete Server Registry & Files
Gracefully stops the instance, removes it from the configuration store, and permanently deletes all files in the server's root folder.

*   **URL:** `/api/deleteServer`
*   **Method:** `POST`
*   **Authentication:** Bearer Session JWT
*   **Request Body:**
    ```json
    {
      "name": "Survival-2"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "status": "success"
    }
    ```
