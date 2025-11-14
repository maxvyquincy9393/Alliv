import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatBubble } from '../ChatBubble';
import type { Message } from '../../types/message';

const baseMessage: Message = {
  id: '1',
  senderId: 'user-1',
  receiverId: 'user-2',
  content: 'hello',
  timestamp: new Date(),
  read: false,
};

describe('ChatBubble', () => {
  it('sanitizes message content', () => {
    render(
      <ChatBubble
        message={{ ...baseMessage, content: '<img src=x onerror=alert(1)>Nice to meet you' }}
        isOwn={false}
      />,
    );

    expect(screen.getByText('Nice to meet you')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

