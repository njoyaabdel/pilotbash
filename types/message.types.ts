export type Role = 'user' | 'assistant' | 'tool';

export type MessageStatus = 'pending' | 'streaming' | 'complete' | 'error';

export interface BaseMessage {
  id: string;
  role: Role;
  timestamp: Date;
}

export interface UserMessage extends BaseMessage {
  role: 'user';
  content: string;
}

export interface AssistantMessage extends BaseMessage {
  role: 'assistant';
  content: string;
  status: MessageStatus;
  toolCalls?: ToolCallRecord[];
}

export interface ToolCallRecord {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
  result?: ToolResultRecord;
  status: 'pending' | 'running' | 'success' | 'error';
}

export interface ToolResultRecord {
  success: boolean;
  data?: unknown;
  error?: string;
  executedAt: Date;
  duration: number;
}

export type AppMessage = UserMessage | AssistantMessage;
