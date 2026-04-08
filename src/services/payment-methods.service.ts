import api from './api';

export type PaymentMethodItem = {
  _id: string;
  name: string;
  code: string;
  provider?: string;
  accountLabel?: string;
  accountValue?: string;
  accountNumber?: string;
  holderName?: string;
  accountHolder?: string;
  instructions?: string;
  isActive: boolean;
  sortOrder?: number;
};

export const paymentMethodsService = {
  getActive: async (): Promise<PaymentMethodItem[]> => {
    const response = await api.get('/payment-methods/active');
    return response.data;
  },
};
