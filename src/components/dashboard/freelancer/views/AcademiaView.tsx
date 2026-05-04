'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

interface VideoWP {
  id: number;
  title: {
    rendered: string;
  };
  url_del_video: string;
}

export function AcademiaView() {
  const { t } = useTranslation('common');

  return (
    <div className="p-6 md:p-8 space-y-6 bg-slate-50/50 dark:bg-black/10 min-h-full animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t('freelancer_menu.academia', 'Academia')}
        </h1>
        <p className="text-muted-foreground">
          Aprende y mejora tus habilidades con nuestra colección de videos.
        </p>
      </div>
      <ReproductorVideosDicilo />
    </div>
  );
}

function ReproductorVideosDicilo() {
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
          <h3 className="text-red-800 dark:text-red-200 font-bold text-lg">¡Ocurrió un error!</h3>
          <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map(video => (
        <Card key={video.id} className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-2xl flex flex-col">
          {video.url_del_video ? (
            <video 
              className="w-full aspect-video object-cover rounded-t-2xl bg-black" 
              controls
              controlsList="nodownload"
            >
              <source src={video.url_del_video} type="video/mp4" />
              Tu navegador no soporta el formato de video.
            </video>
          ) : (
            <div className="w-full aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center rounded-t-2xl">
              <span className="text-slate-400 text-sm font-medium">Video no disponible</span>
            </div>
          )}
          <CardContent className="p-5 flex-1 flex flex-col justify-center">
            <h3 
              className="font-semibold text-lg text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug"
              dangerouslySetInnerHTML={{ __html: video.title.rendered }}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
