import AutomationsClient from './client';
import { FeatureGate } from '@/components/billing/feature-gate';

export default function AutomationsPage() {
    return (
        <FeatureGate feature="chatbot">
            <AutomationsClient />
        </FeatureGate>
    );
}
