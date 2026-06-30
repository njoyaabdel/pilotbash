'use client';

import { MessageList } from './MessageList';
import { InputBar } from './InputBar';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useChatController } from '@/features/chat/useChatController';

export function ChatContainer() {
  const { messages, input, status, error, isLoading, handleInputChange, handleSubmit, stop } =
    useChatController();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header
        className="flex items-center gap-3 px-6 py-4 border-b shrink-0"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}
        >
          $
        </div>
        <div>
          <h1 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            AI Bash Assistant
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {status === 'streaming' ? 'Génération en cours…' : 'Prêt'}
          </p>
        </div>

        {/* Status dot */}
        <div className="ml-auto flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background:
                status === 'streaming'
                  ? 'var(--accent)'
                  : status === 'error'
                  ? 'var(--error)'
                  : 'var(--success)',
              boxShadow:
                status === 'streaming' ? '0 0 6px var(--accent)' : undefined,
            }}
          />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {status === 'streaming' ? 'streaming' : status === 'error' ? 'error' : 'idle'}
          </span>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 shrink-0">
          <ErrorBanner message={error} />
        </div>
      )}

      {/* Messages */}
      <MessageList messages={messages} isStreaming={isLoading} />

      {/* Input */}
      <InputBar
        value={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        onStop={stop}
      />
    </div>
  );
}
