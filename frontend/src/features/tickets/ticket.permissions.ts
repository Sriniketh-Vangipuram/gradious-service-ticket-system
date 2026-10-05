import type { AuthUser } from "../auth/types/auth.types";
import type { Ticket } from "./types/ticket.types";

export function canViewTicket(
  user: AuthUser,
  ticket: Ticket,
): boolean {
  if (user.role === "ADMIN") {
    return true;
  }

  if (user.role === "CENTER_MANAGER") {
    return user.centerId === ticket.centerId;
  }

  if (user.role === "TECHNICIAN") {
    return ticket.assigneeId === user.id;
  }

  return ticket.requesterId === user.id;
}

export function canCreateTicket(
  user: AuthUser,
): boolean {
  return user.role === "EMPLOYEE";
}

export function canEditTicket(
  user: AuthUser,
  ticket: Ticket,
): boolean {
  if (user.role === "EMPLOYEE") {
    return (
      ticket.requesterId === user.id &&
      ticket.status === "OPEN"
    );
  }

  if (user.role === "TECHNICIAN") {
    return ticket.assigneeId === user.id;
  }

  return (
    user.role === "CENTER_MANAGER" ||
    user.role === "ADMIN"
  );
}

export function canCancelTicket(
  user: AuthUser,
  ticket: Ticket,
): boolean {
  const cancellable =
    ticket.status !== "RESOLVED" &&
    ticket.status !== "CLOSED" &&
    ticket.status !== "CANCELLED";

  if (!cancellable) {
    return false;
  }

  return (
    ticket.requesterId === user.id ||
    user.role === "ADMIN"
  );
}

export function canRequestCancellation(
  user: AuthUser,
  ticket: Ticket,
): boolean {
  const cancellable =
    ticket.status !== "RESOLVED" &&
    ticket.status !== "CLOSED" &&
    ticket.status !== "CANCELLED";

  if (!cancellable) {
    return false;
  }

  return (
    user.role === "CENTER_MANAGER" &&
    user.centerId === ticket.centerId
  );
}

export function canReopenTicket(
  user: AuthUser,
  ticket: Ticket,
): boolean {
  if (ticket.status !== "RESOLVED") {
    return false;
  }

  return (
    ticket.requesterId === user.id ||
    user.role === "CENTER_MANAGER" ||
    user.role === "ADMIN"
  );
}

export function canConfirmClosure(
  user: AuthUser,
  ticket: Ticket,
): boolean {
  return (
    user.role === "EMPLOYEE" &&
    ticket.requesterId === user.id &&
    ticket.status === "RESOLVED"
  );
}

export function canRespondToTicket(
  user: AuthUser,
  ticket: Ticket,
): boolean {
  return (
    user.role === "EMPLOYEE" &&
    ticket.requesterId === user.id &&
    ticket.status !== "CLOSED" &&
    ticket.status !== "CANCELLED"
  );
}

export function canCommentOnTicket(
  user: AuthUser,
  ticket: Ticket,
): boolean {
  if (
    ticket.status === "CLOSED" ||
    ticket.status === "CANCELLED"
  ) {
    return false;
  }

  if (user.role === "ADMIN") {
    return true;
  }

  if (user.role === "CENTER_MANAGER") {
    return user.centerId === ticket.centerId;
  }

  if (user.role === "TECHNICIAN") {
    return ticket.assigneeId === user.id;
  }

  return ticket.requesterId === user.id;
}