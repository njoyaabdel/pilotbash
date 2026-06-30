export type ChatStatus = 'idle' | 'loading' | 'streaming' | 'error';

export interface ChatState {
  status: ChatStatus;
  error: string | null;
}

export interface SendMessageOptions {
  content: string;
}
