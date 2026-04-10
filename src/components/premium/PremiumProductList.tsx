'use client';

import React, { useEffect, useState } from 'react';
import { ClientData } from '@/types/client';
import { getFirestore, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// If formatCurrency doesn't exist, I'll fallback gracefully
const simpleFormatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount);
};

interface Product {
    id: string;
    name: string;
    price: number | string;
    description?: string;
    imageUrl?: string;
    currency?: string;
}

interface PremiumProductListProps {
    clientData: ClientData;
}

export const PremiumProductList: React.FC<PremiumProductListProps> = ({ clientData }) => {
    const { t } = useTranslation('client');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const db = getFirestore(app);
        const productsRef = collection(db, 'clients', clientData.id, 'products');
        // Assuming 'createdAt' or 'name' for order. If strict order needed, we might need an index.
        // For now, let's try without complex ordering or just default.
        const q = query(productsRef); // Add orderBy('name') if needed later

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedProducts: Product[] = [];
            snapshot.forEach((doc) => {
                fetchedProducts.push({ id: doc.id, ...doc.data() } as Product);
            });
            setProducts(fetchedProducts);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching products:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [clientData.id]);

    if (loading) {
        return <div className="h-40 w-full animate-pulse bg-gray-100 rounded-xl" />;
    }

    if (products.length === 0) {
        // Empty state
        return (
            <div className="rounded-2xl border bg-white p-8 shadow-sm text-center">
                <ShoppingBag className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">{t('products.noProducts', 'No products or services listed yet.')}</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b bg-gray-50">
                <h3 className="text-lg font-bold">{t('tabs.products', 'Products & Services')} ({products.length})</h3>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300">
                {products.map((product) => (
                    <div key={product.id} className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                        <div className="relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 border">
                            {product.imageUrl ? (
                                <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-gray-400">
                                    <ShoppingBag className="h-8 w-8" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                                <h4 className="font-semibold text-gray-900 truncate">{product.name}</h4>
                                <span className="font-bold text-primary whitespace-nowrap">
                                    {typeof product.price === 'number'
                                        ? simpleFormatCurrency(product.price, product.currency)
                                        : product.price}
                                </span>
                            </div>
                            {product.description && (
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
