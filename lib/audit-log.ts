import { prisma } from "@/lib/prisma";

type AuditAction = "CREATE" | "UPDATE" | "DELETE";
type AuditEntityType = "GIFT_CARD" | "USER" | "STORE" | "TRANSACTION" | "IMPORT";

interface AuditLogParams {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string | null;
  performedBy?: string | null;
  performedByName?: string | null;
  details?: any;
}

/**
 * Writes an audit log entry to the database.
 * Fire-and-forget: errors are logged but never thrown to avoid breaking the main operation.
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        performedBy: params.performedBy ?? null,
        performedByName: params.performedByName ?? null,
        details: params.details ?? undefined,
      },
    });
  } catch (error) {
    console.error("[AuditLog] Failed to write audit entry:", error);
  }
}
