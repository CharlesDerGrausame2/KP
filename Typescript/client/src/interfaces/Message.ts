/**
 * Represents a message sent by the server to the client, containing the room key.
 */
export interface Connection {
  /**
   * The type of the message.
   */
  type: string;
  /**
   * The room key.
   */
  roomKey: string;
}

/**
 * Represents an error message sent by the server to the client.
 */
export interface Error {
  /**
   * The type of the message.
   */
  type: string;
  /**
   * The message data.
   */
  data: string;
}

/**
 * Represents a message sent by a client to the server.
 */
export interface Message {
  /**
   * The type of the message.
   */
  type: string;
  /**
   * The name of the user who sent the message.
   */
  name: string;
  /**
   * The message data.
   */
  data: string;
}
