import Image from 'next/image';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Metadata } from 'next';

type Props = {
    params: { id: string };
    searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
    { params, searchParams }: Props
): Promise<Metadata> {
    // Decode params if necessary, but usually Next.js provides decoded values
    const title = (searchParams.og_title as string) || 'Dicilo';
    const description = (searchParams.og_desc as string) || 'Conectando Marcas con Personas';
    // Fallback to default logo if no image provided
    const image = (searchParams.og_img as string) || 'https://dicilo.net/logo.png';

    return {
        title: title,
        description: description,
        openGraph: {
            title: title,
            description: description,
            images: [image],
            url: `https://dicilo.net/r/${params.id}`,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: title,
            description: description,
            images: [image],
        },
        robots: 'noindex, nofollow',
    };
}

export default function RedirectPage({ params, searchParams }: Props) {
    const trackingId = params.id;
    const rawDest = searchParams.dest as string;

    // Default fallback if dest is missing
    const DEFAULT_DEST = 'https://dicilo.net';
    let destinationUrl = DEFAULT_DEST;

    if (rawDest) {
        // Basic validation
        try {
            // Handle encoded or decoded? Browser usually sends decoded in searchParams here
            // We ensure it is a valid URL
            // If it comes encoded (%3A%2F%2F), searchParams usually handles it? 
            // Next.js searchParams are already decoded strings usually.
            // Let's assume it's a valid string first.
            if (rawDest.startsWith('http')) {
                destinationUrl = rawDest;
            } else {
                // Maybe it is still encoded? Try decode just in case
                const decoded = decodeURIComponent(rawDest);
                if (decoded.startsWith('http')) {
                    destinationUrl = decoded;
                }
            }
        } catch (e) {
            // Fallback
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 font-sans text-center">
            {/* 1. NOSCRIPT FALLBACK */}
            <noscript>
                <meta httpEquiv="refresh" content={`1;url=${destinationUrl}`} />
            </noscript>

            {/* 2. BRIDGE CONTENT */}
            <div className="w-full max-w-md space-y-8">

                {/* LOGO */}
                <div className="flex justify-center">
                    <div className="relative h-16 w-48">
                        <Image
                            src="/logo.png"
                            alt="Dicilo Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>

                {/* LOADER & MESSAGE */}
                <div className="space-y-4">
                    <div className="flex justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                    <h1 className="text-xl font-medium text-gray-800">
                        Conectando con el sitio oficial...
                    </h1>
                    <p className="text-sm text-gray-500">
                        Serás redirigido en unos segundos.
                    </p>
                </div>

                {/* MANUAL BUTTON (FAIL-SAFE) */}
                <div className="pt-4">
                    <a
                        href={destinationUrl}
                        className="inline-flex items-center justify-center rounded-md bg-green-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors w-full"
                    >
                        Clic aquí si no eres redirigido automáticamente
                    </a>
                </div>
            </div>

            {/* 3. CLIENT-SIDE LOGIC */}
            <ClientRedirectLogic trackingId={trackingId} destinationUrl={destinationUrl} />
        </div>
    );
}

// Client Component Wrapper for Logic
import ClientRedirectLogic from './ClientRedirectLogic';
