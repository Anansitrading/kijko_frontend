"""Billing domain Pydantic models matching TypeScript types/settings/billing.ts."""

from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import Field

from server.app.models.base import BaseSchema
from server.app.models.enums import (
    BillingInterval,
    PaymentMethodType,
    PlanTier,
    SubscriptionStatus,
)


# --- Plan ---

class PlanLimits(BaseSchema):
    """Plan tier limits matching TypeScript Plan.limits."""

    api_calls: int = Field(alias="apiCalls")
    ingestions: int
    storage_gb: int = Field(alias="storageGb")
    seats: int
    oracle_queries: int = Field(alias="oracleQueries")


class Plan(BaseSchema):
    """Plan definition matching TypeScript Plan interface."""

    id: PlanTier
    name: str
    price: Decimal  # Use Decimal, never float
    annual_price: Decimal | None = Field(None, alias="annualPrice")
    description: str
    features: list[str]
    limits: PlanLimits
    is_popular: bool | None = Field(None, alias="isPopular")


# --- Subscription ---

class Subscription(BaseSchema):
    """Current subscription details."""

    id: str  # Stripe subscription ID
    plan: PlanTier
    status: SubscriptionStatus
    billing_interval: BillingInterval
    current_period_start: datetime
    current_period_end: datetime
    cancel_at_period_end: bool
    trial_end: datetime | None = None


class SubscriptionCreateRequest(BaseSchema):
    """Request body for creating a checkout session."""

    plan: PlanTier
    billing_interval: BillingInterval = BillingInterval.MONTHLY
    success_url: str
    cancel_url: str


class SubscriptionUpdateRequest(BaseSchema):
    """Request body for updating subscription."""

    plan: PlanTier | None = None
    billing_interval: BillingInterval | None = None


# --- Payment Method ---

class PaymentMethod(BaseSchema):
    """Payment method details."""

    id: str  # Stripe payment method ID
    type: PaymentMethodType
    is_default: bool
    card_last4: str | None = None
    card_brand: str | None = None
    card_exp_month: int | None = None
    card_exp_year: int | None = None
    ideal_bank: str | None = None
    sepa_last4: str | None = None


class PaymentMethodCreateRequest(BaseSchema):
    """Request body for adding a payment method."""

    payment_method_id: str  # From Stripe.js


# --- Invoice ---

class Invoice(BaseSchema):
    """Invoice details."""

    id: str  # Stripe invoice ID
    number: str | None
    status: str
    amount_due: Decimal  # In cents, Decimal not float
    amount_paid: Decimal
    currency: str = "eur"
    period_start: datetime
    period_end: datetime
    hosted_invoice_url: str | None = None
    invoice_pdf: str | None = None
    created_at: datetime


# --- Usage ---

class UsageMetric(BaseSchema):
    """Current usage metrics per category."""

    category: str
    used: int
    limit: int
    percentage: float
    unit: str


class UsageOverview(BaseSchema):
    """Complete usage overview."""

    plan: PlanTier
    metrics: list[UsageMetric]
    billing_period_start: datetime
    billing_period_end: datetime


# --- Billing Details ---

class BillingDetails(BaseSchema):
    """Billing information for invoicing (Dutch BV compliance)."""

    company_name: str | None = None
    btw_number: str | None = None  # Dutch VAT number
    kvk_number: str | None = None  # Dutch Chamber of Commerce number
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    postal_code: str | None = None
    country: str = "NL"
    email: str | None = None


class BillingDetailsUpdate(BaseSchema):
    """Request body for updating billing details."""

    company_name: str | None = None
    btw_number: str | None = None
    kvk_number: str | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    postal_code: str | None = None
    country: str | None = None
    email: str | None = None


class BtwValidationResult(BaseSchema):
    """BTW (VAT) number validation result via VIES API."""

    valid: bool
    btw_number: str
    company_name: str | None = None
    company_address: str | None = None
    message: str | None = None


# --- Checkout Session ---

class CheckoutSessionResponse(BaseSchema):
    """Stripe checkout session response."""

    session_id: str
    url: str
