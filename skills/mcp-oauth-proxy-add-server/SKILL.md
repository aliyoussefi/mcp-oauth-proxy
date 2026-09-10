---
name: "mcp-oauth-proxy-add-server"
description: "Add one MCP server to the generic OAuth proxy using URL-first discovery, Dynamic Client Registration, PKCE authentication, and a separate Scout MCP entry."
---

# MCP OAuth Proxy Add Server

Perform an end-to-end setup of one individual MCP server behind the generic MCP OAuth proxy. The user should normally need to provide only a friendly server name and MCP URL.

## Published package

- Repository: https://github.com/aliyoussefi/mcp-oauth-proxy
- Launch command: `npx -y github:aliyoussefi/mcp-oauth-proxy`
- Provider config: `%USERPROFILE%\mcp-oauth-proxy\config.json`
- Scout config: `%USERPROFILE%\.scout\m-mcp-servers.json`
- OAuth callback: `http://localhost:8765/oauth/callback`

## Workflow

1. If the proxy has not been prepared, invoke or perform the equivalent of `/mcp-oauth-proxy-install` first.
2. Ask for a friendly provider name and the MCP server URL. Do not ask for a client secret, access token, refresh token, or password.
3. Use the proxy setup/discovery flow for that URL. Discover protected-resource metadata and OAuth authorization-server metadata. Use discovered authorization URL, token URL, registration endpoint, scopes, and transport defaults whenever available.
4. Attempt OAuth Dynamic Client Registration as a public PKCE client. Register only the loopback redirect URI `http://localhost:8765/oauth/callback`, with authorization-code and refresh-token grant types, code response type, and `token_endpoint_auth_method=none`.
5. If Dynamic Client Registration succeeds, write the returned public client ID to the provider configuration. If it is unsupported or rejected, ask only for a pre-registered public client ID and explain why it is required. Never ask for a secret unless the provider explicitly requires confidential-client authentication.
6. Use PKCE browser authentication. Tell the user a sign-in browser window will open and wait for them to complete authentication. Authenticate one provider process at a time to avoid invalid OAuth state errors.
7. Write the provider configuration to `%USERPROFILE%\mcp-oauth-proxy\config.json` without secrets. Use a separate token file under `%USERPROFILE%\.mcp-oauth-proxy\<provider>-tokens.json`.
8. Add or replace only one Scout MCP entry in `%USERPROFILE%\.scout\m-mcp-servers.json`, preserving all unrelated entries. Use the provider name as the Scout MCP name and launch:

   ```text
   npx -y github:aliyoussefi/mcp-oauth-proxy --config "%USERPROFILE%\mcp-oauth-proxy\config.json" --server <provider-name>
   ```

   Set timeout to 300000 and tools to [].
9. Verify initialize and tools/list for the selected provider. Because `--server` selects one upstream, the proxy exposes that provider's native tool names without a provider prefix. Do not perform business-data writes.
10. If invalid OAuth state occurs, stop duplicate proxy processes only, leave unrelated processes alone, and retry one flow. If port 8765 is busy, identify its owner before acting.
11. Report the provider name, MCP URL, Scout entry name, config paths, whether Dynamic Client Registration succeeded, and read-only tool verification. Never display token contents.

## Important limitations

- URL-only setup depends on the MCP authorization server supporting OAuth metadata and Dynamic Client Registration.
- If the server does not support registration, the public client ID is the only additional value requested.
- Never invent OAuth endpoints, scopes, client IDs, or credentials.

Use exact Windows paths, concise progress updates, and no destructive cleanup beyond timestamped backups and temporary provider processes.
