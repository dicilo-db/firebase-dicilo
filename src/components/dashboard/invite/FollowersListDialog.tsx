'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Send, Search, ArrowDownAZ, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getFollowersDetails } from '@/app/actions/private-users';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

interface FollowersListDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    followerReferrals: any[]; // Array of referal objects { uid, code, ... }
}

export function FollowersListDialog({ open, onOpenChange, followerReferrals }: FollowersListDialogProps) {
    const { t } = useTranslation(['admin', 'common']);
    const { toast } = useToast();
    const [followers, setFollowers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedUids, setSelectedUids] = useState<string[]>([]);
    const [sending, setSending] = useState(false);

    // Search & Sort State
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'date' | 'alpha'>('date');

    useEffect(() => {
        if (open && followerReferrals.length > 0) {
            setLoading(true);
            // Extract UIDs
            const uids = followerReferrals.map((r: any) => typeof r === 'object' ? r.uid : r).filter(Boolean);

            getFollowersDetails(uids).then((data) => {
                setFollowers(data);
                setLoading(false);
            });
        }
    }, [open, followerReferrals]);

    // Cleanup selection when dialog closes
    useEffect(() => {
        if (!open) {
            setSearchTerm('');
            setSortBy('date');
            setSelectedUids([]);
        }
    }, [open]);

    // Filter & Sort Logic
    const filteredFollowers = followers.filter(follower => {
        if (!searchTerm) return true;
        const lowerTerm = searchTerm.toLowerCase();
        const fullName = `${follower.firstName} ${follower.lastName}`.toLowerCase();
        return fullName.includes(lowerTerm) || follower.email.toLowerCase().includes(lowerTerm);
    }).sort((a, b) => {
        if (sortBy === 'alpha') {
            const nameA = `${a.firstName} ${a.lastName}`.toLowerCase().trim();
            const nameB = `${b.firstName} ${b.lastName}`.toLowerCase().trim();
            return nameA.localeCompare(nameB);
        } else {
            // Date Descending (Newest first)
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
        }
    });

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedUids(filteredFollowers.map(f => f.uid));
        } else {
            setSelectedUids([]);
        }
    };

    const handleSelectOne = (uid: string, checked: boolean) => {
        if (checked) {
            setSelectedUids(prev => [...prev, uid]);
        } else {
            setSelectedUids(prev => prev.filter(id => id !== uid));
        }
    };

    const handleSendNotification = async () => {
        if (selectedUids.length === 0) return;
        setSending(true);

        // Placeholder for sending notification logic
        // In real app, this would call a Server Action to send Email/Push
        await new Promise(resolve => setTimeout(resolve, 1500));

        toast({
            title: t('common:sent', 'Envío Exitoso'),
            description: t('admin:invite.followers.notificationSent', 'Se ha enviado la recomendación a {{count}} seguidores.', { count: selectedUids.length })
        });

        setSending(false);
        setSelectedUids([]);
        onOpenChange(false);
    };

    const toggleSort = () => {
        setSortBy(prev => prev === 'date' ? 'alpha' : 'date');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('admin:invite.followers.title', 'Mis Seguidores')}</DialogTitle>
                    <DialogDescription>
                        {t('admin:invite.followers.subtitle', 'Selecciona los seguidores a quienes deseas enviar recomendaciones.')}
                    </DialogDescription>
                </DialogHeader>

                {/* Search & Sort Bar */}
                <div className="flex items-center gap-2 py-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder={t('common:search', 'Buscar nombre o email...')}
                            className="pl-9 h-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleSort}
                        className="h-9 w-9"
                        title={sortBy === 'date' ? 'Ordenar alfabéticamente' : 'Ordenar por fecha'}
                    >
                        {sortBy === 'date' ? <ArrowDownAZ className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                    </Button>
                </div>

                <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="select-all"
                            checked={filteredFollowers.length > 0 && filteredFollowers.every(f => selectedUids.includes(f.uid))}
                            onCheckedChange={(c) => handleSelectAll(c as boolean)}
                            disabled={loading || filteredFollowers.length === 0}
                        />
                        <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                            {t('common:selectAll', 'Seleccionar Todos')}
                        </label>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {selectedUids.length} {t('common:selected', 'seleccionados')}
                    </span>
                </div>

                <ScrollArea className="h-[300px] pr-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : filteredFollowers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {searchTerm ? t('common:noResults', 'No se encontraron resultados.') : t('admin:invite.followers.empty', 'No tienes seguidores aún.')}
                        </div>
                    ) : (
                        <div className="space-y-3 pt-2">
                            {filteredFollowers.map((follower) => (
                                <div key={follower.uid} className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <Checkbox
                                            id={`user-${follower.uid}`}
                                            checked={selectedUids.includes(follower.uid)}
                                            onCheckedChange={(c) => handleSelectOne(follower.uid, c as boolean)}
                                        />
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={follower.photoUrl} />
                                            <AvatarFallback>{follower.firstName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="grid gap-0.5">
                                            <label
                                                htmlFor={`user-${follower.uid}`}
                                                className="text-sm font-medium leading-none cursor-pointer"
                                            >
                                                {follower.firstName} {follower.lastName}
                                            </label>
                                            <p className="text-xs text-muted-foreground">
                                                {follower.email}
                                            </p>
                                        </div>
                                    </div>
                                    {follower.createdAt && (
                                        <span className="text-[10px] text-muted-foreground">
                                            {new Date(follower.createdAt).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <DialogFooter className="sm:justify-between flex-row items-center gap-2">
                    <div className="flex-1"></div>
                    <Button
                        onClick={handleSendNotification}
                        disabled={selectedUids.length === 0 || sending}
                        className="w-full sm:w-auto"
                    >
                        {sending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="mr-2 h-4 w-4" />
                        )}
                        {t('admin:invite.followers.sendBtn', 'Enviar Recomendación')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
