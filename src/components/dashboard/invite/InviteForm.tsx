'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Eye, Share2, Send, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendPioneerInvitations } from '@/app/actions/invite';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface InviteFormProps {
    uniqueCode: string;
    userName: string;
    onSuccess: () => void;
    availableSlots: number;
}

export function InviteForm({ uniqueCode, userName, onSuccess, availableSlots }: InviteFormProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [name, setName] = useState(userName || '');
    const [friends, setFriends] = useState([{ name: '', email: '', lang: 'es', template: 'general' }]);
    const [isSending, setIsSending] = useState(false);

    const updateFriend = (index: number, field: string, value: string) => {
        const newFriends = [...friends];
        newFriends[index] = { ...newFriends[index], [field]: value };
        setFriends(newFriends);
    };

    const addFriendRow = () => {
        if (friends.length >= availableSlots) {
            toast({ title: 'Limit Reached', description: `Only ${availableSlots} slots remaining.`, variant: 'destructive' });
            return;
        }
        setFriends([...friends, { name: '', email: '', lang: 'es', template: 'general' }]);
    };

    const removeFriendRow = (index: number) => {
        const newFriends = [...friends];
        newFriends.splice(index, 1);
        setFriends(newFriends);
    };

    const handleSend = async () => {
        const validFriends = friends.filter(f => f.name && f.email);
        if (validFriends.length === 0) return;

        setIsSending(true);
        try {
            // Map 'general' template to actual text if needed in backend, or send as ID
            const result = await sendPioneerInvitations(user?.uid || '', name, validFriends as any[]);

            if (result.success) {
                toast({ title: 'Invitations Sent', description: `Successfully sent ${result.sentCount} invitations.` });
                setFriends([{ name: '', email: '', lang: 'es', template: 'general' }]);
                onSuccess();
            } else {
                toast({ title: 'Error', description: result.error, variant: 'destructive' });
            }
        } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Tu ID</Label>
                    <div className="bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-500 font-mono">
                        {uniqueCode || 'Generating...'}
                    </div>
                </div>
                <div className="flex-1 space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Tu Nombre</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
                </div>
            </div>

            <div className="border rounded-lg p-4 space-y-4 bg-white/50">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-blue-600">Agregar Amigo ({friends.filter(f => f.email).length}/7)</h3>
                </div>

                {friends.map((friend, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                        <div className="space-y-2">
                            <Label className="text-xs">Nombre</Label>
                            <Input
                                placeholder="Ej. Martín"
                                value={friend.name}
                                onChange={(e) => updateFriend(idx, 'name', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Email</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="email@ejemplo.com"
                                    value={friend.email}
                                    onChange={(e) => updateFriend(idx, 'email', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Idioma</Label>
                            <Select value={friend.lang} onValueChange={(val) => updateFriend(idx, 'lang', val)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="es">Español</SelectItem>
                                    <SelectItem value="de">Deutsch</SelectItem>
                                    <SelectItem value="en">English</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Plantilla</Label>
                            <div className="flex gap-2">
                                <Select value={friend.template} onValueChange={(val) => updateFriend(idx, 'template', val)}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general">Ahorro (General)</SelectItem>
                                        <SelectItem value="business">Negocio</SelectItem>
                                    </SelectContent>
                                </Select>
                                {friends.length > 1 && (
                                    <Button variant="ghost" size="icon" onClick={() => removeFriendRow(idx)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => toast({ title: 'Preview', description: 'Showing preview...' })}>
                    <Eye className="mr-2 h-4 w-4" /> Vista Previa
                </Button>
                <Button variant="secondary" className="flex-1 bg-gray-500 text-white hover:bg-gray-600" onClick={addFriendRow}>
                    <Plus className="mr-2 h-4 w-4" /> Agregar a la lista
                </Button>
            </div>

            <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" className="bg-green-600 text-white border-none hover:bg-green-700 flex-1">
                    <Share2 className="mr-2 h-4 w-4" /> Compartir
                </Button>
                <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={handleSend} disabled={isSending}>
                    {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Enviar {friends.filter(f => f.email).length} Invitaciones
                </Button>
            </div>
        </div>
    );
}
