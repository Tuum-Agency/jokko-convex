/**
 *  ___            _ _        _   _             
 * |_ _|_ __   ___(_) |_ __ _| |_(_) ___  _ __  
 *  | || '_ \ / _ \ | __/ _` | __| |/ _ \| '_ \ 
 *  | || | | |  __/ | || (_| | |_| | (_) | | | |
 * |___|_| |_|\___|_|\__\__,_|\__|_|\___/|_| |_|
 *
 * INVITATION EMAIL TEMPLATE
 *
 * Sent when a user invites a new member to an organization.
 * Contains:
 * - Inviter name
 * - Organization name
 * - Role
 * - Call to action to join
 */

import {
    Heading,
    Text,
    Section,
} from "@react-email/components";
import * as React from "react";
import { Layout } from "./components/layout";
import { Button } from "./components/button";

interface InvitationEmailProps {
    orgName: string;
    inviterName: string;
    role: "ADMIN" | "AGENT";
    inviteUrl: string;
}

export function InvitationEmail({
    orgName,
    inviterName,
    role,
    inviteUrl,
}: InvitationEmailProps) {
    const roleLabel = role === "ADMIN" ? "Administrateur" : "Agent";

    return (
        <Layout preview={`${inviterName} vous invite à rejoindre ${orgName}`}>
            <Heading className="text-2xl font-bold text-slate-900 m-0 mb-6">
                Rejoignez {orgName}
            </Heading>

            <Text className="text-slate-600 leading-relaxed m-0 mb-4">
                <strong>{inviterName}</strong> vous invite à rejoindre{" "}
                <strong>{orgName}</strong> sur Jokko en tant que{" "}
                <strong>{roleLabel}</strong>.
            </Text>

            <Text className="text-slate-600 leading-relaxed m-0 mb-8">
                Jokko permet de gérer vos conversations WhatsApp Business de manière
                professionnelle avec votre équipe.
            </Text>

            <Section className="text-center mb-8">
                <Button href={inviteUrl}>Accepter l'invitation</Button>
            </Section>

            <Text className="text-slate-400 text-xs m-0">
                Ce lien expire dans 7 jours. Si vous n'avez pas demandé cette
                invitation, ignorez cet email.
            </Text>
        </Layout>
    );
}

export default InvitationEmail;
