'use client';

import React, { useEffect, useState } from 'react';
import { getFirestore, collection, query, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { app } from '@/lib/firebase';

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
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Loader2, Search, Trash2, LayoutDashboard, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const db = getFirestore(app);

export default function RecommendationsPage() {
    useAuthGuard();
    const { t } = useTranslation('admin');
    const { toast } = useToast();
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const fetchRecommendations = async () => {
        setIsLoading(true);
        try {
            const q = query(collection(db, 'recommendations'), orderBy('timestamp', 'desc'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRecommendations(data);
        } catch (error: any) {
            console.error('Error fetching recommendations:', error);
            toast({
                title: t('common:error', { ns: 'common' }), // Fallback title
                description: error.message || 'Error fetching data',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRecommendations();
    }, []);

    const handleDelete = async (id: string) => {
        setIsDeleting(id);
        try {
            await deleteDoc(doc(db, 'recommendations', id));
            toast({
                title: t('common:success', { ns: 'common' }),
                description: 'Record deleted successfully.',
            });
            setRecommendations(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error('Error deleting:', error);
            toast({
                title: 'Error',
                description: 'Could not delete record.',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(null);
        }
    };

    const filteredRecommendations = recommendations.filter(rec =>
        rec.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex min-h-screen flex-col bg-background">

            <main className="container mx-auto flex-grow p-8">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Empfehlungen</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/admin/dashboard">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                {t('businesses.backToDashboard')}
                            </Link>
                        </Button>
                        <Button onClick={fetchRecommendations} variant="outline" disabled={isLoading}>
                            <RefreshCw
                                className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                            />
                            {t('businesses.reload')}
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>List of Recommendations</CardTitle>
                        <div className="flex items-center space-x-2">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by company or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="max-w-sm"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Company Name</TableHead>
                                            <TableHead>Contact Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>Country</TableHead>
                                            <TableHead>City</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Website</TableHead>
                                            <TableHead>Comments</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredRecommendations.map((rec) => (
                                            <TableRow key={rec.id}>
                                                <TableCell className="font-medium">{rec.companyName}</TableCell>
                                                <TableCell>{rec.contactName}</TableCell>
                                                <TableCell>{rec.email}</TableCell>
                                                <TableCell>{rec.phone}</TableCell>
                                                <TableCell>{rec.country}</TableCell>
                                                <TableCell>{rec.city}</TableCell>
                                                <TableCell>{rec.category}</TableCell>
                                                <TableCell className="max-w-[150px] truncate" title={rec.website}>
                                                    {rec.website && (
                                                        <a href={rec.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                                            {rec.website}
                                                        </a>
                                                    )}
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate" title={rec.comments}>
                                                    {rec.comments}
                                                </TableCell>
                                                <TableCell>
                                                    {rec.timestamp?.seconds
                                                        ? new Date(rec.timestamp.seconds * 1000).toLocaleDateString()
                                                        : 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="destructive"
                                                                size="icon"
                                                                disabled={isDeleting === rec.id}
                                                            >
                                                                {isDeleting === rec.id ? (
                                                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This action cannot be undone. This will permanently delete the recommendation.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(rec.id)}>Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredRecommendations.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={11} className="text-center h-24 text-muted-foreground">
                                                    No recommendations found.
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
