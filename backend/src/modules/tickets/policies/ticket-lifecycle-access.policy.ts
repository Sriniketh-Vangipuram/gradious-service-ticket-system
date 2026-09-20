
import { UserRole } from "../../../generated/prisma/client";
import { AppError } from "../../../common/errors/app-error";
import type { AuthenticatedUser } from "../../../middleware/auth.middleware";

export type TicketLifecycleAction =
  | "TRIAGE"
  | "MARK_ASSIGNED"
  | "START_WORK"
  | "WAIT_FOR_USER"
  | "RESUME_WORK"
  | "RESOLVE"
  | "CONFIRM_CLOSURE"
  | "REOPEN"
  | "CANCEL";

type TicketLifecycleAccessContext = {
  requesterId: number;
  assigneeId: number | null;
  centerId: number;
};

type TicketLifecycleScope = {
  id: number;
  requesterId?: number;
  assigneeId?: number | null;
  center?: {
    userAccess: {
      some: {
        userId: number;
      };
    };
  };
};

export function assertTicketLifecycleAccess(
  actor: AuthenticatedUser,
  action: TicketLifecycleAction,
  ticket: TicketLifecycleAccessContext,
): void {
  const isRequester = actor.userId === ticket.requesterId;
  const isAssignedTechnician =
    actor.role === UserRole.TECHNICIAN &&
    actor.userId === ticket.assigneeId;

  switch (action) {
    case "TRIAGE":
      if (
        isAssignedTechnician ||
        actor.role === UserRole.CENTER_MANAGER ||
        actor.role === UserRole.ADMIN
      ) {
        return;
      }
      break;

    case "MARK_ASSIGNED":
      if (
        actor.role === UserRole.ADMIN ||
        actor.role === UserRole.CENTER_MANAGER
      ) {
        return;
      }
      break;

    case "START_WORK":
    case "WAIT_FOR_USER":
    case "RESUME_WORK":
      if (isAssignedTechnician) return;
      break;

    case "RESOLVE":
      if (
        isAssignedTechnician ||
        actor.role === UserRole.ADMIN ||
        actor.role === UserRole.CENTER_MANAGER
      ) {
        return;
      }
      break;

    case "CONFIRM_CLOSURE":
      if (isRequester) return;
      break;

    case "REOPEN":
      if (
        isRequester ||
        actor.role === UserRole.ADMIN ||
        actor.role === UserRole.CENTER_MANAGER
      ) {
        return;
      }
      break;

    case "CANCEL":
      if (
        (isRequester) ||
        actor.role === UserRole.ADMIN ||
        actor.role === UserRole.CENTER_MANAGER
      ) {
        return;
      }
      break;
  }

  throw new AppError(
    "FORBIDDEN",
    "You are not authorized to perform this ticket action.",
  );
}

export function getTicketLifecycleScope(
  actor: AuthenticatedUser,
  action: TicketLifecycleAction,
  ticketId: number,
): TicketLifecycleScope {
  switch (actor.role) {
    case UserRole.ADMIN:
      return { id: ticketId };

    case UserRole.EMPLOYEE:
      if (action === "CONFIRM_CLOSURE" || action === "REOPEN" || action === "CANCEL" || action==="RESOLVE") {
        return { id: ticketId, requesterId: actor.userId };
      }
      throw new AppError("FORBIDDEN", "You are not authorized to perform this ticket action.");

    case UserRole.TECHNICIAN:
      if (["START_WORK", "WAIT_FOR_USER", "RESUME_WORK", "RESOLVE", "TRIAGE"].includes(action)) {
        return { id: ticketId,assigneeId:actor.userId };
      }
      throw new AppError("FORBIDDEN", "You are not authorized to perform this ticket action.");

    case UserRole.CENTER_MANAGER:
      return {
        id: ticketId,
        center: {
          userAccess: {
            some: { userId: actor.userId },
          },
        },
      };

    default:
      throw new AppError("FORBIDDEN", "You are not authorized to perform this ticket action.");
  }
}