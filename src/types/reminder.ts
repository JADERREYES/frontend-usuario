export type ReminderItem = {
  _id: string;
  title: string;
  description?: string;
  frequency?: 'daily' | 'weekly' | 'custom';
  daysOfWeek?: string[];
  time: string;
  enabled: boolean;
  tone?: string;
  createdAt?: string;
};
