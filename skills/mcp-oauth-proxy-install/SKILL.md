# MCP OAuth Proxy Install

Perform the installation and preparation phase for the generic MCP OAuth proxy on Windows.

## Published package

- Repository: https://github.com/aliyoussefi/mcp-oauth-proxy
- Release: v0.3.1
- Launch command: `npx -y github:aliyoussefi/mcp-oauth-proxy#v0.3.1`
- Provider config: `%USERPROFILE%\mcp-oauth-proxy\config.json`

## Workflow

1. Verify Node.js 20+ and npm with `node --version` and `npm --version`. Stop if unavailable.
2. Validate that the pinned GitHub package can be downloaded and built with `npx`/npm. Do not use an unpinned branch.
3. Create `%USERPROFILE%\mcp-oauth-proxy\` if missing.
4. Create `config.json` only if missing, with an empty `servers` object. Preserve any existing provider configuration.
5. Back up `%USERPROFILE%\.scout\m-mcp-servers.json` with a timestamp before changing it.
6. Do not add provider-specific MCP entries yet. This skill only prepares the proxy and leaves provider registration to `/mcp-oauth-proxy-add-server`.
7. Never request, store, print, or write client secrets, access tokens, refresh tokens, or passwords.
8. Report the installed package tag, config path, and the next skill to invoke.

Use exact Windows paths and make no destructive changes beyond creating missing directories/files and timestamped backups.
