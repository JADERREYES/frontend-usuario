import api from './api';

export type PublicPlan = {
  _id: string;
  name: string;
  code: string;
  description: string;
  category:
    | 'free'
    | 'trial'
    | 'premium'
    | 'extra_tokens'
    | 'custom'
    | 'subscription'
    | 'tokens';
  price: number;
  currency: string;
  durationDays: number;
  limits: Record<string, number>;
  isActive: boolean;
  isDefault: boolean;
  isCustomizable: boolean;
};

export const plansService = {
  getActive: async (): Promise<PublicPlan[]> => {
    const response = await api.get('/plans/active');
    return response.data;
  },
};
