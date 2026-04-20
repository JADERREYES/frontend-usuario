import api from './api';
import type {
  ChatItem,
  ChatSessionResponse,
  MessageItem,
  UrgentNotificationItem,
} from '../types/chat';
import { apiConfig } from '../config/api';

const normalizeMessage = (
  message: Partial<MessageItem> & { type?: MessageItem['role'] } | null | undefined,
  fallbackRole: MessageItem['role'],
): MessageItem | null => {
  if (!message) {
    return null;
  }

  return {
    _id: message._id ?? message.id ?? undefined,
    id: message.id ?? message._id ?? undefined,
    chatId: String(message.chatId ?? ''),
    senderId: String(message.senderId ?? ''),
    role: (message.role ?? message.type ?? fallbackRole) as MessageItem['role'],
    content: String(message.content ?? ''),
    createdAt: message.createdAt,
    metadata: message.metadata ?? {},
  };
};

const normalizeChat = (chat: ChatItem | null | undefined): ChatItem | null => {
  if (!chat) {
    return null;
  }

  return {
    ...chat,
    _id: chat._id ?? chat.id,
    id: chat.id ?? chat._id,
  };
};

export const chatService = {
  getChats: async (): Promise<ChatItem[]> => {
    const response = await api.get(apiConfig.endpoints.chats.list);
    return response.data;
  },

  getChat: async (id: string): Promise<ChatItem> => {
    const response = await api.get(apiConfig.endpoints.chats.item(id));
    return response.data;
  },

  createChat: async (payload: { title: string; status?: string }): Promise<ChatItem> => {
    const response = await api.post(apiConfig.endpoints.chats.create, payload);
    return response.data;
  },

  getMessages: async (chatId: string): Promise<MessageItem[]> => {
    const response = await api.get(apiConfig.endpoints.messages.byChat(chatId));
    return (response.data ?? [])
      .map((item: Partial<MessageItem> & { type?: MessageItem['role'] }) =>
        normalizeMessage(item, item.role ?? item.type ?? 'assistant'),
      )
      .filter(Boolean) as MessageItem[];
  },

  sendMessage: async (payload: {
    chatId: string;
    senderId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
  }): Promise<MessageItem> => {
    const response = await api.post(apiConfig.endpoints.messages.create, payload);
    return response.data;
  },

  askAi: async (message: string) => {
    const response = await api.post(apiConfig.endpoints.ai.chat, { message });
    return response.data;
  },

  sendSessionMessage: async (payload: {
    message: string;
    chatId?: string;
    title?: string;
  }): Promise<ChatSessionResponse> => {
    const response = await api.post(apiConfig.endpoints.ai.chatSession, payload, {
      timeout: 45000,
    });
    const data = response.data as ChatSessionResponse;

    return {
      ...data,
      chat: normalizeChat(data.chat ?? null),
      chatId: data.chatId ?? data.chat?._id ?? data.chat?.id ?? null,
      userMessage: normalizeMessage(
        data.userMessage as Partial<MessageItem> & { type?: MessageItem['role'] },
        'user',
      ),
      assistantMessage: normalizeMessage(
        data.assistantMessage as Partial<MessageItem> & { type?: MessageItem['role'] },
        'assistant',
      ),
      sources: Array.isArray(data.sources) ? data.sources : [],
    };
  },

  getUrgentNotifications: async (): Promise<UrgentNotificationItem[]> => {
    const response = await api.get(apiConfig.endpoints.messages.urgentNotifications);
    return (Array.isArray(response.data) ? response.data : []).map(
      (item: Partial<MessageItem> & { type?: MessageItem['role'] }) => ({
        _id: item._id ?? item.id ?? undefined,
        id: item.id ?? item._id ?? undefined,
        chatId: String(item.chatId ?? ''),
        content: String(item.content ?? ''),
        createdAt: item.createdAt,
        metadata: item.metadata ?? {},
      }),
    );
  },

  markUrgentNotificationsRead: async (chatId?: string) => {
    const response = await api.post(
      apiConfig.endpoints.messages.markUrgentNotificationsRead,
      {
        chatId,
      },
    );
    return response.data;
  },
};
