import api from './api';
import type { UserCheckIn, UserProfile, WeeklySummary } from '../types/profile';
import { apiConfig } from '../config/api';

export const profileService = {
  getMe: async (): Promise<UserProfile | null> => {
    const response = await api.get(apiConfig.endpoints.profiles.me);
    return response.data;
  },

  upsertMe: async (payload: Record<string, unknown>): Promise<UserProfile> => {
    const response = await api.put(apiConfig.endpoints.profiles.me, payload);
    return response.data;
  },

  completeOnboarding: async () => {
    const response = await api.post(apiConfig.endpoints.profiles.completeOnboarding);
    return response.data;
  },

  getCheckIns: async (): Promise<UserCheckIn[]> => {
    const response = await api.get(apiConfig.endpoints.profiles.checkIns);
    return response.data;
  },

  createCheckIn: async (payload: { mood: string; energy?: string; note?: string }) => {
    const response = await api.post(apiConfig.endpoints.profiles.checkIns, payload);
    return response.data;
  },

  getWeeklySummary: async (): Promise<WeeklySummary> => {
    const response = await api.get(apiConfig.endpoints.profiles.weeklySummary);
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<UserProfile> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(apiConfig.endpoints.profiles.avatar, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
