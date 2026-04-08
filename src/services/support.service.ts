import api from './api';

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
    const response = await api.get('/support-requests/me');
    return response.data;
  },

  create: async (payload: {
    subject: string;
    message: string;
    type?: 'general' | 'premium_plan' | 'extra_tokens' | 'custom_upgrade';
  }) => {
    const response = await api.post('/support-requests', payload);
    return response.data;
  },
};
