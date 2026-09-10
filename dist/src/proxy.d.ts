import { ProxyConfig } from "./config.js";
import { Rpc } from "./transport.js";
import { TokenProvider } from "./token-store.js";
import { AuditLogger } from "./audit.js";
export declare class ProxyRouter {
    private readonly config;
    private readonly audit;
    private readonly transports;
    constructor(config: ProxyConfig, tokens: TokenProvider, audit?: AuditLogger);
    private target;
    handle(rpc: Rpc): Promise<any>;
}
