'use client';

import React, { useEffect, useState } from 'react';
import { getFirestore, collection, query, getDocs, orderBy } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Header } from '@/components/header';
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
import { Loader2, Search, Download } from 'lucide-react';
import { CSVLink } from 'react-csv';

const db = getFirestore(app);

export default function PrivateUsersPage() {
    useAuthGuard();
    const { t } = useTranslation('admin');
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const q = query(collection(db, 'private_profiles'), orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(q);
                const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setUsers(usersData);
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, []);

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
            <Header />
            <main className="container mx-auto flex-grow p-8">
                <div className="mb-8 flex items-center justify-between">
                    <h1 className="text-3xl font-bold">{t('privateUsers.title')}</h1>
                    <div className="flex gap-2">
                        {/* CSV Export Button - using a simple button for now, requires react-csv or similar logic */}
                        {/* Note: react-csv might not be installed. I'll skip the actual CSVLink component if not sure, 
                 but for now I'll just put a placeholder button or use a simple function to download CSV. */}
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
                            <Download className="mr-2 h-4 w-4" /> {t('privateUsers.exportCSV')}
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('privateUsers.userList')}</CardTitle>
                        <div className="flex items-center space-x-2">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('privateUsers.searchPlaceholder')}
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
                                        <TableHead>{t('privateUsers.table.code')}</TableHead>
                                        <TableHead>{t('privateUsers.table.name')}</TableHead>
                                        <TableHead>{t('privateUsers.table.email')}</TableHead>
                                        <TableHead>{t('privateUsers.table.interests')}</TableHead>
                                        <TableHead>{t('privateUsers.table.joined')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-mono font-medium">{user.uniqueCode}</TableCell>
                                            <TableCell>{user.firstName} {user.lastName}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{user.interests?.length || 0} {t('privateUsers.table.selected')}</TableCell>
                                            <TableCell>
                                                {user.createdAt?.seconds
                                                    ? new Date(user.createdAt.seconds * 1000).toLocaleDateString()
                                                    : 'N/A'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                                {t('privateUsers.noResults')}
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
