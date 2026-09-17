import { randomBytes,createHash } from "node:crypto";

import { SignJWT,jwtVerify } from "jose";
import {env} from "../../config/env";

const accessTokenSecret=new TextEncoder().encode(
    env.JWT_ACCESS_SECRET
);

export interface AccessTokenPayload{
    userId:number;
    role:string;
}

// create a short-lived access JWT
export async function createAccessToken(
    payload:AccessTokenPayload
): Promise<string>{
    return new SignJWT({
        role:payload.role
    })

    .setProtectedHeader({alg:"HS256"})
    .setSubject(String(payload.userId))
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_EXPIRES_IN)
    .sign(accessTokenSecret);
}

// verifies an access JWT and returns its trusted claims.
export async function verifyAccessToken(token:string){

    const{payload}=await jwtVerify(token,accessTokenSecret, {
        algorithms:["HS256"]
    });

    const userId = Number(payload.sub);

    if(!Number.isSafeInteger(userId) || userId<=0){
        throw new Error("Invalid access token subject");
    }

    if(typeof payload.role!=="string"){
        throw new Error("Invalid access token role");
    }

    return {
        userId,
        role:payload.role
    };
}

// Generate a cryptographically random opaque refresh token.
export function generateRefreshToken():string{
    return randomBytes(32).toString("base64url");
}

// Hashes a refresh token before it is stored in database
export function hashRefreshToken(token:string):string{
    return createHash("sha256")
        .update(token)
        .digest("hex");
}