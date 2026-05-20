// src/components/premium/PremiumBlocks.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Check, X, Film, Sparkles, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper to convert standard video links to iframe-compatible embed URLs
export function getVideoEmbedUrl(url: string): string {
  if (!url) return '';
  try {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtube.com/watch')) {
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get('v') || '';
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('youtube.com/embed/')[1]?.split('?')[0] || '';
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
    if (url.includes('vimeo.com')) {
      const vimeoId = url.split('vimeo.com/')[1]?.split('?')[0] || '';
      return vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : url;
    }
  } catch (e) {
    console.error('Error parsing video URL:', e);
  }
  return url;
}

// 1. Text Block Component
export function DynamicTextBlock({ text }: { text: string }) {
  if (!text) return null;

  return (
    <section className="animate-fade-in relative rounded-[2rem] border border-white/20 bg-white/40 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-black/40">
      <div className="prose prose-slate max-w-none dark:prose-invert">
        {text.split('\n').map((paragraph, index) => (
          <p key={index} className="text-base leading-relaxed text-slate-700 dark:text-slate-300 md:text-lg">
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}

// 2. Photo Gallery Component (with Premium Lightbox)
export function DynamicGalleryBlock({ images, clientName }: { images?: string[]; clientName: string }) {
  const [activeImage, setActiveImage] = useState<string | null>(null);

  if (!images || images.length === 0) {
    return (
      <section className="flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-200 p-12 text-center text-muted-foreground dark:border-slate-800">
        <ImageIcon className="mb-4 h-12 w-12 text-slate-400" />
        <h3 className="font-bold text-lg">Galería sin imágenes</h3>
        <p className="text-sm">Agrega fotos de tu negocio desde el panel de control para que aparezcan aquí.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-yellow-500" />
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Galería de fotos</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {images.map((imgUrl, index) => (
          <div
            key={index}
            onClick={() => setActiveImage(imgUrl)}
            className="group relative h-48 w-full cursor-pointer overflow-hidden rounded-2xl bg-slate-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:bg-slate-900"
          >
            <Image
              src={imgUrl}
              alt={`${clientName} foto ${index + 1}`}
              fill
              sizes="(max-width: 768px) 50vw, 30vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
        ))}
      </div>

      {/* Lightbox Dialog Overlay */}
      {activeImage && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md transition-all duration-300 animate-in fade-in">
          <button
            onClick={() => setActiveImage(null)}
            className="absolute top-4 right-4 z-[10001] rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition-colors hover:bg-white/20"
            aria-label="Cerrar vista"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="relative max-h-[85vh] max-w-[95vw] overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
            <img
              src={activeImage}
              alt="Vista ampliada"
              className="max-h-[85vh] max-w-[95vw] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </section>
  );
}

// 3. Amenities / Features list Component
export function DynamicAmenitiesBlock({ items }: { items: string }) {
  if (!items) return null;
  const list = items.split(',').map(i => i.trim()).filter(Boolean);

  if (list.length === 0) return null;

  return (
    <section className="animate-fade-in relative rounded-[2rem] border border-white/20 bg-white/40 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] backdrop-blur-xl dark:border-white/10 dark:bg-black/40">
      <h3 className="mb-6 text-xl font-bold text-slate-800 dark:text-slate-100">Servicios y características</h3>
      <div className="flex flex-wrap gap-3">
        {list.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-2 rounded-full border border-green-200/50 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-700 shadow-sm transition-all hover:bg-green-500/15 dark:border-green-500/20 dark:text-green-400"
          >
            <Check className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// 4. Video Player Component
export function DynamicVideoBlock({ videoUrl, fallbackUrl }: { videoUrl?: string; fallbackUrl?: string }) {
  const urlToUse = videoUrl || fallbackUrl;
  if (!urlToUse) return null;

  const embedUrl = getVideoEmbedUrl(urlToUse);

  return (
    <section className="animate-fade-in space-y-6">
      <div className="flex items-center gap-2">
        <Film className="h-5 w-5 text-yellow-500" />
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Video de presentación</h2>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-white/20 bg-white/30 p-2 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
        <div className="relative aspect-video w-full overflow-hidden rounded-[1.7rem]">
          <iframe
            src={embedUrl}
            title="Video Player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      </div>
    </section>
  );
}
