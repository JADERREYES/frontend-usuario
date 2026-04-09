export type UsageMetric = {
  used: number;
  limit: number;
  extraIncluded?: number;
};

export type UsageSnapshot = {
  chats: UsageMetric;
  messages: UsageMetric;
  documents: UsageMetric;
  tokens: UsageMetric;
  usageRatio: number;
  upgradeRecommended: boolean;
  recommendedPlanCategory: 'premium' | 'extra_tokens' | 'custom';
};

export type SubscriptionInfo = {
  _id?: string;
  planId?: string | null;
  planName: string;
  planCode: string;
  planCategory: 'free' | 'trial' | 'premium' | 'extra_tokens' | 'custom';
  status: string;
  amount: number;
  currency: string;
  autoRenew?: boolean;
  startDate?: string;
  endDate?: string;
  limits?: Record<string, number>;
  currentUsage?: Record<string, number>;
  usageSnapshot: UsageSnapshot;
  upgradeRecommendation?: 'premium' | 'extra_tokens' | 'custom';
  trialDaysRemaining?: number;
  notes?: string;
};
