import api from './api';
import type { SubscriptionInfo, UsageSnapshot } from '../types/subscription';
import { apiConfig } from '../config/api';

export const subscriptionService = {
  getMySubscription: async (): Promise<SubscriptionInfo> => {
    const response = await api.get(apiConfig.endpoints.subscriptions.me);
    return response.data;
  },

  getUsage: async (): Promise<UsageSnapshot> => {
    const response = await api.get(apiConfig.endpoints.subscriptions.usage);
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get(apiConfig.endpoints.subscriptions.history);
    return response.data;
  },
};
