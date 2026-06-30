# 🔒 Authentication API Reference

Beacon secures all standard dashboard communications using JSON Web Tokens (JWT) and offers a secondary, token-based authorization scheme for external automation scripts.

---

## 🔑 Session Authentication Design

*   **Token Verification:** Standard requests to `/api/` verify credentials against a bearer token in the headers:
    `Authorization: Bearer <JWT_TOKEN>`
*   **JWT Secret:** Configured dynamically. It utilizes `process.env.JWT_SECRET` or the fallback value stored in `settings.json`.
*   **Token Expiry:** Standard tokens are signed for **30 days**.
*   **External Gatekeeper:** Requests beginning with `/api/external/` are validated against API security tokens registered in the system settings rather than session JWTs.

---

## 📡 Authentication Endpoints

### 1. User Login
Validates admin credentials and issues a session token.

*   **URL:** `/api/login`
*   **Method:** `POST`
*   **Authentication:** *None*
*   **Request Body:**
    ```json
    {
      "password": "your_admin_password"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Login successful!",
      "token": "eyJhbGciOi..."
    }
    ```
*   **Response (400 Bad Request):**
    ```json
    {
      "statusCode": 400,
      "message": "Invalid credentials!"
    }
    ```

### 2. Verify Session Token
Validates if a session JWT is still active.

*   **URL:** `/api/verify`
*   **Method:** `POST`
*   **Authentication:** Bearer Session JWT
*   **Response (200 OK):**
    ```json
    {
      "valid": true
    }
    ```
*   **Response (401 Unauthorized):**
    ```json
    {
      "statusCode": 401,
      "statusMessage": "Session Expired"
    }
    ```

### 3. Change Admin Password
Updates the password hash in settings.

*   **URL:** `/api/setPassword`
*   **Method:** `POST`
*   **Authentication:** Bearer Session JWT
*   **Request Body:**
    ```json
    {
      "currentPassword": "current_password",
      "newPassword": "new_secure_password"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Password changed successfully"
    }
    ```

---

## 🌐 External API Token Endpoints

### 1. Get API Tokens
Retrieves all registered external api token metadata.

*   **URL:** `/api/getApiTokens`
*   **Method:** `GET`
*   **Authentication:** Bearer Session JWT
*   **Response (200 OK):**
    ```json
    [
      {
        "name": "backup-runner",
        "token": "d7a4b... (masked/full)",
        "createdAt": "2026-06-30T15:00:00.000Z"
      }
    ]
    ```

### 2. Create API Token
Generates a new secure api token.

*   **URL:** `/api/addApiToken`
*   **Method:** `POST`
*   **Authentication:** Bearer Session JWT
*   **Request Body:**
    ```json
    {
      "name": "third-party-webhook"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "token": "tH5kunVlY4rDIv10Y6Hy..."
    }
    ```

### 3. Delete API Token
Revokes access for a token.

*   **URL:** `/api/deleteApiToken`
*   **Method:** `POST`
*   **Authentication:** Bearer Session JWT
*   **Request Body:**
    ```json
    {
      "token": "token_to_remove"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true
    }
    ```

---

## 🌐 External Control

### 1. Control Server State External
Trigger server power states using static API tokens from external environments (e.g. bash scripts or integration tools).

*   **URL:** `/api/external/control`
*   **Method:** `POST`
*   **Authentication:** Bearer API Token (`Authorization: Bearer <API_TOKEN>`)
*   **Request Body:**
    ```json
    {
      "serverName": "Survival",
      "action": "start" // or "stop"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Minecraft server started."
    }
    ```
