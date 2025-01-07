import WebSocket, { WebSocketServer } from "ws";
import { randomUUID } from "crypto";

import { startWebServer } from "../src/startWebServer";

let client1: WebSocket, client2: WebSocket, client3: WebSocket;
let server: WebSocketServer;

/**
 * Before all tests, a new WebSocket server is created and the startWebServer function is called.
 * After all tests, the server is closed.
 */
beforeAll(() => {
  if (server === undefined) {
    server = new WebSocketServer({ port: 8080 });
    startWebServer(server);
  }
});

afterAll((done) => {
  server.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.close();
    }
  });

  server.close();
  setTimeout(() => {
    done();
  }, 1000);
});

/**
 * Before each test, three new WebSocket clients are created.
 * After each test, all WebSocket clients are closed.
 */
beforeEach(() => {
  // Initialisiert WebSocket-Clients vor jedem Test
  client1 = new WebSocket("ws://localhost:8080");
  client2 = new WebSocket("ws://localhost:8080");
  client3 = new WebSocket("ws://localhost:8080");
});

afterEach(() => {
  if (client1.readyState === WebSocket.OPEN) {
    client1.close();
  }
  if (client2.readyState === WebSocket.OPEN) {
    client2.close();
  }
  if (client3.readyState === WebSocket.OPEN) {
    client3.close();
  }
});

/**
 * Sends a message to the server to create a room and checks that the server responds with the room key.
 */
test("should create a room and return the room key", (done) => {
  client1.on("open", () => {
    client1.send(JSON.stringify({ type: "createRoom", name: "Client1" }));
  });

  client1.on("message", (data: WebSocket.Data) => {
    const response = JSON.parse(data.toString());
    expect(response.type).toBe("roomKey");
    expect(response.roomKey).toBeDefined();
    done();
  });
});

/**
 * Client1 creates a room and gets the room key.
 * Client2 tries to join the room using the room key.
 * Checks that client2 successfully joins the room.
 */
test("should join an existing room", (done) => {
  client1.on("open", () => {
    client1.send(JSON.stringify({ type: "createRoom", name: "Client1" }));
  });
  client1.on("message", (data: WebSocket.Data) => {
    const response = JSON.parse(data.toString());
    const roomKey = response.roomKey;
    // Client2 versucht, dem Raum beizutreten
    setTimeout(() => {
      client2.send(
        JSON.stringify({ type: "joinRoom", name: "Client2", roomKey: roomKey })
      );
    }, 1000);
    setTimeout(() => {
      client1.send(JSON.stringify({ type: "message", data: "test" }));
    }, 1000);
  });
  client2.on("message", (joinResponse: WebSocket.Data) => {
    const joinData = JSON.parse(joinResponse.toString());
    expect(joinData.type).not.toBe("error");
    done();
  });
});

/**
 * Client1 creates a room and sends a message to all clients in the same room.
 * Client2 and client3 join the room.
 * Checks that both clients receive the message.
 */
test("should send a message to all clients in the same room", (done) => {
  client1.on("open", () => {
    client1.send(JSON.stringify({ type: "createRoom", name: "Client1" }));
  });

  client1.on("message", (data: WebSocket.Data) => {
    const response = JSON.parse(data.toString());
    const roomKey = response.roomKey;

    setTimeout(() => {
      // Clients 2 and 3 join the room
      client2.send(
        JSON.stringify({
          type: "joinRoom",
          name: "Client2",
          roomKey: roomKey,
        })
      );
    }, 1000);

    setTimeout(() => {
      client3.send(
        JSON.stringify({
          type: "joinRoom",
          name: "Client3",
          roomKey: roomKey,
        })
      );
    }, 1000);

    setTimeout(() => {
      // After both clients joined the room, Client1 sends a message
      client1.send(JSON.stringify({ type: "message", data: "test" }));
    }, 1000);
  });

  // Checks that both clients receive the message
  let messageCount = 0;

  client2.on("message", (message: WebSocket.Data) => {
    const msg = JSON.parse(message.toString());
    expect(msg.data).toBe("test");
    expect(msg.name).toBe("Client1");
    messageCount++;
    if (messageCount === 2) done();
  });

  client3.on("message", (message: WebSocket.Data) => {
    const msg = JSON.parse(message.toString());
    expect(msg.data).toBe("test");
    expect(msg.name).toBe("Client1");
    messageCount++;
    if (messageCount === 2) done();
  });
}, 10000);

/**
 * Client2 tries to join a non-existent room.
 * Checks that the server responds with an error message.
 */
test("should not allow joining a non-existent room", (done) => {
  client2.on("open", () => {
    const nonExistentRoomKey = randomUUID();
    client2.send(
      JSON.stringify({
        type: "joinRoom",
        name: "Client2",
        roomKey: nonExistentRoomKey,
      })
    );
  });

  client2.on("message", (data: WebSocket.Data) => {
    const response = JSON.parse(data.toString());
    expect(response.type).toBe("error");
    expect(response.data).toBe("Raum nicht gefunden");
    done();
  });
});
