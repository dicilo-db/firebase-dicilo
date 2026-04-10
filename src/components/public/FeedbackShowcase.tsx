'use client';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Play, Star, User, MessageCircle } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Feedback {
  id: string;
  name: string;
  rating: number;
  message: string;
  videoUrl?: string;
  createdAt: any;
}

export function FeedbackShowcase() {
  const { t } = useTranslation(['about', 'common']);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeedbacks() {
      try {
        const q = query(
          collection(db, 'feedbacks'),
          where('status', '==', 'approved')
        );
        const snapshot = await getDocs(q);
        const data: Feedback[] = [];
        snapshot.forEach(doc => {
          data.push({ id: doc.id, ...doc.data() } as Feedback);
        });
        
        // Sort manually by createdAt to avoid needing a composite index in Firestore
        data.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        // Limit to 20
        setFeedbacks(data.slice(0, 20));
      } catch (error) {
        console.error('Error fetching public feedbacks:', error);
      } finally {
        setLoading(false);
      }
    }
    loadFeedbacks();
  }, []);

  if (loading) {
    return (
      <div className="w-full space-y-4 py-8">
        <Skeleton className="w-[300px] h-8 mx-auto" />
        <div className="grid md:grid-cols-2 gap-8 mt-8">
          <Skeleton className="w-full h-[300px] rounded-xl" />
          <Skeleton className="w-full h-[300px] rounded-xl" />
        </div>
      </div>
    );
  }

  const videos = feedbacks.filter(f => f.videoUrl);
  const texts = feedbacks.filter(f => f.message && f.message.trim().length > 0);
  
  if (feedbacks.length === 0) {
    return (
      <div className="w-full py-12 mt-4 bg-muted/30 rounded-2xl border px-6 text-center animate-in fade-in duration-500">
        <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-xl font-semibold mb-2">Aún no hay opiniones de la comunidad</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Sé uno de los primeros en contarnos tu experiencia. Entra a tu Panel, ve a "Social y Recompensas" y compártenos tu reseña.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full py-8 mt-4 bg-muted/30 rounded-2xl border px-6">
      <h3 className="text-2xl font-bold text-center mb-8 hidden">
        {t('about:listenCommunity', 'Escucha a la comunidad')}
      </h3>
      
      <div className="grid md:grid-cols-2 gap-12 items-start">
        {/* Lado de Videos */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold flex items-center gap-2">
            <Play className="w-5 h-5 text-primary" />
            Video-Reseñas
          </h4>
          {videos.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aún no hay videos disponibles.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {videos.slice(0, 4).map((f) => (
                <Dialog key={f.id}>
                  <DialogTrigger asChild>
                    <div className="relative aspect-[9/16] bg-black rounded-xl overflow-hidden cursor-pointer group hover:ring-2 hover:ring-primary transition-all">
                      <video 
                        src={f.videoUrl + '#t=0.1'} 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                        preload="metadata"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/50 p-3 rounded-full text-white group-hover:scale-110 transition-transform">
                          <Play className="w-6 h-6 fill-current" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-3">
                        <p className="text-white text-xs font-medium truncate">{f.name}</p>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-black border-none">
                    <DialogTitle className="sr-only">Video Reseña de {f.name}</DialogTitle>
                    <video 
                      src={f.videoUrl} 
                      controls 
                      autoPlay 
                      className="w-full max-h-[85vh] object-contain"
                    />
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}
        </div>

        {/* Lado de Textos (Carrusel) */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            Lo que dicen de nosotros
          </h4>
          {texts.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aún no hay opiniones escritas.</p>
          ) : (
            <div className="px-6 md:px-10">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent>
                  {texts.map((f, index) => (
                    <CarouselItem key={index}>
                      <div className="p-1">
                        <Card className="border-none shadow-md bg-white dark:bg-slate-900 border-t-4 border-t-primary">
                          <CardContent className="flex flex-col gap-4 p-6 min-h-[220px]">
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`h-4 w-4 ${
                                    s <= (f.rating || 5)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <blockquote className="flex-1 text-sm md:text-base italic text-muted-foreground relative">
                              "{f.message}"
                            </blockquote>
                            <div className="flex items-center gap-3 pt-4 border-t">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                  {f.name ? f.name.charAt(0).toUpperCase() : 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-semibold">{f.name || 'Usuario Dicilo'}</p>
                                <p className="text-xs text-muted-foreground">Miembro Verificado</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
