export interface Connection {
  type: string;
  roomKey: string;
}

export interface Error {
  type: string;
  data: string;
}

export interface Message {
  type: string;
  name: string;
  data: string;
}
