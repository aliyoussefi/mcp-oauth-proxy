import fs from "node:fs";
import path from "node:path";

export interface AuditEvent {
  timestamp: string;
  server: string;
  tool: string;
  status: "success" | "error";
  durationMs: number;
}

export class AuditLogger {
  constructor(private readonly file = process.env.MCP_PROXY_AUDIT_LOG) {}

  write(event: AuditEvent): void {
    if (!this.file) return;
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.appendFileSync(this.file, `${JSON.stringify(event)}${process.platform === "win32" ? "\r\n" : "\n"}`, "utf8");
  }
}
