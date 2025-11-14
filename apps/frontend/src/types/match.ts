import { User } from './user';

export interface Match {
  id: string;
  user: User;
  matchedAt: Date;
  lastMessage?: string;
  unreadCount?: number;
}

export type SwipeDirection = 'left' | 'right' | 'up';

export interface SwipeAction {
  userId: string;
  direction: SwipeDirection;
}
