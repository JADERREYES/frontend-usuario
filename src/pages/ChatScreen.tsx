import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  LoaderCircle,
  MessageCircleHeart,
  SendHorizonal,
  Sparkles,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { useSilentPolling } from '../hooks/useSilentPolling';
import { chatService } from '../services/chat.service';
import type { ChatItem, MessageItem } from '../types/chat';
import { apiConfig } from '../config/api';

const starters = [
  'Necesito bajar un poco la ansiedad',
  'Ayudame a respirar dos minutos',
  'Quiero ordenar lo que senti hoy',
];

const resolveVisualRoles = (items: MessageItem[]) => {
  let lastVisualRole: MessageItem['role'] | null = null;

  return items.map((message) => {
    const hasExplicitAssistantRole =
      message.role === 'assistant' ||
      message.role === 'system' ||
      Boolean(message.metadata?.pending);

    const visualRole =
      hasExplicitAssistantRole || (message.role === 'user' && lastVisualRole === 'user')
        ? 'assistant'
        : 'user';

    lastVisualRole = visualRole;

    return {
      ...message,
      visualRole,
    };
  });
};

const buildLocalMessage = (
  id: string,
  role: MessageItem['role'],
  content: string,
  chatId: string,
  pending = false,
): MessageItem => ({
  _id: id,
  id,
  chatId,
  senderId: 'local',
  role,
  content,
  createdAt: new Date().toISOString(),
  metadata: pending ? { pending: true } : {},
});

const getChatErrorMessage = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return 'No pudimos enviar tu mensaje. Intenta otra vez.';
  }

  if (error.code === 'ERR_NETWORK') {
    return `No pudimos conectar con el servidor. Verifica que backend-core este corriendo en ${apiConfig.baseURL}.`;
  }

  if (error.code === 'ECONNABORTED') {
    return 'La respuesta esta tardando mas de lo esperado. Intenta nuevamente en unos segundos.';
  }

  if (error.response?.status === 401) {
    return 'Tu sesion ya no es valida. Cierra sesion e ingresa nuevamente.';
  }

  if (error.response?.status === 429) {
    return 'Alcanzaste el limite temporal de mensajes. Espera un momento antes de volver a intentar.';
  }

  if (typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }

  return 'No pudimos enviar tu mensaje. Intenta otra vez.';
};

const isNearBottom = (element: HTMLDivElement | null) => {
  if (!element) {
    return true;
  }

  const distanceFromBottom =
    element.scrollHeight - element.scrollTop - element.clientHeight;
  return distanceFromBottom < 112;
};

const getMessageKey = (message: MessageItem) => message._id ?? message.id ?? '';

const dedupeMessages = (items: MessageItem[]) => {
  const seen = new Set<string>();
  const result: MessageItem[] = [];

  items.forEach((item) => {
    const key = getMessageKey(item);
    if (!key || seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push(item);
  });

  return result;
};

const getMessagesSignature = (items: MessageItem[]) =>
  items
    .map((item) => {
      const key = getMessageKey(item);
      const pending = item.metadata?.pending ? '1' : '0';
      return `${key}:${item.content}:${pending}`;
    })
    .join('|');

const shouldAutoScroll = ({
  origin,
  isAtBottom,
  isComposerFocused,
  forceScroll,
}: {
  origin: 'initial' | 'poll' | 'submit';
  isAtBottom: boolean;
  isComposerFocused: boolean;
  forceScroll?: boolean;
}) => {
  if (origin === 'initial' || forceScroll) {
    return true;
  }

  if (isComposerFocused) {
    return false;
  }

  return isAtBottom;
};

const debugMessageLength = (label: string, content: string) => {
  if (!import.meta.env.DEV) {
    return;
  }

  console.debug(`[chat-length] ${label}`, { length: content.length });
};

export function ChatScreen() {
  const [searchParams] = useSearchParams();
  const requestedChatId = searchParams.get('chatId');
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [isComposerFocused, setIsComposerFocused] = useState(false);
  const [initializedChatId, setInitializedChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);
  const shouldForceScrollRef = useRef(false);
  const messagesSignatureRef = useRef('');
  const messagesLengthRef = useRef(0);

  const loadChats = useCallback(async () => {
    try {
      const data = await chatService.getChats();
      setChats(data);
      setError('');

      if (requestedChatId) {
        setActiveChatId(requestedChatId);
        return;
      }

      if (!activeChatId) {
        const firstId = data[0]?._id ?? data[0]?.id ?? null;
        if (firstId) {
          setActiveChatId(firstId);
        }
      }
    } catch {
      setError('No pudimos cargar tus conversaciones por ahora.');
    }
  }, [activeChatId, requestedChatId]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({
      behavior,
      block: 'end',
    });
  };

  const loadMessages = useCallback(async (
    chatId: string,
    origin: 'initial' | 'poll' | 'submit' = 'poll',
  ) => {
    try {
      const data = dedupeMessages(await chatService.getMessages(chatId));
      const shouldStickToBottom = shouldAutoScroll({
        origin,
        isAtBottom: isNearBottom(messagesScrollRef.current),
        isComposerFocused,
        forceScroll: shouldForceScrollRef.current,
      });
      const nextSignature = getMessagesSignature(data);
      const previousLength = messagesLengthRef.current;

      if (messagesSignatureRef.current === nextSignature) {
        return;
      }

      messagesSignatureRef.current = nextSignature;

      setMessages((current) => {
        if (getMessagesSignature(current) === nextSignature) {
          return current;
        }

        const hasServerGrowth = data.length > current.length;
        if (origin === 'poll' && hasServerGrowth && !shouldStickToBottom) {
          setHasUnreadMessages(true);
        }

        if (import.meta.env.DEV && data.length > 0) {
          debugMessageLength('frontend-received-last-message', data[data.length - 1].content);
        }

        return data;
      });

      setError('');

      if (origin === 'initial' || shouldStickToBottom) {
        window.requestAnimationFrame(() =>
          scrollToBottom(origin === 'initial' ? 'auto' : 'smooth'),
        );
        setHasUnreadMessages(false);
      }

      if (origin === 'submit' || data.length > previousLength) {
        shouldForceScrollRef.current = false;
      }
    } catch {
      setError('No pudimos abrir esta conversacion.');
    }
  }, [isComposerFocused]);

  useEffect(() => {
    void loadChats();
  }, [loadChats]);

  useEffect(() => {
    messagesLengthRef.current = messages.length;
  }, [messages.length]);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      setInitializedChatId(null);
      messagesSignatureRef.current = '';
      messagesLengthRef.current = 0;
      return;
    }

    void chatService.markUrgentNotificationsRead(activeChatId);
    setHasUnreadMessages(false);
    setInitializedChatId(activeChatId);
    void loadMessages(activeChatId, 'initial');
  }, [activeChatId, loadMessages]);

  useSilentPolling(
    () => {
      if (!activeChatId || loading) {
        return;
      }

      void loadMessages(activeChatId, 'poll');
    },
    {
      enabled: Boolean(activeChatId),
      intervalMs: 10000,
      runOnMount: false,
      pauseWhen: isComposerFocused || loading,
    },
  );

  useSilentPolling(loadChats, {
    intervalMs: 30000,
    runOnMount: false,
  });

  const activeChat = useMemo(
    () => chats.find((chat) => chat._id === activeChatId || chat.id === activeChatId) ?? null,
    [activeChatId, chats],
  );
  const visualMessages = useMemo(() => resolveVisualRoles(messages), [messages]);

  const submitMessage = async (content: string) => {
    const clean = content.trim();
    if (!clean) {
      return;
    }

    setLoading(true);
    setError('');
    setInput('');
    shouldForceScrollRef.current = true;

    const fallbackChatId = activeChatId ?? `draft-${Date.now()}`;
    const optimisticUserMessage = buildLocalMessage(
      `local-user-${Date.now()}`,
      'user',
      clean,
      fallbackChatId,
    );
    const optimisticAssistantMessage = buildLocalMessage(
      `local-assistant-${Date.now()}`,
      'assistant',
      'Estoy contigo un momento...',
      fallbackChatId,
      true,
    );

    setMessages((current) => {
      const nextItems = dedupeMessages([
        ...current,
        optimisticUserMessage,
        optimisticAssistantMessage,
      ]);
      messagesSignatureRef.current = getMessagesSignature(nextItems);
      return nextItems;
    });
    window.requestAnimationFrame(() => scrollToBottom('smooth'));

    try {
      const result = await chatService.sendSessionMessage({
        message: clean,
        chatId: activeChatId ?? undefined,
        title: activeChat?.title ?? clean.slice(0, 48),
      });

      if (result.chatId) {
        setActiveChatId(result.chatId);
      }

      if (result.chat) {
        setChats((current) => {
          const filtered = current.filter(
            (chat) => (chat._id ?? chat.id) !== (result.chat?._id ?? result.chat?.id),
          );
          return result.chat ? [result.chat, ...filtered] : filtered;
        });
      }

      setMessages((current) => {
        const withoutPending = current.filter(
          (message) =>
            message._id !== optimisticUserMessage._id &&
            message._id !== optimisticAssistantMessage._id,
        );

        if (result.userMessage && result.assistantMessage) {
          debugMessageLength('frontend-user-saved', result.userMessage.content);
          debugMessageLength('frontend-assistant-saved', result.assistantMessage.content);
          const nextItems = dedupeMessages([
            ...withoutPending,
            result.userMessage,
            result.assistantMessage,
          ]);
          messagesSignatureRef.current = getMessagesSignature(nextItems);
          return nextItems;
        }

        if (result.response) {
          debugMessageLength('frontend-assistant-fallback', result.response);
          const nextItems = dedupeMessages([
            ...withoutPending,
            optimisticUserMessage,
            buildLocalMessage(
              `server-fallback-${Date.now()}`,
              'assistant',
              result.response,
              result.chatId ?? fallbackChatId,
            ),
          ]);
          messagesSignatureRef.current = getMessagesSignature(nextItems);
          return nextItems;
        }

        messagesSignatureRef.current = getMessagesSignature(withoutPending);
        return withoutPending;
      });
      setHasUnreadMessages(false);
      window.requestAnimationFrame(() => scrollToBottom('smooth'));
      if (result.chatId) {
        void loadMessages(result.chatId, 'submit');
      }

    } catch (requestError) {
      setMessages((current) => {
        const nextItems = current.filter(
          (message) =>
            message._id !== optimisticUserMessage._id &&
            message._id !== optimisticAssistantMessage._id,
        );
        messagesSignatureRef.current = getMessagesSignature(nextItems);
        return nextItems;
      });
      setInput(clean);
      setError(getChatErrorMessage(requestError));
    } finally {
      shouldForceScrollRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 pb-[calc(var(--chat-composer-height)+var(--bottom-nav-height)+2rem+env(safe-area-inset-bottom))]">
      <GlassCard className="aurora-panel premium-card overflow-hidden rounded-[32px] border border-white/55 px-5 py-5 shadow-[0_28px_66px_rgba(92,57,160,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/84 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-royal)]">
              <Sparkles size={12} />
              Chat principal
            </div>
            <p className="mt-3 text-[24px] font-semibold tracking-[-0.05em] text-[var(--text-main)]">
              {activeChat?.title ?? 'Nueva conversacion'}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
              Menos dispersion, mas cercania visual y un espacio que invita a seguir hablando.
            </p>
          </div>
          <div className="rounded-[22px] bg-[linear-gradient(135deg,#6a4dff,#ff996d)] p-3 text-white shadow-[0_20px_34px_rgba(111,77,176,0.22)]">
            <MessageCircleHeart size={18} />
          </div>
        </div>
      </GlassCard>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {chats.slice(0, 6).map((chat) => {
          const id = chat._id ?? chat.id ?? '';
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveChatId(id)}
              className={`whitespace-nowrap rounded-full px-3 py-2 text-xs ${
                activeChatId === id
                  ? 'bg-[var(--gradient-cool)] text-white shadow-[0_18px_28px_rgba(96,82,214,0.2)]'
                  : 'bg-white/82 text-[var(--text-soft)] shadow-[0_8px_18px_rgba(116,83,173,0.08)]'
              }`}
            >
              {chat.title}
            </button>
          );
        })}
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[30px] border border-white/55 bg-[linear-gradient(180deg,rgba(249,245,255,0.92),rgba(255,249,245,0.86),rgba(239,249,255,0.9))] px-3 py-3 shadow-[0_24px_60px_rgba(105,70,163,0.14)]">
        <div className="pointer-events-none absolute -left-10 top-0 h-28 w-28 rounded-full bg-[rgba(147,111,255,0.24)] blur-3xl" />
        <div className="pointer-events-none absolute -right-8 bottom-8 h-28 w-28 rounded-full bg-[rgba(255,171,123,0.22)] blur-3xl" />

        <div
          ref={messagesScrollRef}
          className="relative flex-1 space-y-3.5 overflow-y-auto overscroll-contain pb-[calc(var(--chat-composer-height)+2.25rem)] pr-1"
          onScroll={() => {
            const nextIsAtBottom = isNearBottom(messagesScrollRef.current);
            if (nextIsAtBottom) {
              setHasUnreadMessages(false);
            }
          }}
        >
          {messages.length === 0 ? (
            <GlassCard className="premium-card rounded-[24px] border border-white/55 px-4 py-4">
              <p className="text-sm leading-6 text-[var(--text-muted)]">
                Empieza con una frase corta o usa uno de los accesos rapidos para que el chat tome forma.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {starters.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => void submitMessage(starter)}
                    disabled={loading}
                    className="rounded-full bg-white/82 px-3 py-2 text-xs text-[var(--text-soft)] disabled:opacity-50"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </GlassCard>
          ) : null}

          {visualMessages.map((message) => {
            const isUserMessage = message.visualRole === 'user';
            const isPending = Boolean(message.metadata?.pending);
            const authorLabel = isUserMessage ? 'Tu' : 'MenteAmiga';

            return (
              <div
                key={message._id ?? message.id}
                className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex max-w-[86%] flex-col space-y-1.5 sm:max-w-[82%] ${
                    isUserMessage ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`px-1 text-[11px] font-semibold tracking-[0.12em] ${
                      isUserMessage
                        ? 'text-right uppercase text-[rgba(127,63,40,0.88)]'
                        : 'uppercase text-[rgba(87,70,171,0.92)]'
                    }`}
                  >
                    {authorLabel}
                  </div>
                  <div
                    className={`px-4 py-3 text-sm leading-6 shadow-sm ${
                      isUserMessage
                        ? 'rounded-[24px] rounded-br-[8px] bg-[linear-gradient(135deg,#d95646_0%,#ff8f67_62%,#ffb15f_100%)] text-white shadow-[0_16px_30px_rgba(217,86,70,0.28)]'
                        : 'rounded-[24px] rounded-bl-[8px] border border-[rgba(78,98,214,0.22)] bg-[linear-gradient(135deg,rgba(229,236,255,0.98)_0%,rgba(215,245,255,0.96)_50%,rgba(245,240,255,0.96)_100%)] text-[var(--text-main)] shadow-[0_16px_30px_rgba(77,97,182,0.16)]'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {isPending ? (
                        <LoaderCircle
                          size={14}
                          className="mt-1 shrink-0 animate-spin text-[var(--brand-deep)]"
                        />
                      ) : null}
                      <span className="whitespace-pre-wrap break-words">{message.content}</span>
                    </div>
                    {!isUserMessage && isPending ? (
                      <div className="mt-2 text-[11px] font-medium text-[var(--text-soft)]">
                        Preparando respuesta...
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {error ? <p className="text-sm text-rose-500">{error}</p> : null}

      {hasUnreadMessages && initializedChatId === activeChatId ? (
        <button
          type="button"
          onClick={() => {
            setHasUnreadMessages(false);
            shouldForceScrollRef.current = true;
            scrollToBottom('smooth');
          }}
          className="fixed bottom-[calc(var(--bottom-nav-height)+var(--chat-composer-height)+1.25rem+env(safe-area-inset-bottom))] left-1/2 z-30 -translate-x-1/2 rounded-full bg-[linear-gradient(135deg,#5d43ff,#ff8d63)] px-4 py-2 text-xs font-semibold text-white shadow-[0_18px_30px_rgba(126,84,198,0.28)]"
        >
          Nuevos mensajes
        </button>
      ) : null}

      <div className="fixed inset-x-0 bottom-[calc(var(--bottom-nav-height)+0.75rem+env(safe-area-inset-bottom))] z-20 px-4">
        <div className="app-container">
          <GlassCard className="premium-card rounded-[28px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,236,255,0.92))] px-4 py-3 shadow-[0_26px_56px_rgba(102,68,165,0.2)]">
            <form
              className="flex items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void submitMessage(input);
              }}
            >
              <textarea
                id="chat-message"
                name="message"
                className="min-h-[52px] max-h-32 flex-1 resize-none rounded-[22px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,243,250,0.88))] px-4 py-3 text-sm leading-6 text-[var(--text-main)] outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.48)]"
                placeholder="Escribe lo que necesites decir..."
                rows={2}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onFocus={() => {
                  setIsComposerFocused(true);
                  if (isNearBottom(messagesScrollRef.current)) {
                    window.requestAnimationFrame(() => scrollToBottom('smooth'));
                  }
                }}
                onBlur={() => setIsComposerFocused(false)}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#5d43ff,#ff8d63)] text-white shadow-[0_18px_30px_rgba(126,84,198,0.28)] disabled:opacity-50"
              >
                {loading ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <SendHorizonal size={18} />
                )}
              </button>
            </form>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
