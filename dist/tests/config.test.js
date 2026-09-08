import assert from "node:assert/strict";
import test from "node:test";
import { validateConfig } from "../src/config.js";
test("validates named upstreams", () => { const c = validateConfig({ servers: { salesforce: { endpoint: "https://sf.test/mcp", transport: "streamable-http", scopes: ["mcp"] } } }); assert.equal(c.servers.salesforce.transport, "streamable-http"); });
test("rejects unsafe config", () => assert.throws(() => validateConfig({ servers: { x: { endpoint: "file://x", transport: "bad" } } })));
