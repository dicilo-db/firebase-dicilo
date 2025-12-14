'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCouponStats } from '@/app/actions/coupons';
import Link from 'next/link';
import { Tag, Loader2, Info, ArrowLeft } from 'lucide-react';
import categoriesData from '@/data/categories.json';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';

// Helper to generate deterministic chart data based on category name
// This simulates "AI" generated patterns unique to each category
const generateCategoryData = (seed: string) => {
    const data = [];
    let value = 20;
    for (let i = 0; i < 7; i++) {
        // Use char codes to influence direction so it's consistent
        const charCode = seed.charCodeAt(i % seed.length) || 10;
        const change = (charCode % 20) - 10;
        value = Math.max(5, Math.min(50, value + change));
        data.push({ value });
    }
    return data;
};

export default function CouponsPage() {
    const [stats, setStats] = useState<Record<string, { active: number; total: number }>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await getCouponStats();
                if (res.success && res.stats) {
                    setStats(res.stats);
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Helper component for the mini chart
    const CategoryChart = ({ category }: { category: string }) => {
        const data = useMemo(() => generateCategoryData(category), [category]);

        return (
            <div className="h-[60px] w-full mt-4 opacity-50 group-hover:opacity-80 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id={`gradient-${category}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="currentColor" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="currentColor"
                            fill={`url(#gradient-${category})`}
                            strokeWidth={2}
                            dot={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        );
    };

    const categories = categoriesData.map(c => c.categoria);

    return (
        <div className="container mx-auto py-8">
            <div className="flex flex-col gap-4 mb-8">
                <Link href="/admin/dashboard" className="w-fit">
                    <Button variant="outline" className="gap-2 pl-2 pr-4 hover:bg-muted transition-all">
                        <ArrowLeft className="h-4 w-4" />
                        Volver al Dashboard
                    </Button>
                </Link>

                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Gestión de Cupones</h1>
                        <p className="text-muted-foreground">Administra las promociones y descuentos de las empresas.</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.slice(0, 20).map((cat) => {
                        const stat = stats[cat] || { active: 0, total: 0 };
                        return (
                            <Link href={`/admin/coupons/${encodeURIComponent(cat)}`} key={cat} className="group">
                                <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer overflow-hidden relative flex flex-col justify-between">
                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Tag className="h-16 w-16" />
                                    </div>

                                    <div>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg font-semibold truncate pr-8" title={cat}>
                                                {cat}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-baseline space-x-2">
                                                <span className="text-4xl font-bold text-primary">{stat.active}</span>
                                                <span className="text-sm text-muted-foreground">activos</span>
                                            </div>
                                            {stat.total > 0 && (
                                                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                                                    <Info className="h-3 w-3" />
                                                    <span>{stat.total} en total</span>
                                                </div>
                                            )}
                                        </CardContent>
                                    </div>

                                    {/* AI Graph Section */}
                                    <div className="text-primary mt-auto">
                                        <CategoryChart category={cat} />
                                    </div>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
