export type ChatItem = {
  _id?: string;
  id?: string;
  title: string;
  status?: string;
  messageCount?: number;
  lastMessageAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type MessageItem = {
  _id?: string;
  id?: string;
  chatId: string;
  senderId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
};

export type ChatSource = {
  documentTitle: string;
  excerpt: string;
  score?: number;
};

export type ChatSessionResponse = {
  success?: boolean;
  chat?: ChatItem | null;
  chatId?: string | null;
  userMessage?: MessageItem | null;
  assistantMessage?: MessageItem | null;
  response?: string;
  contextUsed?: boolean;
  retrievalMode?: 'semantic' | 'keyword' | 'none';
  sources?: ChatSource[];
  remaining?: number;
};
