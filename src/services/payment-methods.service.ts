import api from './api';
import { apiConfig } from '../config/api';

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
    const response = await api.get(apiConfig.endpoints.paymentMethods.active);
    return response.data;
  },
};
