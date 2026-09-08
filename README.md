# MCP OAuth Proxy

A local, multi-upstream MCP router for Scout. It exposes one newline-delimited JSON-RPC MCP server on stdio and routes `tools/list` and `tools/call` to named HTTP MCP servers.

## Setup

```powershell
cd .\mcp-oauth-proxy
npm install
Copy-Item config.example.json config.json
# Edit config.json; never put secrets in it.
npm test
npm start -- --config .\config.json
```

For non-developer setup, run the interactive wizard:

```powershell
mcp-oauth-proxy.exe --setup --config "$env:USERPROFILE\mcp-oauth-proxy\config.json"
```

Scout can also launch the package directly without a pre-downloaded executable:

```text
npx -y github:aliyoussefi/mcp-oauth-proxy --config "%USERPROFILE%\mcp-oauth-proxy\config.json"
```

Run the same command with `--setup` once to create the configuration:

```text
npx -y github:aliyoussefi/mcp-oauth-proxy --setup --config "%USERPROFILE%\mcp-oauth-proxy\config.json"
```

The wizard asks for the MCP URL, public OAuth client ID, and any values that
cannot be discovered automatically. It never asks for a password or token.
Run it once for each server name, such as `dataverse` and `salesforce`.
Choose `auto` to prefer device-code sign-in when a device-code URL is available;
choose `browser` for authorization-code + PKCE, or `device-code` to require
device-code sign-in. Browser setup also asks for the callback URL, defaulting to
`http://localhost:8765/oauth/callback`.

Scout command mode example:

```text
node "C:\path\to\mcp-oauth-proxy\dist\src\main.js" --config "C:\path\to\mcp-oauth-proxy\config.json"
```

Portable executable:

```powershell
npm run build:exe
```

The resulting `dist\mcp-oauth-proxy.exe` is self-contained and does not require
Node.js or npm on the target machine. Copy it together with a user-edited
`config.json`, then configure Scout's command MCP as:

```text
"C:\path\to\mcp-oauth-proxy.exe" --config "C:\path\to\config.json"
```

Each entry under `servers` points to one upstream MCP endpoint. Multiple entries
can be configured in the same file, and their tools are exposed to Scout with
names such as `slack/search_messages` and `salesforce/query_records`.

To register each upstream as a separate Scout MCP server while sharing the same
config file, pass the upstream name with `--server`:

```text
npx -y github:aliyoussefi/mcp-oauth-proxy --config "%USERPROFILE%\mcp-oauth-proxy\config.json" --server dataverse
npx -y github:aliyoussefi/mcp-oauth-proxy --config "%USERPROFILE%\mcp-oauth-proxy\config.json" --server salesforce
```

`--provider` is accepted as an alias for `--server`. The selected process
exposes only that named upstream. Omitting the selector keeps the original
multi-upstream behavior.

Set `MCP_OAUTH_PROXY_TOKEN_<SERVERNAME>` for explicit access-token injection (server name uppercased, non-alphanumeric replaced with `_`). If `clientId`, `authorizationEndpoint`, and `tokenEndpoint` are configured, the first unauthenticated tool request opens a browser for OAuth authorization-code + PKCE. The provider must allow a loopback redirect under `http://127.0.0.1:<port>/oauth/callback`. Refresh tokens are persisted encrypted. Windows uses DPAPI through PowerShell. On other platforms, set `MCP_OAUTH_PROXY_KEY` to a 32-byte base64 key; persistence fails rather than writing plaintext.

The proxy refreshes access tokens silently until the provider requires reauthentication. It does not store client secrets in the configuration file. `allowPlaintextRefreshToken` is retained for configuration compatibility but is intentionally ignored by the default implementation.

Tools are namespaced as `server/tool`. Calls may also specify `{ "server": "name", "name": "tool" }`.
