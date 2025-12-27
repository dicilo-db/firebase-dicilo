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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { togglePrivateUserStatus, deletePrivateUser, setPrivateUserRole, updateUserPermissions, setReferrer } from '@/app/actions/private-users';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { CSVLink } from 'react-csv';
import { Loader2, Search, Download, LayoutDashboard, RefreshCw, Trash2, Pause, Play, Briefcase, ShieldCheck, UserPlus, Edit, Save, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const db = getFirestore(app);

export default function PrivateUsersPage() {
    useAuthGuard();
    const { t } = useTranslation(['admin', 'common']);
    const { user: currentUser } = useAuth(); // Get logged in admin
    const { toast } = useToast();
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Permissions Management State
    // Permissions & Referrer State
    const [permissionDialogUser, setPermissionDialogUser] = useState<any>(null);
    const [referrerDialogUser, setReferrerDialogUser] = useState<any>(null);
    const [referrerCodeInput, setReferrerCodeInput] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const AVAILABLE_PERMISSIONS = [
        { id: 'create_qr', label: 'Crear Códigos QR' },
        { id: 'manage_campaigns', label: 'Crear Campañas' },
        { id: 'manage_products', label: 'Gestionar Productos' },
        { id: 'access_admin_panel', label: 'Acceso Panel Admin' },
        { id: 'access_ads_manager', label: 'Acceso Ads Manager' },
        { id: 'freelancer_tool', label: 'Acceso Freelancer Tool' },
    ];

    const handleOpenPermissions = (user: any) => {
        setPermissionDialogUser(user);
        setSelectedPermissions(user.permissions || []);
    };

    const handleSavePermissions = async () => {
        if (!permissionDialogUser) return;
        const res = await updateUserPermissions(permissionDialogUser.id, selectedPermissions);
        if (res.success) {
            toast({ title: 'Permisos actualizados' });
            setUsers(users.map(u => u.id === permissionDialogUser.id ? { ...u, permissions: selectedPermissions } : u));
            setPermissionDialogUser(null);
        } else {
            toast({ title: 'Error', variant: 'destructive', description: res.error });
        }
    };

    const togglePermission = (permId: string) => {
        if (selectedPermissions.includes(permId)) {
            setSelectedPermissions(selectedPermissions.filter(p => p !== permId));
        } else {
            setSelectedPermissions([...selectedPermissions, permId]);
        }
    };

    const handleSaveReferrer = async () => {
        if (!referrerDialogUser || !referrerCodeInput) return;
        const res = await setReferrer(referrerDialogUser.id, referrerCodeInput);
        if (res.success) {
            toast({ title: 'Referrer Linked', description: res.message });
            setReferrerDialogUser(null);
            setReferrerCodeInput('');
            // Reload to reflect changes (simplest way to update graph)
            window.location.reload();
        } else {
            toast({ title: 'Error', description: res.error, variant: 'destructive' });
        }
    };
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const q = query(collection(db, 'private_profiles'), orderBy('uniqueCode', 'asc'));
                const snapshot = await getDocs(q);
                const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Resolve Referrers In-Memory
                const userMap = new Map();
                usersData.forEach((u: any) => userMap.set(u.id, u));

                const enrichedUsers = usersData.map((u: any) => ({
                    ...u,
                    referrerCode: u.referredBy ? userMap.get(u.referredBy)?.uniqueCode : null,
                    referrerName: u.referredBy ? userMap.get(u.referredBy)?.firstName : null
                }));

                setUsers(enrichedUsers);
            } catch (error: any) {
                console.error('Error fetching users:', error);
                setError(error.message || 'Unknown error fetching users.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user =>
        (user.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.uniqueCode?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.country?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.city?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (Array.isArray(user.interests) && user.interests.some((i: string) => i.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    const csvData = filteredUsers.map(user => ({
        FirstName: user.firstName,
        LastName: user.lastName,
        Email: user.email,
        UniqueCode: user.uniqueCode,
        Phone: user.contactPreferences?.whatsapp || user.contactPreferences?.telegram || '',
        Country: user.country || '',
        City: user.city || '',
        Interests: user.interests?.join(', '),
        CreatedAt: user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : '',
    }));

    return (
        <div className="flex min-h-screen flex-col bg-background">

            <main className="container mx-auto flex-grow p-8">
                <div className="mb-8 flex items-center justify-between">
                    <h1 className="text-3xl font-bold">{t('common:privateUsersList')}</h1>
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
                            const headers = ['FirstName,LastName,Email,UniqueCode,Phone,Country,City,Interests,CreatedAt'];
                            const rows = filteredUsers.map(u => [
                                u.firstName, u.lastName, u.email, u.uniqueCode,
                                u.contactPreferences?.whatsapp || u.phoneNumber || '',
                                u.country || '', u.city || '',
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
                        <CardTitle>{t('common:privateUsersList')}</CardTitle>
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
                                        <TableHead>{t('common:dashboard.country') || 'Land'}</TableHead>
                                        <TableHead>{t('common:dashboard.city') || 'Stadt'}</TableHead>
                                        <TableHead>Rol (Rollen)</TableHead>
                                        <TableHead>Interessen</TableHead>
                                        <TableHead>Invitado Por</TableHead>
                                        <TableHead>Beigetreten</TableHead>
                                        <TableHead>Aktionen</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-mono font-medium">{user.uniqueCode}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{user.firstName} {user.lastName}</span>
                                                    {user.disabled && <span className="text-xs text-destructive font-bold">[DISABLED]</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{user.country || '-'}</TableCell>
                                            <TableCell>{user.city || '-'}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {currentUser?.role === 'superadmin' || currentUser?.email?.includes('dicilo.net') ? (
                                                        <Select
                                                            defaultValue={user.role || (user.isFreelancer ? 'freelancer' : 'user')}
                                                            onValueChange={async (newRole) => {
                                                                if (confirm(`¿Cambiar rol de ${user.firstName} a ${newRole}?`)) {
                                                                    const res = await setPrivateUserRole(user.id, newRole);
                                                                    if (res.success) {
                                                                        toast({ title: 'Rol actualizado', description: res.message });
                                                                        // Optimistic update
                                                                        setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole, isFreelancer: ['freelancer', 'team_office', 'admin', 'superadmin'].includes(newRole) } : u));
                                                                    } else {
                                                                        toast({ title: 'Fehler', description: res.error, variant: 'destructive' });
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <SelectTrigger className={`h-8 w-[130px] ${(user.role === 'superadmin') ? 'border-red-500 bg-red-50' :
                                                                (user.role === 'admin') ? 'border-purple-500 bg-purple-50' :
                                                                    (user.role === 'team_office') ? 'border-orange-500 bg-orange-50' :
                                                                        (user.role === 'freelancer' || user.isFreelancer) ? 'border-blue-500 bg-blue-50' : ''
                                                                }`}>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="user">Usuario</SelectItem>
                                                                <SelectItem value="freelancer">Freelancer</SelectItem>
                                                                <SelectItem value="team_office">Team Office</SelectItem>
                                                                <SelectItem value="admin">Admin</SelectItem>
                                                                <SelectItem value="superadmin">Superadmin</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <span className={`px-2 py-1 rounded text-xs font-medium border ${(user.role === 'superadmin') ? 'border-red-200 bg-red-100 text-red-800' :
                                                            (user.role === 'admin') ? 'border-purple-200 bg-purple-100 text-purple-800' :
                                                                (user.role === 'team_office') ? 'border-orange-200 bg-orange-100 text-orange-800' :
                                                                    (user.role === 'freelancer' || user.isFreelancer) ? 'border-blue-200 bg-blue-100 text-blue-800' :
                                                                        'border-gray-200 bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {user.role === 'team_office' ? 'Team Office' :
                                                                user.role === 'superadmin' ? 'Superadmin' :
                                                                    user.role === 'admin' ? 'Admin' :
                                                                        (user.role === 'freelancer' || user.isFreelancer) ? 'Freelancer' : 'Usuario'}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[200px]">
                                                <span className="text-xs text-muted-foreground truncate block" title={user.interests?.join(', ')}>
                                                    {user.interests?.length > 0 ? user.interests.join(', ') : '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {user.referrerCode ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-mono font-bold text-xs">{user.referrerCode}</span>
                                                        <span className="text-[10px] text-muted-foreground">{user.referrerName}</span>
                                                    </div>
                                                ) : (
                                                    <Button variant="ghost" size="sm" className="h-6 text-xs text-blue-600 px-2" onClick={() => setReferrerDialogUser(user)}>
                                                        <UserPlus className="h-3 w-3 mr-1" /> Add
                                                    </Button>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {user.createdAt?.seconds
                                                    ? new Date(user.createdAt.seconds * 1000).toLocaleDateString()
                                                    : 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="sm" onClick={async () => {
                                                        const newStatus = !user.disabled;
                                                        if (confirm(`Sind Sie sicher, dass Sie diesen Benutzer ${newStatus ? 'deaktivieren' : 'aktivieren'} möchten?`)) {
                                                            const res = await togglePrivateUserStatus(user.id, newStatus);
                                                            if (res.success) {
                                                                toast({ title: 'Status aktualisiert', description: res.message });
                                                                setUsers(users.map(u => u.id === user.id ? { ...u, disabled: newStatus } : u));
                                                            } else {
                                                                toast({ title: 'Fehler', description: res.error, variant: 'destructive' });
                                                            }
                                                        }
                                                    }}>
                                                        {user.disabled ? <Play className="h-4 w-4 text-green-600" /> : <Pause className="h-4 w-4 text-amber-600" />}
                                                    </Button>
                                                    {(currentUser?.role === 'superadmin' || currentUser?.email?.includes('dicilo.net')) && (
                                                        <Button variant="ghost" size="sm" onClick={() => handleOpenPermissions(user)} title="Gestión de Permisos">
                                                            <ShieldCheck className="h-4 w-4 text-purple-600" />
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="sm" onClick={async () => {
                                                        if (confirm('ACHTUNG: Möchten Sie diesen Benutzer wirklich LÖSCHEN? Diese Aktion kann nicht rückgängig gemacht werden.')) {
                                                            const res = await deletePrivateUser(user.id);
                                                            if (res.success) {
                                                                toast({ title: 'Benutzer gelöscht', description: res.message });
                                                                window.location.reload();
                                                            } else {
                                                                toast({ title: 'Fehler', description: res.error, variant: 'destructive' });
                                                            }
                                                        }
                                                    }}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
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

            {/* Permissions Dialog */}
            <Dialog open={!!permissionDialogUser} onOpenChange={(open) => !open && setPermissionDialogUser(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Permisos Extras: {permissionDialogUser?.firstName}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <p className="text-sm text-muted-foreground">
                            Estos permisos se suman (o quitan) a los privilegios base del Rol.
                            (Esta es una implementación básica, la lógica granular debe estar soportada en cada módulo).
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                            {AVAILABLE_PERMISSIONS.map((perm) => (
                                <div key={perm.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={perm.id}
                                        checked={selectedPermissions.includes(perm.id)}
                                        onCheckedChange={() => togglePermission(perm.id)}
                                    />
                                    <Label htmlFor={perm.id}>{perm.label}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPermissionDialogUser(null)}>Cancelar</Button>
                        <Button onClick={handleSavePermissions}>Guardar Permisos</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Referrer Dialog */}
            <Dialog open={!!referrerDialogUser} onOpenChange={(open) => !open && setReferrerDialogUser(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Vincular Referidor para {referrerDialogUser?.firstName}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <Label htmlFor="refCode">Código Único del Referidor</Label>
                        <Input
                            id="refCode"
                            placeholder="Ej: DHH25NM00001"
                            value={referrerCodeInput}
                            onChange={(e) => setReferrerCodeInput(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Ingresa el código único de la persona que invitó a este usuario.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReferrerDialogUser(null)}>Cancelar</Button>
                        <Button onClick={handleSaveReferrer}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
