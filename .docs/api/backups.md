# 📦 Backups API Reference

These endpoints let you query, create, restore, and delete zipped backups of Minecraft server files.

---

## 💾 Storage & Packaging Format

*   **Format:** Backups are packaged as `.tar.gz` gzip tarball archives.
*   **Directory:** Saved in `~/.mcservermanager/backups/<server_name>/`.
*   **Safety Constraints:** Path resolving maps are checked to block directory traversal escapes. Restorations require that the target server instance is `offline` to prevent files lock issues and directory corruption.

---

## 📡 Backup Endpoints

### 1. List Server Backups
Retrieves an array of backups for a specific server sorted chronologically (newest first).

*   **URL:** `/api/getBackups`
*   **Method:** `GET`
*   **Authentication:** Bearer Session JWT
*   **Query Parameters:**
    *   `name=Survival` (Target server name)
*   **Response (200 OK):**
    ```json
    [
      {
        "name": "backup_2026-06-30T15-00-00.tar.gz",
        "size": 52428800, // file size in bytes
        "date": "2026-06-30T15:00:00.000Z"
      }
    ]
    ```

### 2. Create Server Backup
Creates a new `.tar.gz` copy of all files in the server root.

*   **URL:** `/api/createBackup`
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
      "message": "Backup created successfully",
      "name": "backup_2026-06-30T15-10-00.tar.gz"
    }
    ```

### 3. Restore Server Backup
Deletes the current server directory contents completely, recreates the directory, and extracts the target `.tar.gz` contents.

*   **URL:** `/api/restoreBackup`
*   **Method:** `POST`
*   **Authentication:** Bearer Session JWT
*   **Request Body:**
    ```json
    {
      "name": "Survival",
      "backupName": "backup_2026-06-30T15-00-00.tar.gz"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Backup restored successfully"
    }
    ```
*   **Response (400 Bad Request):**
    ```json
    {
      "statusCode": 400,
      "statusMessage": "Server must be offline to restore a backup"
    }
    ```

### 4. Delete Server Backup
Permanently deletes a backup archive from the filesystem.

*   **URL:** `/api/deleteBackup`
*   **Method:** `POST`
*   **Authentication:** Bearer Session JWT
*   **Request Body:**
    ```json
    {
      "name": "Survival",
      "backupName": "backup_2026-06-30T15-00-00.tar.gz"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Backup deleted successfully"
    }
    ```
