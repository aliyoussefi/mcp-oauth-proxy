# MCP OAuth Proxy

A local, multi-upstream MCP router for Scout. It exposes one newline-delimited
JSON-RPC MCP server on stdio and routes `tools/list` and `tools/call` to named
HTTP MCP servers.

## Distribution

The proxy follows the same versioned GitHub package model as the MSX MCP.
Publish a release tag, then configure Scout to launch it with `npx`:

```json
{
  "name": "MCP OAuth Proxy",
  "type": "command",
  "command": "npx",
  "args": [
    "-y",
    "github:aliyoussefi/mcp-oauth-proxy#v0.1.0",
    "--config",
    "%USERPROFILE%\\mcp-oauth-proxy\\config.json"
  ],
  "timeout": 300000
}
```

The target machine needs Node.js 20 or later. The repository is also usable
with a public npm package if one is published later.

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

Scout can also launch the package directly:

```text
npx -y github:aliyoussefi/mcp-oauth-proxy#v0.1.0 --config "%USERPROFILE%\mcp-oauth-proxy\config.json"
```

Run the same command with `--setup` once to create the configuration:

```text
npx -y github:aliyoussefi/mcp-oauth-proxy#v0.1.0 --setup --config "%USERPROFILE%\mcp-oauth-proxy\config.json"
```

The wizard asks for the MCP URL, public OAuth client ID, and values that
cannot be discovered automatically. It never asks for a password or token.
Run it once for each server name, such as `dataverse` and `salesforce`.
Choose `auto` to prefer device-code sign-in when available, `browser` for
authorization-code plus PKCE, or `device-code` to require device-code sign-in.

## Multiple upstreams

Each entry under `servers` points to one upstream MCP endpoint. Multiple entries
can be configured in the same file, and their tools are exposed to Scout with
names such as `slack/search_messages`, `salesforce/query_records`, and
`dataverse/list_records`.

To register each upstream as a separate Scout MCP server while sharing one
config file, pass the upstream name with `--server`:

```text
npx -y github:aliyoussefi/mcp-oauth-proxy#v0.1.0 --config "%USERPROFILE%\mcp-oauth-proxy\config.json" --server dataverse
npx -y github:aliyoussefi/mcp-oauth-proxy#v0.1.0 --config "%USERPROFILE%\mcp-oauth-proxy\config.json" --server salesforce
```

`--provider` is accepted as an alias for `--server`. Omitting the selector
keeps the multi-upstream behavior.

## Three-upstream example

The proxy can aggregate Salesforce, Slack, and Dataverse in one Scout process.
The endpoint, client ID, scopes, and OAuth URLs are provider-specific and must
be supplied by the administrator:

```json
{
  "servers": {
    "salesforce": {
      "endpoint": "https://api.salesforce.com/platform/mcp/v1/platform/sobject-all",
      "transport": "streamable-http",
      "clientId": "<salesforce-public-client-id>",
      "scopes": ["api", "sfap_api", "refresh_token", "mcp_api"],
      "auth": {
        "flow": "browser",
        "authorizationEndpoint": "https://login.salesforce.com/services/oauth2/authorize?prompt=select_account",
        "tokenEndpoint": "https://login.salesforce.com/services/oauth2/token",
        "redirectUri": "http://localhost:8765/oauth/callback"
      },
      "tokens": {
        "file": "~/.mcp-oauth-proxy/salesforce-tokens.json"
      }
    },
    "slack": {
      "endpoint": "<slack-mcp-url>",
      "transport": "streamable-http",
      "clientId": "<slack-public-client-id>",
      "auth": {
        "flow": "browser",
        "authorizationEndpoint": "<slack-authorization-url>",
        "tokenEndpoint": "<slack-token-url>",
        "redirectUri": "http://localhost:8765/oauth/callback"
      },
      "tokens": {
        "file": "~/.mcp-oauth-proxy/slack-tokens.json"
      }
    },
    "dataverse": {
      "endpoint": "<dataverse-mcp-url>",
      "transport": "streamable-http",
      "clientId": "<dataverse-public-client-id>",
      "auth": {
        "flow": "browser",
        "authorizationEndpoint": "<dataverse-authorization-url>",
        "tokenEndpoint": "<dataverse-token-url>",
        "redirectUri": "http://localhost:8765/oauth/callback"
      },
      "tokens": {
        "file": "~/.mcp-oauth-proxy/dataverse-tokens.json"
      }
    }
  }
}
```

## OAuth and token storage

Set `MCP_OAUTH_PROXY_TOKEN_<SERVERNAME>` for explicit access-token injection,
with the server name uppercased and non-alphanumeric characters replaced by
`_`. If `clientId`, `authorizationEndpoint`, and `tokenEndpoint` are configured,
the first unauthenticated tool request opens browser OAuth using PKCE.

The provider must allow a loopback redirect under
`http://127.0.0.1:<port>/oauth/callback`. Refresh tokens, access tokens, and
client secrets are persisted encrypted. Windows uses DPAPI through PowerShell.
On other platforms, set `MCP_OAUTH_PROXY_KEY` to a 32-byte base64 key.
Persistence fails rather than writing plaintext.

Token files are user-specific credentials and must never be committed or shared.
Client secrets are not stored in configuration files.

Tools are namespaced as `server/tool`. Calls may also specify
`{ "server": "name", "name": "tool" }`.

## Portable executable

```powershell
npm run build:exe
```

The resulting `dist\mcp-oauth-proxy.exe` is self-contained and does not require
Node.js or npm. Copy it together with a user-edited `config.json`, then
configure Scout with:

```text
"C:\path\to\mcp-oauth-proxy.exe" --config "C:\path\to\config.json"
```
