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
  metadata: Record<string, unknown> = {},
): MessageItem => ({
  _id: id,
  id,
  chatId,
  senderId: 'local',
  role,
  content,
  createdAt: new Date().toISOString(),
  metadata,
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
  const [slowPendingMessageId, setSlowPendingMessageId] = useState<string | null>(null);
  const [initializedChatId, setInitializedChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const shouldForceScrollRef = useRef(false);
  const messagesSignatureRef = useRef('');
  const messagesLengthRef = useRef(0);
  const slowResponseTimerRef = useRef<number | null>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const container = messagesScrollRef.current;
    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    });
  }, []);

  const queueScrollToBottom = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      window.requestAnimationFrame(() => {
        window.setTimeout(() => scrollToBottom(behavior), 80);
      });
    },
    [scrollToBottom],
  );

  useEffect(() => {
    const applyVisualViewportHeight = () => {
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty(
        '--visual-viewport-height',
        `${viewportHeight}px`,
      );
    };

    applyVisualViewportHeight();
    window.visualViewport?.addEventListener('resize', applyVisualViewportHeight);
    window.addEventListener('resize', applyVisualViewportHeight);

    return () => {
      window.visualViewport?.removeEventListener(
        'resize',
        applyVisualViewportHeight,
      );
      window.removeEventListener('resize', applyVisualViewportHeight);
    };
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = '0px';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 96)}px`;
  }, [input]);

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

  const loadMessages = useCallback(
    async (chatId: string, origin: 'initial' | 'poll' | 'submit' = 'poll') => {
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
            debugMessageLength(
              'frontend-received-last-message',
              data[data.length - 1].content,
            );
          }

          return data;
        });

        setError('');

        if (origin === 'initial' || shouldStickToBottom) {
          queueScrollToBottom(origin === 'initial' ? 'auto' : 'smooth');
          setHasUnreadMessages(false);
        }

        if (origin === 'submit' || data.length > previousLength) {
          shouldForceScrollRef.current = false;
        }
      } catch {
        setError('No pudimos abrir esta conversacion.');
      }
    },
    [isComposerFocused, queueScrollToBottom],
  );

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
    shouldForceScrollRef.current = true;

    const fallbackChatId = activeChatId ?? `draft-${Date.now()}`;
    const optimisticUserMessageId = `local-user-${Date.now()}`;
    const optimisticAssistantMessageId = `local-assistant-${Date.now()}`;
    const optimisticUserMessage = buildLocalMessage(
      optimisticUserMessageId,
      'user',
      clean,
      fallbackChatId,
    );
    const optimisticAssistantMessage = buildLocalMessage(
      optimisticAssistantMessageId,
      'assistant',
      'MenteAmiga esta pensando contigo...',
      fallbackChatId,
      { pending: true },
    );

    setInput('');
    setMessages((current) => {
      const nextItems = dedupeMessages([
        ...current,
        optimisticUserMessage,
        optimisticAssistantMessage,
      ]);
      messagesSignatureRef.current = getMessagesSignature(nextItems);
      return nextItems;
    });
    queueScrollToBottom('smooth');
    if (slowResponseTimerRef.current) {
      window.clearTimeout(slowResponseTimerRef.current);
    }
    slowResponseTimerRef.current = window.setTimeout(() => {
      setSlowPendingMessageId(optimisticAssistantMessageId);
    }, 5000);

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
          debugMessageLength(
            'frontend-assistant-saved',
            result.assistantMessage.content,
          );
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
      setSlowPendingMessageId(null);
      queueScrollToBottom('smooth');
      if (result.chatId) {
        void loadMessages(result.chatId, 'submit');
      }
    } catch (requestError) {
      setMessages((current) => {
        const nextItems = current.map((message) => {
          if (message._id === optimisticAssistantMessage._id) {
            return {
              ...message,
              content: 'No pude responderte esta vez.',
              metadata: {
                ...message.metadata,
                pending: false,
                failed: true,
                retryable: true,
                originalMessage: clean,
                relatedUserMessageId: optimisticUserMessageId,
              },
            };
          }

          return message;
        });
        messagesSignatureRef.current = getMessagesSignature(nextItems);
        return nextItems;
      });
      setError(getChatErrorMessage(requestError));
    } finally {
      if (slowResponseTimerRef.current) {
        window.clearTimeout(slowResponseTimerRef.current);
        slowResponseTimerRef.current = null;
      }
      setSlowPendingMessageId(null);
      shouldForceScrollRef.current = false;
      setLoading(false);
    }
  };

  const retryFailedMessage = async (
    originalMessage: string,
    relatedUserMessageId?: string,
    failedAssistantMessageId?: string,
  ) => {
    const clean = originalMessage.trim();
    if (!clean) {
      return;
    }

    setLoading(true);
    setError('');
    shouldForceScrollRef.current = true;

    const pendingAssistantId = `retry-assistant-${Date.now()}`;
    const fallbackChatId = activeChatId ?? `draft-${Date.now()}`;

    setMessages((current) => {
      const nextItems = dedupeMessages(
        current
          .filter((message) => message._id !== failedAssistantMessageId)
          .concat(
            buildLocalMessage(
              pendingAssistantId,
              'assistant',
              'MenteAmiga esta pensando contigo...',
              fallbackChatId,
              { pending: true },
            ),
          ),
      );
      messagesSignatureRef.current = getMessagesSignature(nextItems);
      return nextItems;
    });

    queueScrollToBottom('smooth');
    if (slowResponseTimerRef.current) {
      window.clearTimeout(slowResponseTimerRef.current);
    }
    slowResponseTimerRef.current = window.setTimeout(() => {
      setSlowPendingMessageId(pendingAssistantId);
    }, 5000);

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
          (message) => message._id !== pendingAssistantId,
        );

        if (result.userMessage && result.assistantMessage) {
          const nextItems = dedupeMessages(
            withoutPending
              .map((message) => {
                if (message._id === relatedUserMessageId) {
                  return result.userMessage;
                }

                return message;
              })
              .concat(result.assistantMessage),
          );
          messagesSignatureRef.current = getMessagesSignature(nextItems);
          return nextItems;
        }

        const nextItems = dedupeMessages([
          ...withoutPending,
          buildLocalMessage(
            `server-fallback-${Date.now()}`,
            'assistant',
            result.response || 'No pude generar una respuesta.',
            result.chatId ?? fallbackChatId,
          ),
        ]);
        messagesSignatureRef.current = getMessagesSignature(nextItems);
        return nextItems;
      });

      setSlowPendingMessageId(null);
      queueScrollToBottom('smooth');
    } catch (requestError) {
      setMessages((current) => {
        const nextItems = current.map((message) => {
          if (message._id === pendingAssistantId) {
            return {
              ...message,
              content: 'No pude responderte esta vez.',
              metadata: {
                pending: false,
                failed: true,
                retryable: true,
                originalMessage: clean,
                relatedUserMessageId,
              },
            };
          }

          return message;
        });
        messagesSignatureRef.current = getMessagesSignature(nextItems);
        return nextItems;
      });
      setError(getChatErrorMessage(requestError));
    } finally {
      if (slowResponseTimerRef.current) {
        window.clearTimeout(slowResponseTimerRef.current);
        slowResponseTimerRef.current = null;
      }
      setSlowPendingMessageId(null);
      shouldForceScrollRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="chat-page flex h-full min-h-0 flex-col overflow-hidden pb-[calc(var(--bottom-nav-height)+var(--chat-safe-bottom)+0.75rem)]">
      <GlassCard className="chat-header aurora-panel premium-card shrink-0 overflow-hidden rounded-[20px] border border-white/55 px-3.5 py-3 shadow-[0_18px_36px_rgba(92,57,160,0.14)] md:rounded-[32px] md:px-5 md:py-4 md:shadow-[0_28px_66px_rgba(92,57,160,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/84 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-royal)] md:gap-2 md:px-3 md:text-[11px] md:tracking-[0.18em]">
              <Sparkles size={11} className="md:h-3 md:w-3" />
              Director de chat
            </div>
            <p className="mt-2 line-clamp-2 text-[17px] font-semibold leading-5 tracking-[-0.04em] text-[var(--text-main)] md:mt-3 md:text-[24px] md:leading-7 md:tracking-[-0.05em]">
              {activeChat?.title ?? 'Nueva conversacion'}
            </p>
            <p className="mt-1 line-clamp-1 text-[12px] leading-5 text-[var(--text-soft)]/85 md:mt-2 md:text-sm md:leading-6 md:text-[var(--text-soft)]">
              Un espacio para seguir hablando contigo sin perder el hilo.
            </p>
          </div>
          <div className="rounded-[16px] bg-[linear-gradient(135deg,#6a4dff,#ff996d)] p-2.5 text-white shadow-[0_12px_22px_rgba(111,77,176,0.18)] md:rounded-[22px] md:p-3 md:shadow-[0_20px_34px_rgba(111,77,176,0.22)]">
            <MessageCircleHeart size={16} className="md:h-[18px] md:w-[18px]" />
          </div>
        </div>
      </GlassCard>

      <div className="shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1 pt-2 md:pt-3">
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
      </div>

      <div className="relative mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[30px] border border-white/55 bg-[linear-gradient(180deg,rgba(249,245,255,0.92),rgba(255,249,245,0.86),rgba(239,249,255,0.9))] px-3 py-3 shadow-[0_24px_60px_rgba(105,70,163,0.14)]">
        <div className="pointer-events-none absolute -left-10 top-0 h-28 w-28 rounded-full bg-[rgba(147,111,255,0.24)] blur-3xl" />
        <div className="pointer-events-none absolute -right-8 bottom-8 h-28 w-28 rounded-full bg-[rgba(255,171,123,0.22)] blur-3xl" />

        <div
          ref={messagesScrollRef}
          className="chat-messages relative flex-1 overflow-y-auto overscroll-contain pr-1"
          onScroll={() => {
            const nextIsAtBottom = isNearBottom(messagesScrollRef.current);
            if (nextIsAtBottom) {
              setHasUnreadMessages(false);
            }
          }}
          style={{ paddingBottom: '1rem' }}
        >
          <div className="space-y-3.5">
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
                          {slowPendingMessageId === (message._id ?? message.id)
                            ? 'Estoy preparando una respuesta con cuidado...'
                            : 'MenteAmiga esta pensando contigo...'}
                        </div>
                      ) : null}
                      {!isUserMessage && message.metadata?.failed ? (
                        <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-rose-500">
                          <span>La respuesta no pudo llegar.</span>
                          {message.metadata?.retryable ? (
                            <button
                              type="button"
                              onClick={() =>
                                void retryFailedMessage(
                                  String(message.metadata?.originalMessage ?? ''),
                                  String(message.metadata?.relatedUserMessageId ?? ''),
                                  String(message._id ?? message.id ?? ''),
                                )
                              }
                              className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold text-[var(--brand-deep)]"
                            >
                              Reintentar
                            </button>
                          ) : null}
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

        {hasUnreadMessages && initializedChatId === activeChatId ? (
          <button
            type="button"
            onClick={() => {
              setHasUnreadMessages(false);
              shouldForceScrollRef.current = true;
              queueScrollToBottom('smooth');
            }}
            className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[linear-gradient(135deg,#5d43ff,#ff8d63)] px-4 py-2 text-xs font-semibold text-white shadow-[0_18px_30px_rgba(126,84,198,0.28)]"
          >
            Nuevos mensajes
          </button>
        ) : null}
      </div>

      {error ? <p className="mt-2 shrink-0 text-sm text-rose-500">{error}</p> : null}

      <div className="chat-composer mt-3 shrink-0">
        <GlassCard className="premium-card rounded-[26px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,236,255,0.92))] px-3 py-2.5 shadow-[0_22px_40px_rgba(102,68,165,0.16)]">
          <form
            className="flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void submitMessage(input);
            }}
          >
            <textarea
              ref={textareaRef}
              id="chat-message"
              name="message"
              className="min-h-12 max-h-24 flex-1 resize-none overflow-y-auto rounded-[20px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,243,250,0.88))] px-4 py-3 text-sm leading-5 text-[var(--text-main)] outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.48)]"
              placeholder="Escribe lo que necesites decir..."
              rows={1}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              aria-label="Escribe tu mensaje"
              onFocus={() => {
                setIsComposerFocused(true);
                if (isNearBottom(messagesScrollRef.current)) {
                  window.setTimeout(() => queueScrollToBottom('smooth'), 150);
                }
              }}
              onBlur={() => setIsComposerFocused(false)}
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
  );
}
