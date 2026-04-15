import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "__Secure-jokko-session";
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days

function getCookieOptions(isLocal: boolean) {
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "jokko.co";
    return {
        httpOnly: true,
        secure: !isLocal,
        sameSite: "lax" as const,
        path: "/",
        maxAge: MAX_AGE,
        ...(isLocal ? {} : { domain: `.${rootDomain}` }),
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
        response.cookies.set(COOKIE_NAME, token, getCookieOptions(isLocal));
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
    response.cookies.set(COOKIE_NAME, "", {
        ...getCookieOptions(isLocal),
        maxAge: 0,
    });
    return response;
}
