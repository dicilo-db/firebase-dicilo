import React from 'react';
import { Metadata, ResolvingMetadata } from 'next';
import { getAdminDb } from '@/lib/firebase-admin';
import { SharedPostView } from '@/components/community/SharedPostView';
import { notFound } from 'next/navigation';
import { CommunityPost } from '@/types/community';
import { Header } from '@/components/header';

interface PageProps {
    params: { id: string };
}

// Helper to fetch post data server-side
async function getPost(id: string): Promise<CommunityPost | null> {
    try {
        const db = getAdminDb();
        const doc = await db.collection('community_posts').doc(id).get();
        if (!doc.exists) return null;
        
        const data = doc.data();
        if (!data) return null;

        // Convert Firestore dates to serializable format
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
        } as CommunityPost;
    } catch (error) {
        console.error("Error fetching post for metadata:", error);
        return null;
    }
}

export async function generateMetadata(
    { params }: PageProps,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const id = params.id;
    const post = await getPost(id);

    if (!post) {
        return {
            title: 'Post No Encontrado | Dicilo',
        };
    }

    const title = `${post.userName} en Dicilo | Comunidad`;
    const description = post.content.substring(0, 160) + (post.content.length > 160 ? '...' : '');
    const previewImage = post.media?.[0]?.url || post.imageUrl || 'https://dicilo.net/og-image.png'; // Fallback to a default logo

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'article',
            images: [
                {
                    url: previewImage,
                    width: 1200,
                    height: 630,
                    alt: 'Post Preview',
                },
            ],
            url: `https://dicilo.net/post/${id}`,
            siteName: 'Dicilo',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [previewImage],
        },
    };
}

export default async function SharedPostPage({ params }: PageProps) {
    const post = await getPost(params.id);

    if (!post) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Header />
            <div className="pt-8 pb-20">
                <SharedPostView post={post} />
            </div>
        </div>
    );
}
