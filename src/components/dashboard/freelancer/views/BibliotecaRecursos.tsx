'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, FileText, Headphones, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface RecursoWP {
  id: number;
  title: {
    rendered: string;
  };
  url_archivo: string;
  tipo: 'pdf' | 'audio'; // 'pdf' o 'audio'
  categoria?: string; 
  idioma?: string;
}

export function BibliotecaRecursos() {
  const { t, i18n } = useTranslation('common');
  const [recursos, setRecursos] = useState<RecursoWP[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // NOTA: Asegúrate de que este endpoint exista en tu WordPress
    fetch('https://wp.dicilo.net/wp-json/wp/v2/recursos-dicilo')
      .then(respuesta => {
        if (!respuesta.ok) {
          // Si el endpoint no existe aún, lanzamos error controlado
          throw new Error('El endpoint de recursos aún no está disponible en WordPress.');
        }
        return respuesta.json();
      })
      .then((datos: RecursoWP[]) => {
        setRecursos(datos);
        setCargando(false);
      })
      .catch(err => {
        setError(err.message);
        setCargando(false);
      });
  }, []);

  const recursosPorCategoria = useMemo(() => {
    if (!recursos.length) return {};
    const agrupado: Record<string, RecursoWP[]> = {};
    const currentLang = (i18n.language || 'es').split('-')[0]; // "es", "en", "de"

    recursos.forEach(recurso => {
      // Filtrar por idioma
      const recursoLang = recurso.idioma;
      if (recursoLang && recursoLang !== 'all' && recursoLang !== currentLang) {
        return; // Saltar recursos que no pertenecen a este idioma
      }

      const apiCat = recurso.categoria;
      const cat = (!apiCat || apiCat === 'Documentos Generales')
        ? t('academia.resources.general', 'Documentos Generales')
        : apiCat;
      if (!agrupado[cat]) agrupado[cat] = [];
      agrupado[cat].push(recurso);
    });
    return agrupado;
  }, [recursos, t, i18n.language]);

  if (cargando) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((skeleton) => (
          <Card key={skeleton} className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
            <CardContent className="p-6 flex flex-col gap-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-10 w-full mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 shadow-sm p-6 rounded-2xl flex items-start gap-4">
        <AlertCircle className="text-amber-500 h-6 w-6 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-amber-800 dark:text-amber-200 font-bold text-lg">Preparando Biblioteca</h3>
          <p className="text-amber-700 dark:text-amber-300 mt-1">
            {error} <br/>
            Para que esta sección funcione, necesitas crear el Custom Post Type "Recursos" en WordPress y exponer la API en `/wp-json/wp/v2/recursos-dicilo`.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {Object.keys(recursosPorCategoria).length === 0 ? (
          <div className="text-center p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>{t('academia.resources.empty', 'No hay recursos disponibles en este momento.')}</p>
          </div>
      ) : (
          Object.entries(recursosPorCategoria).map(([categoria, listaRecursos]) => (
            <div key={categoria} className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        {categoria}
                    </h2>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-semibold px-2.5 py-0.5 rounded-full">
                        {listaRecursos.length}
                    </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {listaRecursos.map(recurso => (
                    <Card key={recurso.id} className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow rounded-2xl flex flex-col group">
                        <CardContent className="p-6 flex flex-col h-full gap-4">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl flex-shrink-0 ${recurso.tipo === 'pdf' ? 'bg-red-50 text-red-500 dark:bg-red-900/20' : 'bg-indigo-50 text-indigo-500 dark:bg-indigo-900/20'}`}>
                                    {recurso.tipo === 'pdf' ? <FileText className="w-6 h-6" /> : <Headphones className="w-6 h-6" />}
                                </div>
                                <h3 
                                    className="font-semibold text-lg text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
                                    dangerouslySetInnerHTML={{ __html: recurso.title.rendered }}
                                />
                            </div>

                            <div className="mt-auto pt-4 flex flex-col gap-3">
                                {recurso.tipo === 'audio' && recurso.url_archivo && (
                                    <audio controls className="w-full h-10" src={recurso.url_archivo}>
                                        Tu navegador no soporta el formato de audio.
                                    </audio>
                                )}

                                <div className="flex gap-2 w-full">
                                    <Button variant="outline" className="flex-1 gap-2" asChild>
                                        <a href={recurso.url_archivo} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="w-4 h-4" />
                                            Ver
                                        </a>
                                    </Button>
                                    <Button variant="secondary" className="flex-1 gap-2" asChild>
                                        <a href={recurso.url_archivo} download>
                                            <Download className="w-4 h-4" />
                                            Descargar
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                </div>
            </div>
          ))
      )}
    </div>
  );
}
