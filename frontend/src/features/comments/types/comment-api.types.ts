import type { TicketComment } from "./comment.types";

/* -------------------------------------------------------------------------- */
/* Shared API response                                                        */
/* -------------------------------------------------------------------------- */

export interface CommentSuccessResponse<T> {
  success: true;
  data: T;
}

/* -------------------------------------------------------------------------- */
/* List comments                                                              */
/* -------------------------------------------------------------------------- */

export type ListTicketCommentsResponse =
  CommentSuccessResponse<{
    comments: TicketComment[];
  }>;

/* -------------------------------------------------------------------------- */
/* Create comment                                                             */
/* -------------------------------------------------------------------------- */

export interface CreateTicketCommentRequest {
  content: string;
  visibility: "PUBLIC";
}

export type CreateTicketCommentResponse =
  CommentSuccessResponse<{
    comment: TicketComment;
  }>;