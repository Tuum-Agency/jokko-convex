import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Helper to decode Base64URL
function base64decode(str: string) {
    return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
}

// Helper to verify signature
function verifySignature(signedRequest: string, appSecret: string) {
    const [encodedSig, payload] = signedRequest.split('.');

    if (!encodedSig || !payload) return null;

    const sig = Buffer.from(encodedSig.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    const expectedSig = crypto
        .createHmac('sha256', appSecret)
        .update(payload)
        .digest();

    if (!crypto.timingSafeEqual(sig, expectedSig)) {
        return null;
    }

    return JSON.parse(base64decode(payload));
}

export async function POST(req: NextRequest) {
    try {
        // Facebook sends data as form-data
        const formData = await req.formData();
        const signedRequest = formData.get('signed_request') as string;

        if (!signedRequest) {
            return NextResponse.json({ error: 'Missing signed_request' }, { status: 400 });
        }

        // Validate Signature
        // NOTE: Ensure FACEBOOK_APP_SECRET is set in your .env file
        const appSecret = process.env.FACEBOOK_APP_SECRET;

        if (!appSecret) {
            console.error('FACEBOOK_APP_SECRET is not defined');
            // Allow dev bypass or fail? Better fail securely.
            // keeping it failing but logging helpful error.
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const data = verifySignature(signedRequest, appSecret);

        if (!data) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // Here you would process the deletion:
        // data.user_id contains the user's scoped ID
        // Perform deletion logic...

        // Generate a confirmation code
        const confirmationCode = `del_${data.user_id}_${Date.now().toString(36)}`;

        // Return the required JSON response
        return NextResponse.json({
            url: `${process.env.NEXT_PUBLIC_APP_URL}/privacy`, // URL where user can check status (or a dedicated status page)
            confirmation_code: confirmationCode,
        });

    } catch (error) {
        console.error('Data Deletion Callback Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
