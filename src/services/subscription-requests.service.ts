import api from './api';
import type {
  SubscriptionRequestItem,
  SubscriptionRequestType,
} from '../types/premium-request';

export const subscriptionRequestsService = {
  create: async (payload: {
    planId: string;
    paymentMethodId: string;
    requestType: SubscriptionRequestType;
    payerName?: string;
    payerPhone: string;
    reportedAmount: number;
    paidAtReference?: string;
    message?: string;
    proof?: File | null;
  }): Promise<SubscriptionRequestItem> => {
    const formData = new FormData();
    formData.append('planId', payload.planId);
    formData.append('paymentMethodId', payload.paymentMethodId);
    formData.append('requestType', payload.requestType);
    if (payload.payerName?.trim()) {
      formData.append('payerName', payload.payerName.trim());
    }
    formData.append('payerPhone', payload.payerPhone.trim());
    formData.append('reportedAmount', String(payload.reportedAmount));
    if (payload.paidAtReference?.trim()) {
      formData.append('paidAtReference', payload.paidAtReference.trim());
    }
    if (payload.message?.trim()) {
      formData.append('message', payload.message.trim());
    }
    if (payload.proof) {
      formData.append('proof', payload.proof);
    }

    const response = await api.post('/subscription-requests', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getMine: async (): Promise<SubscriptionRequestItem[]> => {
    const response = await api.get('/subscription-requests/me');
    return response.data;
  },
};
