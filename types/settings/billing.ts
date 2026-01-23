// Billing Types
// Sprint 7: Billing and Usage

// Plan tier identifiers
export type PlanTier = 'free' | 'pro' | 'teams' | 'enterprise';

// Plan billing interval
export type BillingInterval = 'monthly' | 'annually';

// Plan definition
export interface Plan {
  id: PlanTier;
  name: string;
  price: number;
  annualPrice?: number;
  description: string;
  features: string[];
  limits: {
    apiCalls: number;
    ingestions: number;
    storageGb: number;
    seats: number;
    oracleQueries: number;
  };
  isPopular?: boolean;
}

// Plan definitions with limits
export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'For individuals getting started',
    features: [
      'Basic context management',
      'Limited API calls',
      '1 GB storage',
      '1 seat',
      '10 Oracle queries/day',
    ],
    limits: {
      apiCalls: 1000,
      ingestions: 50,
      storageGb: 1,
      seats: 1,
      oracleQueries: 10,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    annualPrice: 24,
    description: 'For professionals and power users',
    features: [
      'Advanced context management',
      '10,000 API calls/month',
      '25 GB storage',
      '3 seats',
      '100 Oracle queries/day',
      'Priority support',
    ],
    limits: {
      apiCalls: 10000,
      ingestions: 500,
      storageGb: 25,
      seats: 3,
      oracleQueries: 100,
    },
    isPopular: true,
  },
  {
    id: 'teams',
    name: 'Teams',
    price: 79,
    annualPrice: 66,
    description: 'For growing teams',
    features: [
      'Team collaboration',
      '50,000 API calls/month',
      '100 GB storage',
      '10 seats',
      'Unlimited Oracle queries',
      'SSO integration',
      'Advanced analytics',
    ],
    limits: {
      apiCalls: 50000,
      ingestions: 2500,
      storageGb: 100,
      seats: 10,
      oracleQueries: -1,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: -1,
    description: 'For large organizations',
    features: [
      'Custom limits',
      'Dedicated support',
      'SLA guarantees',
      'Custom integrations',
      'On-premise deployment',
      'Audit logs',
    ],
    limits: {
      apiCalls: -1,
      ingestions: -1,
      storageGb: -1,
      seats: -1,
      oracleQueries: -1,
    },
  },
];

// Subscription status
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';

// Subscription entity
export interface Subscription {
  id: string;
  userId: string;
  planId: PlanTier;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  stripeSubscriptionId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Payment method types
export type PaymentMethodType = 'card' | 'sepa_debit';

// Card brand
export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';

// Payment method entity
export interface PaymentMethod {
  id: string;
  userId: string;
  type: PaymentMethodType;
  stripePaymentMethodId: string;
  isDefault: boolean;
  cardBrand?: CardBrand;
  cardLast4?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  sepaBankCode?: string;
  sepaLast4?: string;
  sepaCountry?: string;
  createdAt: Date;
}

// Invoice status
export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

// Invoice entity
export interface Invoice {
  id: string;
  userId: string;
  stripeInvoiceId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  amountDue: number;
  amountPaid: number;
  currency: string;
  description?: string;
  invoiceUrl?: string;
  pdfUrl?: string;
  periodStart: Date;
  periodEnd: Date;
  dueDate?: Date;
  paidAt?: Date;
  createdAt: Date;
}

// Usage metric types
export type UsageMetricType = 'api_calls' | 'ingestions' | 'storage' | 'seats' | 'oracle_queries';

// Usage metric labels
export const USAGE_METRIC_LABELS: Record<UsageMetricType, { label: string; unit: string }> = {
  api_calls: { label: 'API Calls', unit: 'calls' },
  ingestions: { label: 'Ingestions', unit: 'imports' },
  storage: { label: 'Storage', unit: 'GB' },
  seats: { label: 'Seats', unit: 'members' },
  oracle_queries: { label: 'Oracle Queries', unit: 'queries/day' },
};

// Usage metric data point
export interface UsageDataPoint {
  date: Date;
  value: number;
}

// Usage metric
export interface UsageMetric {
  type: UsageMetricType;
  current: number;
  limit: number;
  percentage: number;
  trend: UsageDataPoint[];
}

// Billing details (Dutch BV compliance)
export interface BillingDetails {
  userId: string;
  companyName?: string;
  btwNumber?: string;
  kvkNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  country: string;
  updatedAt: Date;
}

// BTW validation result
export interface BtwValidationResult {
  isValid: boolean;
  companyName?: string;
  address?: string;
  errorMessage?: string;
}

// Billing state for context
export interface BillingState {
  subscription: Subscription | null;
  paymentMethods: PaymentMethod[];
  invoices: Invoice[];
  usageMetrics: UsageMetric[];
  billingDetails: BillingDetails | null;
  isLoading: boolean;
  error: string | null;
}

// Billing actions
export type BillingAction =
  | { type: 'SET_SUBSCRIPTION'; payload: Subscription }
  | { type: 'SET_PAYMENT_METHODS'; payload: PaymentMethod[] }
  | { type: 'ADD_PAYMENT_METHOD'; payload: PaymentMethod }
  | { type: 'REMOVE_PAYMENT_METHOD'; payload: string }
  | { type: 'SET_DEFAULT_PAYMENT_METHOD'; payload: string }
  | { type: 'SET_INVOICES'; payload: Invoice[] }
  | { type: 'SET_USAGE_METRICS'; payload: UsageMetric[] }
  | { type: 'SET_BILLING_DETAILS'; payload: BillingDetails }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// Component Props for Billing Section

export interface CurrentPlanProps {
  subscription: Subscription | null;
  onUpgrade: (planId: PlanTier) => Promise<void>;
  onDowngrade: (planId: PlanTier) => Promise<void>;
  onCancelSubscription: () => Promise<void>;
  onResumeSubscription: () => Promise<void>;
}

export interface PlanComparisonModalProps {
  isOpen: boolean;
  currentPlanId: PlanTier;
  onClose: () => void;
  onSelectPlan: (planId: PlanTier) => Promise<void>;
}

export interface PaymentMethodsProps {
  paymentMethods: PaymentMethod[];
  onAddPaymentMethod: (type: PaymentMethodType) => Promise<void>;
  onRemovePaymentMethod: (id: string) => Promise<void>;
  onSetDefault: (id: string) => Promise<void>;
}

export interface AddPaymentMethodModalProps {
  isOpen: boolean;
  type: PaymentMethodType;
  onClose: () => void;
  onSubmit: () => Promise<void>;
}

export interface InvoiceHistoryProps {
  invoices: Invoice[];
  isLoading: boolean;
  onDownload: (invoiceId: string) => Promise<void>;
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
}

export interface UsageMetricsProps {
  metrics: UsageMetric[];
  subscription: Subscription | null;
}

export interface UsageProgressBarProps {
  metric: UsageMetric;
  showTrend?: boolean;
}

export interface BillingDetailsProps {
  details: BillingDetails | null;
  onSave: (details: Partial<BillingDetails>) => Promise<void>;
  onValidateBtw: (btwNumber: string) => Promise<BtwValidationResult>;
}
