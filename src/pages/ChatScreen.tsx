import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  LoaderCircle,
  MessageCircleHeart,
  SendHorizonal,
  Sparkles,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
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

export function ChatScreen() {
  const [searchParams] = useSearchParams();
  const requestedChatId = searchParams.get('chatId');
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await chatService.getChats();
        setChats(data);
        setError('');
        if (requestedChatId) {
          setActiveChatId(requestedChatId);
          return;
        }
        const firstId = data[0]?._id ?? data[0]?.id ?? null;
        if (firstId) {
          setActiveChatId(firstId);
        }
      } catch {
        setError('No pudimos cargar tus conversaciones por ahora.');
      }
    };

    void load();
  }, [requestedChatId]);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    void chatService.markUrgentNotificationsRead(activeChatId);

    const loadMessages = async () => {
      try {
        const data = await chatService.getMessages(activeChatId);
        setMessages(data);
        setError('');
      } catch {
        setError('No pudimos abrir esta conversacion.');
      }
    };

    void loadMessages();
  }, [activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: messages.length > 0 ? 'smooth' : 'auto',
      block: 'end',
    });
  }, [messages, loading]);

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

    setMessages((current) => [...current, optimisticUserMessage, optimisticAssistantMessage]);

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
          return [...withoutPending, result.userMessage, result.assistantMessage];
        }

        if (result.response) {
          return [
            ...withoutPending,
            optimisticUserMessage,
            buildLocalMessage(
              `server-fallback-${Date.now()}`,
              'assistant',
              result.response,
              result.chatId ?? fallbackChatId,
            ),
          ];
        }

        return withoutPending;
      });

    } catch (requestError) {
      setMessages((current) =>
        current.filter(
          (message) =>
            message._id !== optimisticUserMessage._id &&
            message._id !== optimisticAssistantMessage._id,
        ),
      );
      setInput(clean);
      setError(getChatErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 pb-8">
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

      <div className="relative overflow-hidden rounded-[30px] border border-white/55 bg-[linear-gradient(180deg,rgba(249,245,255,0.92),rgba(255,249,245,0.86),rgba(239,249,255,0.9))] px-3 py-3 shadow-[0_24px_60px_rgba(105,70,163,0.14)]">
        <div className="pointer-events-none absolute -left-10 top-0 h-28 w-28 rounded-full bg-[rgba(147,111,255,0.24)] blur-3xl" />
        <div className="pointer-events-none absolute -right-8 bottom-8 h-28 w-28 rounded-full bg-[rgba(255,171,123,0.22)] blur-3xl" />

        <div className="relative space-y-3.5 pb-32">
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

      <GlassCard className="premium-card sticky bottom-[calc(7rem+env(safe-area-inset-bottom))] z-20 rounded-[28px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,236,255,0.92))] px-4 py-3 shadow-[0_26px_56px_rgba(102,68,165,0.2)]">
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void submitMessage(input);
          }}
        >
          <textarea
            className="min-h-[52px] flex-1 resize-none rounded-[22px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,243,250,0.88))] px-4 py-3 text-sm leading-6 text-[var(--text-main)] outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.48)]"
            placeholder="Escribe lo que necesites decir..."
            rows={2}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#5d43ff,#ff8d63)] text-white shadow-[0_18px_30px_rgba(126,84,198,0.28)] disabled:opacity-50"
          >
            {loading ? <LoaderCircle size={18} className="animate-spin" /> : <SendHorizonal size={18} />}
          </button>
        </form>
      </GlassCard>
    </div>
  );
}
