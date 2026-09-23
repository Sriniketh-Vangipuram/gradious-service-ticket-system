import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, Send } from "lucide-react";
import { useForm } from "react-hook-form";

import {
  createTicketCommentSchema,
  type CreateTicketCommentFormValues,
} from "../schemas/comment.schema";
import type { CommentVisibility } from "../types/comment.types";

interface CommentComposerProps {
  onSubmit: (
    values: CreateTicketCommentFormValues,
  ) => Promise<void>;
  visibility?: CommentVisibility;
  isSubmitting?: boolean;
  disabled?: boolean;
}

export function CommentComposer({
  onSubmit,
  visibility = "PUBLIC",
  isSubmitting = false,
  disabled = false,
}: CommentComposerProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTicketCommentFormValues>({
    resolver: zodResolver(createTicketCommentSchema),
    defaultValues: {
      content: "",
    },
  });

  const handleFormSubmit = async (
    values: CreateTicketCommentFormValues,
  ) => {
    await onSubmit(values);
    reset();
  };

  const isDisabled = disabled || isSubmitting;
  const isInternal = visibility === "INTERNAL";

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className={`rounded-2xl border shadow-xl shadow-black/10 ${
        isInternal
          ? "border-amber-500/20 bg-amber-500/5"
          : "border-slate-700/80 bg-slate-900"
      }`}
    >
      <div className="px-4 pt-4 sm:px-5 sm:pt-5">
        <label
          htmlFor="ticket-comment"
          className="sr-only"
        >
          {isInternal ? "Write an internal note" : "Write a reply"}
        </label>

        <textarea
          id="ticket-comment"
          rows={4}
          placeholder={
            isInternal
              ? "Write an internal note for the service team..."
              : "Write a reply..."
          }
          disabled={isDisabled}
          {...register("content")}
          className="min-h-28 w-full resize-y bg-transparent text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
        />

        {errors.content ? (
          <p
            role="alert"
            className="pb-3 text-xs font-medium text-rose-400"
          >
            {errors.content.message}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-800 px-4 py-3 sm:px-5">
        <p
          className={`flex items-center gap-1.5 text-xs ${
            isInternal ? "text-amber-300/70" : "text-slate-600"
          }`}
        >
          {isInternal ? (
            <>
              <LockKeyhole size={12} aria-hidden="true" />
              Visible only to authorized staff.
            </>
          ) : (
            "Your message will be visible to the service desk."
          )}
        </p>

        <button
          type="submit"
          disabled={isDisabled}
          className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
            isInternal
              ? "bg-amber-500 text-slate-950 hover:bg-amber-400 focus:ring-2 focus:ring-amber-400/70"
              : "bg-indigo-500 text-white hover:bg-indigo-400 focus:ring-2 focus:ring-indigo-400/70"
          }`}
        >
          {isInternal ? (
            <LockKeyhole size={15} aria-hidden="true" />
          ) : (
            <Send size={15} aria-hidden="true" />
          )}

          {isSubmitting
            ? "Sending..."
            : isInternal
              ? "Add internal note"
              : "Send"}
        </button>
      </div>
    </form>
  );
}