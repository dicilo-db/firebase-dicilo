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
        return <div className="h-[400px] w-full animate-pulse bg-slate-100/40 backdrop-blur-md border border-white/30 rounded-[2.5rem]" />;
    }

    if (products.length === 0) {
        // Empty state
        return (
            <div className="rounded-[2.5rem] border border-white/30 bg-white/40 backdrop-blur-xl p-10 shadow-sm text-center">
                <ShoppingBag className="h-12 w-12 mx-auto text-slate-300 mb-3 animate-bounce" style={{ animationDuration: '3s' }} />
                <p className="text-slate-500 font-semibold">{t('products.noProducts', 'No products or services listed yet.')}</p>
            </div>
        );
    }

    return (
        <div className="rounded-[2.5rem] border border-white/30 bg-white/40 backdrop-blur-xl shadow-[0_15px_45px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col h-[600px] transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:scale-[1.01]">
            <div className="p-6 border-b border-slate-100 bg-white/60 flex items-center justify-between">
                <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2.5">
                    <ShoppingBag className="h-5.5 w-5.5 text-blue-600 animate-pulse" />
                    {t('tabs.products', 'Products & Services')}
                </h3>
                <span className="text-xs font-extrabold bg-blue-100/50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200/35">
                    {products.length} {products.length === 1 ? 'Item' : 'Items'}
                </span>
            </div>
            
            <div className="overflow-y-auto flex-1 p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {products.map((product) => (
                    <div key={product.id} className="flex gap-4 p-4.5 rounded-2xl bg-white/70 hover:bg-white transition-all duration-300 border border-white hover:border-blue-100 hover:shadow-md group cursor-pointer">
                        <div className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shadow-inner">
                            {product.imageUrl ? (
                                <Image src={product.imageUrl} alt={product.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-slate-300">
                                    <ShoppingBag className="h-8 w-8" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div className="flex justify-between items-start gap-3">
                                <h4 className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors truncate text-[16px]">{product.name}</h4>
                                <span className="font-extrabold text-xs text-blue-800 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg whitespace-nowrap">
                                    {typeof product.price === 'number'
                                        ? simpleFormatCurrency(product.price, product.currency)
                                        : product.price}
                                </span>
                            </div>
                            {product.description && (
                                <p className="text-sm font-medium text-slate-400 mt-2 line-clamp-2 group-hover:text-slate-500 transition-colors">
                                    {product.description}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
