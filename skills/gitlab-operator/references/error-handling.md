# GitLab Operator Error Handling Guide

Pattern matching and resolution procedures for errors encountered during GitLab MCP tool invocations. Evaluate in priority order (first match wins):

---

## 1. 401 Unauthorized

- **Pattern:** HTTP status code 401 or message indicating unauthorized access.
- **Root Cause:** OAuth token expired, invalid, or revoked.
- **Action:** Inform user that re-authentication is required. Restarting/reconnecting the MCP server triggers the OAuth browser flow.
- **Message:**
  > "The GitLab API returned a 401 Unauthorized error. Your OAuth token may be expired or revoked. Please restart or reconnect the `gitlab` MCP server to re-authenticate via the browser."

---

## 2. 404 Not Found

- **Pattern:** HTTP status code 404 or resource not found.
- **Root Cause:** Incomplete project namespace path, typo, or user lacks project permissions.
- **Action:** Request the full namespace path and permission verification.
- **Message:**
  > "The GitLab API returned a 404 Not Found error. Please verify that the project path includes the full namespace (e.g., `sds/sistemas/meu-projeto`) and that you have access to this project in GitLab."

---

## 3. SSL Certificate Errors

- **Pattern:** Message contains `"self-signed certificate in certificate chain"` or `"unable to verify the first certificate"`.
- **Root Cause:** TRE-PR internal root CA missing from certificate store or Node.js version < 22.
- **Action:** Instruct user to verify Node.js 22+ and install the internal CA certificate (`tre-root-v3.crt`).
- **Message:**
  > "An SSL certificate error occurred. Please verify that Node.js 22+ is installed (`node --version`) and that the TRE-PR internal CA certificate is installed in the Certificate Store. You can verify with `certutil -store Root "ACRAIZ"` and install it with `certutil -addstore Root "tre-root-v3.crt"` if needed."

---

## 4. No Tools Available

- **Pattern:** MCP server connects but reports no tools available or empty response.
- **Root Cause:** Missing Node.js runtime, missing npx, or port 8888 conflict.
- **Action:** Verify environment prerequisites and port availability.
- **Message:**
  > "The MCP server connected but no tools are available. Please verify that Node.js 22+ (`node --version`) and npx (`npx --version`) are installed and accessible in your system PATH, then restart or reconnect the MCP server."

---

## 5. Nexus Registry Package Resolution Error

- **Pattern:** Error message contains `npm ERR! 404` or `ETARGET` for `@trepr/mcp-gitlab`.
- **Root Cause:** The `@trepr` npm scope is not configured to point to the internal Nexus registry (`nexus.tre-pr.jus.br`) in the user's `~/.npmrc`.
- **Action:** Instruct the user to configure `~/.npmrc`:
- **Message:**
  > "Não foi possível encontrar o pacote `@trepr/mcp-gitlab`. Verifique se o repositório do Nexus está configurado no seu `~/.npmrc`: `@trepr:registry=https://nexus.tre-pr.jus.br/repository/npm-group/`."

---

## 6. Client ID Not Configured

- **Pattern:** Error message contains `"[gitlab-plugin] ERRO: GITLAB_OAUTH_CLIENT_ID não está configurado"` ou similar.
- **Root Cause:** The `GITLAB_OAUTH_CLIENT_ID` environment variable was not set in the user's environment, `.env`, `${PLUGIN_DATA}/.env`, or `~/.gitlab-plugin.env`.
- **Action:** Instruct the user to set `GITLAB_OAUTH_CLIENT_ID` in their environment or in a `.env` file (see `.env.example`).
- **Message:**
  > "O Client ID do GitLab não está configurado. Por favor, defina a variável `GITLAB_OAUTH_CLIENT_ID` no seu sistema ou crie um arquivo `.env` na raiz do plugin com base no `.env.example`."

---

## 7. Catch-All (Other Errors)

- **Pattern:** Any error not matching patterns 1 through 4.
- **Action:** Present the original error message to the user without modification, and refer to `README.md` for additional troubleshooting.
