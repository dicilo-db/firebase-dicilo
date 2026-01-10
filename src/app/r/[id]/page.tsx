import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { Metadata } from 'next';
import { getAdminDb } from '@/lib/firebase-admin'; // Ensure consistent admin usage
import ClientRedirectLogic from './ClientRedirectLogic';

type Props = {
    params: { id: string };
    searchParams: { [key: string]: string | string[] | undefined };
};

// Helper to fetch data efficiently
async function getRedirectData(id: string) {
    const db = getAdminDb();

    // 1. Try Freelancer Link (Short ID)
    const linkDoc = await db.collection('freelancer_links').doc(id).get();
    if (linkDoc.exists) {
        const linkData = linkDoc.data();
        // Fetch valid campaign for OG data
        let campaignData: any = {};
        if (linkData?.campaignId) {
            const campDoc = await db.collection('campaigns').doc(linkData.campaignId).get();
            if (campDoc.exists) campaignData = campDoc.data();
        }

        return {
            found: true,
            type: 'link',
            targetUrl: linkData?.targetUrl,
            // Prioritize link selection, fallback to campaign default
            ogImage: linkData?.selectedImageUrl || campaignData?.images?.[0] || campaignData?.companyLogo,
            ogTitle: campaignData?.companyName || 'Dicilo',
            ogDesc: campaignData?.title || campaignData?.description || 'Conectando Marcas'
        };
    }

    // 2. Try Campaign ID (Direct Campaign Link)
    // ID could be "campaignId" OR "campaignId_LANG"
    let campaignId = id;
    let lang = 'es'; // default

    // Check if ID has language suffix e.g. "xc90_DE" used in fallback logic
    if (id.includes('_')) {
        const parts = id.split('_');
        const candidateLang = parts.pop()?.toLowerCase(); // last part
        if (candidateLang && ['en', 'es', 'de', 'fr', 'pt', 'it'].includes(candidateLang)) {
            lang = candidateLang;
            campaignId = parts.join('_');
        }
    }

    const campDoc = await db.collection('campaigns').doc(campaignId).get();
    if (campDoc.exists) {
        const data = campDoc.data();
        return {
            found: true,
            type: 'campaign',
            // Smart URL selection based on Lang
            targetUrl: data?.target_urls?.[lang]?.[0] || data?.targetUrl || 'https://dicilo.net',
            ogImage: data?.images?.[0] || data?.companyLogo,
            ogTitle: data?.companyName || 'Dicilo',
            ogDesc: data?.translations?.[lang]?.description || data?.description
        };
    }

    return { found: false };
}

export async function generateMetadata(
    { params, searchParams }: Props
): Promise<Metadata> {
    const { id } = params;

    // Server-side lookup
    const data = await getRedirectData(id);

    // Fallback to URL params if not found in DB (Legacy/State-in-URL)
    const title = data.found ? data.ogTitle : ((searchParams.og_title as string) || 'Dicilo');
    const description = data.found ? data.ogDesc : ((searchParams.og_desc as string) || 'Descubre nuevas oportunidades.');
    const image = data.found ? data.ogImage : ((searchParams.og_img as string) || 'https://dicilo.net/logo.png');

    return {
        title: title,
        description: description,
        openGraph: {
            title: title,
            description: description,
            images: [image],
            url: `https://dicilo.net/r/${id}`,
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

export default async function RedirectPage({ params, searchParams }: Props) {
    const { id } = params;

    // Server-side lookup
    const data = await getRedirectData(id);

    // Determine Destination
    let destinationUrl = 'https://dicilo.net';

    if (data.found && data.targetUrl) {
        destinationUrl = data.targetUrl;
    } else {
        // Legacy Parameter Fallback
        const rawDest = searchParams.dest as string;
        if (rawDest) {
            try {
                if (rawDest.startsWith('http')) {
                    destinationUrl = rawDest;
                } else {
                    const decoded = decodeURIComponent(rawDest);
                    if (decoded.startsWith('http')) destinationUrl = decoded;
                }
            } catch (e) { }
        }
    }

    // Append UTM params if missing? Optional enhancement.

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 font-sans text-center">
            <noscript>
                <meta httpEquiv="refresh" content={`0;url=${destinationUrl}`} />
            </noscript>

            <div className="w-full max-w-md space-y-8">
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

                <div className="space-y-4">
                    <div className="flex justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                    <h1 className="text-xl font-medium text-gray-800">
                        {data.found ? 'Redirigiendo...' : 'Conectando...'}
                    </h1>
                </div>

                <div className="pt-4">
                    <a
                        href={destinationUrl}
                        className="inline-flex items-center justify-center rounded-md bg-green-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-green-700 w-full"
                    >
                        Continuar
                    </a>
                </div>
            </div>

            <ClientRedirectLogic trackingId={id} destinationUrl={destinationUrl} />
        </div>
    );
}

// Client Component Wrapper for Logic
import ClientRedirectLogic from './ClientRedirectLogic';
