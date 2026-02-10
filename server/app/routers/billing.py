"""Billing router — Plans, checkout, subscriptions, payment methods, invoices, usage."""

from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client as SupabaseClient

from server.app.dependencies import get_supabase
from server.app.middleware.auth import require_auth
from server.app.models.billing import (
    BillingDetails,
    BillingDetailsUpdate,
    BtwValidationResult,
    CheckoutSessionResponse,
    Invoice,
    PaymentMethod,
    PaymentMethodCreateRequest,
    Subscription,
    SubscriptionCreateRequest,
    SubscriptionUpdateRequest,
    UsageOverview,
)
from server.app.services import stripe_service

router = APIRouter(prefix="/billing", tags=["billing"])


# =============================================================================
# Plans
# =============================================================================

@router.get("/plans")
async def list_plans(user: dict = Depends(require_auth)):
    """List all available subscription plans with pricing and limits."""
    return stripe_service.PLANS


# =============================================================================
# Checkout
# =============================================================================

@router.post("/checkout", response_model=CheckoutSessionResponse)
async def create_checkout(
    body: SubscriptionCreateRequest,
    user: dict = Depends(require_auth),
):
    """Create a Stripe Checkout session with iDEAL + card payment methods."""
    try:
        # Get or create Stripe customer
        customer = stripe_service.get_or_create_customer(
            org_id=user["org_id"],
            email=user.get("email", ""),
            name=user.get("name"),
        )

        # Create checkout session
        session = stripe_service.create_checkout_session(
            customer_id=customer.id,
            plan=body.plan,
            billing_interval=body.billing_interval,
            success_url=body.success_url,
            cancel_url=body.cancel_url,
        )

        return CheckoutSessionResponse(
            session_id=session.id,
            url=session.url,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Stripe error: {str(e)}")


# =============================================================================
# Subscription
# =============================================================================

@router.get("/subscription")
async def get_subscription(user: dict = Depends(require_auth)):
    """Get the current subscription for the organization."""
    customer = stripe_service.get_customer_by_org(user["org_id"])
    if not customer:
        return {"status": "no_subscription", "plan": "free"}

    sub = stripe_service.get_customer_subscription(customer.id)
    if not sub:
        return {"status": "no_subscription", "plan": "free"}

    return {
        "id": sub.id,
        "plan": sub.metadata.get("plan", "unknown"),
        "status": sub.status,
        "billing_interval": "annual" if sub.items.data[0].price.recurring.interval == "year" else "monthly",
        "current_period_start": sub.current_period_start,
        "current_period_end": sub.current_period_end,
        "cancel_at_period_end": sub.cancel_at_period_end,
        "trial_end": sub.trial_end,
    }


@router.patch("/subscription")
async def update_subscription(
    body: SubscriptionUpdateRequest,
    user: dict = Depends(require_auth),
):
    """Update the current subscription (plan change)."""
    customer = stripe_service.get_customer_by_org(user["org_id"])
    if not customer:
        raise HTTPException(status_code=404, detail="No billing account found")

    sub = stripe_service.get_customer_subscription(customer.id)
    if not sub:
        raise HTTPException(status_code=404, detail="No active subscription")

    # Determine new price
    plan = body.plan or sub.metadata.get("plan")
    interval = body.billing_interval or (
        "annual" if sub.items.data[0].price.recurring.interval == "year" else "monthly"
    )
    price_id = stripe_service.PLAN_PRICES.get((plan, interval))
    if not price_id:
        raise HTTPException(status_code=400, detail=f"Invalid plan/interval: {plan}/{interval}")

    try:
        updated = stripe_service.update_subscription(sub.id, price_id)
        return {"status": "updated", "subscription_id": updated.id}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Stripe error: {str(e)}")


@router.post("/subscription/cancel")
async def cancel_subscription(user: dict = Depends(require_auth)):
    """Cancel the current subscription at period end."""
    customer = stripe_service.get_customer_by_org(user["org_id"])
    if not customer:
        raise HTTPException(status_code=404, detail="No billing account found")

    sub = stripe_service.get_customer_subscription(customer.id)
    if not sub:
        raise HTTPException(status_code=404, detail="No active subscription")

    try:
        cancelled = stripe_service.cancel_subscription(sub.id, at_period_end=True)
        return {
            "status": "cancelling",
            "cancel_at_period_end": cancelled.cancel_at_period_end,
            "current_period_end": cancelled.current_period_end,
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Stripe error: {str(e)}")


# =============================================================================
# Payment Methods
# =============================================================================

@router.get("/payment-methods")
async def list_payment_methods(user: dict = Depends(require_auth)):
    """List payment methods for the organization."""
    customer = stripe_service.get_customer_by_org(user["org_id"])
    if not customer:
        return []

    return stripe_service.list_payment_methods(customer.id)


@router.post("/payment-methods")
async def add_payment_method(
    body: PaymentMethodCreateRequest,
    user: dict = Depends(require_auth),
):
    """Attach a payment method (from Stripe.js) to the organization."""
    customer = stripe_service.get_or_create_customer(
        org_id=user["org_id"],
        email=user.get("email", ""),
    )

    try:
        pm = stripe_service.attach_payment_method(customer.id, body.payment_method_id)
        return {"id": pm.id, "type": pm.type, "attached": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to attach: {str(e)}")


@router.delete("/payment-methods/{pm_id}")
async def remove_payment_method(
    pm_id: str,
    user: dict = Depends(require_auth),
):
    """Detach a payment method."""
    try:
        stripe_service.detach_payment_method(pm_id)
        return {"id": pm_id, "detached": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to detach: {str(e)}")


# =============================================================================
# Invoices
# =============================================================================

@router.get("/invoices")
async def list_invoices(
    limit: int = Query(20, ge=1, le=100),
    user: dict = Depends(require_auth),
):
    """List invoices for the organization."""
    customer = stripe_service.get_customer_by_org(user["org_id"])
    if not customer:
        return []

    return stripe_service.list_invoices(customer.id, limit=limit)


# =============================================================================
# Billing Details (Company, BTW, KVK)
# =============================================================================

@router.get("/details")
async def get_billing_details(
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Get billing details for the organization."""
    result = (
        db.table("organizations")
        .select("billing_details")
        .eq("id", user["org_id"])
        .single()
        .execute()
    )
    if result.data and result.data.get("billing_details"):
        return result.data["billing_details"]
    return {
        "company_name": None,
        "btw_number": None,
        "kvk_number": None,
        "country": "NL",
    }


@router.patch("/details")
async def update_billing_details(
    body: BillingDetailsUpdate,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Update billing details (company name, BTW, KVK, address)."""
    update_data = body.model_dump(exclude_unset=True)
    result = (
        db.table("organizations")
        .update({"billing_details": update_data})
        .eq("id", user["org_id"])
        .execute()
    )
    return update_data


@router.post("/details/validate-btw", response_model=BtwValidationResult)
async def validate_btw(
    body: dict,
    user: dict = Depends(require_auth),
):
    """Validate a BTW (VAT) number."""
    btw_number = body.get("btw_number", "")
    if not btw_number:
        raise HTTPException(status_code=400, detail="btw_number is required")
    return stripe_service.validate_btw_number(btw_number)


# =============================================================================
# Customer Portal
# =============================================================================

@router.post("/portal")
async def create_portal_session(
    body: dict,
    user: dict = Depends(require_auth),
):
    """Create a Stripe Customer Portal session for self-service management."""
    customer = stripe_service.get_customer_by_org(user["org_id"])
    if not customer:
        raise HTTPException(status_code=404, detail="No billing account found")

    return_url = body.get("return_url", "https://app.kijko.nl/settings/billing")

    try:
        session = stripe_service.create_portal_session(customer.id, return_url)
        return {"url": session.url}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Stripe error: {str(e)}")


# =============================================================================
# Usage (wired from Plan 03-03)
# =============================================================================

@router.get("/usage")
async def get_usage(
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Get current usage overview for the organization."""
    from server.app.services.usage import get_usage_overview
    return await get_usage_overview(db, user["org_id"])
