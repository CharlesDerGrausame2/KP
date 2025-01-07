import WebSocket, { WebSocketServer } from "ws";
import { ChatMessage, ConnectToServerMessage } from "./interface/Message";
import { randomUUID } from "crypto";
import { Connection } from "./interface/Connection";

// We export it here for the test
export function startWebServer(wss: WebSocketServer) {
  /**
   * Array of all active connections.
   * Each connection contains a WebSocket, a name and a roomkey.
   */
  const connections: Connection[] = [];

  /**
   * Handles all incoming WebSocket connections.
   *
   * When a client connects, a connection event is triggered.
   * The server listens for messages from the client and processes them according to the message type.
   *
   * Message Types:
   * - "createRoom": Creates a new room with a unique key, associates the client with this room,
   *   and sends the room key back to the client.
   * - "joinRoom": Attempts to join an existing room using the provided room key. If successful,
   *   the client is added to the room; otherwise, an error message is sent back to the client.
   * - "message": Broadcasts a chat message to all clients in the same room, except for the sender.
   *
   * @param {WebSocket} ws - The WebSocket connection for the client.
   */
  wss.on("connection", (ws) => {
    console.log("Ein Client hat sich verbunden.");

    // Listen for messages from the client
    ws.on("message", (message: ConnectToServerMessage | ChatMessage) => {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case "createRoom":
          // Create a new room and send the room key to the client
          const key = randomUUID();
          connections.push({ ws, name: data.name, roomKey: key });
          ws.send(JSON.stringify({ type: "roomKey", roomKey: key }));
          break;

        case "joinRoom":
          // Attempt to join an existing room
          if (
            connections.find(
              (connection) => connection.roomKey === data.roomKey
            )
          ) {
            connections.push({
              ws,
              name: data.name,
              roomKey: data.roomKey,
            });
          } else {
            // Send an error message if the room was not found
            ws.send(
              JSON.stringify({ type: "error", data: "Raum nicht gefunden" })
            );
          }
          break;

        case "message":
          // Find the connection that sent the message
          const sourceConnection = connections.find(
            (connection) => connection.ws === ws
          );

          // Filter out the connections that are in the same room as the sender except for the sender himself
          const connected = connections.filter(
            (connection) =>
              connection.roomKey === sourceConnection?.roomKey &&
              connection.ws !== ws
          );

          // Send the message to all filtered connections
          connected.forEach((c) => {
            if (c.ws.readyState === WebSocket.OPEN) {
              c.ws.send(
                JSON.stringify({
                  type: "message",
                  data: data.data,
                  name: sourceConnection?.name,
                })
              );
            }
          });
          break;

        default:
          break;
      }
    });

    /**
     * When a client disconnects, this event is fired.
     * It prints a message to the console and removes the connection from the array of active connections.
     */
    ws.on("close", () => {
      console.log("Ein Client hat die Verbindung getrennt.");
      connections.splice(
        connections.findIndex((connection) => connection.ws === ws)
      );
    });
  });

  console.log("WebSocket-Server läuft auf ws://localhost:" + wss.options.port);
}
