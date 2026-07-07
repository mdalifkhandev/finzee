import { useCallback, useState } from 'react';

export type InterventionStage = 'idle' | 'behavior' | 'goal-impact' | 'intervention' | 'decision';

export interface BehaviorAnalysis {
  recentPurchaseCount: number;
  categorySpend: number;
  categorySpendChange: number; // % vs. baseline
  isImpulsive: boolean;
}

export interface GoalImpactAnalysis {
  goalName: string;
  goalProgress: number; // 0-100
  monthsDelayed: number;
  percentOfBudgetRemaining: number;
}

export interface InterventionRecommendation {
  level: 'none' | 'caution' | 'warning';
  message: string;
  suggestion: string;
}

export interface PurchaseEvaluation {
  amount: number;
  category: string;
  behavior: BehaviorAnalysis;
  goalImpact: GoalImpactAnalysis;
  intervention: InterventionRecommendation;
}

const STAGE_DELAY_MS = 800;

function analyzeBehavior(amount: number): BehaviorAnalysis {
  const recentPurchaseCount = Math.floor(Math.random() * 6) + 1;
  const categorySpendChange = Math.round(Math.random() * 60 - 10);
  const categorySpend = Math.round(amount * (1.5 + Math.random() * 2));

  return {
    recentPurchaseCount,
    categorySpend,
    categorySpendChange,
    isImpulsive: recentPurchaseCount >= 4 || categorySpendChange > 35,
  };
}

function analyzeGoalImpact(amount: number): GoalImpactAnalysis {
  const monthsDelayed = amount > 200 ? Math.ceil(amount / 250) : 0;

  return {
    goalName: 'Emergency Fund',
    goalProgress: 62,
    monthsDelayed,
    percentOfBudgetRemaining: Math.max(5, Math.round(100 - amount / 10)),
  };
}

function buildIntervention(
  amount: number,
  behavior: BehaviorAnalysis,
  goalImpact: GoalImpactAnalysis
): InterventionRecommendation {
  if (behavior.isImpulsive && goalImpact.monthsDelayed > 0) {
    return {
      level: 'warning',
      message: `This $${amount.toFixed(2)} trade would push your ${goalImpact.goalName} goal back by ${goalImpact.monthsDelayed} month${goalImpact.monthsDelayed > 1 ? 's' : ''}.`,
      suggestion: 'Consider waiting 24 hours, or sizing down the position before committing.',
    };
  }

  if (behavior.isImpulsive) {
    return {
      level: 'caution',
      message: `You've made ${behavior.recentPurchaseCount} similar trades recently — activity in this category is up ${behavior.categorySpendChange}%.`,
      suggestion: 'A short pause often helps avoid decisions you might regret.',
    };
  }

  return {
    level: 'none',
    message: 'This looks consistent with your usual habits and goals.',
    suggestion: "You're on track — go ahead!",
  };
}

export function usePurchaseIntervention() {
  const [stage, setStage] = useState<InterventionStage>('idle');
  const [evaluation, setEvaluation] = useState<PurchaseEvaluation | null>(null);

  const evaluate = useCallback((amount: number, category: string = 'Trading') => {
    setEvaluation(null);
    setStage('behavior');

    const behavior = analyzeBehavior(amount);

    setTimeout(() => {
      setStage('goal-impact');
      const goalImpact = analyzeGoalImpact(amount);

      setTimeout(() => {
        setStage('intervention');
        const intervention = buildIntervention(amount, behavior, goalImpact);
        setEvaluation({ amount, category, behavior, goalImpact, intervention });

        setTimeout(() => {
          setStage('decision');
        }, STAGE_DELAY_MS);
      }, STAGE_DELAY_MS);
    }, STAGE_DELAY_MS);
  }, []);

  const reset = useCallback(() => {
    setStage('idle');
    setEvaluation(null);
  }, []);

  return { stage, evaluation, evaluate, reset };
}
