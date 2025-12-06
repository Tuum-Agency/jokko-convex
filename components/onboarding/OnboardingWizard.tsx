'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { OnboardingProgress } from './OnboardingProgress';
import { BusinessInfoStep } from './steps/BusinessInfoStep';
import { WhatsAppConnectStep } from './steps/WhatsAppConnectStep';
import { CompletionStep } from './steps/CompletionStep';
import { Card, CardContent } from '@/components/ui/card';
import {
    type OnboardingStepKey,
    ONBOARDING_STEPS,
    getStepByKey,
    getNextStep
} from '@/lib/onboarding/steps';

// ============================================
// STEP COMPONENTS MAP
// ============================================

const STEP_COMPONENTS: Record<OnboardingStepKey, React.ComponentType<{ onComplete: () => void }>> = {
    BUSINESS_INFO: BusinessInfoStep,
    WHATSAPP_CONNECT: WhatsAppConnectStep,
    COMPLETED: CompletionStep,
};

// ============================================
// ANIMATION VARIANTS
// ============================================

const stepVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 50 : -50,
        opacity: 0,
    }),
    center: {
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        x: direction < 0 ? 50 : -50,
        opacity: 0,
    }),
};

// ============================================
// COMPONENT
// ============================================

export function OnboardingWizard() {
    const [currentStepKey, setCurrentStepKey] = useState<OnboardingStepKey>('BUSINESS_INFO');
    const [direction, setDirection] = useState(1);

    const currentStep = getStepByKey(currentStepKey);
    const StepComponent = STEP_COMPONENTS[currentStepKey];

    const handleNext = () => {
        const nextStep = getNextStep(currentStepKey);
        if (nextStep) {
            setDirection(1);
            setCurrentStepKey(nextStep.key);
        }
    };

    const handleStepClick = (stepKey: string) => {
        // Basic navigation logic: allow going back or to completed steps
        // For now, simpler implementation: verify order
        const targetStep = getStepByKey(stepKey as OnboardingStepKey);
        const current = getStepByKey(currentStepKey);

        if (targetStep && current) {
            if (targetStep.order < current.order) {
                setDirection(-1);
                setCurrentStepKey(targetStep.key);
            }
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto px-4 py-8">
            {/* Progress Bar */}
            <OnboardingProgress
                steps={ONBOARDING_STEPS}
                currentStepKey={currentStepKey}
                onStepClick={handleStepClick}
            />

            {/* Page Header */}
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">{currentStep?.title}</h1>
                <p className="mt-2 text-gray-500">{currentStep?.description}</p>
            </div>

            {/* Step Content */}
            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6 sm:p-8">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={currentStepKey}
                            custom={direction}
                            variants={stepVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                        >
                            <StepComponent onComplete={handleNext} />
                        </motion.div>
                    </AnimatePresence>
                </CardContent>
            </Card>
        </div>
    );
}
