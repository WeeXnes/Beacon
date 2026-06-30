# Setup & Installation Guide

This guide details the steps required to install, configure, run, and secure the Minecraft Server Panel (Beacon) in both development and production environments.

---

## Prerequisites

Before running the panel, ensure the hosting machine has the following tools installed:

1.  **Node.js:** Version 16 or newer (LTS recommended).
2.  **Java Runtime Environment (JRE):** Java 17 or newer (needed for modern Minecraft servers like 1.17+).
3.  **Minecraft Server JAR:** A server jar file (e.g. paper-1.20.6.jar or a vanilla/forge jar).
4.  **PM2 (Optional but Recommended):** For production process management.

---

## Installation

1.  **Clone the Repository:**
    ```bash
    git clone https://code.weexnes.dev/Beacon.git
    cd Beacon
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

---

## Running the Panel

### Development Mode

To start the panel in development mode with hot-reloading:
```bash
npm run dev
```
By default, the server will start on [http://localhost:3000](http://localhost:3000).

### Production Mode (using PM2)

To deploy the application for production:

1.  **Build the application:**
    ```bash
    npm run build
    ```

2.  **Start with PM2:**
    ```bash
    pm2 start
    ```
    This launches the panel based on the configuration defined in [ecosystem.config.js](file:///home/weexnes/Gitbackup/Beacon/ecosystem.config.js):
    ```javascript
    module.exports = {
      apps: [
        {
          name: 'minecraft-server-manager',
          port: '3000',
          exec_mode: 'cluster',
          instances: 'max',
          script: './.output/server/index.mjs'
        }
      ]
    }
    ```

---

## Admin Password Setup

By default, the admin password is set to `admin`. On first start, you will be prompted to go through the onboarding process if not configured, or you can log in directly.

### Changing the Password

You can change the admin password through two methods:

#### Method 1: Using the Panel Web UI
Go to the **System Settings** page within the panel UI, enter your new password, and save.

#### Method 2: Manually Editing settings.json
The password is saved as a bcrypt hash inside `~/.mcservermanager/settings.json`. To generate a new hash:

1.  Execute the password generator script:
    ```bash
    npm run password_gen <your_new_password>
    ```
    *Example:*
    ```bash
    npm run password_gen MySecurePassword123
    ```
2.  Copy the generated hash.
3.  Open `~/.mcservermanager/settings.json` and replace the `password_hash` field value with the copied hash:
    ```json
    {
      "password_hash": "$2a$10$...your_generated_hash_here..."
    }
    ```

---

## Security Recommendations

*   **Internal LAN Scope:** By default, this panel runs without TLS and is intended for local networks or home setups.
*   **Public Access:** If exposing the panel to the public internet:
    *   **Always use HTTPS:** Configure a reverse proxy like Nginx or Caddy to handle SSL certificates (e.g., Let's Encrypt).
    *   **Strong Password:** Ensure you change the default password from `admin` to a strong, high-entropy password.
    *   **API Tokens:** Protect external HTTP calls by using the built-in API token management for webhook calls.
