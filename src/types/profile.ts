export type UserPreferences = {
  theme?: 'light' | 'dark';
  language?: string;
  notifications?: boolean;
  palette?: string;
  backgroundStyle?: string;
  bubbleStyle?: string;
  motivationalIntensity?: string;
};

export type UserCheckIn = {
  mood: string;
  energy?: string;
  note?: string;
  createdAt: string;
};

export type WeeklySummary = {
  periodDays: number;
  totalCheckIns: number;
  selfCareDays: number;
  conversationsThisWeek?: number;
  activeReminders?: number;
  dominantMood: string | null;
  dominantEnergy: string | null;
  moodBreakdown: Array<{ label: string; value: number }>;
  energyBreakdown: Array<{ label: string; value: number }>;
  highlights: string[];
  recentCheckIns: UserCheckIn[];
};

export type UserProfile = {
  _id?: string;
  userId?: string;
  displayName?: string;
  pronouns?: string;
  avatarUrl?: string;
  bio?: string;
  preferences?: UserPreferences;
  onboardingData?: {
    completed?: boolean;
    step?: number;
    interests?: string[];
    goals?: string[];
  };
  checkIns?: UserCheckIn[];
};
