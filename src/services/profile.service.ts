import api from './api';
import type { UserCheckIn, UserProfile, WeeklySummary } from '../types/profile';

export const profileService = {
  getMe: async (): Promise<UserProfile | null> => {
    const response = await api.get('/profiles/me');
    return response.data;
  },

  upsertMe: async (payload: Record<string, unknown>): Promise<UserProfile> => {
    const response = await api.put('/profiles/me', payload);
    return response.data;
  },

  completeOnboarding: async () => {
    const response = await api.post('/profiles/me/complete-onboarding');
    return response.data;
  },

  getCheckIns: async (): Promise<UserCheckIn[]> => {
    const response = await api.get('/profiles/me/check-ins');
    return response.data;
  },

  createCheckIn: async (payload: { mood: string; energy?: string; note?: string }) => {
    const response = await api.post('/profiles/me/check-ins', payload);
    return response.data;
  },

  getWeeklySummary: async (): Promise<WeeklySummary> => {
    const response = await api.get('/profiles/me/weekly-summary');
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<UserProfile> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/profiles/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
