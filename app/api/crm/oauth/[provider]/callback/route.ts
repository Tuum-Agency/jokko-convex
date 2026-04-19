import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

/**
 * CRM OAuth callback. Provider redirects the browser here with ?code and ?state.
 * We forward to the Convex action `crm.oauth.complete`, which verifies the state
 * HMAC, exchanges the code for tokens, encrypts & persists them, and kicks off
 * the initial import. On success we bounce the user to /dashboard/integrations.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ provider: string }> },
) {
    const { provider } = await params;
    const url = new URL(req.url);
    const error = url.searchParams.get("error");
    const state = url.searchParams.get("state");
    const code = url.searchParams.get("code");

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;
    const destination = new URL("/dashboard/integrations", siteUrl);

    if (error) {
        destination.searchParams.set("error", error);
        destination.searchParams.set("provider", provider);
        return NextResponse.redirect(destination);
    }

    if (!state || !code) {
        destination.searchParams.set("error", "missing_params");
        destination.searchParams.set("provider", provider);
        return NextResponse.redirect(destination);
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
        destination.searchParams.set("error", "server_misconfigured");
        return NextResponse.redirect(destination);
    }

    try {
        const client = new ConvexHttpClient(convexUrl);
        const result = await client.action(api.crm.oauth.complete, { state, code });
        destination.searchParams.set("connected", result.provider);
        destination.searchParams.set("connectionId", result.connectionId);
        return NextResponse.redirect(destination);
    } catch (e) {
        const message = e instanceof Error ? e.message : "oauth_failed";
        destination.searchParams.set("error", "oauth_exchange_failed");
        destination.searchParams.set("detail", message.slice(0, 200));
        destination.searchParams.set("provider", provider);
        return NextResponse.redirect(destination);
    }
}
