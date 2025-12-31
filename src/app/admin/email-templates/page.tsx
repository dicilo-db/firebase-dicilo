'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Edit, Trash2, Mail } from 'lucide-react';
import Link from 'next/link';
import { getTemplates, EmailTemplate } from '@/actions/email-templates';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function EmailTemplatesPage() {
    useAuthGuard(['admin', 'superadmin', 'team_office'], 'access_admin_panel');
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const data = await getTemplates();
            setTemplates(data);
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudieron cargar las plantillas",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Contenido</h1>
                    <p className="text-muted-foreground">Administra las plantillas de email del sistema.</p>
                </div>
                <Link href="/admin/email-templates/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Plantilla
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    <p>Cargando plantillas...</p>
                ) : templates.length === 0 ? (
                    <div className="col-span-full text-center py-10 border rounded-lg bg-slate-50 dark:bg-slate-900 border-dashed">
                        <Mail className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                        <h3 className="text-lg font-medium">No hay plantillas creadas</h3>
                        <p className="text-muted-foreground mb-4">Empieza creando una nueva plantilla para tus correos.</p>
                        <Link href="/admin/email-templates/new">
                            <Button variant="outline">Crear Plantilla</Button>
                        </Link>
                    </div>
                ) : (
                    templates.map((template) => (
                        <Card key={template.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg">{template.name}</CardTitle>
                                    <Badge variant={template.category === 'system' ? 'secondary' : 'default'}>
                                        {template.category}
                                    </Badge>
                                </div>
                                <CardDescription>
                                    ID: {template.id}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2 justify-end mt-4">
                                    <Link href={`/admin/email-templates/${template.id}`} className="w-full">
                                        <Button variant="outline" className="w-full">
                                            <Edit className="mr-2 h-4 w-4" />
                                            Editar
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
