'use client';

import type { Message } from '@ai-sdk/react';
import { MessageBubble } from './MessageBubble';
import { StreamingIndicator } from './StreamingIndicator';
import { useAutoScroll } from '@/hooks/useAutoScroll';

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const scrollRef = useAutoScroll<HTMLDivElement>(messages);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: 'var(--accent-dim)', border: '1px solid rgba(99,102,241,0.2)' }}
        >
          🖥️
        </div>
        <div>
          <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text)' }}>
            AI Bash Assistant
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Dites-moi ce que vous voulez faire avec vos fichiers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center mt-2">
          {[
            'Liste mes fichiers',
            'Quel est mon dossier actuel ?',
            'Crée un dossier Test',
            'Lis le fichier README.md',
          ].map((suggestion) => (
            <span
              key={suggestion}
              className="px-3 py-1.5 rounded-lg text-xs cursor-default"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              {suggestion}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-6 space-y-6"
      aria-live="polite"
      aria-label="Conversation"
    >
      {messages.map((message, i) => (
        <MessageBubble
          key={message.id}
          message={message}
          isStreaming={isStreaming && i === messages.length - 1 && message.role === 'assistant'}
        />
      ))}
      {isStreaming && (
        <div className="pl-11">
          <StreamingIndicator />
        </div>
      )}
    </div>
  );
}
