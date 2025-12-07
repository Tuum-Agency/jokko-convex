/**
 * __     __        _  __ _          _   _             
 * \ \   / /__ _ __(_)/ _(_) ___ __ | |_(_) ___  _ __  
 *  \ \ / / _ \ '__| | |_| |/ __/ _` | __| |/ _ \| '_ \ 
 *   \ V /  __/ |  | |  _| | (_| (_| | |_| | (_) | | | |
 *    \_/ \___|_|  |_|_| |_|\___\__,_|\__|_|\___/|_| |_|
 *
 * VERIFICATION EMAIL TEMPLATE
 *
 * Sent to verify a user's email address during sign up or when changing email.
 */

import {
    Heading,
    Text,
    Section,
} from "@react-email/components";
import * as React from "react";
import { Layout } from "./components/layout";
import { Button } from "./components/button";

interface VerificationEmailProps {
    verifyUrl: string;
}

export function VerificationEmail({ verifyUrl }: VerificationEmailProps) {
    return (
        <Layout preview="Vérifiez votre adresse email">
            <Heading className="text-2xl font-bold text-slate-900 m-0 mb-6">
                Vérifiez votre email
            </Heading>

            <Text className="text-slate-600 leading-relaxed m-0 mb-8">
                Cliquez sur le bouton ci-dessous pour confirmer votre adresse email et
                activer votre compte Jokko.
            </Text>

            <Section className="text-center mb-8">
                <Button href={verifyUrl}>Vérifier mon email</Button>
            </Section>

            <Text className="text-slate-400 text-xs m-0">
                Ce lien expire dans 24 heures.
            </Text>
        </Layout>
    );
}

export default VerificationEmail;
