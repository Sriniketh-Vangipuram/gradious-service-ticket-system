import type { Request, Response, NextFunction } from "express";

import { loginSchema, registerSchema} from "./auth.schemas";
import { AuthError, register, login , logout, getCurrentUser} from "./auth.service";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  accessCookieOptions,
  refreshCookieOptions
} from "./auth.cookies";

import { getValidatedData } from "../../common/validation/validate-request";

import { refreshSession } from "./auth.service";

import {
  clearAccessCookiesOptions,
  clearRefreshCookieOptions
} from "./auth.cookies";

import { AppError } from "../../common/errors/app-error";

export async function registerController(
    req:Request,
    res:Response
):Promise<void>{

    const body = getValidatedData(
        req,
        {body:registerSchema},
        "body",
    );

    try{
        const result = await register(body);

        res.status(201).json({
            user:result.user
        });
    }

    catch(error){
        if(error instanceof AuthError){
            res.status(error.statusCode).json({
                error:{
                    code:"REGISTRATION_FAILED",
                    message:error.message
                }
            });

            return;
        }

        res.status(500).json({
            error:{
                code:"INTERNAL_SERVER_ERROR",
                message:"An unexpected error occured"
            }
        });
    }
}

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body  = getValidatedData(
      req,
      { body: loginSchema },
      "body",
    );

    const result = await login(body, {
      userAgent: req.get("user-agent"),
      ipAddress: req.ip,
    });

    res.cookie(
      ACCESS_COOKIE_NAME,
      result.accessToken,
      accessCookieOptions,
    );

    res.cookie(
      REFRESH_COOKIE_NAME,
      result.refreshToken,
      refreshCookieOptions,
    );

    res.status(200).json({
      user: result.user,
    });
    } catch (error) {
    if (error instanceof AuthError) {
        if (error.statusCode === 401) {
        return next(
            new AppError(
            "UNAUTHENTICATED",
            "Invalid email or password.",
            ),
        );
        }

        if (error.statusCode === 403) {
        return next(
            new AppError(
            "FORBIDDEN",
            "Account is inactive.",
            ),
        );
        }
    }

    return next(error);
  }
}


export async function refreshController(
    req:Request,
    res:Response
):Promise<void>{

    const refreshToken=req.cookies?.[REFRESH_COOKIE_NAME];

    if(typeof refreshToken!=="string" || !refreshToken){
        res.clearCookie(ACCESS_COOKIE_NAME,clearAccessCookiesOptions);
        res.clearCookie(REFRESH_COOKIE_NAME,clearRefreshCookieOptions);

        res.status(401).json({
            error:{
                code:"REFRESH_TOKEN_MISSING",
                message:"Refresh token is missing"
            }
        });

        return;
    }

    try{
        const result=await refreshSession(refreshToken,{
            userAgent:req.get("user-agent"),
            ipAddress:req.ip
        });

        res.cookie(
            ACCESS_COOKIE_NAME,
            result.accessToken,
            accessCookieOptions
        );

        res.cookie(
            REFRESH_COOKIE_NAME,
            result.refreshToken,
            refreshCookieOptions
        );

        res.status(200).json({
            user:result.user
        });
    }

    catch(error){
        res.clearCookie(ACCESS_COOKIE_NAME,clearAccessCookiesOptions);
        res.clearCookie(REFRESH_COOKIE_NAME,clearRefreshCookieOptions);

        if(error instanceof AuthError){
            res.status(error.statusCode).json({
                error:{
                    code:"REFRESH_FAILED",
                    message:error.message
                }
            });

            return;
        }

        res.status(500).json({
            error:{
                code:"INTERNAL_SERVER_ERROR",
                message:"An unexpected error occured"
            }
        });
    }

}

export async function logoutController(
    req:Request,
    res:Response,
    next:NextFunction
):Promise<void>{

    const refreshToken=req.cookies?.[REFRESH_COOKIE_NAME];

    try{
        await logout(
            typeof refreshToken ==="string" ? refreshToken : undefined
        );

        res.clearCookie(ACCESS_COOKIE_NAME,clearAccessCookiesOptions);
        res.clearCookie(REFRESH_COOKIE_NAME,clearRefreshCookieOptions);

        res.status(200).json({
            message:"Logged out successfully"
        });
    }

    catch(error) {
        ;next(error);
    }
}

export async function meController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authUser = req.authUser;

  // Defensive check; requireAuth should already guarantee this.
  if (!authUser) {
    return next(
      new AppError(
        "UNAUTHENTICATED",
        "Authentication is required.",
      ),
    );
  }

  try {
    const user = await getCurrentUser(authUser.userId);

    res.status(200).json({ user });
  } catch (error) {
    if (error instanceof AuthError) {
      return next(
        new AppError(
          "UNAUTHENTICATED",
          error.message,
        ),
      );
    }

    return next(error);
  }
}