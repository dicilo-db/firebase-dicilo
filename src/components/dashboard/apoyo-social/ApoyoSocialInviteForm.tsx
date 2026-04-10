'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { sendApoyoSocialInvite } from '@/app/actions/apoyo-social';

// Terreno abonado para 12 idiomas (Consistente con soporte multilingüe de Dicilo)
const SUPPORTED_LANGS = ['es', 'en', 'de', 'fr', 'pt', 'it', 'nl', 'zh', 'ja', 'ru', 'ar', 'hi'] as const;
type SupportedLang = (typeof SUPPORTED_LANGS)[number];

const inviteSchema = z.object({
  organizationName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  email: z.string().email('Introduzca un correo electrónico válido.'),
  lang: z.enum(SUPPORTED_LANGS)
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export function ApoyoSocialInviteForm() {
  const { toast } = useToast();
  const [isInviting, setIsInviting] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors }, reset, watch } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { lang: 'es' }
  });

  const onSubmit = async (data: InviteFormValues) => {
    setIsInviting(true);
    try {
      const res = await sendApoyoSocialInvite(data.email, data.organizationName, data.lang);
      if (res.success) {
        toast({ 
          title: 'Invitación enviada', 
          description: `Se ha enviado el enlace a ${data.email}.` 
        });
        reset();
      } else {
        toast({ title: 'Error al enviar', description: res.error, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error del sistema', description: e.message, variant: 'destructive' });
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="border p-6 rounded-xl shadow-sm bg-white">
      <h2 className="text-xl font-bold text-green-700 mb-4">Enviar invitación protegida</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        <div className="space-y-2">
          <Label htmlFor="organizationName">Nombre de la organización</Label>
          <Input 
            {...register('organizationName')} 
            id="organizationName"
            placeholder="Ej: Avanzando Juntos ONG"
          />
          {errors.organizationName && <p className="text-red-500 text-xs">{errors.organizationName.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input 
            type="email" 
            {...register('email')} 
            id="email"
            placeholder="contacto@organizacion.com" 
          />
          {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label>Idioma del correo</Label>
          <Select 
            onValueChange={(val: SupportedLang) => setValue('lang', val)} 
            value={watch('lang')}
          >
            <SelectTrigger><SelectValue placeholder="Seleccione un idioma..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="pt">Português</SelectItem>
              <SelectItem value="it">Italiano</SelectItem>
            </SelectContent>
          </Select>
          {errors.lang && <p className="text-red-500 text-xs">{errors.lang.message}</p>}
        </div>
        
        <p className="text-xs text-muted-foreground pt-2">
          Al enviar esta invitación, el destinatario recibirá un enlace único y personalizado para acceder al formulario de registro seguro. <strong>Queda prohibido</strong> reenviar este enlace a terceros.
        </p>

        <Button type="submit" className="w-full bg-green-600 text-white hover:bg-green-700" disabled={isInviting}>
          {isInviting ? 'Enviando invitación...' : 'Enviar invitación por correo'}
        </Button>
      </form>
    </div>
  );
}
