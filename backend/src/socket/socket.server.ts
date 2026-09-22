import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";

import { env } from "../config/env";
import { ACCESS_COOKIE_NAME } from "../modules/auth/auth.cookies";
import { verifyAccessToken } from "../modules/auth/auth.tokens";

type SocketAuthUser = {
  userId: number;
  role: string;
};

let socketServer: Server | null = null;

export function publishToUser(
  userId: number,
  event: string,
  payload: Record<string, unknown>,
): void {
  if (!socketServer) {
    return;
  }

  socketServer.to(`user:${userId}`).emit(event, payload);
}

export function initializeSocketServer(
  httpServer: HttpServer,
): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
    },
  });

  socketServer = io;

  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.request.headers.cookie;

      if (!cookieHeader) {
        return next(new Error("UNAUTHENTICATED"));
      }

      const accessCookie = cookieHeader
        .split(";")
        .map((cookie) => cookie.trim())
        .find((cookie) =>
          cookie.startsWith(`${ACCESS_COOKIE_NAME}=`),
        );

      if (!accessCookie) {
        return next(new Error("UNAUTHENTICATED"));
      }

      const token = decodeURIComponent(
        accessCookie.slice(ACCESS_COOKIE_NAME.length + 1),
      );

      const payload = await verifyAccessToken(token);

      socket.data.authUser = {
        userId: payload.userId,
        role: payload.role,
      } satisfies SocketAuthUser;

      return next();
    } catch {
      return next(new Error("UNAUTHENTICATED"));
    }
  });

  io.on("connection", (socket) => {
    const authUser = socket.data.authUser as SocketAuthUser;
    const userRoom = `user:${authUser.userId}`;

    void socket.join(userRoom);

    console.log(
      `[Socket] Connected: userId=${authUser.userId}, role=${authUser.role}`,
    );

    socket.on("disconnect", (reason) => {
      console.log(
        `[Socket] Disconnected: userId=${authUser.userId}, reason=${reason}`,
      );
    });
  });

  return io;
}