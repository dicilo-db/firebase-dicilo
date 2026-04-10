
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');
    // const filename = searchParams.get('filename') || 'image.webp';

    if (!url) {
        return new NextResponse('Missing URL', { status: 400 });
    }

    // Security: Validate domain to prevent open proxy abuse
    try {
        const urlObj = new URL(url);
        // Allow firebase storage and maybe others if valid
        // Ideally strict check: firebasestorage.googleapis.com
        if (!urlObj.hostname.includes('firebasestorage.googleapis.com')) {
            return new NextResponse('Invalid URL domain', { status: 403 });
        }
    } catch (e) {
        return new NextResponse('Invalid URL', { status: 400 });
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

        const contentType = response.headers.get('content-type') || 'image/webp';
        const buffer = await response.arrayBuffer();

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                // We don't strictly need attachment here if we do blob download in client,
                // but it's good practice for direct hits.
                'Access-Control-Allow-Origin': '*', // Allow client to fetch this
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (error) {
        console.error('Proxy error:', error);
        return new NextResponse('Failed to fetch image', { status: 500 });
    }
}
