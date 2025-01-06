/**
 * Enum of message types that can be sent over the WebSocket connection.
 */
export enum MessageType {
  /**
   * Sent by the client to the server to join a room.
   */
  JoinRoom = "joinRoom",
  /**
   * Sent by the client to the server to create a new room.
   */
  CreateRoom = "createRoom",
  /**
   * Sent by the client to the server to send a message to other clients in the same room.
   */
  Message = "message",
}
