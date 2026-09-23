import type { Request, Response, NextFunction } from "express";

import { ACCESS_COOKIE_NAME } from "../modules/auth/auth.cookies";
import { verifyAccessToken } from "../modules/auth/auth.tokens";
import type { UserRole } from "../generated/prisma/enums";

export interface AuthenticatedUser {
  userId: number;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.[ACCESS_COOKIE_NAME];

  if (!token) {
    return res.status(401).json({
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication is required",
      },
    });
  }

  try {
    const payload = await verifyAccessToken(token);

    req.authUser = {
      userId: payload.userId,
      role: payload.role,
    };

    return next();
  } catch {
    return res.status(401).json({
      error: {
        code: "INVALID_ACCESS_TOKEN",
        message: "Access token is invalid or expired",
      },
    });
  }
}