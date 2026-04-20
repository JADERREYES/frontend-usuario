import api from './api';
import { apiConfig } from '../config/api';

export type SupportRequestItem = {
  _id: string;
  subject: string;
  message: string;
  type?: 'general' | 'premium_plan' | 'extra_tokens' | 'custom_upgrade';
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
};

export const supportService = {
  getMine: async (): Promise<SupportRequestItem[]> => {
    const response = await api.get(apiConfig.endpoints.supportRequests.me);
    return response.data;
  },

  create: async (payload: {
    subject: string;
    message: string;
    type?: 'general' | 'premium_plan' | 'extra_tokens' | 'custom_upgrade';
  }) => {
    const response = await api.post(apiConfig.endpoints.supportRequests.create, payload);
    return response.data;
  },
};
