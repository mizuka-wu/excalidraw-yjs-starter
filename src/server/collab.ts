import { Server } from "socket.io";
import { YSocketIO } from "y-socket.io/dist/server";
import type { createServer as httpCreateServer } from "http";

export function createServer(server: ReturnType<typeof httpCreateServer>) {
  const io = new Server(server);
  /**
   * @see https://github.com/ivan-topp/y-socket.io?tab=readme-ov-file#server-api
   */
  const ySocketIOServer = new YSocketIO(io);
  ySocketIOServer.initialize();
}
