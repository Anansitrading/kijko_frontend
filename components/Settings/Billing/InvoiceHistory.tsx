// InvoiceHistory component - View and download invoices
// Setting Sprint 7: Billing and Usage

import React, { useState } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  Check,
  Clock,
  AlertCircle,
  ChevronDown,
  Calendar,
  Loader2,
} from 'lucide-react';
import { tw } from '../../../styles/settings';
import type { InvoiceHistoryProps, Invoice, InvoiceStatus } from '../../../types/settings';

// Status badge configuration
const statusConfig: Record<InvoiceStatus, { label: string; className: string; icon: React.ReactNode }> = {
  paid: {
    label: 'Paid',
    className: 'bg-accent/20 text-accent',
    icon: <Check className="w-3 h-3" />,
  },
  open: {
    label: 'Open',
    className: 'bg-primary/20 text-primary',
    icon: <Clock className="w-3 h-3" />,
  },
  draft: {
    label: 'Draft',
    className: 'bg-muted text-muted-foreground',
    icon: <FileText className="w-3 h-3" />,
  },
  void: {
    label: 'Void',
    className: 'bg-muted text-muted-foreground',
    icon: <AlertCircle className="w-3 h-3" />,
  },
  uncollectible: {
    label: 'Uncollectible',
    className: 'bg-destructive/20 text-destructive',
    icon: <AlertCircle className="w-3 h-3" />,
  },
};

interface InvoiceRowProps {
  invoice: Invoice;
  onDownload: (id: string) => void;
}

function InvoiceRow({ invoice, onDownload }: InvoiceRowProps) {
  const status = statusConfig[invoice.status];

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className={`${tw.row} hover:bg-muted/30 transition-colors -mx-2 px-2 rounded`}>
      <div className="flex items-center gap-4 flex-1">
        <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {invoice.invoiceNumber}
            </span>
            <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${status.className}`}>
              {status.icon}
              {status.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {invoice.description || `${formatDate(invoice.periodStart)} - ${formatDate(invoice.periodEnd)}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">
            {formatCurrency(invoice.amountDue, invoice.currency)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(invoice.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {invoice.pdfUrl && (
            <button
              onClick={() => onDownload(invoice.id)}
              className={`${tw.buttonGhost} text-muted-foreground hover:text-foreground`}
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          {invoice.invoiceUrl && (
            <a
              href={invoice.invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${tw.buttonGhost} text-muted-foreground hover:text-foreground`}
              title="View in Stripe"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// Date Filter Dropdown
interface DateFilterProps {
  value: string;
  onChange: (value: string) => void;
}

function DateFilter({ value, onChange }: DateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { value: 'all', label: 'All time' },
    { value: '3m', label: 'Last 3 months' },
    { value: '6m', label: 'Last 6 months' },
    { value: '1y', label: 'Last year' },
  ];

  const selectedLabel = options.find(o => o.value === value)?.label || 'All time';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${tw.buttonSecondary} flex items-center gap-2`}
      >
        <Calendar className="w-4 h-4" />
        <span>{selectedLabel}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-10 py-1 min-w-[150px]">
            {options.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors ${
                  value === option.value ? 'text-primary' : 'text-foreground'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function InvoiceHistory({
  invoices,
  isLoading,
  onDownload,
  onLoadMore,
  hasMore,
}: InvoiceHistoryProps) {
  const [dateFilter, setDateFilter] = useState('all');

  // Filter invoices based on date
  const filteredInvoices = invoices.filter(invoice => {
    if (dateFilter === 'all') return true;

    const now = new Date();
    const invoiceDate = new Date(invoice.createdAt);
    const monthsAgo = {
      '3m': 3,
      '6m': 6,
      '1y': 12,
    }[dateFilter] || 0;

    const cutoffDate = new Date();
    cutoffDate.setMonth(now.getMonth() - monthsAgo);

    return invoiceDate >= cutoffDate;
  });

  if (invoices.length === 0 && !isLoading) {
    return (
      <div className={`${tw.card} text-center py-8`}>
        <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
        <p className="text-muted-foreground mt-2">No invoices yet</p>
        <p className="text-sm text-muted-foreground/80">
          Your billing history will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filter */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
        </p>
        <DateFilter value={dateFilter} onChange={setDateFilter} />
      </div>

      {/* Invoice List */}
      <div className="space-y-1">
        {filteredInvoices.map(invoice => (
          <InvoiceRow
            key={invoice.id}
            invoice={invoice}
            onDownload={onDownload}
          />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <button
          onClick={onLoadMore}
          disabled={isLoading}
          className={`${tw.buttonSecondary} w-full justify-center flex items-center gap-2`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Load More
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default InvoiceHistory;
