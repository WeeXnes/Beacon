# System & Config API Reference

These endpoints are used to administer overall system properties, Discord bot credentials, Java version runtimes, onboarding states, and Velocity proxy routing configurations.

---

## System Configuration Endpoints

### 1. Panel Onboarding (First Launch Setup)
Registers the initial EULA agreement state and admin credentials.

*   **URL:** `/api/setup`
*   **Method:** `POST`
*   **Authentication:** None
*   **Request Body:**
    ```json
    {
      "password": "new_secure_admin_password",
      "eula": true
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Setup completed successfully"
    }
    ```

### 2. Check Onboarding Status
Queries if the admin password and configurations have already been initialized.

*   **URL:** `/api/onboardingStatus`
*   **Method:** `GET`
*   **Authentication:** None
*   **Response (200 OK):**
    ```json
    {
      "onboarded": true // false if password has not been configured
    }
    ```

### 3. Read Server Properties (server.properties / velocity.toml)
Reads configurations for a target server. If it is a Velocity proxy, returns configuration parsed from TOML format.

*   **URL:** `/api/getProperties`
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
      "message": "properties for Survival",
      "properties": "difficulty=easy\npvp=true\n..." // JSON string if Velocity proxy
    }
    ```

### 4. Update Server Properties
Writes modified configuration properties string or TOML schema back to files.

*   **URL:** `/api/setProperties`
*   **Method:** `POST`
*   **Authentication:** Bearer Session JWT
*   **Request Body:**
    ```json
    {
      "name": "Survival",
      "properties": "difficulty=hard\npvp=true\n..."
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "properties for Survival set"
    }
    ```

---

## Discord Configuration

### 1. Get Discord Credentials
Retrieves the active Discord application credentials.

*   **URL:** `/api/getDiscordConfig`
*   **Method:** `GET`
*   **Authentication:** Bearer Session JWT
*   **Response (200 OK):**
    ```json
    {
      "enabled": true,
      "token": "bot_token_value",
      "clientId": "discord_application_id",
      "guildId": "discord_guild_id"
    }
    ```

### 2. Update Discord Credentials
Saves the bot credentials and registers/re-runs the Discord bot plugin integration.

*   **URL:** `/api/setDiscordConfig`
*   **Method:** `POST`
*   **Authentication:** Bearer Session JWT
*   **Request Body:**
    ```json
    {
      "enabled": true,
      "token": "MTA5O...",
      "clientId": "1098...",
      "guildId": "5849..."
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true
    }
    ```

---

## Java Versions Management

### 1. Get Java Versions
Returns list of registered Java versions.

*   **URL:** `/api/getJavaVersions`
*   **Method:** `GET`
*   **Authentication:** Bearer Session JWT
*   **Response (200 OK):**
    ```json
    [
      {
        "name": "Java 17.0.8",
        "path": "/usr/lib/jvm/java-17-openjdk/bin/java"
      }
    ]
    ```

### 2. Scan & Discover Java Installations
Initiates system directories discovery to find Java executables.

*   **URL:** `/api/discoverJavaVersions`
*   **Method:** `POST`
*   **Authentication:** Bearer Session JWT
*   **Response (200 OK):**
    ```json
    [
      {
        "name": "Java 17.0.8",
        "path": "/usr/lib/jvm/java-17-openjdk/bin/java"
      },
      {
        "name": "Java 21",
        "path": "/usr/lib/jvm/java-21-openjdk/bin/java"
      }
    ]
    ```

### 3. Update Java Versions
Overrides the list of custom registered Java paths.

*   **URL:** `/api/setJavaVersions`
*   **Method:** `POST`
*   **Authentication:** Bearer Session JWT
*   **Request Body:**
    ```json
    [
      {
        "name": "Java 17",
        "path": "/usr/lib/jvm/java-17-openjdk/bin/java"
      }
    ]
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true
    }
    ```

---

## Velocity Proxy Routing (Proxy Mapping)

### 1. Get Proxy Routing Configurations
Lists servers mapped under a specific Velocity proxy.

*   **URL:** `/api/getProxyMapping`
*   **Method:** `GET`
*   **Authentication:** Bearer Session JWT
*   **Query Parameters:**
    *   `name=MyProxy` (Proxy server instance name)
*   **Response (200 OK):**
    ```json
    {
      "mappings": [
        {
          "serverName": "Survival",
          "mappingName": "Survival",
          "address": "127.0.0.1:25565",
          "isMapped": true,
          "subdomain": "survival",
          "isInTry": true
        }
      ],
      "trySequence": ["Survival"],
      "baseDomain": "mycompany.org"
    }
    ```

### 2. Update Proxy Routing Configurations
Alters mapping paths, forced-hosts subdomains, and tries routing queues inside the Velocity proxy server `velocity.toml` configuration.

*   **URL:** `/api/setProxyMapping`
*   **Method:** `POST`
*   **Authentication:** Bearer Session JWT
*   **Request Body:**
    ```json
    {
      "proxyName": "MyProxy",
      "baseDomain": "mycompany.org",
      "mappings": [
        {
          "serverName": "Survival",
          "isMapped": true,
          "subdomain": "survival",
          "address": "127.0.0.1:25565",
          "isInTry": true
        }
      ]
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true
    }
    ```
