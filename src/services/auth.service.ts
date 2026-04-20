import api from './api';
import type { LoginPayload, RegisterPayload } from '../types/auth';
import { apiConfig } from '../config/api';

export const authService = {
  register: async (payload: RegisterPayload) => {
    const response = await api.post(apiConfig.endpoints.auth.register, payload);
    return response.data;
  },

  login: async (payload: LoginPayload) => {
    const response = await api.post(apiConfig.endpoints.auth.login, payload);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get(apiConfig.endpoints.auth.profile);
    return response.data;
  },

  deleteAccount: async () => {
    const response = await api.delete(apiConfig.endpoints.auth.account);
    return response.data;
  },
};
