import { getFirestore, doc, getDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Image from 'next/image';
import { MapPin, Globe, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RecommendationButton } from '@/components/recommendations/recommendation-button';

// Force dynamic rendering if not generating static params for all (we have too many maybe?)
// For now let's use ISG for seeded ones or dynamic.
// export const dynamic = 'force-dynamic'; 

const db = getFirestore(app);

async function getBusinessData(id: string) {
    try {
        const docRef = doc(db, 'businesses', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }
        return { id: docSnap.id, ...docSnap.data() } as any;
    } catch (error) {
        console.error("Error fetching business", error);
        return null;
    }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const business = await getBusinessData(params.id);
    if (!business) return { title: 'Business Not Found' };

    return {
        title: `${business.name} | Dicilo Local`,
        description: business.description || `Check out ${business.name} in ${business.city || 'Germany'}.`,
    };
}

export default async function BasicBusinessPage({ params }: { params: { id: string } }) {
    const business = await getBusinessData(params.id);

    if (!business) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header / Hero */}
            <div className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        <div className="relative h-24 w-24 md:h-32 md:w-32 flex-shrink-0 overflow-hidden rounded-full border-4 border-white shadow-md bg-white">
                            {business.imageUrl ? (
                                <Image src={business.imageUrl} alt={business.name} fill className="object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-blue-100 text-blue-500 font-bold text-2xl">
                                    {business.name.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                        </div>

                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{business.name}</h1>
                            <p className="text-slate-600 font-medium mt-1">{business.category}</p>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3 text-sm text-slate-500">
                                {(business.city || business.location) && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        <span>
                                            {business.zip} {business.city} {business.neighborhood ? `(${business.neighborhood})` : ''}
                                        </span>
                                    </div>
                                )}
                                {business.website && (
                                    <a href={business.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-600">
                                        <Globe className="h-4 w-4" />
                                        <span>Website</span>
                                    </a>
                                )}
                                {business.phone && (
                                    <div className="flex items-center gap-1">
                                        <Phone className="h-4 w-4" />
                                        <span>{business.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-8 max-w-3xl">
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <h2 className="text-lg font-bold mb-4">About</h2>
                    <p className="text-slate-700 whitespace-pre-wrap">{business.description || 'No description available.'}</p>
                </div>
            </div>

            {/* FAB */}
            <RecommendationButton businessId={business.id} />
        </div>
    );
}
