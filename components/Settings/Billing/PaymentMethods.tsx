// PaymentMethods component - Manage payment methods
// Setting Sprint 7: Billing and Usage

import React, { useState } from 'react';
import {
  CreditCard,
  Building2,
  Plus,
  Trash2,
  Star,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { tw } from '../../../styles/settings';
import type {
  PaymentMethodsProps,
  PaymentMethod,
  PaymentMethodType,
  CardBrand,
} from '../../../types/settings';

// Card brand icons/colors
const cardBrandStyles: Record<CardBrand, { bg: string; name: string }> = {
  visa: { bg: 'bg-blue-600', name: 'Visa' },
  mastercard: { bg: 'bg-red-500', name: 'Mastercard' },
  amex: { bg: 'bg-blue-400', name: 'American Express' },
  discover: { bg: 'bg-orange-500', name: 'Discover' },
  unknown: { bg: 'bg-gray-500', name: 'Card' },
};

interface PaymentMethodCardProps {
  method: PaymentMethod;
  onRemove: (id: string) => void;
  onSetDefault: (id: string) => void;
}

function PaymentMethodCard({ method, onRemove, onSetDefault }: PaymentMethodCardProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleRemove = () => {
    onRemove(method.id);
    setShowConfirmDelete(false);
  };

  if (method.type === 'card') {
    const brand = method.cardBrand || 'unknown';
    const brandStyle = cardBrandStyles[brand];

    return (
      <div className={`${tw.card} flex items-center justify-between`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-8 ${brandStyle.bg} rounded flex items-center justify-center`}>
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {brandStyle.name} •••• {method.cardLast4}
              </span>
              {method.isDefault && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded">
                  <Star className="w-3 h-3" />
                  Default
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Expires {method.cardExpMonth?.toString().padStart(2, '0')}/{method.cardExpYear}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!method.isDefault && (
            <button
              onClick={() => onSetDefault(method.id)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Set as default
            </button>
          )}
          {showConfirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleRemove}
                className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="p-1.5 text-muted-foreground hover:bg-muted rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmDelete(true)}
              className={`${tw.buttonGhost} text-muted-foreground hover:text-destructive`}
              disabled={method.isDefault}
              title={method.isDefault ? 'Cannot remove default payment method' : 'Remove'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // SEPA Direct Debit
  return (
    <div className={`${tw.card} flex items-center justify-between`}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-8 bg-emerald-600 rounded flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              SEPA •••• {method.sepaLast4}
            </span>
            {method.isDefault && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded">
                <Star className="w-3 h-3" />
                Default
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {method.sepaBankCode} ({method.sepaCountry})
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!method.isDefault && (
          <button
            onClick={() => onSetDefault(method.id)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Set as default
          </button>
        )}
        {showConfirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              onClick={handleRemove}
              className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowConfirmDelete(false)}
              className="p-1.5 text-muted-foreground hover:bg-muted rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirmDelete(true)}
            className={`${tw.buttonGhost} text-muted-foreground hover:text-destructive`}
            disabled={method.isDefault}
            title={method.isDefault ? 'Cannot remove default payment method' : 'Remove'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Add Payment Method Modal
interface AddPaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: PaymentMethodType) => void;
}

function AddPaymentMethodModal({ isOpen, onClose, onSelectType }: AddPaymentMethodModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg max-w-md w-full mx-4">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Add Payment Method</h2>
          <button onClick={onClose} className={tw.buttonGhost}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <button
            onClick={() => onSelectType('card')}
            className={`${tw.cardHover} w-full flex items-center gap-4 text-left`}
          >
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Credit or Debit Card</h3>
              <p className="text-sm text-muted-foreground">Visa, Mastercard, American Express</p>
            </div>
          </button>

          <button
            onClick={() => onSelectType('sepa_debit')}
            className={`${tw.cardHover} w-full flex items-center gap-4 text-left`}
          >
            <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">SEPA Direct Debit</h3>
              <p className="text-sm text-muted-foreground">For EU bank accounts</p>
            </div>
          </button>
        </div>

        <div className="p-4 bg-muted/30 border-t border-border rounded-b-lg">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              Your payment information is securely processed by Stripe. We never store your full card details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PaymentMethods({
  paymentMethods,
  onAddPaymentMethod,
  onRemovePaymentMethod,
  onSetDefault,
}: PaymentMethodsProps) {
  const [showAddModal, setShowAddModal] = useState(false);

  const handleSelectType = async (type: PaymentMethodType) => {
    setShowAddModal(false);
    // TODO: This would open Stripe Elements for card/SEPA entry
    await onAddPaymentMethod(type);
  };

  return (
    <div className="space-y-4">
      {/* Payment Methods List */}
      {paymentMethods.length > 0 ? (
        <div className="space-y-3">
          {paymentMethods.map(method => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              onRemove={onRemovePaymentMethod}
              onSetDefault={onSetDefault}
            />
          ))}
        </div>
      ) : (
        <div className={`${tw.card} text-center py-8`}>
          <CreditCard className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground mt-2">No payment methods added</p>
          <p className="text-sm text-muted-foreground/80">Add a payment method to upgrade your plan</p>
        </div>
      )}

      {/* Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className={`${tw.buttonSecondary} w-full justify-center flex items-center gap-2`}
      >
        <Plus className="w-4 h-4" />
        Add Payment Method
      </button>

      {/* Add Modal */}
      <AddPaymentMethodModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSelectType={handleSelectType}
      />
    </div>
  );
}

export default PaymentMethods;
