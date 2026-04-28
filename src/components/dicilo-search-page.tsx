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
import { useAuth } from '@/context/AuthContext';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { ToastAction } from '@/components/ui/toast';
import { Heart } from 'lucide-react';

import { BasicCard } from './cards/BasicCard';
import { PremiumCard } from './cards/PremiumCard';

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
  email?: string;
  website?: string;
  category_key?: string;
  subcategory_key?: string;
  rating?: number;
  currentOfferUrl?: string;
  clientSlug?: string;
  mapUrl?: string;
  clientType?: 'retailer' | 'premium' | 'starter';
  tier_level?: 'basic' | 'premium';
  clientLogoUrl?: string;
  coverImageUrl?: string;
  visibility_settings?: {
    active_range: 'local' | 'regional' | 'national' | 'continental' | 'international';
    geo_coordinates?: { lat: number; lng: number };
    allowed_continents?: string[];
  };
  description_translations?: {
    en?: string;
    es?: string;
    de?: string;
  };
  activeCoupons?: any[];
  active?: boolean;
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
  initialAds?: Ad[];
  serverGeo?: any;
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
  initialAds = [],
  serverGeo
}: DiciloSearchPageProps) {
  const { toast } = useToast();
  const { t, i18n } = useTranslation('common');
  const locale = i18n.language;
  const { user } = useAuth();
  const router = useRouter();
  const db = getFirestore(app);
  const [isMounted, setIsMounted] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user?.uid) {
        setFavorites([]);
        return;
      }
      try {
        const docRef = doc(db, 'private_profiles', user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setFavorites(snap.data().favorites || []);
        }
      } catch (error) {
        console.error("Error loading favorites:", error);
      }
    };
    loadFavorites();
  }, [user, db]);

  const toggleFavorite = async (e: React.MouseEvent, businessId: string) => {
    e.stopPropagation(); // Prevent card click
    if (!user) {
      toast({
        title: t('auth.requiredTitle', "Cuenta requerida"),
        description: t('auth.favoritesLoginDesc', "Por favor, regístrate en Dicilo para guardar favoritos."),
        action: (
          <ToastAction altText="Registrarse" onClick={() => router.push('/register')}>
            Registrarse
          </ToastAction>
        ),
      });
      return;
    }

    const isFav = favorites.includes(businessId);
    // Optimistic Update
    setFavorites(prev => isFav ? prev.filter(id => id !== businessId) : [...prev, businessId]);

    try {
      const userRef = doc(db, 'private_profiles', user.uid);
      if (isFav) {
        await updateDoc(userRef, { favorites: arrayRemove(businessId) });
      } else {
        await updateDoc(userRef, { favorites: arrayUnion(businessId) });
      }
    } catch (err) {
      console.error("Fav error:", err);
      toast({ title: "Error", description: "No se pudo actualizar.", variant: "destructive" });
      // Rollback
      setFavorites(prev => isFav ? [...prev, businessId] : prev.filter(id => id !== businessId));
    }
  };

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
  const [isMobileSearchHidden, setIsMobileSearchHidden] = useState(false);
  
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBusinesses = useCallback(async (resetPage: boolean = false) => {
    const currentPage = resetPage ? 0 : page;
    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', '50');
      
      if (debouncedQuery.trim()) {
        params.append('q', debouncedQuery);
      }
      
      if (userLocation) {
        params.append('lat', userLocation[0].toString());
        params.append('lng', userLocation[1].toString());
      } else if (serverGeo && serverGeo.lat && serverGeo.lon) {
        params.append('lat', serverGeo.lat.toString());
        params.append('lng', serverGeo.lon.toString());
      }

      const res = await fetch(`/api/search/nearest?${params.toString()}`);
      const data = await res.json();

      if (data.data) {
        if (resetPage) {
          setBusinesses(data.data);
        } else {
          setBusinesses(prev => {
            // Deduplicate to avoid key errors
            const existingIds = new Set(prev.map(b => b.id));
            const newItems = data.data.filter((b: any) => !existingIds.has(b.id));
            return [...prev, ...newItems];
          });
        }
        setHasMore(data.meta?.hasMore || false);
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, userLocation, serverGeo, page]);

  useEffect(() => {
    setPage(0);
    fetchBusinesses(true);
  }, [debouncedQuery, userLocation]);

  useEffect(() => {
    if (page > 0) {
      fetchBusinesses(false);
    }
  }, [page]);

  const loadMore = () => {
    setPage(p => p + 1);
  };

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
    async (isInitialLoad = false) => {

      const updateLocationState = (lat: number, lng: number) => {
        setMapCenter([lat, lng]);
        setUserLocation([lat, lng]);
        setMapZoom(14);
        setSelectedBusinessId(null);
      };

      const handleGeoError = async (error: any) => {
        console.warn("Geo/GPS Limit:", error.message);

        let errorMsg = t('search.geoGenericError', "Standort konnte nicht ermittelt werden.");
        let showToast = !isInitialLoad;

        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = t('search.geoPermissionDeniedDesc', "Standortzugriff verweigert. Bitte erlauben Sie diesen in Ihrem Browser.");
          showToast = true;
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = t('search.geoUnavailableDesc', "Standort derzeit nicht verfügbar.");
        } else if (error.code === error.TIMEOUT) {
          errorMsg = t('search.geoTimeoutDesc', "Zeitüberschreitung bei der Standortbestimmung.");
        }

        if (showToast) {
          toast({
            title: t('search.geoErrorTitle', "Standortfehler"),
            description: errorMsg,
            variant: 'destructive',
          });
        }

        // FALLBACK STRATEGY (Plan B - API IP)
        try {
          console.log("Attempting IP Fallback...");
          const response = await fetch('https://ipapi.co/json/');
          if (!response.ok) throw new Error("IP API failed");

          const data = await response.json();
          if (data.latitude && data.longitude) {
            updateLocationState(data.latitude, data.longitude);
            if (showToast) {
              toast({
                title: t('search.geoFallbackTitle', "Ungefährer Standort"),
                description: t('search.geoFallbackDesc', "Verwende Standort basierend auf IP."),
              });
            }
          }
        } catch (fallbackError) {
          console.error("Fallback IP Geo failed:", fallbackError);
        }
      };

      // 1. HTTPS CHECK
      if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        const msg = t('search.geoHttpsRequired', "Die Ortung erfordert eine sichere Verbindung (HTTPS).");
        if (!isInitialLoad) {
          toast({
            title: "Sicherheit",
            description: msg,
            variant: 'destructive',
          });
        }
        console.warn(msg);
        return;
      }

      // 2. High Accuracy Options
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      if (!navigator.geolocation) {
        handleGeoError(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (isInitialLoad && selectedBusinessIdRef.current) {
            console.log('Geolocation skipped because a business is selected.');
            return;
          }
          const { latitude, longitude } = pos.coords;
          updateLocationState(latitude, longitude);
          
          if (!isInitialLoad) {
            toast({
              title: "Ubicación actualizada",
              description: "Resultados ordenados por cercanía."
            });
          }
        },
        async (error) => {
          await handleGeoError(error);
        },
        options
      );
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
      // Try Photon (Komoot) first for better fault tolerance with complex addresses
      let response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(debouncedQuery)}&limit=1`
      );
      let data = await response.json();
      
      let foundCenter: [number, number] | null = null;
      let foundZoom = 14;

      if (data && data.features && data.features.length > 0) {
        const [lon, lat] = data.features[0].geometry.coordinates;
        const type = data.features[0].properties?.osm_value;
        foundCenter = [lat, lon];
        foundZoom = type === 'country' ? 5 : 14;
      } else {
        // Fallback to strict Nominatim
        response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(debouncedQuery)}&format=json&limit=1&accept-language=${locale}`
        );
        data = await response.json();
        if (data && data.length > 0) {
          const { lat, lon, type } = data[0];
          foundCenter = [parseFloat(lat), parseFloat(lon)];
          foundZoom = type === 'country' ? 5 : 14;
        }
      }

      if (foundCenter) {
        setMapCenter(foundCenter);
        setMapZoom(foundZoom);
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

  const filteredBusinesses = businesses;

  const sortedAds = useMemo(() => {
    // 1. If no user location, return original list
    if (!userLocation) return initialAds;

    // 2. Map ads to ensure coords are available (prefer injected, fallback to lookup)
    const localizedAds = initialAds.map((ad) => {
      // If ad already has coords (from server), use them.
      if (ad.coords) return ad;

      // Fallback: lookup in business list
      const business = businesses.find((b) => b.id === ad.clientId);
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
  }, [initialAds, userLocation, businesses]);

  const businessesWithAds = useMemo(() => {
    if (!sortedAds.length || !filteredBusinesses.length) return filteredBusinesses.map(b => ({ type: 'business', data: b }));

    const result: any[] = [];
    let adIndex = 0;

    // 1. Start with 2 Nearest Ads (Priority)
    // Always inject the first 1 or 2 ads at the very top if available
    if (adIndex < sortedAds.length) {
      result.push({ type: 'ad', data: sortedAds[adIndex] });
      adIndex++;
    }
    if (adIndex < sortedAds.length) {
      result.push({ type: 'ad', data: sortedAds[adIndex] });
      adIndex++;
    }

    // 2. Interleave Businesses and remaining Ads
    filteredBusinesses.forEach((business, index) => {
      result.push({ type: 'business', data: business });

      // After every 10 businesses, inject the next 2 ads
      if ((index + 1) % 10 === 0) {
        if (adIndex < sortedAds.length) {
          result.push({ type: 'ad', data: sortedAds[adIndex] });
          adIndex++;
        }
        if (adIndex < sortedAds.length) {
          result.push({ type: 'ad', data: sortedAds[adIndex] });
          adIndex++;
        }
      }
    });

    // If there are remaining ads, append them at the end
    while (adIndex < sortedAds.length) {
      result.push({ type: 'ad', data: sortedAds[adIndex] });
      adIndex++;
    }

    return result;
  }, [filteredBusinesses, sortedAds]);

  const visibleBusinessesWithAds = businessesWithAds;

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
          />
        ) : (
          <Skeleton className="h-full w-full" />
        )}
      </div>

      {/* Columna de Búsqueda y Resultados */}
      <div className="flex h-full w-full flex-col md:w-1/2 relative">
        <Header />
        
        {/* Toggle para reabrir la búsqueda (Solo Móvil) */}
        {isMobileSearchHidden && (
          <div className="md:hidden flex justify-center py-3 bg-slate-50/95 backdrop-blur border-b shadow-sm sticky top-0 z-20">
            <Button 
              variant="outline" 
              onClick={() => setIsMobileSearchHidden(false)} 
              className="text-primary hover:bg-green-50 rounded-full h-12 w-12 p-0 border-2 border-green-500 bg-white shadow-md transition-transform hover:scale-110"
              aria-label="Abrir búsqueda"
            >
              <Search className="h-6 w-6 text-green-600" />
            </Button>
          </div>
        )}

        <div className={cn("flex-shrink-0 px-4 pt-4 transition-all duration-300", isMobileSearchHidden ? "hidden md:block" : "block")}>
          <Card className="w-full shadow-lg relative">
            <Button 
              onClick={() => setIsMobileSearchHidden(true)} 
              variant="ghost" 
              size="icon" 
              className="md:hidden absolute top-2 right-2 text-slate-400 hover:text-slate-600 z-10"
              aria-label="Minimizar búsqueda"
            >
              <X className="h-5 w-5" />
            </Button>
            <CardContent className="pt-6">
              <div className="mb-4 text-center">
                <h2 className="text-2xl font-bold tracking-tight">
                  {t('search.title')}
                </h2>
              </div>
              <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  onClick={() => setSearchType('business')}
                  variant={searchType === 'business' ? 'default' : 'outline'}
                  className="w-full h-auto py-2 px-3 whitespace-normal text-center flex flex-col sm:flex-row"
                >
                  <Building className="mb-1 sm:mb-0 sm:mr-2 h-4 w-4 shrink-0" />
                  <span className="leading-tight">{t('search.businessType')}</span>
                </Button>
                <Button
                  onClick={() => setSearchType('location')}
                  variant={searchType === 'location' ? 'default' : 'outline'}
                  className="w-full h-auto py-2 px-3 whitespace-normal text-center flex flex-col sm:flex-row"
                >
                  <MapPin className="mb-1 sm:mb-0 sm:mr-2 h-4 w-4 shrink-0" />
                  <span className="leading-tight">{t('search.locationType')}</span>
                </Button>
              </div>
              <div className="flex w-full flex-wrap sm:flex-nowrap items-center gap-2">
                <div className="relative flex-grow min-w-[200px]">
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && window.innerWidth < 768) {
                        e.currentTarget.blur();
                        setIsMobileSearchHidden(true);
                      }
                    }}
                    className="pl-10 text-base w-full"
                    disabled={isGeocoding}
                  />
                  {isGeocoding && (
                    <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin" />
                  )}
                </div>
                <div className="flex items-center gap-2 ml-auto sm:ml-0">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label="Suche per Sprache"
                    onClick={startListening}
                    className={cn("h-10 w-10 shrink-0", isListening ? "text-red-500 animate-pulse border-red-500" : "")}
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
                    className="h-10 w-10 shrink-0"
                  >
                    <Navigation className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    onClick={() => setShowMobileMap(true)}
                    variant="outline"
                    aria-label="Show map"
                    className="md:hidden h-10 w-10 shrink-0"
                  >
                    <Map className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <ScrollArea className="mt-4 flex-grow px-4">
          <div 
            className="grid grid-cols-1 gap-4 pb-4 md:grid-cols-2"
            onTouchMoveCapture={() => {
              if (!isMobileSearchHidden && window.innerWidth < 768) {
                setIsMobileSearchHidden(true);
              }
            }}
            onWheelCapture={() => {
              if (!isMobileSearchHidden && window.innerWidth < 768) {
                setIsMobileSearchHidden(true);
              }
            }}
          >
            {isLoading && businesses.length === 0 ? (
              // Initial Loading Skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <div key={`skel-${i}`} className="p-4 border rounded-xl flex gap-4 bg-white/50 animate-pulse">
                  <div className="h-16 w-16 rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-3 py-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-200 rounded w-full" />
                      <div className="h-3 bg-slate-200 rounded w-5/6" />
                    </div>
                  </div>
                </div>
              ))
            ) : businessesWithAds.length > 0 ? (
              businessesWithAds.map((item, idx) => {
                // Calc Debug
                let distDisplay = '';
                let debugInfo = '';

                if (userLocation && item.data.coords && item.data.coords.length === 2 && userLocation[0] && userLocation[1]) {
                  const d = haversineDistance(userLocation, item.data.coords as [number, number]);
                  distDisplay = `${d.toFixed(2)} km`;
                } else if (!item.data.coords) {
                  if (item.type === 'ad') {
                    debugInfo = 'No Coords';
                    if (item.data.clientId) {
                      // Try to find why lookup failed
                      const linkedBiz = businesses.find(b => b.id === item.data.clientId);
                      if (!linkedBiz) debugInfo += ' (Client Not Found)';
                      else if (!linkedBiz.coords) debugInfo += ' (Client has No Coords)';
                    } else {
                      debugInfo += ' (No ClientID)';
                    }
                  } else {
                    debugInfo = 'No Coords';
                  }
                }

                const DebugBadge = () => (
                  <div className="absolute top-0 right-0 z-50 bg-red-600 text-white text-[10px] px-1 font-mono opacity-90 pointer-events-none rounded-bl-md flex flex-col items-end">
                    <span>{distDisplay || 'N/A'}</span>
                    {debugInfo && <span className="text-[9px] bg-black px-1">{debugInfo}</span>}
                  </div>
                );

                if (item.type === 'ad') {
                  return (
                    <div key={`ad-${item.data.id}-${idx}`} className="relative mb-4">
                      <DebugBadge />
                      <AdBanner ad={item.data} rank={idx} />
                    </div>
                  )
                }
                const business = item.data;
                // Uniform presentation for the list (User request)
                return (
                  <div key={business.id} className="relative">
                    <DebugBadge />
                    <div
                      onClick={() => {
                        if (business.active === false) {
                          toast({
                            title: 'Empresa en revisión',
                            description: 'Esta empresa está registrada pero en espera de ser aprobada.',
                          });
                          return;
                        }
                        handleBusinessCardClick(business);
                      }}
                      className={cn(
                        'w-full cursor-pointer overflow-hidden rounded-xl p-4 shadow-md transition-all duration-200 relative',
                        business.active === false ? 'bg-muted/50 grayscale opacity-80' : 'bg-card',
                        selectedBusinessId === business.id && business.active !== false
                          ? 'border-2 border-primary ring-2 ring-primary/20'
                          : 'border'
                      )}
                    >
                      {business.active === false && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
                          <span className="rounded-md bg-secondary px-3 py-1 text-sm font-medium shadow-sm">
                            En espera de aprobación
                          </span>
                        </div>
                      )}
                      {/* FAVORITE BUTTON */}
                      <button
                        onClick={(e) => {
                          if (business.active === false) {
                            e.stopPropagation();
                            return;
                          }
                          toggleFavorite(e, business.id);
                        }}
                        className="absolute bottom-4 right-4 z-10 p-2 rounded-full hover:bg-slate-100 transition-colors"
                      >
                        <Heart
                          className={cn(
                            "h-5 w-5 transition-all duration-300",
                            favorites.includes(business.id) ? "fill-red-500 text-red-500 scale-110" : "text-slate-400 hover:text-slate-600"
                          )}
                        />
                      </button>
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
                            {business.description_translations?.[locale as 'en' | 'es' | 'de'] || business.description}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 truncate text-xs text-muted-foreground">
                        {business.location}
                      </div>
                      {(business.clientSlug || business.currentOfferUrl) && business.active !== false && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <a
                            href={
                              business.clientSlug
                                ? `/client/${business.clientSlug}`
                                : business.currentOfferUrl!
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline relative z-30"
                          >
                            {t('businessCard.currentOffer')}{' '}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
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
          
          {hasMore && (
            <div className="flex justify-center pb-8 pt-4">
              <Button 
                variant="outline" 
                onClick={loadMore}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Cargar más empresas
              </Button>
            </div>
          )}
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
