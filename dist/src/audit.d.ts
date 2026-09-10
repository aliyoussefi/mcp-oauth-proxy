export interface AuditEvent {
    timestamp: string;
    server: string;
    tool: string;
    status: "success" | "error";
    durationMs: number;
}
export declare class AuditLogger {
    private readonly file;
    constructor(file?: string | undefined);
    write(event: AuditEvent): void;
}
