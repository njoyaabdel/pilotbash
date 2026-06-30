'use client';

import { useChat } from '@ai-sdk/react';
import type { ChatStatus } from './chat.types';

export function useChatController() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, stop, reload } =
    useChat({
      api: '/api/chat',
      onError: (err) => {
        console.error('[useChatController] Stream error:', err);
      },
    });

  const status: ChatStatus = isLoading ? 'streaming' : error ? 'error' : 'idle';

  return {
    messages,
    input,
    status,
    error: error?.message ?? null,
    isLoading,
    handleInputChange,
    handleSubmit,
    stop,
    reload,
  };
}
