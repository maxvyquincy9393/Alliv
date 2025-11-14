export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

export interface ChatRoom {
  id: string;
  matchId: string;
  messages: Message[];
  typing?: boolean;
}
