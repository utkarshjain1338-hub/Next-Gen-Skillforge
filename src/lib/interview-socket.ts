import { io, type Socket } from "socket.io-client";

/**
 * Socket.IO client for the interview server (examples/websocket/server.ts).
 * - Local dev: connects to port 3003 with path `/` (matches the example server).
 * - Same-origin deployments: use NEXT_PUBLIC_INTERVIEW_WS_URL or the XTransformPort query pattern.
 */
export function createInterviewSocket(): Socket {
  const explicit = process.env.NEXT_PUBLIC_INTERVIEW_WS_URL;
  if (explicit && explicit.length > 0) {
    return io(explicit, {
      path: "/",
      transports: ["websocket", "polling"],
      reconnection: true,
      timeout: 15000,
    });
  }
  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return io(`http://${hostname}:3003`, {
        path: "/",
        transports: ["websocket", "polling"],
        reconnection: true,
        timeout: 15000,
      });
    }
    return io("/?XTransformPort=3003", {
      path: "/",
      transports: ["websocket", "polling"],
      reconnection: true,
      timeout: 15000,
    });
  }
  return io("http://127.0.0.1:3003", {
    path: "/",
    transports: ["websocket", "polling"],
    reconnection: true,
    timeout: 15000,
  });
}
