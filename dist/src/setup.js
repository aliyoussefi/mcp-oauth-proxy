import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { loadConfig } from "./config.js";
async function ask(rl, question, defaultValue) {
    const suffix = defaultValue ? ` [${defaultValue}]` : "";
    const value = (await rl.question(`${question}${suffix}: `)).trim();
    return value || defaultValue || "";
}
async function discover(endpoint) {
    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
    });
    const challenge = response.headers.get("www-authenticate") ?? "";
    const metadataMatch = challenge.match(/resource_metadata="([^"]+)"/i);
    const candidates = metadataMatch ? [metadataMatch[1]] : [];
    const origin = new URL(endpoint).origin;
    candidates.push(`${origin}/.well-known/oauth-authorization-server`, `${origin}/.well-known/openid-configuration`);
    for (const url of candidates) {
        try {
            const metadataResponse = await fetch(url);
            if (!metadataResponse.ok)
                continue;
            const metadata = await metadataResponse.json();
            const authorizationServers = Array.isArray(metadata.authorization_servers)
                ? metadata.authorization_servers.filter((v) => typeof v === "string")
                : [];
            const issuer = typeof metadata.issuer === "string" ? metadata.issuer : authorizationServers[0];
            if (issuer && !metadata.authorization_endpoint && !metadata.token_endpoint) {
                for (const suffix of ["/.well-known/openid-configuration", "/.well-known/oauth-authorization-server"]) {
                    const nested = await fetch(`${issuer.replace(/\/$/, "")}${suffix}`);
                    if (nested.ok)
                        Object.assign(metadata, await nested.json());
                }
            }
            return {
                authorizationEndpoint: typeof metadata.authorization_endpoint === "string" ? metadata.authorization_endpoint : undefined,
                tokenEndpoint: typeof metadata.token_endpoint === "string" ? metadata.token_endpoint : undefined,
                registrationEndpoint: typeof metadata.registration_endpoint === "string" ? metadata.registration_endpoint : undefined,
                scopes: Array.isArray(metadata.scopes_supported)
                    ? metadata.scopes_supported.filter((v) => typeof v === "string")
                    : undefined,
            };
        }
        catch {
            // Try the next standard discovery location.
        }
    }
    return {};
}
async function registerPublicClient(endpoint, redirectUri, scopes) {
    const body = {
        client_name: "MCP OAuth Proxy",
        redirect_uris: [redirectUri],
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        token_endpoint_auth_method: "none",
    };
    if (scopes.length)
        body.scope = scopes.join(" ");
    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(body),
    });
    if (!response.ok)
        return undefined;
    const value = await response.json();
    return typeof value.client_id === "string" && value.client_id ? value.client_id : undefined;
}
function writeConfig(file, config) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(config, null, 2)}${os.EOL}`, "utf8");
}
export async function runSetup(file) {
    const rl = readline.createInterface({ input, output });
    try {
        console.log("MCP OAuth Proxy setup");
        console.log("This creates a config file. It never asks for or stores your password or tokens.");
        const existing = fs.existsSync(file) ? loadConfig(file) : { servers: {} };
        const serverName = await ask(rl, "Name for this MCP server", "dataverse");
        const endpoint = await ask(rl, "MCP server URL");
        if (!endpoint)
            throw new Error("An MCP server URL is required.");
        const transport = (await ask(rl, "Transport (streamable-http or sse)", "streamable-http"));
        if (transport !== "streamable-http" && transport !== "sse")
            throw new Error("Transport must be streamable-http or sse.");
        console.log("Checking the server for OAuth settings...");
        const discovery = await discover(endpoint);
        const authorizationEndpoint = await ask(rl, "Authorization URL", discovery.authorizationEndpoint);
        const tokenEndpoint = await ask(rl, "Token URL", discovery.tokenEndpoint);
        const discoveredScopes = discovery.scopes?.join(" ");
        const scopeText = await ask(rl, "OAuth scopes (space-separated)", discoveredScopes);
        const flowChoice = await ask(rl, "Sign-in method (auto, browser, or device-code)", "auto");
        if (flowChoice !== "auto" && flowChoice !== "browser" && flowChoice !== "device-code") {
            throw new Error("Sign-in method must be auto, browser, or device-code.");
        }
        const deviceCodeEndpoint = await ask(rl, "Device-code URL (optional)");
        const redirectUri = flowChoice === "device-code"
            ? undefined
            : await ask(rl, "Browser callback URL", "http://localhost:8765/oauth/callback");
        const scopes = scopeText ? scopeText.split(/\s+/) : [];
        let clientId;
        if (discovery.registrationEndpoint) {
            console.log("Attempting Dynamic Client Registration for a public PKCE client...");
            clientId = await registerPublicClient(discovery.registrationEndpoint, redirectUri ?? "http://localhost:8765/oauth/callback", scopes);
            if (clientId)
                console.log("Dynamic Client Registration succeeded.");
        }
        if (!clientId) {
            clientId = await ask(rl, "Public OAuth client ID (required when Dynamic Client Registration is unavailable)");
        }
        if (!tokenEndpoint || !clientId || (flowChoice === "browser" && !authorizationEndpoint) ||
            (flowChoice === "device-code" && !deviceCodeEndpoint) ||
            (flowChoice === "auto" && !authorizationEndpoint && !deviceCodeEndpoint) ||
            (flowChoice !== "device-code" && !redirectUri)) {
            throw new Error("Token URL and public client ID are required. Browser flow needs an authorization URL; device-code flow needs a device-code URL.");
        }
        const config = {
            servers: {
                ...existing.servers,
                [serverName]: {
                    endpoint,
                    transport,
                    clientId,
                    scopes,
                    auth: {
                        flow: flowChoice,
                        authorizationEndpoint,
                        tokenEndpoint,
                        ...(discovery.registrationEndpoint ? { registrationEndpoint: discovery.registrationEndpoint } : {}),
                        ...(deviceCodeEndpoint ? { deviceCodeEndpoint } : {}),
                        ...(redirectUri ? { redirectUri } : {}),
                    },
                    tokens: { file: `~/.mcp-oauth-proxy/${serverName}-tokens.json` },
                },
            },
        };
        writeConfig(file, config);
        console.log(`Saved configuration to ${file}`);
        console.log("The first Scout tools/list call will open a browser for sign-in.");
    }
    finally {
        rl.close();
    }
}
