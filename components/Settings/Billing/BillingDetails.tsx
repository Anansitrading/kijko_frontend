// BillingDetails component - Dutch BV invoicing details
// Setting Sprint 7: Billing and Usage

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { tw } from '../../../styles/settings';
import { useAutoSave } from '../../../hooks/useAutoSave';
import type {
  BillingDetailsProps,
  BillingDetails as BillingDetailsType,
  BtwValidationResult,
} from '../../../types/settings';

// Country options (EU countries for SEPA)
const EU_COUNTRIES = [
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'AT', name: 'Austria' },
  { code: 'IE', name: 'Ireland' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'PT', name: 'Portugal' },
  { code: 'FI', name: 'Finland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'DK', name: 'Denmark' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
];

interface FormField {
  value: string;
  error?: string;
  touched: boolean;
}

interface FormState {
  companyName: FormField;
  btwNumber: FormField;
  kvkNumber: FormField;
  addressLine1: FormField;
  addressLine2: FormField;
  city: FormField;
  postalCode: FormField;
  country: FormField;
}

export function BillingDetails({
  details,
  onSave,
  onValidateBtw,
}: BillingDetailsProps) {
  const { save, status } = useAutoSave();
  const [btwValidation, setBtwValidation] = useState<{
    status: 'idle' | 'validating' | 'valid' | 'invalid';
    result?: BtwValidationResult;
  }>({ status: 'idle' });

  // Initialize form state
  const [form, setForm] = useState<FormState>({
    companyName: { value: details?.companyName || '', touched: false },
    btwNumber: { value: details?.btwNumber || '', touched: false },
    kvkNumber: { value: details?.kvkNumber || '', touched: false },
    addressLine1: { value: details?.addressLine1 || '', touched: false },
    addressLine2: { value: details?.addressLine2 || '', touched: false },
    city: { value: details?.city || '', touched: false },
    postalCode: { value: details?.postalCode || '', touched: false },
    country: { value: details?.country || 'NL', touched: false },
  });

  // Update form when details prop changes
  useEffect(() => {
    if (details) {
      setForm({
        companyName: { value: details.companyName || '', touched: false },
        btwNumber: { value: details.btwNumber || '', touched: false },
        kvkNumber: { value: details.kvkNumber || '', touched: false },
        addressLine1: { value: details.addressLine1 || '', touched: false },
        addressLine2: { value: details.addressLine2 || '', touched: false },
        city: { value: details.city || '', touched: false },
        postalCode: { value: details.postalCode || '', touched: false },
        country: { value: details.country || 'NL', touched: false },
      });
    }
  }, [details]);

  // Handle field change with auto-save
  const handleFieldChange = useCallback(
    async (field: keyof FormState, value: string) => {
      setForm(prev => ({
        ...prev,
        [field]: { ...prev[field], value, touched: true },
      }));

      // Save immediately for select fields, debounce for text
      await save(`billing.${field}`, value, field === 'country');

      // Trigger save to backend
      await onSave({ [field]: value });
    },
    [save, onSave]
  );

  // Validate BTW number
  const handleValidateBtw = useCallback(async () => {
    const btwNumber = form.btwNumber.value.trim();
    if (!btwNumber) return;

    setBtwValidation({ status: 'validating' });

    try {
      const result = await onValidateBtw(btwNumber);
      setBtwValidation({
        status: result.isValid ? 'valid' : 'invalid',
        result,
      });

      // Update company name if found
      if (result.isValid && result.companyName) {
        setForm(prev => ({
          ...prev,
          btwNumber: { ...prev.btwNumber, error: undefined },
        }));
      } else {
        setForm(prev => ({
          ...prev,
          btwNumber: { ...prev.btwNumber, error: result.errorMessage },
        }));
      }
    } catch (error) {
      setBtwValidation({
        status: 'invalid',
        result: { isValid: false, errorMessage: 'Validation failed' },
      });
    }
  }, [form.btwNumber.value, onValidateBtw]);

  // KVK validation (Dutch Chamber of Commerce number - 8 digits)
  const validateKvk = (value: string): string | undefined => {
    if (!value) return undefined;
    if (!/^\d{8}$/.test(value)) {
      return 'KVK number must be 8 digits';
    }
    return undefined;
  };

  // Postal code validation based on country
  const validatePostalCode = (value: string, country: string): string | undefined => {
    if (!value) return undefined;

    if (country === 'NL') {
      // Dutch postal code: 4 digits + space + 2 letters
      if (!/^\d{4}\s?[A-Za-z]{2}$/.test(value)) {
        return 'Format: 1234 AB';
      }
    }
    return undefined;
  };

  const handleKvkChange = (value: string) => {
    const error = validateKvk(value);
    setForm(prev => ({
      ...prev,
      kvkNumber: { value, touched: true, error },
    }));
    handleFieldChange('kvkNumber', value);
  };

  const handlePostalCodeChange = (value: string) => {
    const error = validatePostalCode(value, form.country.value);
    setForm(prev => ({
      ...prev,
      postalCode: { value, touched: true, error },
    }));
    handleFieldChange('postalCode', value);
  };

  return (
    <div className="space-y-6">
      {/* Company Information */}
      <div className={tw.card}>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-primary" />
          <h4 className="text-sm font-medium text-foreground">Company Information</h4>
        </div>

        <div className="space-y-4">
          {/* Company Name */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              Company Name
            </label>
            <input
              type="text"
              value={form.companyName.value}
              onChange={e => handleFieldChange('companyName', e.target.value)}
              placeholder="Your Company B.V."
              className={tw.input}
            />
          </div>

          {/* BTW Number (Dutch VAT) */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              BTW Number (VAT)
              <span className="text-muted-foreground font-normal ml-1">(for EU businesses)</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={form.btwNumber.value}
                  onChange={e => {
                    handleFieldChange('btwNumber', e.target.value.toUpperCase());
                    setBtwValidation({ status: 'idle' });
                  }}
                  placeholder="NL123456789B01"
                  className={`${form.btwNumber.error ? tw.inputError : tw.input} pr-10`}
                />
                {btwValidation.status === 'valid' && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-accent" />
                )}
                {btwValidation.status === 'invalid' && (
                  <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-destructive" />
                )}
              </div>
              <button
                onClick={handleValidateBtw}
                disabled={!form.btwNumber.value || btwValidation.status === 'validating'}
                className={tw.buttonSecondary}
              >
                {btwValidation.status === 'validating' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="ml-2">Verify</span>
              </button>
            </div>
            {form.btwNumber.error && (
              <p className="text-xs text-destructive mt-1">{form.btwNumber.error}</p>
            )}
            {btwValidation.status === 'valid' && btwValidation.result?.companyName && (
              <p className="text-xs text-accent mt-1">
                Verified: {btwValidation.result.companyName}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Validated via EU VIES system
            </p>
          </div>

          {/* KVK Number (Dutch Chamber of Commerce) */}
          {form.country.value === 'NL' && (
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                KVK Number
                <span className="text-muted-foreground font-normal ml-1">(Dutch businesses)</span>
              </label>
              <input
                type="text"
                value={form.kvkNumber.value}
                onChange={e => handleKvkChange(e.target.value)}
                placeholder="12345678"
                maxLength={8}
                className={form.kvkNumber.error ? tw.inputError : tw.input}
              />
              {form.kvkNumber.error && (
                <p className="text-xs text-destructive mt-1">{form.kvkNumber.error}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Address */}
      <div className={tw.card}>
        <h4 className="text-sm font-medium text-foreground mb-4">Invoice Address</h4>

        <div className="space-y-4">
          {/* Address Line 1 */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              Address Line 1
            </label>
            <input
              type="text"
              value={form.addressLine1.value}
              onChange={e => handleFieldChange('addressLine1', e.target.value)}
              placeholder="Street name and number"
              className={tw.input}
            />
          </div>

          {/* Address Line 2 */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              Address Line 2
              <span className="text-muted-foreground font-normal ml-1">(optional)</span>
            </label>
            <input
              type="text"
              value={form.addressLine2.value}
              onChange={e => handleFieldChange('addressLine2', e.target.value)}
              placeholder="Apartment, suite, etc."
              className={tw.input}
            />
          </div>

          {/* City and Postal Code */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                City
              </label>
              <input
                type="text"
                value={form.city.value}
                onChange={e => handleFieldChange('city', e.target.value)}
                placeholder="Amsterdam"
                className={tw.input}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Postal Code
              </label>
              <input
                type="text"
                value={form.postalCode.value}
                onChange={e => handlePostalCodeChange(e.target.value)}
                placeholder={form.country.value === 'NL' ? '1234 AB' : 'Postal code'}
                className={form.postalCode.error ? tw.inputError : tw.input}
              />
              {form.postalCode.error && (
                <p className="text-xs text-destructive mt-1">{form.postalCode.error}</p>
              )}
            </div>
          </div>

          {/* Country */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              Country
            </label>
            <select
              value={form.country.value}
              onChange={e => handleFieldChange('country', e.target.value)}
              className={tw.dropdown}
            >
              {EU_COUNTRIES.map(country => (
                <option key={country.code} value={country.code} className={tw.dropdownOption}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Save Status */}
      {status === 'saving' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving changes...
        </div>
      )}
      {status === 'saved' && (
        <div className="flex items-center gap-2 text-sm text-accent">
          <Check className="w-4 h-4" />
          Changes saved
        </div>
      )}
    </div>
  );
}

export default BillingDetails;
