import { AgentAuditRecord } from './types';

const AUDIT_STORAGE_KEY = 'satquery_agent_audit_log_v1';

export class AuditLogger {
  private static records: AgentAuditRecord[] = [];

  public static log(record: AgentAuditRecord): void {
    this.records.unshift(record);
    // Keep max 50 records in memory/local storage
    if (this.records.length > 50) {
      this.records = this.records.slice(0, 50);
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(this.records));
      }
    } catch {
      // Storage might fail if quota exceeded
    }
  }

  public static getRecords(): AgentAuditRecord[] {
    if (this.records.length === 0) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const stored = window.localStorage.getItem(AUDIT_STORAGE_KEY);
          if (stored) {
            this.records = JSON.parse(stored);
          }
        }
      } catch {
        // Fallback
      }
    }
    return this.records;
  }

  public static getRecordById(auditId: string): AgentAuditRecord | undefined {
    return this.getRecords().find((r) => r.auditId === auditId);
  }

  public static clear(): void {
    this.records = [];
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(AUDIT_STORAGE_KEY);
      }
    } catch {
      // Ignore
    }
  }
}
