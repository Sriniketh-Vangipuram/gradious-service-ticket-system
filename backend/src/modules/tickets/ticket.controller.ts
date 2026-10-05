import type { Request, Response, NextFunction } from "express";

import { getValidatedData } from "../../common/validation/validate-request";
import { sendSuccess } from "../../common/http/api-response";
import { createTicketSchema,ticketIdParamsSchema } from "./ticket.schemas";
import { createTicketUseCase } from "./use-cases/create-ticket.use-case";
import { getTicketUseCase } from "./use-cases/get-ticket.use-case";
import { listTicketsQuerySchema } from "./ticket.schemas";
import { listTicketsUseCase } from "./use-cases/list-tickets.use-case";
import {
  updateTicketParamsSchema,
  updateTicketBodySchema,
  requestInformationBodySchema,
} from "./ticket.schemas";
import {
  approveCancellationRequestUseCase,
} from "./use-cases/lifecycle/approve-cancellation.use-case";

import {
  rejectCancellationRequestUseCase,
} from "./use-cases/lifecycle/reject-cancellation-request.use-case";

import { requestCancellationBodySchema } from "./ticket.schemas";
import { requestCancellationUseCase } from "./use-cases/lifecycle/request-cancellation.use-case";

import { AppError } from "../../common/errors/app-error";

import { updateTicketUseCase } from "./use-cases/update-ticket.use-case";

import { changeTicketStatusBodySchema } from "./ticket.schemas";
import { changeTicketStatusUseCase } from "./use-cases/lifecycle/change-ticket-status.use-case";
import { resolveTicketBodySchema } from "./ticket.schemas";
import { resolveTicketUseCase } from "./use-cases/lifecycle/resolve-ticket.use-case";
import { confirmTicketClosureUseCase } from "./use-cases/lifecycle/confirm-ticket-closure.use-case";
import { reopenTicketBodySchema } from "./ticket.schemas";
import { reopenTicketUseCase } from "./use-cases/lifecycle/reopen-ticket.use-case";
import { cancelTicketBodySchema } from "./ticket.schemas";
import { cancelTicketUseCase } from "./use-cases/lifecycle/cancel-ticket.use-case";
import { createSuccessBody } from "../../common/http/api-response";
import { getEligibleTechniciansUseCase } from "./use-cases/get-eligible-technicians.use-case";
import {
  assignCenterManagerBodySchema,
  assignTechnicianBodySchema,
} from "./ticket.schemas";

import {
  getEligibleManagersUseCase,
} from "./use-cases/get-eligible-managers.use-case";

import {
  assignCenterManagerUseCase,
} from "./use-cases/assign-center-manager.use-case";

import { assignTechnicianUseCase } from "./use-cases/assign-technician.use-case";
import { requestInformationUseCase } from "./use-cases/request-information.use-case";



export async function createTicketController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = getValidatedData(
      req,
      { body: createTicketSchema },
      "body",
    );

    const actor = req.authUser;

    if (!actor) {
      return next(
        new Error(
          "Authenticated user missing after requireAuth middleware.",
        ),
      );
    }

    const idempotencyKey = req.get("Idempotency-Key");

    if (
      !idempotencyKey ||
      idempotencyKey.length < 8 ||
      idempotencyKey.length > 128 ||
      !/^[\x21-\x7E]+$/.test(idempotencyKey)
    ) {
      throw new AppError(
        "VALIDATION_ERROR",
        "A valid Idempotency-Key header is required (8–128 printable ASCII characters).",
      );
    }

    const result = await createTicketUseCase(
      input,
      actor,
      idempotencyKey,
    );

    res
      .status(result.responseStatus)
      .json(result.responseBody);
  } catch (error) {
    next(error);
  }
}

export async function getTicketController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { ticketId } = getValidatedData(
      req,
      { params: ticketIdParamsSchema },
      "params",
    );

    const actor = req.authUser;

    if (!actor) {
      return next(
        new Error(
          "Authenticated user missing after requireAuth middleware.",
        ),
      );
    }

    const ticket = await getTicketUseCase(ticketId, actor);

    sendSuccess(res, { ticket });
  } catch (error) {
    next(error);
  }
}

export async function listTicketsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = getValidatedData(
      req,
      { query: listTicketsQuerySchema },
      "query",
    );

    const actor = req.authUser;

    if (!actor) {
      return next(
        new Error(
          "Authenticated user missing after requireAuth middleware.",
        ),
      );
    }

    const result = await listTicketsUseCase(query, actor);

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}


export async function updateTicketController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { ticketId } = getValidatedData(
      req,
      { params: updateTicketParamsSchema },
      "params",
    );

    const body = getValidatedData(
      req,
      { body: updateTicketBodySchema },
      "body",
    );

    const actor = req.authUser;

    if (!actor) {
      return next(
        new Error(
          "Authenticated user missing after requireAuth middleware.",
        ),
      );
    }

    const ticket = await updateTicketUseCase(
      ticketId,
      body,
      actor,
    );

    sendSuccess(res, { ticket });
  } catch (error) {
    next(error);
  }
}


export async function changeTicketStatusController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { ticketId } = getValidatedData(
      req,
      { params: ticketIdParamsSchema },
      "params",
    );

    const body = getValidatedData(
      req,
      { body: changeTicketStatusBodySchema },
      "body",
    );

    const actor = req.authUser;

    if (!actor) {
      return next(
        new Error(
          "Authenticated user missing after requireAuth middleware.",
        ),
      );
    }

    const ticket = await changeTicketStatusUseCase(
      ticketId,
      body.status,
      actor,
    );

    sendSuccess(res, { ticket });
  } catch (error) {
    next(error);
  }
}

export async function resolveTicketController(
  req: Request,
  res: Response,
  next: NextFunction,
):Promise<void> {
  try {
    const { ticketId } = getValidatedData(
      req,
      { params: ticketIdParamsSchema },
      "params",
    );

    const body = getValidatedData(
      req,
      { body: resolveTicketBodySchema },
      "body",
    );

    if (!req.authUser) {
      throw new AppError("UNAUTHENTICATED", "Authentication required.");
    }

    const ticket = await resolveTicketUseCase(
      ticketId,
      body,
      req.authUser,
    );

    sendSuccess(res, { ticket });
  } catch (error) {
    next(error);
  }
}

export async function confirmTicketClosureController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { ticketId } = getValidatedData(
      req,
      { params: ticketIdParamsSchema },
      "params",
    );

    const actor = req.authUser;

    if (!actor) {
      return next(
        new Error(
          "Authenticated user missing after requireAuth middleware.",
        ),
      );
    }

    const ticket = await confirmTicketClosureUseCase(
      ticketId,
      actor,
    );

    sendSuccess(res, { ticket });
  } catch (error) {
    next(error);
  }
}

export async function reopenTicketController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { ticketId } = getValidatedData(
      req,
      { params: ticketIdParamsSchema },
      "params",
    );

    const body = getValidatedData(
      req,
      { body: reopenTicketBodySchema },
      "body",
    );

    const actor = req.authUser;

    if (!actor) {
      return next(
        new Error(
          "Authenticated user missing after requireAuth middleware.",
        ),
      );
    }

    const ticket = await reopenTicketUseCase(
      ticketId,
      body,
      actor,
    );

    sendSuccess(res, { ticket });
  } catch (error) {
    next(error);
  }
}

export async function cancelTicketController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { ticketId } = getValidatedData(
      req,
      { params: ticketIdParamsSchema },
      "params",
    );

    const body = getValidatedData(
      req,
      { body: cancelTicketBodySchema },
      "body",
    );

    const actor = req.authUser;

    if (!actor) {
      return next(
        new Error(
          "Authenticated user missing after requireAuth middleware.",
        ),
      );
    }

    const ticket = await cancelTicketUseCase(
      ticketId,
      body,
      actor,
    );

    sendSuccess(res, { ticket });
  } catch (error) {
    next(error);
  }
}

export async function getEligibleManagersController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { ticketId } = getValidatedData(
      req,
      {
        params: ticketIdParamsSchema,
      },
      "params",
    );

    const actor = req.authUser;

    if (!actor) {
      return next(
        new Error(
          "Authenticated user missing after requireAuth middleware.",
        ),
      );
    }

    const managers =
      await getEligibleManagersUseCase(
        ticketId,
        actor,
      );

    sendSuccess(res, {
      managers,
    });
  } catch (error) {
    next(error);
  }
}

export async function getEligibleTechniciansController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { ticketId } = getValidatedData(
      req,
      { params: ticketIdParamsSchema },
      "params",
    );

    const actor = req.authUser;

    if (!actor) {
      return next(
        new Error(
          "Authenticated user missing after requireAuth middleware.",
        ),
      );
    }

    const result = await getEligibleTechniciansUseCase(
      ticketId,
      actor,
    );

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}


export async function assignCenterManagerController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { ticketId } = getValidatedData(
      req,
      {
        params: ticketIdParamsSchema,
      },
      "params",
    );

    const body = getValidatedData(
      req,
      {
        body: assignCenterManagerBodySchema,
      },
      "body",
    );

    const actor = req.authUser;

    if (!actor) {
      return next(
        new Error(
          "Authenticated user missing after requireAuth middleware.",
        ),
      );
    }

    const ticket =
      await assignCenterManagerUseCase(
        ticketId,
        body,
        actor,
      );

    sendSuccess(res, {
      ticket,
    });
  } catch (error) {
    next(error);
  }
}

export async function assignTechnicianController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { ticketId } = getValidatedData(
      req,
      {
        params: ticketIdParamsSchema,
      },
      "params",
    );

    const body = getValidatedData(
      req,
      {
        body: assignTechnicianBodySchema,
      },
      "body",
    );

    const actor = req.authUser;

    if (!actor) {
      return next(
        new Error(
          "Authenticated user missing after requireAuth middleware.",
        ),
      );
    }

    const ticket =
      await assignTechnicianUseCase(
        ticketId,
        body,
        actor,
      );

    sendSuccess(res, {
      ticket,
    });
  } catch (error) {
    next(error);
  }
}

export async function requestCancellationController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { ticketId } = getValidatedData(
      req,
      { params: ticketIdParamsSchema },
      "params",
    );

    const body = getValidatedData(
      req,
      { body: requestCancellationBodySchema },
      "body",
    );

    const actor = req.authUser;

    if (!actor) {
      return next(
        new Error(
          "Authenticated user missing after requireAuth middleware.",
        ),
      );
    }

    const result = await requestCancellationUseCase(
      ticketId,
      body,
      actor,
    );

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

export async function approveCancellationRequestController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const ticketId = Number(req.params.ticketId);
    const historyId = Number(req.params.historyId);

    const actor = req.authUser;

    if (!actor) {
      throw new AppError(
        "UNAUTHENTICATED",
        "Authentication required.",
      );
    }

    const ticket =
      await approveCancellationRequestUseCase(
        ticketId,
        historyId,
        actor,
      );

    res.status(200).json({
      success: true,
      data: {
        ticket,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function rejectCancellationRequestController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const ticketId = Number(req.params.ticketId);
    const historyId = Number(req.params.historyId);

    const actor = req.authUser;

    if (!actor) {
      throw new AppError(
        "UNAUTHENTICATED",
        "Authentication required.",
      );
    }

    const result =
      await rejectCancellationRequestUseCase(
        ticketId,
        historyId,
        req.body,
        actor,
      );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function requestInformationController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { ticketId } = getValidatedData(
      req,
      { params: ticketIdParamsSchema },
      "params",
    );

    const body = getValidatedData(
      req,
      { body: requestInformationBodySchema },
      "body",
    );

    const actor = req.authUser;

    if (!actor) {
      throw new AppError(
        "UNAUTHENTICATED",
        "Authentication required.",
      );
    }

    const result = await requestInformationUseCase(
      ticketId,
      body,
      actor,
    );

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}