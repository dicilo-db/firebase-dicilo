'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createTrustBoardPost } from '@/app/actions/trustboard';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function TrustBoardPostForm({ neighborhood, onSuccess, onCancel }: { neighborhood: string, onSuccess: () => void, onCancel: () => void }) {
    const { t, i18n } = useTranslation('common');
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'jobs'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        setLoading(true);
        try {
            const dataToSubmit = {
                ...formData,
                neighborhood,
                lang: i18n.language.substring(0, 2)
            };

            const result = await createTrustBoardPost(user.uid, dataToSubmit);
            
            if (result.success) {
                toast({
                    title: t('community.trustboard.form.success_title', '¡Anuncio Publicado!'),
                    description: t('community.trustboard.form.success_desc', 'Tu anuncio pasará por la revisión automática de Dicilo y será visible pronto.'),
                    className: "bg-emerald-50 border-emerald-200 text-emerald-800"
                });
                onSuccess();
            } else {
                toast({
                    title: t('community.trustboard.form.error_title', 'Límite Alcanzado o Error'),
                    description: result.error,
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: t('community.trustboard.form.unexpected_title', 'Error Inesperado'),
                description: t('community.trustboard.form.unexpected_desc', 'Revisa tu conexión e inténtalo de nuevo.'),
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
                <Label>{t('community.trustboard.form.category', 'Categoría')}</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('community.trustboard.form.cat_placeholder', 'Selecciona una especialidad')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="jobs">{t('community.trustboard.cat_jobs', 'Dicilo Jobs (Empleos locales)')}</SelectItem>
                        <SelectItem value="living">{t('community.trustboard.cat_living', 'Dicilo Living (Vivienda/Compañeros)')}</SelectItem>
                        <SelectItem value="talent">{t('community.trustboard.cat_talent', 'Dicilo Talent (Servicios/Mentores)')}</SelectItem>
                        <SelectItem value="swap">{t('community.trustboard.cat_swap', 'Gift/Swap (Intercambio/Regalos)')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>{t('community.trustboard.form.title', 'Título del Anuncio')}</Label>
                <Input 
                    required 
                    maxLength={100}
                    placeholder={t('community.trustboard.form.title_ph', 'Ej. Clases de Alemán Nivel C1')} 
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
            </div>

            <div className="space-y-2">
                <Label>{t('community.trustboard.form.desc', 'Descripción')}</Label>
                <Textarea 
                    required 
                    maxLength={1500}
                    className="min-h-[120px]"
                    placeholder={t('community.trustboard.form.desc_ph', 'Detalla qué ofreces o qué buscas...')} 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
            </div>
            
            <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
                💡 {t('community.trustboard.form.note', 'Nota: Este anuncio se publicará en')} <strong>{neighborhood}</strong>. 
                {t('community.trustboard.form.note_premium', 'Si eres usuario premium, Cerebro DiciBot traducirá este anuncio automáticamente a los otros 11 idiomas.')}
            </p>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                    {t('community.trustboard.form.cancel', 'Cancelar')}
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-white" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('community.trustboard.form.submit', 'Publicar Anuncio')}
                </Button>
            </div>
        </form>
    );
}
