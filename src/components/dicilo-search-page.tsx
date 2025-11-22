// src/components/dicilo-search-page.tsx
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Navigation,
  Building,
  MapPin,
  ExternalLink,
  Loader2,
  Mic,
  Map,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RecommendationForm } from './RecommendationForm';
import { useTranslation } from 'react-i18next';
import { Header } from './header';

export interface Business {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  imageUrl: string;
  imageHint: string;
  coords?: [number, number];
  address?: string;
  phone?: string;
  website?: string;
  category_key?: string;
  subcategory_key?: string;
  rating?: number;
  currentOfferUrl?: string;
  clientSlug?: string;
  mapUrl?: string;
}

interface DiciloSearchPageProps {
  initialBusinesses: Business[];
}

const logAnalyticsEvent = async (eventData: object) => {
  try {
    await fetch('/api/analytics/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
  } catch (error) {
    console.error('Failed to log analytics event:', error);
  }
};

const haversineDistance = (
  coords1: [number, number],
  coords2: [number, number]
): number => {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = toRad(coords2[0] - coords1[0]);
  const dLon = toRad(coords2[1] - coords1[1]);
  const lat1 = toRad(coords1[0]);
  const lat2 = toRad(coords2[0]);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const DiciloMap = dynamic(() => import('@/components/dicilo-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

const normalizeText = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export default function DiciloSearchPage({
  initialBusinesses,
}: DiciloSearchPageProps) {
  const { toast } = useToast();
  const { t, i18n } = useTranslation('common');
  const locale = i18n.language;
  const [isMounted, setIsMounted] = useState(false);

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchType, setSearchType] = useState<'business' | 'location'>(
    'business'
  );

  const [mapCenter, setMapCenter] = useState<[number, number]>([
    53.5511, 9.9937,
  ]);
  const [mapZoom, setMapZoom] = useState(12);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(
    null
  );
  const [isRecommendationFormOpen, setRecommendationFormOpen] = useState(false);
  const [recommendedBusiness, setRecommendedBusiness] = useState('');
  const [showMobileMap, setShowMobileMap] = useState(false);

  const handleGeolocation = useCallback(
    (isInitialLoad = false) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setMapCenter([latitude, longitude]);
            setMapZoom(14);
            setSelectedBusinessId(null);
          },
          (error) => {
            if (!isInitialLoad) {
              console.error('Geolocation error:', error);
              toast({
                title: t('search.geolocationErrorTitle'),
                description: t('search.geolocationErrorDesc'),
                variant: 'destructive',
              });
            }
          }
        );
      } else if (!isInitialLoad) {
        toast({
          title: t('search.geolocationNotSupportedTitle'),
          description: t('search.geolocationNotSupportedDesc'),
          variant: 'destructive',
        });
      }
    },
    [toast, t]
  );

  useEffect(() => {
    setIsMounted(true);
    setTimeout(() => handleGeolocation(true), 100);
  }, [handleGeolocation]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleOpenRecommendation = () => {
    setRecommendedBusiness(searchQuery);
    setRecommendationFormOpen(true);
  };

  const handleLocationSearch = useCallback(async () => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 3) return;
    setIsGeocoding(true);
    setSelectedBusinessId(null);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(debouncedQuery)}&format=json&limit=1&accept-language=${locale}`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon, type } = data[0];
        const newCenter: [number, number] = [parseFloat(lat), parseFloat(lon)];
        setMapCenter(newCenter);
        setMapZoom(type === 'country' ? 5 : 14);
        logAnalyticsEvent({
          type: 'search',
          searchQuery: debouncedQuery,
          resultsCount: 0,
          businessName: 'N/A',
          businessId: 'N/A',
        });
      } else {
        toast({
          title: t('search.locationNotFoundTitle'),
          description: t('search.locationNotFoundDesc', {
            query: debouncedQuery,
          }),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      toast({
        title: t('search.searchErrorTitle'),
        description: t('search.searchErrorDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsGeocoding(false);
    }
  }, [debouncedQuery, toast, t, locale]);

  const filteredBusinesses = useMemo(() => {
    const normalizedQuery = normalizeText(debouncedQuery);

    if (searchType !== 'business' || !normalizedQuery.trim()) {
      return [...initialBusinesses];
    }

    const textFiltered = initialBusinesses.filter((b) => {
      const searchableText = [
        b.name,
        b.description,
        b.category,
        b.location,
        b.address,
      ]
        .map(normalizeText)
        .join(' ');
      return searchableText.includes(normalizedQuery);
    });

    if (textFiltered.length === 0) return [];

    const primaryResult =
      textFiltered.find((b) =>
        normalizeText(b.name).startsWith(normalizedQuery)
      ) || textFiltered[0];

    if (
      !primaryResult ||
      !primaryResult.coords ||
      primaryResult.coords.length !== 2
    ) {
      return textFiltered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return textFiltered.sort((a, b) => {
      if (a.id === primaryResult.id) return -1;
      if (b.id === primaryResult.id) return 1;

      if (!a.coords || a.coords.length !== 2) return 1;
      if (!b.coords || b.coords.length !== 2) return -1;

      const distanceA = haversineDistance(primaryResult.coords, a.coords);
      const distanceB = haversineDistance(primaryResult.coords, b.coords);

      return distanceA - distanceB;
    });
  }, [debouncedQuery, initialBusinesses, searchType]);

  useEffect(() => {
    if (searchType === 'location' && debouncedQuery.length >= 3) {
      handleLocationSearch();
    } else if (searchType === 'business' && debouncedQuery.length >= 3) {
      logAnalyticsEvent({
        type: 'search',
        searchQuery: debouncedQuery,
        resultsCount: filteredBusinesses.length,
        businessName: 'N/A',
        businessId: 'N/A',
      });
    } else if (debouncedQuery.length < 3) {
      setSelectedBusinessId(null);
    }
  }, [
    debouncedQuery,
    searchType,
    handleLocationSearch,
    filteredBusinesses.length,
  ]);

  const handleBusinessCardClick = (business: Business) => {
    if (
      business.coords?.length === 2 &&
      !isNaN(business.coords[0]) &&
      !isNaN(business.coords[1])
    ) {
      setSelectedBusinessId(business.id);
      setMapCenter(business.coords as [number, number]);
      setMapZoom(15);
      logAnalyticsEvent({
        type: 'cardClick',
        businessId: business.id,
        businessName: business.name,
      });
      // Show map on mobile after clicking a card
      if (window.innerWidth < 768) {
        setShowMobileMap(true);
      }
    } else {
      toast({
        title: t('search.locationErrorTitle'),
        description: t('search.locationErrorDesc'),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex h-screen w-screen bg-background text-foreground md:flex-row flex-col">
      {/* Columna del Mapa */}
      <div
        className={cn(
          'h-1/2 w-full md:h-full md:w-1/2',
          'md:block', // Siempre visible en desktop
          showMobileMap ? 'hidden' : 'hidden' // Por defecto oculto en movil
        )}
      >
        {isMounted ? (
          <DiciloMap
            center={mapCenter}
            zoom={mapZoom}
            businesses={filteredBusinesses}
            selectedBusinessId={selectedBusinessId}
            t={t}
          />
        ) : (
          <Skeleton className="h-full w-full" />
        )}
      </div>

      {/* Columna de Búsqueda y Resultados */}
      <div
        className={cn(
          'flex h-full w-full flex-col',
          'md:w-1/2'
        )}
      >
        <Header />
        <div className="flex-shrink-0 px-4 pt-4">
          <Card className="w-full shadow-lg">
            <CardContent className="pt-6">
              <div className="mb-4 text-center">
                <h2 className="text-2xl font-bold tracking-tight">
                  {t('search.title')}
                </h2>
              </div>
              <div className="mb-2 flex gap-2">
                <Button
                  onClick={() => setSearchType('business')}
                  variant={searchType === 'business' ? 'default' : 'outline'}
                  className="w-full"
                >
                  <Building className="mr-2 h-4 w-4" />
                  {t('search.businessType')}
                </Button>
                <Button
                  onClick={() => setSearchType('location')}
                  variant={searchType === 'location' ? 'default' : 'outline'}
                  className="w-full"
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  {t('search.locationType')}
                </Button>
              </div>
              <div className="flex w-full items-center space-x-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    id="searchInput"
                    placeholder={
                      searchType === 'business'
                        ? t('search.businessPlaceholder')
                        : t('search.locationPlaceholder')
                    }
                    aria-label={t('search.searchLabel')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 text-base"
                    disabled={isGeocoding}
                  />
                  {isGeocoding && (
                    <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin" />
                  )}
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label="Suche per Sprache"
                >
                  <Mic className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  onClick={() => handleGeolocation(false)}
                  variant="outline"
                  aria-label={t('search.useLocationLabel')}
                  disabled={isGeocoding}
                >
                  <Navigation className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  onClick={() => setShowMobileMap(true)}
                  variant="outline"
                  aria-label="Show map"
                  className="md:hidden"
                >
                  <Map className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <ScrollArea className="mt-4 flex-grow px-4">
          <div className="grid grid-cols-1 gap-4 pb-4 md:grid-cols-2">
            {filteredBusinesses.length > 0 ? (
              filteredBusinesses.map((business) => (
                <div
                  key={business.id}
                  onClick={() => handleBusinessCardClick(business)}
                  className={cn(
                    'w-full cursor-pointer overflow-hidden rounded-xl bg-card p-4 shadow-md transition-all duration-200',
                    selectedBusinessId === business.id
                      ? 'border-2 border-primary ring-2 ring-primary/20'
                      : 'border'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <Image
                      className="h-16 w-16 rounded-full border-2 border-green-100 object-cover bg-green-100 p-1"
                      src={
                        business.imageUrl || 'https://placehold.co/64x64.png'
                      }
                      alt={`${business.name} logo`}
                      width={64}
                      height={64}
                      data-ai-hint={business.imageHint}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold">{business.name}</h3>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {business.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 truncate text-xs text-muted-foreground">
                    {business.location}
                  </div>
                  {(business.clientSlug || business.currentOfferUrl) && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <a
                        href={
                          business.clientSlug
                            ? `/client/${business.clientSlug}`
                            : business.currentOfferUrl!
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        {t('businessCard.currentOffer')}{' '}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="w-full py-10 text-center text-muted-foreground md:col-span-2">
                <p>{t('search.noResults', { query: searchQuery })}</p>
                {searchQuery && (
                  <Button variant="link" onClick={handleOpenRecommendation}>
                    {t('search.recommendBusiness')}
                  </Button>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Mapa a Pantalla Completa para Móviles */}
      {showMobileMap && (
        <div className="absolute inset-0 z-40 h-full w-full bg-background md:hidden">
          <Button
            variant="default"
            size="icon"
            onClick={() => setShowMobileMap(false)}
            className="absolute right-4 top-4 z-50 rounded-full"
            aria-label="Close map view"
          >
            <X className="h-5 w-5" />
          </Button>
          <DiciloMap
            center={mapCenter}
            zoom={mapZoom}
            businesses={filteredBusinesses}
            selectedBusinessId={selectedBusinessId}
            t={t}
          />
        </div>
      )}

      <RecommendationForm
        isOpen={isRecommendationFormOpen}
        setIsOpen={setRecommendationFormOpen}
        initialBusinessName={recommendedBusiness}
      />
    </div>
  );
}
