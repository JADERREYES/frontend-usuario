export type SubscriptionRequestType = 'premium' | 'extra_tokens' | 'custom';

export type SubscriptionRequestStatus =
  | 'new'
  | 'receipt_uploaded'
  | 'submitted'
  | 'under_review'
  | 'contacted'
  | 'pending_payment'
  | 'paid'
  | 'awaiting_validation'
  | 'approved'
  | 'activated'
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
    accountLabel?: string;
    accountValue?: string;
    holderName?: string;
    accountNumber: string;
    instructions: string;
  };
  payerName?: string;
  payerPhone?: string;
  reportedAmount?: number;
  paidAtReference?: string;
  message: string;
  proofUrl?: string;
  proofFileUrl?: string;
  proofStorageProvider?: string;
  proofStorageKey?: string;
  proofOriginalName?: string;
  receiptUrl?: string;
  receiptFileName?: string;
  proofMimeType?: string;
  proofSize?: number;
  status: SubscriptionRequestStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
};
