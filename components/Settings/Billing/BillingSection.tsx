// BillingSection component - Billing and Usage settings page
// Setting Sprint 7: Billing and Usage

import React, { useState, useEffect } from 'react';
import { useSettings } from '../../../contexts/SettingsContext';
import SettingsSection from '../SettingsSection';
import CurrentPlan from './CurrentPlan';
import PaymentMethods from './PaymentMethods';
import InvoiceHistory from './InvoiceHistory';
import UsageMetrics from './UsageMetrics';
import BillingDetails from './BillingDetails';
import type {
  Subscription,
  PaymentMethod,
  Invoice,
  UsageMetric,
  BillingDetails as BillingDetailsType,
  PlanTier,
  PaymentMethodType,
  BtwValidationResult,
} from '../../../types/settings';

// Mock data for demonstration
const mockSubscription: Subscription = {
  id: 'sub_1',
  userId: 'user_1',
  planId: 'pro',
  status: 'active',
  billingInterval: 'monthly',
  stripeSubscriptionId: 'sub_stripe_123',
  currentPeriodStart: new Date('2025-01-01'),
  currentPeriodEnd: new Date('2025-02-01'),
  cancelAtPeriodEnd: false,
  createdAt: new Date('2024-06-15'),
  updatedAt: new Date('2025-01-01'),
};

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: 'pm_1',
    userId: 'user_1',
    type: 'card',
    stripePaymentMethodId: 'pm_stripe_1',
    isDefault: true,
    cardBrand: 'visa',
    cardLast4: '4242',
    cardExpMonth: 12,
    cardExpYear: 2027,
    createdAt: new Date('2024-06-15'),
  },
  {
    id: 'pm_2',
    userId: 'user_1',
    type: 'sepa_debit',
    stripePaymentMethodId: 'pm_stripe_2',
    isDefault: false,
    sepaBankCode: 'INGBNL2A',
    sepaLast4: '3456',
    sepaCountry: 'NL',
    createdAt: new Date('2024-08-20'),
  },
];

const mockInvoices: Invoice[] = [
  {
    id: 'inv_1',
    userId: 'user_1',
    stripeInvoiceId: 'in_stripe_1',
    invoiceNumber: 'HV-2025-0001',
    status: 'paid',
    amountDue: 2900,
    amountPaid: 2900,
    currency: 'eur',
    description: 'Pro Plan - January 2025',
    invoiceUrl: '#',
    pdfUrl: '#',
    periodStart: new Date('2025-01-01'),
    periodEnd: new Date('2025-02-01'),
    paidAt: new Date('2025-01-01'),
    createdAt: new Date('2025-01-01'),
  },
  {
    id: 'inv_2',
    userId: 'user_1',
    stripeInvoiceId: 'in_stripe_2',
    invoiceNumber: 'HV-2024-0012',
    status: 'paid',
    amountDue: 2900,
    amountPaid: 2900,
    currency: 'eur',
    description: 'Pro Plan - December 2024',
    invoiceUrl: '#',
    pdfUrl: '#',
    periodStart: new Date('2024-12-01'),
    periodEnd: new Date('2025-01-01'),
    paidAt: new Date('2024-12-01'),
    createdAt: new Date('2024-12-01'),
  },
  {
    id: 'inv_3',
    userId: 'user_1',
    stripeInvoiceId: 'in_stripe_3',
    invoiceNumber: 'HV-2024-0011',
    status: 'paid',
    amountDue: 2900,
    amountPaid: 2900,
    currency: 'eur',
    description: 'Pro Plan - November 2024',
    invoiceUrl: '#',
    pdfUrl: '#',
    periodStart: new Date('2024-11-01'),
    periodEnd: new Date('2024-12-01'),
    paidAt: new Date('2024-11-01'),
    createdAt: new Date('2024-11-01'),
  },
];

const mockUsageMetrics: UsageMetric[] = [
  {
    type: 'api_calls',
    current: 7500,
    limit: 10000,
    percentage: 75,
    trend: [
      { date: new Date('2025-01-17'), value: 6200 },
      { date: new Date('2025-01-18'), value: 6500 },
      { date: new Date('2025-01-19'), value: 6800 },
      { date: new Date('2025-01-20'), value: 7100 },
      { date: new Date('2025-01-21'), value: 7300 },
      { date: new Date('2025-01-22'), value: 7500 },
    ],
  },
  {
    type: 'ingestions',
    current: 420,
    limit: 500,
    percentage: 84,
    trend: [
      { date: new Date('2025-01-17'), value: 380 },
      { date: new Date('2025-01-18'), value: 390 },
      { date: new Date('2025-01-19'), value: 400 },
      { date: new Date('2025-01-20'), value: 405 },
      { date: new Date('2025-01-21'), value: 415 },
      { date: new Date('2025-01-22'), value: 420 },
    ],
  },
  {
    type: 'storage',
    current: 18.5,
    limit: 25,
    percentage: 74,
    trend: [
      { date: new Date('2025-01-17'), value: 17.2 },
      { date: new Date('2025-01-18'), value: 17.5 },
      { date: new Date('2025-01-19'), value: 17.8 },
      { date: new Date('2025-01-20'), value: 18.0 },
      { date: new Date('2025-01-21'), value: 18.3 },
      { date: new Date('2025-01-22'), value: 18.5 },
    ],
  },
  {
    type: 'seats',
    current: 2,
    limit: 3,
    percentage: 67,
    trend: [],
  },
  {
    type: 'oracle_queries',
    current: 85,
    limit: 100,
    percentage: 85,
    trend: [
      { date: new Date('2025-01-17'), value: 72 },
      { date: new Date('2025-01-18'), value: 78 },
      { date: new Date('2025-01-19'), value: 81 },
      { date: new Date('2025-01-20'), value: 79 },
      { date: new Date('2025-01-21'), value: 83 },
      { date: new Date('2025-01-22'), value: 85 },
    ],
  },
];

const mockBillingDetails: BillingDetailsType = {
  userId: 'user_1',
  companyName: 'Hypervisa B.V.',
  btwNumber: 'NL123456789B01',
  kvkNumber: '12345678',
  addressLine1: 'Herengracht 100',
  city: 'Amsterdam',
  postalCode: '1015 BS',
  country: 'NL',
  updatedAt: new Date('2024-06-15'),
};

export function BillingSection() {
  const { state } = useSettings();
  const [subscription, setSubscription] = useState<Subscription | null>(mockSubscription);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(mockPaymentMethods);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [usageMetrics] = useState<UsageMetric[]>(mockUsageMetrics);
  const [billingDetails, setBillingDetails] = useState<BillingDetailsType | null>(mockBillingDetails);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [hasMoreInvoices] = useState(true);

  // Only render when billing section is active
  if (state.activeSection !== 'billing') {
    return null;
  }

  // Handler functions
  const handleUpgrade = async (planId: PlanTier) => {
    // TODO: Integrate with Stripe
    console.log('Upgrading to:', planId);
    if (subscription) {
      setSubscription({ ...subscription, planId });
    }
  };

  const handleDowngrade = async (planId: PlanTier) => {
    // TODO: Integrate with Stripe
    console.log('Downgrading to:', planId);
    if (subscription) {
      setSubscription({ ...subscription, planId, cancelAtPeriodEnd: true });
    }
  };

  const handleCancelSubscription = async () => {
    // TODO: Integrate with Stripe
    console.log('Canceling subscription');
    if (subscription) {
      setSubscription({ ...subscription, cancelAtPeriodEnd: true });
    }
  };

  const handleResumeSubscription = async () => {
    // TODO: Integrate with Stripe
    console.log('Resuming subscription');
    if (subscription) {
      setSubscription({ ...subscription, cancelAtPeriodEnd: false });
    }
  };

  const handleAddPaymentMethod = async (type: PaymentMethodType) => {
    // TODO: Integrate with Stripe Elements
    console.log('Adding payment method:', type);
  };

  const handleRemovePaymentMethod = async (id: string) => {
    setPaymentMethods(paymentMethods.filter(pm => pm.id !== id));
  };

  const handleSetDefaultPaymentMethod = async (id: string) => {
    setPaymentMethods(paymentMethods.map(pm => ({
      ...pm,
      isDefault: pm.id === id,
    })));
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice?.pdfUrl) {
      window.open(invoice.pdfUrl, '_blank');
    }
  };

  const handleLoadMoreInvoices = async () => {
    setIsLoadingInvoices(true);
    // TODO: Fetch more invoices from API
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoadingInvoices(false);
  };

  const handleSaveBillingDetails = async (details: Partial<BillingDetailsType>) => {
    // TODO: Save to backend
    if (billingDetails) {
      setBillingDetails({ ...billingDetails, ...details, updatedAt: new Date() });
    }
  };

  const handleValidateBtw = async (btwNumber: string): Promise<BtwValidationResult> => {
    // TODO: Integrate with VIES API
    // Mock validation for demo
    await new Promise(resolve => setTimeout(resolve, 800));

    if (btwNumber.startsWith('NL') && btwNumber.length === 14) {
      return {
        isValid: true,
        companyName: 'Example Company B.V.',
        address: 'Amsterdam, Netherlands',
      };
    }
    return {
      isValid: false,
      errorMessage: 'Invalid BTW number format',
    };
  };

  return (
    <div className="space-y-8">
      {/* Current Plan */}
      <SettingsSection
        title="Current Plan"
        description="Manage your subscription and view plan details"
      >
        <CurrentPlan
          subscription={subscription}
          onUpgrade={handleUpgrade}
          onDowngrade={handleDowngrade}
          onCancelSubscription={handleCancelSubscription}
          onResumeSubscription={handleResumeSubscription}
        />
      </SettingsSection>

      {/* Usage Metrics */}
      <SettingsSection
        title="Usage & Limits"
        description="Track your current usage and plan limits"
      >
        <UsageMetrics
          metrics={usageMetrics}
          subscription={subscription}
        />
      </SettingsSection>

      {/* Payment Methods */}
      <SettingsSection
        title="Payment Methods"
        description="Manage your payment methods for billing"
      >
        <PaymentMethods
          paymentMethods={paymentMethods}
          onAddPaymentMethod={handleAddPaymentMethod}
          onRemovePaymentMethod={handleRemovePaymentMethod}
          onSetDefault={handleSetDefaultPaymentMethod}
        />
      </SettingsSection>

      {/* Billing Details */}
      <SettingsSection
        title="Invoicing Details"
        description="Business information for invoices (Dutch BV compliance)"
      >
        <BillingDetails
          details={billingDetails}
          onSave={handleSaveBillingDetails}
          onValidateBtw={handleValidateBtw}
        />
      </SettingsSection>

      {/* Invoice History */}
      <SettingsSection
        title="Billing History"
        description="View and download your past invoices"
      >
        <InvoiceHistory
          invoices={invoices}
          isLoading={isLoadingInvoices}
          onDownload={handleDownloadInvoice}
          onLoadMore={handleLoadMoreInvoices}
          hasMore={hasMoreInvoices}
        />
      </SettingsSection>
    </div>
  );
}

export default BillingSection;
