import api from './api';
import type { ReminderItem } from '../types/reminder';
import { apiConfig } from '../config/api';

export const remindersService = {
  getAll: async (): Promise<ReminderItem[]> => {
    const response = await api.get(apiConfig.endpoints.reminders.list);
    return response.data;
  },

  create: async (payload: Partial<ReminderItem>): Promise<ReminderItem> => {
    const response = await api.post(apiConfig.endpoints.reminders.create, payload);
    return response.data;
  },

  update: async (id: string, payload: Partial<ReminderItem>): Promise<ReminderItem> => {
    const response = await api.put(apiConfig.endpoints.reminders.item(id), payload);
    return response.data;
  },

  remove: async (id: string) => {
    const response = await api.delete(apiConfig.endpoints.reminders.item(id));
    return response.data;
  },
};
