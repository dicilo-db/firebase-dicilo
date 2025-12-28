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
import { Header } from '@/components/header';
import { AdBanner } from '@/components/AdBanner';

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

export interface Ad {
  id: string;
  clientId: string;
  imageUrl: string;
  linkUrl: string;
  shareText?: string;
  postalZones?: string[];
  languages?: string[];
  reach_config?: {
    type: 'local' | 'regional' | 'national' | 'continental' | 'international';
    value?: {
      radius_km?: number;
      city?: string;
      country?: string;
      continents?: string[];
    };
  };
  coords?: [number, number];
  [key: string]: any;
}

interface DiciloSearchPageProps {
  initialBusinesses: Business[];
  initialAds?: Ad[];
}

// AdCard removed, using AdBanner from '@/components/AdBanner'
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
  initialAds = []
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
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const selectedBusinessIdRef = React.useRef(selectedBusinessId);
  const [isListening, setIsListening] = useState(false);

  const startListening = useCallback(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = locale === 'de' ? 'de-DE' : locale === 'es' ? 'es-ES' : 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        toast({
          title: "Error",
          description: "No se pudo activar el micrófono.",
          variant: "destructive"
        });
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.start();
    } else {
      toast({
        title: "No soportado",
        description: "Tu navegador no soporta búsqueda por voz.",
        variant: "destructive"
      });
    }
  }, [locale, toast]);

  useEffect(() => {
    selectedBusinessIdRef.current = selectedBusinessId;
  }, [selectedBusinessId]);

  const handleGeolocation = useCallback(
    (isInitialLoad = false) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            // If it's the initial auto-load and the user has already selected a business,
            // do NOT override their selection with the user's location.
            if (isInitialLoad && selectedBusinessIdRef.current) {
              console.log('Geolocation skipped because a business is selected.');
              return;
            }

            const { latitude, longitude } = pos.coords;
            setMapCenter([latitude, longitude]);
            setUserLocation([latitude, longitude]);
            setMapZoom(14);
            setSelectedBusinessId(null);
          },
          (error) => {
            console.error('Geolocation error:', error);
            // Show toast even on initial load if it's a PERMISSION_DENIED
            // Use translation keys with fallback
            if (error.code === error.PERMISSION_DENIED) {
              toast({
                title: t('search.geoPermissionDeniedTitle', 'Standortzugriff verweigert'),
                description: t('search.geoPermissionDeniedDesc', 'Bitte erlauben Sie den Standortzugriff, um lokale Ergebnisse zu sehen.'),
                variant: 'destructive',
              });
            } else if (!isInitialLoad) {
              toast({
                title: t('search.geoErrorTitle'),
                description: t('search.geoErrorDesc'),
                variant: 'destructive',
              });
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
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

    // 1. Filter by text (if query exists)
    let result = [...initialBusinesses];

    if (searchType === 'business' && normalizedQuery.trim()) {
      result = initialBusinesses.filter((b) => {
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
    }

    // 2. Sort the result
    if (userLocation) {
      // Sort by distance if user location is known
      return result.sort((a, b) => {
        if (!a.coords || a.coords.length !== 2) return 1;
        if (!b.coords || b.coords.length !== 2) return -1;
        const distA = haversineDistance(userLocation, a.coords);
        const distB = haversineDistance(userLocation, b.coords);
        return distA - distB;
      });
    } else if (searchType === 'business' && normalizedQuery.trim()) {
      // If sorting by text relevance (primary match)
      const primaryResult = result.find((b) =>
        normalizeText(b.name).startsWith(normalizedQuery)
      ) || result[0];

      if (primaryResult) {
        return result.sort((a, b) => {
          if (a.id === primaryResult.id) return -1;
          if (b.id === primaryResult.id) return 1;
          return a.name.localeCompare(b.name);
        });
      }
    }

    // Default fallback: Alphabetical or kept as is
    return result; // Or result.sort((a, b) => a.name.localeCompare(b.name));
  }, [debouncedQuery, initialBusinesses, searchType, userLocation]);

  const sortedAds = useMemo(() => {
    // 1. If no user location, return original list
    if (!userLocation) return initialAds;

    // 2. Map ads to ensure coords are available (prefer injected, fallback to lookup)
    const localizedAds = initialAds.map((ad) => {
      // If ad already has coords (from server), use them.
      if (ad.coords) return ad;

      // Fallback: lookup in business list
      const business = initialBusinesses.find((b) => b.id === ad.clientId);
      return {
        ...ad,
        coords: business?.coords,
      };
    });

    // 3. Filter based on Geolocation (Match Server Logic but with precise GPS)
    const filteredAds = localizedAds.filter(ad => {
      // Safe check for reach_config
      const adAny = ad as any;
      if (!adAny.reach_config) return true; // Default to show if no config
      const { type, value } = adAny.reach_config;

      // Strict Local Radius Check
      if (type === 'local') {
        const radius = value?.radius_km || 50;
        if (!ad.coords || ad.coords.length !== 2) return true; // Can't verify, fail open (or close?) -> Open for visibility
        const dist = haversineDistance(userLocation, ad.coords as [number, number]);
        return dist <= radius;
      }

      return true;
    });

    // 4. Sort by distance to user
    return filteredAds.sort((a, b) => {
      // If no coords, push to end (distance = infinity)
      const hasCoordsA = a.coords && a.coords.length === 2;
      const hasCoordsB = b.coords && b.coords.length === 2;

      if (!hasCoordsA && !hasCoordsB) return 0;
      if (!hasCoordsA) return 1;
      if (!hasCoordsB) return -1;

      const distA = haversineDistance(userLocation, a.coords as [number, number]);
      const distB = haversineDistance(userLocation, b.coords as [number, number]);
      return distA - distB;
    });
  }, [initialAds, userLocation, initialBusinesses]);

  const businessesWithAds = useMemo(() => {
    if (!sortedAds.length || !filteredBusinesses.length) return filteredBusinesses.map(b => ({ type: 'business', data: b }));

    const result: any[] = [];
    let adIndex = 0;

    filteredBusinesses.forEach((business, index) => {
      result.push({ type: 'business', data: business });

      // Inject 2 ads every 10 businesses
      if ((index + 1) % 10 === 0 && sortedAds.length > 0) {

        // First Ad
        const ad1 = sortedAds[adIndex % sortedAds.length];

        // Ensure we don't crash and add valid ad
        if (ad1) {
          result.push({ type: 'ad', data: ad1 });
          adIndex++;
        }

        // Second Ad - Try to pick a NEXT one that is different if possible
        if (sortedAds.length > 1) {
          const ad2 = sortedAds[adIndex % sortedAds.length];
          if (ad2) {
            result.push({ type: 'ad', data: ad2 });
            adIndex++;
          }
        }
      }
    });

    return result;
  }, [filteredBusinesses, sortedAds]);

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
    // Robust validation before setting state
    if (
      Array.isArray(business.coords) &&
      business.coords.length === 2 &&
      Number.isFinite(business.coords[0]) &&
      Number.isFinite(business.coords[1])
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
      console.warn("Invalid coordinates for business:", business.name, business.coords);
      toast({
        title: t('search.locationErrorTitle'),
        description: t('search.locationErrorDesc'),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground md:flex-row">
      {/* Columna del Mapa (solo para desktop) */}
      <div className="hidden h-full md:block md:w-1/2">
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
      <div className="flex h-full w-full flex-col md:w-1/2">
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
                  onClick={startListening}
                  className={isListening ? "text-red-500 animate-pulse border-red-500" : ""}
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
            {businessesWithAds.length > 0 ? (
              businessesWithAds.map((item, idx) => {
                if (item.type === 'ad') {
                  return <AdBanner key={`ad-${idx}`} ad={item.data} rank={idx} />
                }
                const business = item.data;
                return (
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
                )
              })
            ) : (
              <div className="w-full py-10 text-center text-muted-foreground md:col-span-2">
                <p>
                  {searchQuery
                    ? t('search.noResults', { query: searchQuery })
                    : t('search.noResultsGeneric')}
                </p>
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
            className="absolute right-4 top-4 z-[2000] rounded-full shadow-md"
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
