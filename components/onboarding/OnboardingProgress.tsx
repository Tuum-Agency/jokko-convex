'use client';

import {
    Check,
    Building2,
    MessageCircle,
    CheckCircle,
    Circle,
    LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OnboardingStep, OnboardingStepKey } from '@/lib/onboarding/steps';

// ============================================
// ICON MAP
// ============================================

const ICON_MAP: Record<string, LucideIcon> = {
    Building2,
    MessageCircle,
    CheckCircle,
    Circle,
};

// ============================================
// TYPES
// ============================================

interface OnboardingProgressProps {
    steps: OnboardingStep[];
    currentStepKey: OnboardingStepKey;
    onStepClick: (stepKey: string) => void;
}

// ============================================
// COMPONENT
// ============================================

export function OnboardingProgress({
    steps,
    currentStepKey,
    onStepClick,
}: OnboardingProgressProps) {
    const currentIndex = steps.findIndex((s) => s.key === currentStepKey);

    return (
        <nav aria-label="Progression de l'onboarding" className="mb-8">
            <ol className="flex items-start">
                {steps.map((step, index) => {
                    const isCompleted = index < currentIndex;
                    const isCurrent = step.key === currentStepKey;
                    const isClickable = index < currentIndex;

                    // Dynamic icon
                    const IconComponent = ICON_MAP[step.icon] || Circle;

                    return (
                        <li key={step.key} className="flex-1 flex flex-col items-center relative">
                            {/* Connector Line (before) - positioned absolutely */}
                            {index > 0 && (
                                <div
                                    className={cn(
                                        'absolute top-6 right-1/2 h-0.5 w-1/2 -translate-y-1/2 transition-colors',
                                        index <= currentIndex ? 'bg-green-600' : 'bg-gray-200'
                                    )}
                                    aria-hidden="true"
                                />
                            )}

                            {/* Connector Line (after) - positioned absolutely */}
                            {index < steps.length - 1 && (
                                <div
                                    className={cn(
                                        'absolute top-6 left-1/2 h-0.5 w-1/2 -translate-y-1/2 transition-colors',
                                        index < currentIndex ? 'bg-green-600' : 'bg-gray-200'
                                    )}
                                    aria-hidden="true"
                                />
                            )}

                            {/* Step Circle */}
                            <button
                                onClick={() => isClickable && onStepClick(step.key)}
                                disabled={!isClickable}
                                className={cn(
                                    'relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all',
                                    isCompleted && 'border-green-600 bg-green-600 text-white',
                                    isCurrent && 'border-green-600 bg-white text-green-600',
                                    !isCompleted && !isCurrent && 'border-gray-200 bg-white text-gray-400',
                                    isClickable && 'cursor-pointer hover:bg-green-50',
                                    !isClickable && 'cursor-default'
                                )}
                                aria-current={isCurrent ? 'step' : undefined}
                                aria-label={`${step.title}${isCompleted ? ' (complété)' : ''}${isCurrent ? ' (étape actuelle)' : ''}`}
                            >
                                {isCompleted ? (
                                    <Check className="h-5 w-5" />
                                ) : (
                                    <IconComponent className="h-5 w-5" />
                                )}
                            </button>

                            {/* Step Label (centered under icon) */}
                            <span
                                className={cn(
                                    'mt-3 text-center text-xs font-medium max-w-[100px] hidden sm:block',
                                    isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'
                                )}
                            >
                                {step.title}
                            </span>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
