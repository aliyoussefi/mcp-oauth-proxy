import { HttpMcpTransport } from "./transport.js";
import { AuditLogger } from "./audit.js";
export class ProxyRouter {
    config;
    audit;
    transports = {};
    constructor(config, tokens, audit = new AuditLogger()) {
        this.config = config;
        this.audit = audit;
        for (const [n, c] of Object.entries(config.servers))
            this.transports[n] = new HttpMcpTransport(c, tokens, n);
    }
    target(params, toolName) { const server = params?.server; if (server && this.transports[server])
        return { server, name: params.name ?? toolName }; if (toolName?.includes("/")) {
        const [s, ...rest] = toolName.split("/");
        if (this.transports[s])
            return { server: s, name: rest.join("/") };
    } if (Object.keys(this.transports).length === 1)
        return { server: Object.keys(this.transports)[0], name: toolName }; throw new Error("upstream server is required (use params.server or server/tool name)"); }
    async handle(rpc) {
        if (rpc.method === "initialize")
            return { jsonrpc: "2.0", id: rpc.id, result: { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "mcp-oauth-proxy", version: "0.1.0" } } };
        if (rpc.method === "notifications/initialized")
            return undefined;
        if (rpc.method === "tools/list") {
            const selected = rpc.params?.server ? [rpc.params.server] : Object.keys(this.transports);
            const namespace = Object.keys(this.transports).length > 1;
            const tools = [];
            for (const s of selected) {
                if (!this.transports[s])
                    throw new Error(`unknown upstream server: ${s}`);
                const result = await this.transports[s].request({ jsonrpc: "2.0", id: rpc.id ?? 1, method: "tools/list", params: rpc.params });
                for (const t of result?.result?.tools ?? [])
                    tools.push({ ...t, name: namespace ? `${s}/${t.name}` : t.name });
            }
            return { jsonrpc: "2.0", id: rpc.id, result: { tools } };
        }
        if (rpc.method === "tools/call") {
            const target = this.target(rpc.params, rpc.params?.name);
            if (!target.name)
                throw new Error("tool name is required");
            const started = Date.now();
            try {
                const result = await this.transports[target.server].request({ jsonrpc: "2.0", id: rpc.id ?? 1, method: "tools/call", params: { ...rpc.params, name: target.name, server: undefined } });
                this.audit.write({ timestamp: new Date().toISOString(), server: target.server, tool: target.name, status: result?.result?.isError ? "error" : "success", durationMs: Date.now() - started });
                return { ...result, id: rpc.id };
            }
            catch (error) {
                this.audit.write({ timestamp: new Date().toISOString(), server: target.server, tool: target.name, status: "error", durationMs: Date.now() - started });
                throw error;
            }
        }
        throw new Error(`unsupported method: ${rpc.method}`);
    }
}
