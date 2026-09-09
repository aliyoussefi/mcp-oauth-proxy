import assert from "node:assert/strict";
import test from "node:test";
import http from "node:http";
import { ProxyRouter } from "../src/proxy.js";
import { TokenProvider } from "../src/token-store.js";
const tokens:TokenProvider={get:async()=>undefined,set:async()=>{}};
test("routes a dedicated upstream with plain tool names",async()=>{const server=http.createServer(async(req,res)=>{let body=""; for await(const c of req)body+=c; const r=JSON.parse(body); const result=r.method==="tools/list"?{tools:[{name:"hello",description:"hi",inputSchema:{type:"object"}}]}:{content:[{type:"text",text:"ok"}]}; res.setHeader("content-type","application/json"); res.end(JSON.stringify({jsonrpc:"2.0",id:r.id,result}));}); await new Promise<void>(resolve=>server.listen(0,resolve)); const port=(server.address() as any).port; const router=new ProxyRouter({servers:{mock:{endpoint:`http://127.0.0.1:${port}`,transport:"streamable-http"}}},tokens); const listed=await router.handle({jsonrpc:"2.0",id:1,method:"tools/list"}); assert.equal(listed.result.tools[0].name,"hello"); const called=await router.handle({jsonrpc:"2.0",id:2,method:"tools/call",params:{name:"hello",arguments:{}}}); assert.equal(called.result.content[0].text,"ok"); await new Promise<void>(resolve=>server.close(()=>resolve()));});
