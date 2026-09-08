import assert from "node:assert/strict";
import test from "node:test";
import { spawn } from "node:child_process";
import path from "node:path";
test("stdio returns JSON-RPC initialize framing",async()=>{const p=spawn(process.execPath,[path.join(process.cwd(),"dist/src/main.js"),"--config",path.join(process.cwd(),"config.example.json")],{stdio:["pipe","pipe","pipe"]}); const out=new Promise<string>(resolve=>p.stdout.once("data",d=>resolve(d.toString()))); p.stdin.write(JSON.stringify({jsonrpc:"2.0",id:1,method:"initialize",params:{}})+"\n"); const line=await out; assert.equal(JSON.parse(line).result.serverInfo.name,"mcp-oauth-proxy"); p.kill();});

