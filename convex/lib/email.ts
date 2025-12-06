/**
 *  _____                 _ _ 
 * | ____|_ __ ___   __ _(_) |
 * |  _| | '_ ` _ \ / _` | | |
 * | |___| | | | | | (_| | | |
 * |_____|_| |_| |_|\__,_|_|_|
 *
 * EMAIL SERVICE
 *
 * Handles sending transactional emails via AWS SES.
 * Renders React Email templates to HTML/Text.
 */

import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { render } from "@react-email/render";
import { InvitationEmail } from "../../emails/invitation";
import { VerificationEmail } from "../../emails/verification";
import { PasswordResetEmail } from "../../emails/password-reset";

const ses = new SESClient({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

interface SendEmailParams {
    to: string;
    subject: string;
    react: React.ReactElement;
}

export async function sendEmail({ to, subject, react }: SendEmailParams) {
    const html = await render(react);
    const text = await render(react, { plainText: true });

    const command = new SendEmailCommand({
        Source: process.env.AWS_SES_FROM_EMAIL!,
        Destination: { ToAddresses: [to] },
        Message: {
            Subject: { Data: subject, Charset: "UTF-8" },
            Body: {
                Html: { Data: html, Charset: "UTF-8" },
                Text: { Data: text, Charset: "UTF-8" },
            },
        },
    });

    return ses.send(command);
}

// ============================================
// Email Senders
// ============================================

export async function sendInvitationEmail(params: {
    to: string;
    orgName: string;
    inviterName: string;
    role: "ADMIN" | "AGENT";
    inviteUrl: string;
}) {
    return sendEmail({
        to: params.to,
        subject: `Invitation à rejoindre ${params.orgName} sur Jokko`,
        react: InvitationEmail({
            orgName: params.orgName,
            inviterName: params.inviterName,
            role: params.role,
            inviteUrl: params.inviteUrl,
        }),
    });
}

export async function sendVerificationEmail(params: {
    to: string;
    verifyUrl: string;
}) {
    return sendEmail({
        to: params.to,
        subject: "Vérifiez votre email - Jokko",
        react: VerificationEmail({ verifyUrl: params.verifyUrl }),
    });
}

export async function sendPasswordResetEmail(params: {
    to: string;
    resetUrl: string;
}) {
    return sendEmail({
        to: params.to,
        subject: "Réinitialisez votre mot de passe - Jokko",
        react: PasswordResetEmail({ resetUrl: params.resetUrl }),
    });
}
