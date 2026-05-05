'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, FileText, PlayCircle, Bot, Headphones } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BibliotecaRecursos } from './BibliotecaRecursos';
import { AcademiaTutor } from './AcademiaTutor';

interface VideoWP {
  id: number;
  title: {
    rendered: string;
  };
  url_del_video?: string;
  categoria?: string;
  idioma?: string;
}

export function AcademiaView() {
  const { t } = useTranslation('common');

  return (
    <div className="p-6 md:p-8 space-y-6 bg-slate-50/50 dark:bg-black/10 min-h-full animate-in fade-in duration-500">
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t('freelancer_menu.academia', 'Academia Dicilo')}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t('academia.subtitle', 'Centro de estudios integral: videos, recursos y tutoría interactiva.')}
        </p>
      </div>

      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl mb-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-12">
          <TabsTrigger value="videos" className="flex items-center gap-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 dark:data-[state=active]:bg-indigo-900/30 dark:data-[state=active]:text-indigo-300">
            <PlayCircle className="w-4 h-4" />
            {t('academia.tabs.videos', 'Videos')}
          </TabsTrigger>
          <TabsTrigger value="recursos" className="flex items-center gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900/30 dark:data-[state=active]:text-emerald-300">
            <FileText className="w-4 h-4" />
            {t('academia.tabs.resources', 'Recursos')}
          </TabsTrigger>
          <TabsTrigger value="tutor" className="flex items-center gap-2 data-[state=active]:bg-fuchsia-50 data-[state=active]:text-fuchsia-700 dark:data-[state=active]:bg-fuchsia-900/30 dark:data-[state=active]:text-fuchsia-300">
            <Bot className="w-4 h-4" />
            {t('academia.tabs.tutor', 'Tutor AI')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="videos" className="mt-0 animate-in fade-in duration-300">
            <ReproductorVideosDicilo />
        </TabsContent>
        
        <TabsContent value="recursos" className="mt-0 animate-in fade-in duration-300">
            <BibliotecaRecursos />
        </TabsContent>
        
        <TabsContent value="tutor" className="mt-0 animate-in fade-in duration-300">
            <AcademiaTutor />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReproductorVideosDicilo() {
  const { t } = useTranslation('common');
  const [videos, setVideos] = useState<VideoWP[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('https://wp.dicilo.net/wp-json/wp/v2/videos-dicilo')
      .then(respuesta => {
        if (!respuesta.ok) {
          throw new Error('Error al conectar con la API de WordPress.');
        }
        return respuesta.json();
      })
      .then((datos: VideoWP[]) => {
        setVideos(datos);
        setCargando(false);
      })
      .catch(err => {
        setError(err.message);
        setCargando(false);
      });
  }, []);

  // Agrupamos los videos por su categoría (si WP no manda categoría, van a "General")
  const videosPorCategoria = useMemo(() => {
    if (!videos.length) return {};
    
    const agrupado: Record<string, VideoWP[]> = {};
    const currentLang = (i18n.language || 'es').split('-')[0]; // "es", "en", "de"

    videos.forEach(video => {
      // Filtrar por idioma
      const videoLang = video.idioma;
      if (videoLang && videoLang !== 'all' && videoLang !== currentLang) {
        return; // Saltar videos que no pertenecen a este idioma
      }

      // Por defecto, si el desarrollador de WP aún no ha mapeado el campo "categoria" en el JSON, 
      // mostramos todos bajo "Contenido General"
      const apiCat = video.categoria;
      const cat = (!apiCat || apiCat === 'Contenido General') 
        ? t('academia.videos.general', 'Contenido General') 
        : apiCat;
      if (!agrupado[cat]) agrupado[cat] = [];
      agrupado[cat].push(video);
    });
    
    return agrupado;
  }, [videos]);

  if (cargando) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((skeleton) => (
          <Card key={skeleton} className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg rounded-2xl bg-white dark:bg-slate-900">
            <Skeleton className="w-full aspect-video rounded-t-2xl rounded-b-none" />
            <CardContent className="p-5">
              <Skeleton className="h-6 w-3/4 mb-3" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 shadow-sm p-4 rounded-xl flex items-center gap-3">
        <AlertCircle className="text-red-500 h-6 w-6 shrink-0" />
        <div>
          <h3 className="text-red-800 dark:text-red-200 font-bold text-lg">{t('academia.error.title', '¡Ocurrió un error!')}</h3>
          <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {Object.keys(videosPorCategoria).length === 0 ? (
          <div className="text-center p-8 text-slate-500">{t('academia.videos.empty', 'No hay videos disponibles.')}</div>
      ) : (
          Object.entries(videosPorCategoria).map(([categoria, listaVideos]) => (
            <div key={categoria} className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        {categoria}
                    </h2>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-semibold px-2.5 py-0.5 rounded-full">
                        {listaVideos.length}
                    </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listaVideos.map(video => (
                    <Card key={video.id} className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl flex flex-col group">
                    {video.url_del_video ? (
                        <div className="relative">
                            <video 
                                className="w-full aspect-video object-cover rounded-t-2xl bg-black" 
                                controls
                                controlsList="nodownload"
                            >
                                <source src={video.url_del_video} type="video/mp4" />
                                {t('academia.videos.unsupported', 'Tu navegador no soporta el formato de video.')}
                            </video>
                        </div>
                    ) : (
                        <div className="w-full aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center rounded-t-2xl">
                        <span className="text-slate-400 text-sm font-medium">{t('academia.videos.unavailable', 'Video no disponible')}</span>
                        </div>
                    )}
                    <CardContent className="p-5 flex-1 flex flex-col justify-center">
                        <h3 
                        className="font-semibold text-lg text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                        dangerouslySetInnerHTML={{ __html: video.title.rendered }}
                        />
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
