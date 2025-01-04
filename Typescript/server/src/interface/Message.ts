import { MessageType } from "../enum/MessageType";

export interface ConnectToServerMessage {
  type: MessageType.CreateRoom | MessageType.JoinRoom;
  name: string;
  roomKey: string;
}

export interface ChatMessage {
  type: MessageType.Message;
  data: string;
}
