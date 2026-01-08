'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminUser, useAuthGuard } from '@/hooks/useAuthGuard';
import { Loader2, Search, LayoutDashboard, Download, Filter, RefreshCw, X } from 'lucide-react';
import Link from 'next/link';
import { getFreelancersList, FreelancerData } from '@/app/actions/admin-freelancers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function FreelancersPage() {
    useAuthGuard(['superadmin']); // Restrict to Superadmin only
    const { user: currentUser } = useAdminUser();
    const { t } = useTranslation(['admin', 'common']);

    // Data State
    const [freelancers, setFreelancers] = useState<FreelancerData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('name-asc');
    const [filterCountry, setFilterCountry] = useState('all');
    const [filterCity, setFilterCity] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all'); // Mapping to 'Interests'

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await getFreelancersList();
            if (res.success) {
                setFreelancers(res.data);
            } else {
                console.error("Failed to fetch freelancers:", res.error);
            }
        } catch (error) {
            console.error("Error fetching freelancers:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Derived Filters Data ---
    const uniqueCountries = useMemo(() => {
        const countries = new Set(freelancers.map(f => f.country).filter(Boolean));
        return Array.from(countries).sort();
    }, [freelancers]);

    const uniqueCities = useMemo(() => {
        const cities = new Set(freelancers.map(f => f.city).filter(Boolean));
        return Array.from(cities).sort();
    }, [freelancers]);

    const uniqueCategories = useMemo(() => {
        // Flatten interests arrays
        const allInterests = freelancers.flatMap(f => f.interests || []);
        const unique = new Set(allInterests.filter(Boolean));
        return Array.from(unique).sort();
    }, [freelancers]);


    // --- Filtering & Sorting Logic ---
    const filteredFreelancers = useMemo(() => {
        let result = [...freelancers];

        // 1. Search (Name, Email, Code)
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(f =>
                (f.firstName?.toLowerCase() || '').includes(lowerSearch) ||
                (f.lastName?.toLowerCase() || '').includes(lowerSearch) ||
                (f.email?.toLowerCase() || '').includes(lowerSearch) ||
                (f.uniqueCode?.toLowerCase() || '').includes(lowerSearch)
            );
        }

        // 2. Filter by Country
        if (filterCountry && filterCountry !== 'all') {
            result = result.filter(f => f.country === filterCountry);
        }

        // 3. Filter by City
        if (filterCity && filterCity !== 'all') {
            result = result.filter(f => f.city === filterCity);
        }

        // 4. Filter by Category (Interests)
        if (filterCategory && filterCategory !== 'all') {
            result = result.filter(f => f.interests?.includes(filterCategory));
        }

        // 5. Sorting
        result.sort((a, b) => {
            switch (sortOrder) {
                case 'name-asc':
                    return (a.firstName || '').localeCompare(b.firstName || '');
                case 'name-desc':
                    return (b.firstName || '').localeCompare(a.firstName || '');
                case 'dicipoints-desc':
                    return b.diciPoints - a.diciPoints;
                case 'earnings-desc':
                    return b.euroBalance - a.euroBalance;
                case 'newest':
                    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                default:
                    return 0;
            }
        });

        return result;
    }, [freelancers, searchTerm, filterCountry, filterCity, filterCategory, sortOrder]);

    const resetFilters = () => {
        setSearchTerm('');
        setFilterCountry('all');
        setFilterCity('all');
        setFilterCategory('all');
        setSortOrder('name-asc');
    };

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <main className="container mx-auto flex-grow p-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Freelancers Management</h1>
                        <p className="text-muted-foreground">{t('common:privateUsersList')} - Overview</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/admin/dashboard">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                {t('businesses.backToDashboard')}
                            </Link>
                        </Button>
                        <Button variant="outline" onClick={() => {
                            // CSV Export
                            const headers = ['FirstName,LastName,Email,UniqueCode,Country,City,Interests,Dicipoints,EurBalance'];
                            const rows = filteredFreelancers.map(u => [
                                u.firstName, u.lastName, u.email, u.uniqueCode,
                                u.country || '', u.city || '',
                                `"${u.interests?.join(',') || ''}"`,
                                u.diciPoints, u.euroBalance
                            ].join(','));
                            const csvContent = [headers, ...rows].join('\n');
                            const blob = new Blob([csvContent], { type: 'text/csv' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'freelancers_export.csv';
                            a.click();
                        }}>
                            <Download className="mr-2 h-4 w-4" /> CSV Export
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-xl">Freelancers Directory <span className="ml-2 text-sm font-normal text-muted-foreground">({filteredFreelancers.length} total)</span></CardTitle>
                                <Button variant="ghost" size="sm" onClick={fetchData} disabled={isLoading}>
                                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                                </Button>
                            </div>

                            {/* Filter Bar */}
                            <div className="flex flex-wrap items-center gap-3">
                                {/* Search */}
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar por nombre, email o código..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>

                                {/* Sort */}
                                <Select value={sortOrder} onValueChange={setSortOrder}>
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue placeholder="Sort By" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                                        <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                                        <SelectItem value="dicipoints-desc">Highest DiciPoints</SelectItem>
                                        <SelectItem value="earnings-desc">Highest Earnings</SelectItem>
                                        <SelectItem value="newest">Newest First</SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Country Filter */}
                                <Select value={filterCountry} onValueChange={setFilterCountry}>
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue placeholder="All Countries" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Countries</SelectItem>
                                        {uniqueCountries.map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* City Filter */}
                                <Select value={filterCity} onValueChange={setFilterCity}>
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="All Cities" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Cities</SelectItem>
                                        {uniqueCities.map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Category/Interest Filter */}
                                <Select value={filterCategory} onValueChange={setFilterCategory}>
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue placeholder="All Categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {uniqueCategories.map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Reset */}
                                <Button variant="ghost" onClick={resetFilters} className="px-3" title="Reset Filters">
                                    <X className="h-4 w-4" /> <span className="sr-only">Reset</span>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center p-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead>Code</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email / Location</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead className="text-right">DiciPoints</TableHead>
                                            <TableHead className="text-right">Earnings (EUR)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredFreelancers.map((user) => (
                                            <TableRow key={user.id} className="hover:bg-muted/5">
                                                <TableCell className="font-mono font-medium text-xs text-muted-foreground">{user.uniqueCode}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{user.firstName} {user.lastName}</span>
                                                        <Badge variant="outline" className="w-fit text-[10px] h-5 mt-1 capitalize font-normal border-blue-200 bg-blue-50 text-blue-700">
                                                            {user.role}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-sm">
                                                        <span>{user.email}</span>
                                                        {(user.city || user.country) && (
                                                            <span className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                                                {user.city}{user.city && user.country ? ', ' : ''}{user.country}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {user.interests && user.interests.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {user.interests.slice(0, 2).map((int, i) => (
                                                                <Badge key={i} variant="secondary" className="text-[10px] h-5">{int}</Badge>
                                                            ))}
                                                            {user.interests.length > 2 && <span className="text-xs text-muted-foreground">+{user.interests.length - 2}</span>}
                                                        </div>
                                                    ) : <span className="text-muted-foreground">-</span>}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1 font-mono">
                                                        {user.diciPoints.toLocaleString()} <span className="text-xs text-muted-foreground">DP</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1 font-mono font-bold text-green-600">
                                                        € {user.euroBalance.toFixed(2)}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredFreelancers.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <Filter className="h-8 w-8 opacity-20" />
                                                        <p>No freelancers found matching criteria.</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
