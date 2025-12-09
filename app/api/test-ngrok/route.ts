import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: "ok",
        message: "Ngrok and Next.js are working correctly!",
        timestamp: new Date().toISOString()
    });
}
