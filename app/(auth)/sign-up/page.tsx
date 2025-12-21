import { Metadata } from 'next';
import SignUpContent from './content';

export const metadata: Metadata = {
    title: "Inscription - Jokko (Essai Gratuit)",
    description: "Créez votre compte Jokko gratuitement et commencez à automatiser votre relation client sur WhatsApp dès aujourd'hui.",
};

export default function SignUpPage() {
    return <SignUpContent />;
}
