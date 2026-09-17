import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "../generated/prisma/client";

export function requireRole(
    ...allowedRoles:UserRole[]
){
    return (
        req:Request,
        res:Response,
        next:NextFunction
    )=>{
        const authUser=req.authUser;

        // Auth middleware should run first
        if(!authUser){
            return res.status(401).json({
                error:{
                    code:"UNAUTHENTICATED",
                    message:"Authentication is required"
                }
            });
        }

        // check whether the authenticated user's role is allowed
        if(!allowedRoles.includes(authUser.role as UserRole)){
            return res.status(403).json({
                error:{
                    code:"FORBIDDEN",
                    message:"You do not have permission to access this resource"
                }
            });
        }

        return next();
    }
}