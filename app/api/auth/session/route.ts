import { NextRequest, NextResponse } from "next/server";

const MAX_AGE = 30 * 24 * 60 * 60; // 30 days

function getCookieName(isLocal: boolean): string {
    return isLocal ? "jokko-session" : "__Secure-jokko-session";
}

function getCookieOptions(isLocal: boolean) {
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "jokko.co";
    return {
        httpOnly: true,
        secure: !isLocal,
        sameSite: "lax" as const,
        path: "/",
        maxAge: MAX_AGE,
        ...(isLocal ? { domain: "localhost" } : { domain: `.${rootDomain}` }),
    };
}

/**
 * POST: Mirror the auth token into an HttpOnly cookie.
 * Called by ConvexClientProvider after setting the JS-accessible cookie.
 */
export async function POST(req: NextRequest) {
    try {
        const { token } = await req.json();
        if (!token || typeof token !== "string") {
            return NextResponse.json({ error: "Missing token" }, { status: 400 });
        }

        const isLocal = req.headers.get("host")?.includes("localhost") ?? false;
        const response = NextResponse.json({ ok: true });
        response.cookies.set(getCookieName(isLocal), token, getCookieOptions(isLocal));
        return response;
    } catch {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}

/**
 * DELETE: Clear the HttpOnly session cookie.
 * Called by ConvexClientProvider when removing auth tokens.
 */
export async function DELETE(req: NextRequest) {
    const isLocal = req.headers.get("host")?.includes("localhost") ?? false;
    const response = NextResponse.json({ ok: true });
    const opts = { ...getCookieOptions(isLocal), maxAge: 0 };
    response.cookies.set(getCookieName(isLocal), "", opts);
    return response;
}
