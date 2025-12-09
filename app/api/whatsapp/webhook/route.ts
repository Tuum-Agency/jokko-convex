import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// 1. Verification Challenge (GET)
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    console.log(`[NextJS Webhook] Verify attempt: mode=${mode}, token=${token}`);

    if (mode === "subscribe" && token === "jokko_webhook_verify_2024") {
        console.log("[NextJS Webhook] Verified!");
        return new NextResponse(challenge, { status: 200 });
    }
    return new NextResponse("Forbidden", { status: 403 });
}

// 2. Event Notification (POST)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;

        if (!value) return new NextResponse("No value", { status: 200 });

        // Case A: Messages entrants
        if (value.messages) {
            const contacts = value.contacts || [];
            for (const message of value.messages) {
                console.log(`[NextJS Webhook] Received message from ${message.from}`);

                await convex.mutation(api.webhook.handleIncomingMessage, {
                    message,
                    phoneNumberId: value.metadata?.phone_number_id,
                    contact: contacts.find((c: any) => c.wa_id === message.from)
                });
            }
        }

        // Case B: Status updates
        if (value.statuses) {
            for (const status of value.statuses) {
                console.log(`[NextJS Webhook] Status update: ${status.status}`);

                await convex.mutation(api.webhook.handleStatusUpdate, {
                    waMessageId: status.id,
                    status: status.status,
                    timestamp: status.timestamp,
                    errors: status.errors
                });
            }
        }

        return new NextResponse("OK", { status: 200 });
    } catch (error) {
        console.error("[NextJS Webhook] Error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
