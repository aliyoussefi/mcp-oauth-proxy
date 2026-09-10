import fs from "node:fs";
import path from "node:path";
export class AuditLogger {
    file;
    constructor(file = process.env.MCP_PROXY_AUDIT_LOG) {
        this.file = file;
    }
    write(event) {
        if (!this.file)
            return;
        fs.mkdirSync(path.dirname(this.file), { recursive: true });
        fs.appendFileSync(this.file, `${JSON.stringify(event)}${process.platform === "win32" ? "\r\n" : "\n"}`, "utf8");
    }
}
