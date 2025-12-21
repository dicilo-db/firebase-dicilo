'use client';

import React, { useEffect, useState } from 'react';
import { getFirestore, collection, query, getDocs, orderBy } from 'firebase/firestore';
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
import { Loader2, Search, Download, LayoutDashboard, RefreshCw } from 'lucide-react';
import { CSVLink } from 'react-csv';
import Link from 'next/link';

const db = getFirestore(app);

export default function PrivateUsersPage() {
    useAuthGuard();
    const { t } = useTranslation('admin');
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const q = query(collection(db, 'private_profiles'), orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(q);
                const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setUsers(usersData);
            } catch (error: any) {
                console.error('Error fetching users:', error);
                setError(error.message || 'Unknown error fetching users.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // Get error from state if we implemented it properly, for now quick fix to not break types:
    // Ideally we should add [error, setError] state.
    // Let's re-do the tool call with a proper state implementation.

    const filteredUsers = users.filter(user =>
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.uniqueCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const csvData = filteredUsers.map(user => ({
        FirstName: user.firstName,
        LastName: user.lastName,
        Email: user.email,
        UniqueCode: user.uniqueCode,
        Phone: user.contactPreferences?.whatsapp || user.contactPreferences?.telegram || '',
        Interests: user.interests?.join(', '),
        CreatedAt: user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : '',
    }));

    return (
        <div className="flex min-h-screen flex-col bg-background">

            <main className="container mx-auto flex-grow p-8">
                <div className="mb-8 flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Privat User</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/admin/dashboard">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                {t('businesses.backToDashboard')}
                            </Link>
                        </Button>
                        <Button variant="outline" onClick={async () => {
                            try {
                                setIsLoading(true);
                                const res = await fetch('/api/admin/sync-private-users', { method: 'POST' });
                                const data = await res.json();
                                if (data.success) {
                                    const details = data.results.details && data.results.details.length > 0
                                        ? '\n\nDetails:\n' + data.results.details.join('\n')
                                        : '';
                                    alert(`Sync Complete:\nTotal: ${data.results.total}\nCreated: ${data.results.created}\nSkipped: ${data.results.skipped}\nErrors: ${data.results.errors}${details}`);
                                    window.location.reload();
                                } else {
                                    alert('Error syncing: ' + (data.error || 'Unknown error'));
                                }
                            } catch (e) {
                                console.error(e);
                                alert('Error syncing users');
                            } finally {
                                setIsLoading(false);
                            }
                        }}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Import from Registrations
                        </Button>
                        <Button variant="outline" onClick={() => {
                            const headers = ['FirstName,LastName,Email,UniqueCode,Phone,Interests,CreatedAt'];
                            const rows = filteredUsers.map(u => [
                                u.firstName, u.lastName, u.email, u.uniqueCode,
                                u.contactPreferences?.whatsapp || '',
                                `"${u.interests?.join(', ') || ''}"`,
                                u.createdAt ? new Date(u.createdAt.seconds * 1000).toISOString() : ''
                            ].join(','));
                            const csvContent = [headers, ...rows].join('\n');
                            const blob = new Blob([csvContent], { type: 'text/csv' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'private_users.csv';
                            a.click();
                        }}>
                            <Download className="mr-2 h-4 w-4" /> CSV Export
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 rounded-md bg-destructive/15 p-4 text-destructive border border-destructive/20">
                        <p className="font-semibold">Error cargando usuarios:</p>
                        <p className="text-sm">{error}</p>
                        {error.includes('permission') && (
                            <p className="mt-2 text-xs">Asegúrese de que su usuario tenga rol 'superadmin' o 'admin' en el sistema.</p>
                        )}
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Liste der Privat User</CardTitle>
                        <div className="flex items-center space-x-2">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Suche nach Name, E-Mail oder Code..."
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
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>E-Mail</TableHead>
                                        <TableHead>Interessen</TableHead>
                                        <TableHead>Beigetreten</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-mono font-medium">{user.uniqueCode}</TableCell>
                                            <TableCell>{user.firstName} {user.lastName}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell className="max-w-[200px] truncate" title={user.interests?.join(', ')}>
                                                {user.interests?.length > 0 ? user.interests.join(', ') : '-'}
                                            </TableCell>
                                            <TableCell>
                                                {user.createdAt?.seconds
                                                    ? new Date(user.createdAt.seconds * 1000).toLocaleDateString()
                                                    : 'N/A'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredUsers.length === 0 && !error && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span>Keine Benutzer gefunden.</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
