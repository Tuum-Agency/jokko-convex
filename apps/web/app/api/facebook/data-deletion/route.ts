import { NextRequest, NextResponse } from 'next/server';

/**
 * Facebook Data Deletion Callback.
 * Proxies to the Convex HTTP endpoint which handles signature verification
 * and actual data deletion.
 */
export async function POST(req: NextRequest) {
    const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.replace('.cloud', '.site');

    if (!convexSiteUrl) {
        console.error('[FB Data Deletion] NEXT_PUBLIC_CONVEX_URL not configured');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        // Forward the request body to the Convex HTTP endpoint
        const body = await req.text();
        const response = await fetch(`${convexSiteUrl}/api/facebook/data-deletion`, {
            method: 'POST',
            headers: {
                'Content-Type': req.headers.get('content-type') || 'application/x-www-form-urlencoded',
            },
            body,
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Data Deletion Callback Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
