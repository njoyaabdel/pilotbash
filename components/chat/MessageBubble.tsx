'use client';

import type { Message } from '@ai-sdk/react';
import { Avatar } from '@/components/ui/Avatar';
import { ToolCallCard } from '@/components/tools/ToolCallCard';
import { ToolResultCard } from '@/components/tools/ToolResultCard';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 animate-fadein ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar role={isUser ? 'user' : 'assistant'} />

      <div className={`flex flex-col gap-2 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Tool calls and results */}
        {message.parts && message.parts.length > 0 && (
          <div className="w-full space-y-2">
            {message.parts.map((part, i) => {
              if (part.type === 'tool-invocation') {
                const inv = part.toolInvocation;
                if (inv.state === 'call' || inv.state === 'partial-call') {
                  return (
                    <ToolCallCard
                      key={i}
                      toolName={inv.toolName}
                      args={inv.args ?? {}}
                    />
                  );
                }
                if (inv.state === 'result') {
                  const res = inv.result as {
                    success?: boolean;
                    data?: unknown;
                    error?: string;
                    duration?: number;
                  };
                  return (
                    <div key={i} className="space-y-1">
                      <ToolCallCard toolName={inv.toolName} args={inv.args ?? {}} />
                      <ToolResultCard
                        toolName={inv.toolName}
                        result={res?.data ?? res?.error}
                        success={res?.success ?? false}
                        duration={res?.duration}
                      />
                    </div>
                  );
                }
              }
              return null;
            })}
          </div>
        )}

        {/* Text content */}
        {message.content && (
          <div
            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              isUser
                ? 'rounded-tr-sm'
                : 'rounded-tl-sm'
            } ${isStreaming ? 'streaming-cursor' : ''}`}
            style={{
              background: isUser ? 'var(--user-bubble)' : 'var(--surface)',
              border: `1px solid ${isUser ? 'var(--border)' : 'var(--border)'}`,
              color: 'var(--text)',
              maxWidth: '100%',
            }}
          >
            {message.content}
          </div>
        )}
      </div>
    </div>
  );
}
