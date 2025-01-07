import WebSocket, { WebSocketServer } from "ws";
import { startWebServer } from "./startWebServer";

/**
 * This is the main file of the WebSocket server.
 * It creates a WebSocket server that listens on port 8080.
 */
function main() {
  const wss = new WebSocketServer({ port: 8080 });
  startWebServer(wss);
}

main();
