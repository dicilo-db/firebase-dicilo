// src/components/ClientBody.tsx
'use client';
import React from 'react';
import Image from 'next/image';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

// Define la interfaz para los datos del cuerpo
export interface BodyData {
  title?: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  imageHint?: string;
  videoUrl?: string; // Para videos de YouTube o Vimeo
  ctaButtonText?: string;
  ctaButtonLink?: string;
  layout?: 'image-left' | 'image-right';
}

interface ClientBodyProps {
  data?: BodyData;
}

const ClientBody = ({ data }: ClientBodyProps) => {
  const { t } = useTranslation();

  if (
    !data ||
    (!data.title && !data.description && !data.imageUrl && !data.videoUrl)
  ) {
    return null; // No renderizar si no hay datos
  }

  const isVideo =
    data.videoUrl &&
    (data.videoUrl.includes('youtube') || data.videoUrl?.includes('vimeo'));
  const isImage = data.imageUrl && !isVideo;

  const contentOrderClass = cn('md:flex-row', {
    'md:flex-row-reverse': data.layout === 'image-right',
  });

  return (
    <section className="bg-white py-12 md:py-24">
      <div className="container mx-auto px-4">
        <div
          className={cn(
            'flex flex-col items-center gap-8 md:flex-row',
            contentOrderClass
          )}
        >
          {/* Columna de Contenido (Texto) */}
          <div className="flex-1 space-y-6 text-center md:text-left">
            {data.title && (
              <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl">
                {data.title}
              </h2>
            )}
            {data.subtitle && (
              <p className="text-xl font-semibold text-primary">
                {data.subtitle}
              </p>
            )}
            {data.description && (
              <div
                className="prose text-lg leading-relaxed text-gray-600"
                dangerouslySetInnerHTML={{ __html: data.description }}
              />
            )}
            {data.ctaButtonText && data.ctaButtonLink && (
              <Button asChild className="mt-4">
                <a
                  href={data.ctaButtonLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {data.ctaButtonText}
                </a>
              </Button>
            )}
          </div>

          {/* Columna de Medios (Imagen o Video) */}
          {(isImage || isVideo) && (
            <div className="relative aspect-video w-full flex-1 overflow-hidden rounded-xl shadow-2xl">
              {isImage && (
                <Image
                  src={data.imageUrl!}
                  alt={data.imageHint || 'Client-specific image'}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              )}
              {isVideo && (
                <iframe
                  className="absolute left-0 top-0 h-full w-full"
                  src={data.videoUrl}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Client video"
                ></iframe>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ClientBody;
