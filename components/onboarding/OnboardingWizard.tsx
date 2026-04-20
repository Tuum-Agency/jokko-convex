'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { OnboardingProgress } from './OnboardingProgress';
import { BusinessInfoStep } from './steps/BusinessInfoStep';
import { PlanSelectStep } from './steps/PlanSelectStep';
import { WhatsAppConnectStep } from './steps/WhatsAppConnectStep';
import { CompletionStep } from './steps/CompletionStep';
import { Card, CardContent } from '@/components/ui/card';
import {
    type OnboardingStepKey,
    ONBOARDING_STEPS,
    getStepByKey,
    getNextStep
} from '@/lib/onboarding/steps';

const STEP_COMPONENTS: Record<OnboardingStepKey, React.ComponentType<{ onComplete: () => void }>> = {
    BUSINESS_INFO: BusinessInfoStep,
    PLAN_SELECT: PlanSelectStep,
    WHATSAPP_CONNECT: WhatsAppConnectStep,
    COMPLETED: CompletionStep,
};

const STEP_CARD_WIDTH: Record<OnboardingStepKey, string> = {
    BUSINESS_INFO: 'max-w-2xl',
    PLAN_SELECT: 'max-w-5xl',
    WHATSAPP_CONNECT: 'max-w-xl',
    COMPLETED: 'max-w-3xl',
};

const stepVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 40 : -40,
        opacity: 0,
    }),
    center: {
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        x: direction < 0 ? 40 : -40,
        opacity: 0,
    }),
};

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
        const targetStep = getStepByKey(stepKey as OnboardingStepKey);
        const current = getStepByKey(currentStepKey);

        if (targetStep && current) {
            if (targetStep.order < current.order) {
                setDirection(-1);
                setCurrentStepKey(targetStep.key);
            }
        }
    };

    const cardWidth = STEP_CARD_WIDTH[currentStepKey];

    return (
        <div className="w-full px-3 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-12">
            <div className="w-full max-w-5xl mx-auto">
                <OnboardingProgress
                    steps={ONBOARDING_STEPS}
                    currentStepKey={currentStepKey}
                    onStepClick={handleStepClick}
                />

                <div className="text-center mb-6 sm:mb-8">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                        {currentStep?.title}
                    </h1>
                    <p className="mt-1.5 text-sm text-gray-500">
                        {currentStep?.description}
                    </p>
                </div>
            </div>

            <motion.div
                layout
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                className={`w-full ${cardWidth} mx-auto`}
            >
                <Card className="border border-gray-100 shadow-sm bg-white">
                    <CardContent className="p-5 sm:p-7 lg:p-9">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={currentStepKey}
                            custom={direction}
                            variants={stepVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                        >
                            <StepComponent onComplete={handleNext} />
                        </motion.div>
                    </AnimatePresence>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
