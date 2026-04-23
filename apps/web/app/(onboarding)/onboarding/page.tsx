'use client';

import { FadeInView } from '@/components/animations';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

export default function OnboardingPage() {
    return (
        <FadeInView>
            <OnboardingWizard />
        </FadeInView>
    );
}
