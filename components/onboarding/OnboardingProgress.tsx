'use client';

import {
    Check,
    Building2,
    CreditCard,
    MessageCircle,
    CheckCircle,
    Circle,
    LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OnboardingStep, OnboardingStepKey } from '@/lib/onboarding/steps';

const ICON_MAP: Record<string, LucideIcon> = {
    Building2,
    CreditCard,
    MessageCircle,
    CheckCircle,
    Circle,
};

interface OnboardingProgressProps {
    steps: OnboardingStep[];
    currentStepKey: OnboardingStepKey;
    onStepClick: (stepKey: string) => void;
}

export function OnboardingProgress({
    steps,
    currentStepKey,
    onStepClick,
}: OnboardingProgressProps) {
    const currentIndex = steps.findIndex((s) => s.key === currentStepKey);

    return (
        <nav aria-label="Progression de l'onboarding" className="mb-8 sm:mb-10">
            <ol className="flex items-start">
                {steps.map((step, index) => {
                    const isCompleted = index < currentIndex;
                    const isCurrent = step.key === currentStepKey;
                    const isClickable = index < currentIndex;

                    const IconComponent = ICON_MAP[step.icon] || Circle;

                    return (
                        <li key={step.key} className="flex-1 flex flex-col items-center relative">
                            {index > 0 && (
                                <div
                                    className={cn(
                                        'absolute top-5 sm:top-6 right-1/2 h-[2px] w-1/2 -translate-y-1/2 transition-colors duration-300',
                                        index <= currentIndex ? 'bg-green-600' : 'bg-gray-200'
                                    )}
                                    aria-hidden="true"
                                />
                            )}

                            {index < steps.length - 1 && (
                                <div
                                    className={cn(
                                        'absolute top-5 sm:top-6 left-1/2 h-[2px] w-1/2 -translate-y-1/2 transition-colors duration-300',
                                        index < currentIndex ? 'bg-green-600' : 'bg-gray-200'
                                    )}
                                    aria-hidden="true"
                                />
                            )}

                            <button
                                onClick={() => isClickable && onStepClick(step.key)}
                                disabled={!isClickable}
                                className={cn(
                                    'relative z-10 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border-2 transition-all duration-300',
                                    isCompleted && 'border-green-600 bg-green-600 text-white shadow-sm shadow-green-900/20',
                                    isCurrent && 'border-green-600 bg-white text-green-600 shadow-sm ring-4 ring-green-100',
                                    !isCompleted && !isCurrent && 'border-gray-200 bg-white text-gray-400',
                                    isClickable && 'cursor-pointer hover:bg-green-700 hover:border-green-700',
                                    !isClickable && 'cursor-default'
                                )}
                                aria-current={isCurrent ? 'step' : undefined}
                                aria-label={`${step.title}${isCompleted ? ' (complété)' : ''}${isCurrent ? ' (étape actuelle)' : ''}`}
                            >
                                {isCompleted ? (
                                    <Check className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
                                ) : (
                                    <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" />
                                )}
                            </button>

                            <span
                                className={cn(
                                    'mt-2.5 sm:mt-3 text-center text-xs font-medium max-w-[100px] hidden sm:block transition-colors',
                                    isCompleted && 'text-gray-900',
                                    isCurrent && 'text-green-700',
                                    !isCompleted && !isCurrent && 'text-gray-400'
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
