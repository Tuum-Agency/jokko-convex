import { Metadata } from 'next';
import SignInContent from './content';

export const metadata: Metadata = {
    title: "Connexion - Jokko",
    description: "Connectez-vous à votre espace Jokko pour gérer vos conversations WhatsApp Business et vos campagnes marketing.",
};

export default function SignInPage() {
    return <SignInContent />;
}
