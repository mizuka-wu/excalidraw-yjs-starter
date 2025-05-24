import { Server } from "socket.io";
import { YSocketIO } from "y-socket.io/dist/server";
import * as http from "http";

export function createServer(server: ReturnType<typeof http.createServer>) {
  const io = new Server(server);
  /**
   * @see https://github.com/ivan-topp/y-socket.io?tab=readme-ov-file#server-api
   */
  const ySocketIOServer = new YSocketIO(io);
  ySocketIOServer.initialize();
}
