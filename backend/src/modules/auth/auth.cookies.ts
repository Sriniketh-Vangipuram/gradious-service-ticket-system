import type { CookieOptions } from "express";
import {env} from "../../config/env";

const isProduction = env.NODE_ENV==="production";

export const ACCESS_COOKIE_NAME="gsts_access";
export const REFRESH_COOKIE_NAME="gsts_refresh";


const sharedCookieOptions:CookieOptions={
    httpOnly:true,
    secure:isProduction,
    sameSite:isProduction?"none":"lax"
};

export const accessCookieOptions:CookieOptions={
    ...sharedCookieOptions,
    path:"/",
    maxAge:15 * 60 * 1000
};

export const refreshCookieOptions:CookieOptions={
    ...sharedCookieOptions,
    path:"/api/v1/auth",
    maxAge: 7 *24 * 60 * 60 *1000
};

// clear cookies using same path and security attributes used when setting them

export const clearAccessCookiesOptions: CookieOptions={
    ...sharedCookieOptions,
    path:accessCookieOptions.path
};

export const clearRefreshCookieOptions:CookieOptions={
    ...sharedCookieOptions,
    path:refreshCookieOptions.path
};