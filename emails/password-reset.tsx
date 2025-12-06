/**
 *  ____                           _   
 * |  _ \ ___  ___  ___ _ __  _ __| |_ 
 * | |_) / _ \/ __|/ _ \ '_ \| '__| __|
 * |  _ <  __/\__ \  __/ | | | |  | |_ 
 * |_| \_\___||___/\___|_| |_|_|   \__|
 *
 * PASSWORD RESET EMAIL TEMPLATE
 *
 * Sent when a user requests a password reset.
 */

import {
    Heading,
    Text,
    Section,
} from "@react-email/components";
import * as React from "react";
import { Layout } from "./components/layout";
import { Button } from "./components/button";

interface PasswordResetEmailProps {
    resetUrl: string;
}

export function PasswordResetEmail({ resetUrl }: PasswordResetEmailProps) {
    return (
        <Layout preview="Réinitialisez votre mot de passe">
            <Heading className="text-2xl font-bold text-slate-900 m-0 mb-6">
                Réinitialisez votre mot de passe
            </Heading>

            <Text className="text-slate-600 leading-relaxed m-0 mb-8">
                Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le
                bouton ci-dessous pour en créer un nouveau.
            </Text>

            <Section className="text-center mb-8">
                <Button href={resetUrl}>Réinitialiser</Button>
            </Section>

            <Text className="text-slate-400 text-xs m-0">
                Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande,
                ignorez cet email.
            </Text>
        </Layout>
    );
}

export default PasswordResetEmail;
