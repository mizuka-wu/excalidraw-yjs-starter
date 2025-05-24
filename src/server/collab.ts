import { Server } from "socket.io";
import { YSocketIO } from "y-socket.io/dist/server";
import type { createServer } from "http";

export function createServer(server: ReturnType<typeof createServer>) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
  /**
   * @see https://github.com/ivan-topp/y-socket.io?tab=readme-ov-file#server-api
   */
  new YSocketIO(io);
}
