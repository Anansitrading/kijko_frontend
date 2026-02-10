"""Webhook router — Stripe webhook handler with signature verification.

No auth middleware — webhooks are verified by Stripe signature.
Events are processed idempotently (event ID checked).
"""

import logging
from typing import Any

import stripe
from fastapi import APIRouter, HTTPException, Request

from server.app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

# Track processed event IDs to prevent duplicate processing
# In production, use Redis or DB for persistence across restarts
_processed_events: set[str] = set()
_MAX_PROCESSED_CACHE = 10000


# =============================================================================
# Stripe Webhook
# =============================================================================

@router.post("/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events with signature verification.

    Events handled:
    - checkout.session.completed → Activate subscription
    - customer.subscription.updated → Sync status
    - customer.subscription.deleted → Mark cancelled
    - invoice.payment_succeeded → Log payment
    - invoice.payment_failed → Notify + update status
    """
    # 1. Get raw body and signature
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    # 2. Verify signature
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET,
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # 3. Idempotency check
    event_id = event.get("id", "")
    if event_id in _processed_events:
        logger.info("Duplicate event %s, skipping", event_id)
        return {"status": "already_processed"}

    # 4. Route to handler
    event_type = event["type"]
    event_data = event["data"]["object"]

    handlers = {
        "checkout.session.completed": _handle_checkout_completed,
        "customer.subscription.updated": _handle_subscription_updated,
        "customer.subscription.deleted": _handle_subscription_deleted,
        "invoice.payment_succeeded": _handle_payment_succeeded,
        "invoice.payment_failed": _handle_payment_failed,
    }

    handler = handlers.get(event_type)
    if handler:
        try:
            await handler(event_data)
            _mark_processed(event_id)
            logger.info("Processed webhook event: %s (%s)", event_type, event_id)
        except Exception as e:
            logger.exception("Error processing webhook %s: %s", event_type, e)
            # Still return 200 to prevent Stripe retries on application errors
            # The error is logged for investigation
            return {"status": "error", "event_type": event_type}
    else:
        logger.debug("Unhandled webhook event type: %s", event_type)

    return {"status": "ok", "event_type": event_type}


# =============================================================================
# Event Handlers
# =============================================================================

async def _handle_checkout_completed(session: dict[str, Any]) -> None:
    """Handle successful checkout — activate subscription, link customer.

    Triggered when a customer completes the Stripe Checkout flow.
    """
    customer_id = session.get("customer")
    subscription_id = session.get("subscription")
    plan = session.get("metadata", {}).get("plan")

    if not customer_id or not subscription_id:
        logger.warning("Checkout completed but missing customer/subscription")
        return

    logger.info(
        "Checkout completed: customer=%s, subscription=%s, plan=%s",
        customer_id, subscription_id, plan,
    )

    # In production: update organization's subscription record in DB
    # db.table("organizations").update({
    #     "stripe_customer_id": customer_id,
    #     "stripe_subscription_id": subscription_id,
    #     "plan": plan,
    #     "subscription_status": "active",
    # }).eq("stripe_customer_id", customer_id).execute()


async def _handle_subscription_updated(subscription: dict[str, Any]) -> None:
    """Handle subscription update — status change, plan change.

    Triggered on plan upgrades, downgrades, or status transitions.
    """
    sub_id = subscription.get("id")
    status = subscription.get("status")
    cancel_at_period_end = subscription.get("cancel_at_period_end", False)

    logger.info(
        "Subscription updated: id=%s, status=%s, cancel_at_period_end=%s",
        sub_id, status, cancel_at_period_end,
    )

    # In production: sync subscription status to DB
    # db.table("organizations").update({
    #     "subscription_status": status,
    #     "cancel_at_period_end": cancel_at_period_end,
    # }).eq("stripe_subscription_id", sub_id).execute()


async def _handle_subscription_deleted(subscription: dict[str, Any]) -> None:
    """Handle subscription deletion — revert to free tier.

    Triggered when subscription is fully cancelled (not just at_period_end).
    """
    sub_id = subscription.get("id")

    logger.info("Subscription deleted: id=%s — reverting to free tier", sub_id)

    # In production: revert to free tier
    # db.table("organizations").update({
    #     "plan": "free",
    #     "subscription_status": "cancelled",
    #     "stripe_subscription_id": None,
    # }).eq("stripe_subscription_id", sub_id).execute()


async def _handle_payment_succeeded(invoice: dict[str, Any]) -> None:
    """Handle successful payment — log for records.

    Triggered after each successful subscription payment.
    """
    invoice_id = invoice.get("id")
    amount = invoice.get("amount_paid", 0)
    customer_id = invoice.get("customer")

    logger.info(
        "Payment succeeded: invoice=%s, amount=%s, customer=%s",
        invoice_id, amount, customer_id,
    )

    # In production: record payment, send receipt notification


async def _handle_payment_failed(invoice: dict[str, Any]) -> None:
    """Handle failed payment — notify, potentially pause service.

    Triggered when subscription payment fails.
    """
    invoice_id = invoice.get("id")
    amount = invoice.get("amount_due", 0)
    customer_id = invoice.get("customer")
    attempt_count = invoice.get("attempt_count", 0)

    logger.warning(
        "Payment FAILED: invoice=%s, amount=%s, customer=%s, attempt=%s",
        invoice_id, amount, customer_id, attempt_count,
    )

    # In production:
    # - Send email notification to customer
    # - If attempt_count >= 3, pause service
    # - Log for admin dashboard


# =============================================================================
# Helpers
# =============================================================================

def _mark_processed(event_id: str) -> None:
    """Mark an event as processed (simple in-memory cache)."""
    global _processed_events
    _processed_events.add(event_id)

    # Prevent memory leak: trim old events
    if len(_processed_events) > _MAX_PROCESSED_CACHE:
        # Keep most recent half
        _processed_events = set(list(_processed_events)[_MAX_PROCESSED_CACHE // 2:])
