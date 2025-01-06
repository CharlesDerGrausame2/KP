import { MessageType } from "../enum/MessageType";

/**
 * A message sent by a client to the server.
 */
export interface ConnectToServerMessage {
  /**
   * The possible types of the message.
   */
  type: MessageType.CreateRoom | MessageType.JoinRoom;
  /**
   * The user's name.
   */
  name: string;
  /**
   * The key of the room the user wants to join.
   * Only used for MessageType.JoinRoom.
   */
  roomKey: string;
}

/**
 * A message sent by a client to the server, containing the message to be sent to other clients in the same room.
 */
export interface ChatMessage {
  /**
   * The type of the message.
   */
  type: MessageType.Message;
  /**
   * The message to be sent to other clients in the same room.
   */
  data: string;
}
