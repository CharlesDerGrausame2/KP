import WebSocket from "ws";

/**
 * Represents a client's connection in the WebSocket server.
 */
export interface Connection {
  /**
   * The WebSocket connection associated with the client.
   */
  ws: WebSocket;

  /**
   * The name of the client.
   */
  name: string;

  /**
   * The unique key of the room the client has joined.
   */
  roomKey: string;
}
