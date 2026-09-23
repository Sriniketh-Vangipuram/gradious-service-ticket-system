import type { UserRole } from "../../auth/types/auth.types";

export type CommentVisibility = "PUBLIC" | "INTERNAL";

export interface TicketCommentAuthor {
  id: number;
  fullName: string;
  role: UserRole;
}

export interface TicketComment {
  id: number;
  content: string;
  visibility: CommentVisibility;
  createdAt: string;
  author: TicketCommentAuthor;
}