export type SubscriptionRequestType = 'premium' | 'extra_tokens' | 'custom';

export type SubscriptionRequestStatus =
  | 'submitted'
  | 'under_review'
  | 'awaiting_validation'
  | 'approved'
  | 'rejected';

export type SubscriptionRequestItem = {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planId: string;
  planName: string;
  planCode: string;
  requestType: SubscriptionRequestType;
  planSnapshot: {
    price: number;
    currency: string;
    durationDays: number;
    limits: Record<string, number>;
  };
  paymentMethodId: string;
  paymentMethodSnapshot: {
    name: string;
    code: string;
    accountNumber: string;
    instructions: string;
  };
  message: string;
  proofUrl?: string;
  proofOriginalName?: string;
  status: SubscriptionRequestStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
};
