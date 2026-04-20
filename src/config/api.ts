const DEFAULT_API_URL = 'http://localhost:3001';

const normalizeApiUrl = (value?: string) =>
  (value?.trim() || DEFAULT_API_URL).replace(/\/+$/, '');

export const apiConfig = {
  baseURL: normalizeApiUrl(import.meta.env.VITE_API_URL),
  storage: {
    tokenKey: 'user_token',
    profileKey: 'user_profile',
    sessionStartedAtKey: 'user_session_started_at',
  },
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      profile: '/auth/profile',
      account: '/auth/account',
    },
    profiles: {
      me: '/profiles/me',
      completeOnboarding: '/profiles/me/complete-onboarding',
      checkIns: '/profiles/me/check-ins',
      weeklySummary: '/profiles/me/weekly-summary',
      avatar: '/profiles/me/avatar',
    },
    subscriptions: {
      me: '/subscriptions/me',
      usage: '/subscriptions/me/usage',
      history: '/subscriptions/me/history',
    },
    subscriptionRequests: {
      create: '/subscription-requests',
      me: '/subscription-requests/me',
    },
    plans: {
      active: '/plans/active',
    },
    paymentMethods: {
      active: '/payment-methods/active',
    },
    supportRequests: {
      me: '/support-requests/me',
      create: '/support-requests',
    },
    reminders: {
      list: '/reminders',
      create: '/reminders',
      item: (id: string) => `/reminders/${id}`,
    },
    chats: {
      list: '/chats',
      create: '/chats',
      item: (id: string) => `/chats/${id}`,
    },
    messages: {
      create: '/messages',
      byChat: (chatId: string) => `/messages/chat/${chatId}`,
      urgentNotifications: '/messages/notifications/urgent',
      markUrgentNotificationsRead: '/messages/notifications/urgent/read',
    },
    ai: {
      chat: '/ai/chat',
      chatSession: '/ai/chat-session',
    },
  },
};

export const getAuthToken = () => {
  const token = localStorage.getItem(apiConfig.storage.tokenKey)?.trim();
  return token && token !== 'undefined' && token !== 'null' ? token : null;
};

export const clearAuthSession = () => {
  localStorage.removeItem(apiConfig.storage.tokenKey);
  localStorage.removeItem(apiConfig.storage.profileKey);
  localStorage.removeItem(apiConfig.storage.sessionStartedAtKey);
};

export const resolveApiAssetUrl = (path?: string) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return `${apiConfig.baseURL}${path.startsWith('/') ? path : `/${path}`}`;
};
