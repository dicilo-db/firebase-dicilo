'use client';
import { useState, useCallback } from 'react';

export interface GeoPos {
  lat: number;
  lng: number;
  accuracy?: number;
}

export type GeoEstado = 'idle' | 'loading' | 'success' | 'error' | 'denied';

export function useGeolocalizacion() {
  const [pos, setPos] = useState<GeoPos | null>(null);
  const [estado, setEstado] = useState<GeoEstado>('idle');
  const [error, setError] = useState<string | null>(null);

  const obtener = useCallback(() => {
    if (!navigator?.geolocation) {
      setEstado('error');
      setError('Geolocalización no soportada en este dispositivo.');
      return;
    }
    setEstado('loading');
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPos({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setEstado('success');
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setEstado('denied');
          setError('Permiso de ubicación denegado.');
        } else {
          setEstado('error');
          setError('No se pudo obtener la ubicación.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  return { pos, estado, error, obtener };
}
