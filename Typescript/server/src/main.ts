import WebSocket, { WebSocketServer } from "ws";
import { MessageType } from "./enum/MessageType";
import { ChatMessage, ConnectToServerMessage } from "./interface/Message";
import { randomUUID } from "crypto";

const wss = new WebSocketServer({ port: 8080 });

interface Connection {
  ws: WebSocket;
  name: string;
  roomKey: string;
}

const connections: Connection[] = [];

wss.on("connection", (ws) => {
  console.log("Ein Client hat sich verbunden.");
  // Nachricht vom Client empfangen
  ws.on("message", (message: ConnectToServerMessage | ChatMessage) => {
    const data = JSON.parse(message.toString());

    switch (data.type) {
      case "createRoom":
        const key = randomUUID();
        connections.push({ ws, name: data.name, roomKey: key });
        ws.send(JSON.stringify({ type: "roomKey", roomKey: key }));
        break;

      case "joinRoom":
        if (
          connections.find((connection) => connection.roomKey === data.roomKey)
        ) {
          connections.push({
            ws,
            name: data.name,
            roomKey: data.roomKey,
          });
        } else {
          ws.send(
            JSON.stringify({ type: "error", data: "Raum nicht gefunden" })
          );
        }
        break;

      case "message":
        const sourceConnection = connections.find(
          (connection) => connection.ws === ws
        );

        const connected = connections.filter(
          (connection) =>
            connection.roomKey === sourceConnection?.roomKey &&
            connection.ws !== ws
        );
        console.log(sourceConnection);
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

  ws.on("close", () => {
    console.log("Ein Client hat die Verbindung getrennt.");
    connections.filter((connection) => connection.ws !== ws);
  });
});

console.log("WebSocket-Server läuft auf ws://localhost:8080");
