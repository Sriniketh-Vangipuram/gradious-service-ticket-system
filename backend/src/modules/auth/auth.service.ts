import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

import {prisma} from "../../config/database";
import {env} from "../../config/env";

import { createAccessToken,generateRefreshToken,hashRefreshToken } from "./auth.tokens";
import type { LoginInput,RegisterInput } from "./auth.schemas";

export class AuthError extends Error{
    constructor(
        message:string,
        public readonly statusCode:number
    ){
        super(message);
        this.name="AuthError";
    }
}


export async function register(input:RegisterInput){
  const existingUser=await prisma.user.findUnique({
    where:{
      email:input.email
    },
    select:{
      id:true
    }
  });

  if(existingUser){
    throw new AuthError("Email is already registered",409);
  }

  const passwordHash=await bcrypt.hash(input.password,12);

  try {
    const user = await prisma.user.create({
      data:{
        fullName:input.fullName,
        email:input.email,
        passwordHash,
        role:"EMPLOYEE"
      },

      select:{
        id:true,
        fullName:true,
        email:true,
        role:true,
        centerId:true
      }
    });

    return {user};
  }

  catch(error:unknown){
    if(typeof error === "object" && 
      error !==null &&
      "code" in error &&
      error.code === "P2002"
    ){
      throw new AuthError("Email is already registered",409);
    }

    throw error;
  }
}
interface LoginMetadata{
    userAgent?:string;
    ipAddress?:string;
}

export async function login(
    input:LoginInput,
    metadata:LoginMetadata,
){
    const user = await prisma.user.findUnique({
        where:{
            email:input.email
        }
    });

    // if no user is found. Then return 401 (unauthorized)
    if(!user){
        throw new AuthError("Invalid email or Password",401);
    }

    const passwordMatches=await bcrypt.compare(input.password,user.passwordHash);

    if(!passwordMatches){
        throw new AuthError("Invalid email or password",401);
    }

    if(!user.isActive){
        throw new AuthError("Account is inactive",403);
    }

    const accessToken=await createAccessToken({
        userId:user.id,
        role:user.role
    });

    const refreshToken=generateRefreshToken();
    const familyId=randomUUID();


    const expiresAt=new Date(
        Date.now() + env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000
    );

    await prisma.refreshSession.create({
        data:{
            familyId,
            tokenHash:hashRefreshToken(refreshToken),
            userId:user.id,
            expiresAt,
            userAgent:metadata.userAgent,
            ipAddress:metadata.ipAddress,
        }
    });

    return {
        accessToken,
        refreshToken,
        user:{
            id:user.id,
            fullName:user.fullName,
            email:user.email,
            role:user.role,
            centerId:user.centerId,

        }
    };
}

interface RefreshMetadata {
  userAgent?: string;
  ipAddress?: string;
}

type RefreshResult =
  | {
      ok: true;
      accessToken: string;
      refreshToken: string;
      user: {
        id: number;
        fullName: string;
        email: string;
        role: string;
        centerId: number | null;
      };
    }
  | {
      ok: false;
      statusCode: number;
      code: string;
      message: string;
    };

export async function refreshSession(
  rawRefreshToken: string,
  metadata: RefreshMetadata = {}
) {
  const tokenHash = hashRefreshToken(rawRefreshToken);
  const now = new Date();

  const outcome: RefreshResult = await prisma.$transaction(async (tx) => {
    const session = await tx.refreshSession.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!session) {
      return {
        ok: false,
        statusCode: 401,
        code: "INVALID_REFRESH_TOKEN",
        message: "Invalid refresh token"
      };
    }

    // Reuse of a revoked token: revoke all still-active sessions
    // in this token family, then commit before returning the error.
    if (session.revokedAt) {
      await tx.refreshSession.updateMany({
        where: {
          familyId: session.familyId,
          revokedAt: null
        },
        data: { revokedAt: now }
      });

      return {
        ok: false,
        statusCode: 401,
        code: "REFRESH_TOKEN_REUSE_DETECTED",
        message: "Refresh token reuse detected"
      };
    }

    if (session.expiresAt <= now) {
      await tx.refreshSession.updateMany({
        where: {
          id: session.id,
          revokedAt: null
        },
        data: { revokedAt: now }
      });

      return {
        ok: false,
        statusCode: 401,
        code: "REFRESH_TOKEN_EXPIRED",
        message: "Refresh token expired"
      };
    }

    if (!session.user.isActive) {
      await tx.refreshSession.updateMany({
        where: {
          familyId: session.familyId,
          revokedAt: null
        },
        data: { revokedAt: now }
      });

      return {
        ok: false,
        statusCode: 403,
        code: "ACCOUNT_INACTIVE",
        message: "Account is inactive"
      };
    }

    // Atomically claim this active token for rotation.
    const claimed = await tx.refreshSession.updateMany({
      where: {
        id: session.id,
        revokedAt: null,
        expiresAt: { gt: now }
      },
      data: { revokedAt: now }
    });

    if (claimed.count !== 1) {
      // A concurrent request may have rotated this token.
      await tx.refreshSession.updateMany({
        where: {
          familyId: session.familyId,
          revokedAt: null
        },
        data: { revokedAt: now }
      });

      return {
        ok: false,
        statusCode: 401,
        code: "REFRESH_TOKEN_REUSE_DETECTED",
        message: "Refresh token reuse detected"
      };
    }

    const nextRefreshToken = generateRefreshToken();

    const expiresAt = new Date(
      Date.now() +
        env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000
    );

    await tx.refreshSession.create({
      data: {
        familyId: session.familyId,
        tokenHash: hashRefreshToken(nextRefreshToken),
        userId: session.userId,
        expiresAt,
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress
      }
    });

    const accessToken = await createAccessToken({
      userId: session.user.id,
      role: session.user.role
    });

    return {
      ok: true,
      accessToken,
      refreshToken: nextRefreshToken,
      user: {
        id: session.user.id,
        fullName: session.user.fullName,
        email: session.user.email,
        role: session.user.role,
        centerId: session.user.centerId
      }
    };
  });

  // This is deliberately outside the transaction.
  // Returning the error outcome above allows revocation to commit.
  if (!outcome.ok) {
    throw new AuthError(outcome.message, outcome.statusCode);
  }

  return outcome;
}


export async function logout(rawRefreshToken?:string):Promise<void>{
    if(!rawRefreshToken){
        return;
    }

    await prisma.refreshSession.updateMany({
        where:{
            tokenHash:hashRefreshToken(rawRefreshToken),
            revokedAt:null
        },

        data:{
            revokedAt:new Date()
        }
    });
}

export async function getCurrentUser(userId: number) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      centerId: true,
      isActive: true
    }
  });

  if (!user || !user.isActive) {
    throw new AuthError("User account is unavailable", 401);
  }

  return user;
}