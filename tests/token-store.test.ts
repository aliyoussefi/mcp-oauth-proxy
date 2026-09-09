import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs/promises";
import path from "node:path";
import { FileTokenStore } from "../src/token-store.js";
const file=path.join(process.cwd(),".test-tokens.json");
test("stores OAuth tokens encrypted",async()=>{if(process.platform!=="win32")process.env.MCP_OAUTH_PROXY_KEY=Buffer.alloc(32,7).toString("base64"); const s=new FileTokenStore(file); await s.set("x",{accessToken:"access-secret",refreshToken:"refresh-secret"}); const raw=await fs.readFile(file,"utf8"); assert.ok(!raw.includes("access-secret")); assert.ok(!raw.includes("refresh-secret")); const tokens=await s.get("x"); assert.equal(tokens?.accessToken,"access-secret"); assert.equal(tokens?.refreshToken,"refresh-secret"); await fs.rm(file,{force:true});});
