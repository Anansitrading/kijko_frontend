// CurrentPlan component - Display and manage subscription
// Setting Sprint 7: Billing and Usage

import React, { useState } from 'react';
import {
  CreditCard,
  Check,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { tw } from '../../../styles/settings';
import type {
  CurrentPlanProps,
  Subscription,
  PlanTier,
  Plan,
} from '../../../types/settings';
import { PLANS } from '../../../types/settings';

// Plan Comparison Modal
interface PlanComparisonModalProps {
  isOpen: boolean;
  currentPlanId: PlanTier;
  subscription: Subscription | null;
  onClose: () => void;
  onSelectPlan: (planId: PlanTier) => void;
}

function PlanComparisonModal({
  isOpen,
  currentPlanId,
  subscription,
  onClose,
  onSelectPlan,
}: PlanComparisonModalProps) {
  if (!isOpen) return null;

  const currentPlanIndex = PLANS.findIndex(p => p.id === currentPlanId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Compare Plans</h2>
          <button onClick={onClose} className={tw.buttonGhost}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan, index) => {
            const isCurrent = plan.id === currentPlanId;
            const isUpgrade = index > currentPlanIndex;
            const isDowngrade = index < currentPlanIndex;

            return (
              <div
                key={plan.id}
                className={`relative rounded-lg border p-4 ${
                  isCurrent
                    ? 'border-primary bg-primary/5'
                    : plan.isPopular
                    ? 'border-accent'
                    : 'border-border'
                }`}
              >
                {plan.isPopular && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-accent text-accent-foreground text-xs font-medium rounded">
                    Popular
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded">
                    Current
                  </div>
                )}

                <h3 className="text-lg font-semibold text-foreground mt-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>

                <div className="mt-4">
                  {plan.price === -1 ? (
                    <span className="text-2xl font-bold text-foreground">Custom</span>
                  ) : plan.price === 0 ? (
                    <span className="text-2xl font-bold text-foreground">Free</span>
                  ) : (
                    <>
                      <span className="text-2xl font-bold text-foreground">
                        €{plan.price}
                      </span>
                      <span className="text-muted-foreground">/mo</span>
                    </>
                  )}
                </div>

                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2 px-4 rounded-md bg-muted text-muted-foreground cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : plan.price === -1 ? (
                    <button
                      onClick={() => window.open('mailto:sales@hypervisa.io', '_blank')}
                      className={`w-full py-2 px-4 rounded-md ${tw.buttonSecondary}`}
                    >
                      Contact Sales
                    </button>
                  ) : (
                    <button
                      onClick={() => onSelectPlan(plan.id)}
                      className={`w-full py-2 px-4 rounded-md ${
                        isUpgrade ? tw.buttonPrimary : tw.buttonSecondary
                      }`}
                    >
                      {isUpgrade ? 'Upgrade' : 'Downgrade'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function CurrentPlan({
  subscription,
  onUpgrade,
  onDowngrade,
  onCancelSubscription,
  onResumeSubscription,
}: CurrentPlanProps) {
  const [showComparison, setShowComparison] = useState(false);
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  const currentPlan = PLANS.find(p => p.id === (subscription?.planId || 'free')) || PLANS[0];
  const currentPlanIndex = PLANS.findIndex(p => p.id === currentPlan.id);

  const handleSelectPlan = async (planId: PlanTier) => {
    setIsChangingPlan(true);
    try {
      const newPlanIndex = PLANS.findIndex(p => p.id === planId);
      if (newPlanIndex > currentPlanIndex) {
        await onUpgrade(planId);
      } else {
        await onDowngrade(planId);
      }
      setShowComparison(false);
    } finally {
      setIsChangingPlan(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="space-y-4">
      {/* Current Plan Card */}
      <div className={`${tw.card} relative overflow-hidden`}>
        {currentPlan.isPopular && (
          <div className="absolute top-0 right-0 px-3 py-1 bg-accent text-accent-foreground text-xs font-medium rounded-bl">
            <Sparkles className="w-3 h-3 inline mr-1" />
            Most Popular
          </div>
        )}

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <h4 className="text-lg font-semibold text-foreground">{currentPlan.name}</h4>
              {subscription?.status === 'active' && (
                <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs font-medium rounded">
                  Active
                </span>
              )}
              {subscription?.status === 'trialing' && (
                <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded">
                  Trial
                </span>
              )}
              {subscription?.cancelAtPeriodEnd && (
                <span className="px-2 py-0.5 bg-warning/20 text-warning text-xs font-medium rounded">
                  Canceling
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{currentPlan.description}</p>
          </div>

          <div className="text-right">
            {currentPlan.price === 0 ? (
              <span className="text-2xl font-bold text-foreground">Free</span>
            ) : currentPlan.price === -1 ? (
              <span className="text-2xl font-bold text-foreground">Custom</span>
            ) : (
              <>
                <span className="text-2xl font-bold text-foreground">€{currentPlan.price}</span>
                <span className="text-muted-foreground">/month</span>
                {subscription?.billingInterval === 'annually' && (
                  <p className="text-xs text-accent">Billed annually</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Billing Period Info */}
        {subscription && subscription.planId !== 'free' && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current period</span>
              <span className="text-foreground">
                {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
              </span>
            </div>

            {subscription.cancelAtPeriodEnd && (
              <div className="mt-2 p-3 bg-warning/10 border border-warning/20 rounded-md flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-warning font-medium">Subscription ending</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your subscription will end on {formatDate(subscription.currentPeriodEnd)}.
                    You can resume your subscription anytime before that date.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Plan Features Summary */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <h5 className="text-sm font-medium text-foreground mb-2">Plan includes:</h5>
          <div className="grid grid-cols-2 gap-2">
            {currentPlan.features.slice(0, 4).map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-accent" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-3">
          <button
            onClick={() => setShowComparison(true)}
            className={tw.buttonPrimary}
          >
            {currentPlanIndex < PLANS.length - 2 ? (
              <>
                <ArrowUpRight className="w-4 h-4 mr-1 inline" />
                Upgrade Plan
              </>
            ) : (
              'Compare Plans'
            )}
          </button>

          {subscription && subscription.planId !== 'free' && (
            subscription.cancelAtPeriodEnd ? (
              <button
                onClick={onResumeSubscription}
                className={tw.buttonSecondary}
              >
                Resume Subscription
              </button>
            ) : (
              <button
                onClick={onCancelSubscription}
                className="text-sm text-muted-foreground hover:text-destructive transition-colors"
              >
                Cancel Subscription
              </button>
            )
          )}
        </div>
      </div>

      {/* Plan Comparison Modal */}
      <PlanComparisonModal
        isOpen={showComparison}
        currentPlanId={currentPlan.id}
        subscription={subscription}
        onClose={() => setShowComparison(false)}
        onSelectPlan={handleSelectPlan}
      />
    </div>
  );
}

export default CurrentPlan;
