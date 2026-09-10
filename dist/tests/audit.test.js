import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { AuditLogger } from "../src/audit.js";
test("writes metadata-only audit events", async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-audit-"));
    const file = path.join(directory, "audit.jsonl");
    new AuditLogger(file).write({
        timestamp: "2026-09-09T00:00:00.000Z",
        server: "dataverse",
        tool: "read_query",
        status: "success",
        durationMs: 12,
    });
    const event = JSON.parse(await fs.readFile(file, "utf8"));
    assert.deepEqual(event, {
        timestamp: "2026-09-09T00:00:00.000Z",
        server: "dataverse",
        tool: "read_query",
        status: "success",
        durationMs: 12,
    });
    await fs.rm(directory, { recursive: true, force: true });
});
