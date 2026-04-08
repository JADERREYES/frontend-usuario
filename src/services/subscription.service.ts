import api from './api';
import type { SubscriptionInfo, UsageSnapshot } from '../types/subscription';

export const subscriptionService = {
  getMySubscription: async (): Promise<SubscriptionInfo> => {
    const response = await api.get('/subscriptions/me');
    return response.data;
  },

  getUsage: async (): Promise<UsageSnapshot> => {
    const response = await api.get('/subscriptions/me/usage');
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get('/subscriptions/me/history');
    return response.data;
  },
};
