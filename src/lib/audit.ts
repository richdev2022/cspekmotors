import { db } from "@/lib/db";

export interface AuditInput {
  adminId?: string | null;
  adminName: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  details?: string | null;
}

/**
 * Records an important admin action. Best-effort: audit failures
 * must never break the primary operation.
 */
export async function logAudit(input: AuditInput): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        adminId: input.adminId ?? null,
        adminName: input.adminName,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId ?? null,
        details: input.details ?? null,
      },
    });
  } catch (err) {
    console.error("[AUDIT] Failed to record audit log:", err);
  }
}
