import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { useForm } from "react-hook-form";

import {
  createTicketCommentSchema,
  type CreateTicketCommentFormValues,
} from "../schemas/comment.schema";

interface CommentComposerProps {
  onSubmit: (values: CreateTicketCommentFormValues) => Promise<void>;
  isSubmitting?: boolean;
  disabled?: boolean;
}

export function CommentComposer({
  onSubmit,
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

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="rounded-2xl border border-slate-700/80 bg-slate-900 shadow-xl shadow-black/10"
    >
      <div className="px-4 pt-4 sm:px-5 sm:pt-5">
        <label
          htmlFor="ticket-comment"
          className="sr-only"
        >
          Write a reply
        </label>

        <textarea
          id="ticket-comment"
          rows={4}
          placeholder="Write a reply..."
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
        <p className="text-xs text-slate-600">
          Your message will be visible to the service desk.
        </p>

        <button
          type="submit"
          disabled={isDisabled}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/70 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={15} aria-hidden="true" />
          {isSubmitting ? "Sending..." : "Send"}
        </button>
      </div>
    </form>
  );
}