import type { Request, Response } from "express";

import { loginSchema, registerSchema} from "./auth.schemas";
import { AuthError, register, login , logout, getCurrentUser} from "./auth.service";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  accessCookieOptions,
  refreshCookieOptions
} from "./auth.cookies";


import { refreshSession } from "./auth.service";

import {
  clearAccessCookiesOptions,
  clearRefreshCookieOptions
} from "./auth.cookies";


export async function registerController(
    req:Request,
    res:Response
):Promise<void>{

    const parsed = registerSchema.safeParse(req.body);

    if(!parsed.success){
        res.status(400).json({
            error:{
                code:"VALIDATION_ERROR",
                message:"Invalid registration request",
                details:parsed.error.flatten().fieldErrors
            }
        });

        return;
    }

    try{
        const result = await register(parsed.data);

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
    req:Request,
    res:Response,
):Promise<void>{
    const parsed=loginSchema.safeParse(req.body);

    if(!parsed.success){
        res.status(400).json({
            error:{
                code:"VALIDATION_ERROR",
                message:"Invalid login request",
                details:parsed.error.flatten().fieldErrors
            }
        });

        return;
    }

    try{
        const result=await login(parsed.data,{
            userAgent:req.get("user-agent"),
            ipAddress:req.ip
        });

        res.cookie(
            ACCESS_COOKIE_NAME,
            result.accessToken,
            accessCookieOptions
        )

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
        if(error instanceof AuthError){
            res.status(error.statusCode).json({
                error:{
                    code:
                        error.statusCode===401
                        ? "INVALID_CREDENTIALS"
                        : "ACCOUNT_INACTIVE",
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
        })
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

    catch {
        res.status(500).json({
            error:{
                code:"INTERNAL_SERVER_ERROR",
                message:"An unexpected error occured"
            }
        });
    }
}

export async function meController(
    req:Request,
    res:Response
){
    const authUser = req.authUser;

    if(!authUser){
        return res.status(401).json({
            error:{
                code:"UNAUTHENTICATION",
                message:"Authentication is required"
            }
        });
    }

    try{
        const user = await getCurrentUser(authUser.userId);

        return res.status(200).json({
            user
        });
    }
    catch(error:unknown){
        if(error instanceof AuthError){
            return res.status(error.statusCode).json({
                error:{
                    code:"UNAUTHENTICATED",
                    message:error.message
                }
            });
        }

        return res.status(500).json({
            error:{
                code:"INTERNAL_SERVER_ERROR",
                message:"Failed to retrieve current user"
            }
        });
    }
    
}