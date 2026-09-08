import assert from "node:assert/strict";
import test from "node:test";
import { selectServer, validateConfig } from "../src/config.js";
test("validates named upstreams",()=>{const c=validateConfig({servers:{salesforce:{endpoint:"https://sf.test/mcp",transport:"streamable-http",scopes:["mcp"]}}}); assert.equal(c.servers.salesforce.transport,"streamable-http");});
test("rejects unsafe config",()=>assert.throws(()=>validateConfig({servers:{x:{endpoint:"file://x",transport:"bad"}}})));
test("selects one upstream for a dedicated process",()=>{const c=validateConfig({servers:{dataverse:{endpoint:"https://dv.test/mcp",transport:"streamable-http"},salesforce:{endpoint:"https://sf.test/mcp",transport:"streamable-http"}}}); const selected=selectServer(c,"salesforce"); assert.deepEqual(Object.keys(selected.servers),["salesforce"]);});
test("rejects an unknown upstream",()=>{const c=validateConfig({servers:{dataverse:{endpoint:"https://dv.test/mcp",transport:"streamable-http"}}}); assert.throws(()=>selectServer(c,"salesforce"),/unknown server/);});
