import api from './api';
import type { ReminderItem } from '../types/reminder';

export const remindersService = {
  getAll: async (): Promise<ReminderItem[]> => {
    const response = await api.get('/reminders');
    return response.data;
  },

  create: async (payload: Partial<ReminderItem>): Promise<ReminderItem> => {
    const response = await api.post('/reminders', payload);
    return response.data;
  },

  update: async (id: string, payload: Partial<ReminderItem>): Promise<ReminderItem> => {
    const response = await api.put(`/reminders/${id}`, payload);
    return response.data;
  },

  remove: async (id: string) => {
    const response = await api.delete(`/reminders/${id}`);
    return response.data;
  },
};
