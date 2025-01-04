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
    switch (message.type) {
      case MessageType.CreateRoom:
        connections.push({ ws, name: message.name, roomKey: randomUUID() });
        break;
      case MessageType.JoinRoom:
        if (
          connections.find(
            (connection) => connection.roomKey === message.roomKey
          )
        ) {
          connections.push({
            ws,
            name: message.name,
            roomKey: message.roomKey,
          });
        } else {
          ws.send(
            JSON.stringify({ type: "error", data: "Raum nicht gefunden" })
          );
        }
        break;
      case MessageType.Message:
        console.log(`Nachricht erhalten: ${message}`);

        const data = JSON.parse(message.toString());

        // Nachricht an alle anderen Clients weiterleiten
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "message", data: data.data }));
          }
        });
        break;
    }
  });

  ws.on("close", () => {
    console.log("Ein Client hat die Verbindung getrennt.");
    connections.filter((connection) => connection.ws !== ws);
  });
});

console.log("WebSocket-Server läuft auf ws://localhost:8080");
