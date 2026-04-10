'use client';

import React, { useState, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
  Graticule,
  ZoomableGroup,
  Marker
} from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { getGlobalStats, GlobalStats } from '@/app/actions/global-stats';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Users, Globe, Building2, Target, Flag, Search, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import countriesIso from 'i18n-iso-countries';

// Register languages for conversion
countriesIso.registerLocale(require("i18n-iso-countries/langs/en.json"));
countriesIso.registerLocale(require("i18n-iso-countries/langs/es.json"));

// TopoJSON for the world map
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export function WorldMap() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCountry, setHoveredCountry] = useState<any>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [position, setPosition] = useState({ coordinates: [0, 0] as [number, number], zoom: 1 });

  useEffect(() => {
    async function loadStats() {
      const res = await getGlobalStats();
      setStats(res);
      setIsLoading(false);
    }
    loadStats();
  }, []);

  const handleZoomIn = () => {
    if (position.zoom >= 8) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };

  const handleMoveEnd = (position: { coordinates: [number, number]; zoom: number }) => {
    setPosition(position);
  };

  const activeCountriesList = stats ? Object.entries(stats.countries)
    .filter(([_, data]) => data.agencies > 0 || data.users > 0)
    .sort((a, b) => b[1].agencies + b[1].users - (a[1].agencies + a[1].users))
    : [];

  if (isLoading) {
    return (
      <Card className="w-full overflow-hidden border-0 shadow-2xl bg-white dark:bg-slate-950">
        <div className="p-8 space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-[450px] w-full rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </Card>
    );
  }

  const colorScale = scaleLinear<string>()
    .domain([0, 1, 10, 50])
    .range(["#f8fafc", "#22c55e", "#16a34a", "#14532d"]);

  return (
    <TooltipProvider>
      <Card className="w-full overflow-hidden border-0 shadow-[0_32px_64px_rgba(0,0,0,0.14)] bg-white dark:bg-slate-950 transition-all duration-1000">
        <CardHeader className="border-b bg-white dark:bg-slate-950 p-6 md:px-10 md:py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <CardTitle className="text-3xl md:text-6xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none">
                Alcance <span className="text-primary">Global</span>
              </CardTitle>
              <CardDescription className="text-slate-500 font-bold text-[10px] md:text-sm tracking-[0.3em] uppercase">
                Panel de Monitoreo Interactivo en Tiempo Real
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black shadow-xl">
                <Globe className="h-4 w-4 text-emerald-400 animate-spin-slow" />
                DATO EN VIVO
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl text-[10px] font-bold">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                SISTEMA ACTIVO
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row min-h-[500px] md:min-h-[650px] bg-slate-50/30 dark:bg-black/20">
            
            {/* INTERACTIVE LEGEND PANEL */}
            <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white dark:bg-slate-950 p-6 overflow-y-auto max-h-[300px] lg:max-h-none custom-scrollbar">
              <div className="flex items-center gap-2 mb-6 text-slate-400">
                <Building2 className="h-4 w-4" />
                <h3 className="text-[10px] font-black tracking-widest uppercase">Paises con Actividad</h3>
              </div>
              
              <div className="space-y-2">
                {activeCountriesList.map(([code, data]) => (
                  <button
                    key={code}
                    onMouseEnter={() => {
                      setSelectedCountryCode(code);
                      setHoveredCountry({ ...data, id: code, NAME: data.name });
                    }}
                    onMouseLeave={() => {
                      setSelectedCountryCode(null);
                      setHoveredCountry(null);
                    }}
                    onClick={() => {
                      // Note: Standard react-simple-maps doesn't have an easy "getCoordsForCountry"
                      // but we could implement it if needed. For now, we highlight.
                    }}
                    className={cn(
                      "w-full group flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300",
                      selectedCountryCode === code 
                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                        : "bg-slate-50 dark:bg-slate-900 border border-transparent hover:border-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-xl flex items-center justify-center font-black text-xs",
                        selectedCountryCode === code ? "bg-white/20" : "bg-white dark:bg-slate-800 shadow-sm"
                      )}>
                        {code}
                      </div>
                      <span className="font-bold text-sm tracking-tight">{data.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <Users className="h-3 w-3" />
                      <span className="text-[10px] font-black">{data.agencies + data.users}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* MAP AREA */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
              
              {/* ZOOM CONTROLS */}
              <div className="absolute right-6 top-6 z-20 flex flex-col gap-2">
                <button 
                  onClick={handleZoomIn}
                  className="h-10 w-10 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors"
                >
                  <Maximize2 className="h-4 w-4 text-slate-600" />
                </button>
                <button 
                  onClick={handleZoomOut}
                  className="h-10 w-10 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors"
                >
                  <Minimize2 className="h-4 w-4 text-slate-600" />
                </button>
              </div>

              <ComposableMap
                projectionConfig={{ 
                  rotate: [-10, 0, 0], 
                  scale: 160,
                }}
                style={{ width: "100%", height: "100%" }}
              >
                <ZoomableGroup 
                  zoom={position.zoom} 
                  center={position.coordinates}
                  onMoveEnd={handleMoveEnd}
                  minZoom={1} 
                  maxZoom={8}
                >
                  <Sphere stroke="#e2e8f0" strokeWidth={0.5} fill="transparent" />
                  <Graticule stroke="#e2e8f0" strokeWidth={0.5} opacity={0.3} />
                  <Geographies geography={geoUrl}>
                    {({ geographies }: { geographies: any[] }) =>
                      geographies.map((geo: any) => {
                        // FIX: Proper mapping using numeric-to-alpha2
                        const countryCode = countriesIso.numericToAlpha2(geo.id) || null;
                        const countryData = countryCode ? stats?.countries[countryCode.toUpperCase()] : null;
                        const isTarget = !!countryData;
                        const isSelected = selectedCountryCode === countryCode;
                        
                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            onMouseEnter={() => {
                              if (isTarget) {
                                setHoveredCountry({ ...geo.properties, ...countryData });
                                setSelectedCountryCode(countryCode);
                              }
                            }}
                            onMouseLeave={() => {
                              setHoveredCountry(null);
                              setSelectedCountryCode(null);
                            }}
                            style={{
                              default: {
                                fill: isTarget ? colorScale(countryData!.agencies + countryData!.users) : "#f8fafc",
                                outline: "none",
                                stroke: isTarget ? "#fff" : "#e2e8f0",
                                strokeWidth: isTarget ? 1.0 : 0.3,
                                transition: "all 300ms ease"
                              },
                              hover: {
                                fill: isTarget ? "#15803d" : "#f1f5f9",
                                outline: "none",
                                cursor: isTarget ? "pointer" : "default",
                                stroke: "#fff",
                                strokeWidth: 1.5,
                              },
                              pressed: {
                                fill: "#14532d",
                                outline: "none"
                              }
                            }}
                            className={cn(isSelected && "filter drop-shadow-lg")}
                          />
                        );
                      })
                    }
                  </Geographies>

                  {/* VISUAL MARKERS */}
                  {stats?.markers.map((marker) => (
                    <Marker key={marker.id} coordinates={marker.coordinates}>
                      <g className="cursor-pointer group">
                        <circle 
                          r={3 / position.zoom} 
                          fill={marker.type === 'agency' ? "#16a34a" : "#3b82f6"} 
                          stroke="#fff" 
                          strokeWidth={1 / position.zoom} 
                        />
                        <circle 
                          r={10 / position.zoom} 
                          fill={marker.type === 'agency' ? "#16a34a" : "#3b82f6"} 
                          className="animate-pulse opacity-10"
                        />
                      </g>
                    </Marker>
                  ))}
                </ZoomableGroup>
              </ComposableMap>

              {/* OVERLAY RICH TOOLTIP */}
              {hoveredCountry && (
                <div 
                  className="absolute bottom-10 right-10 hidden md:block bg-slate-900/95 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] z-50 animate-in zoom-in-95 fade-in duration-300 min-w-[320px]"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <Flag className="h-5 w-5 text-emerald-400" />
                        <h4 className="font-black text-3xl text-white tracking-tighter uppercase">
                          {hoveredCountry.name || hoveredCountry.NAME}
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase">MÉTRICAS TERRITORIALES</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-5 rounded-3xl border border-white/5 transition-colors hover:bg-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-4 w-4 text-emerald-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase">Agencias</span>
                      </div>
                      <p className="text-4xl font-black text-white">{hoveredCountry.agencies || 0}</p>
                    </div>
                    <div className="bg-white/5 p-5 rounded-3xl border border-white/5 transition-colors hover:bg-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-blue-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase">Usuarios</span>
                      </div>
                      <p className="text-4xl font-black text-white">{hoveredCountry.users || 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* EXACT 4-COLUMN RESPONSIVE LAYOUT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-slate-200">
            <StatsBox 
              value={stats?.totalAgencies || 0} 
              label="AGENCIAS REGISTRADAS DIVERSOS RUBROS" 
              bgColor="bg-primary" 
              textColor="text-white"
            />
            <StatsBox 
              value={stats?.totalCountriesCommercial || 0} 
              label="PAÍSES CON PRESENCIA COMERCIAL" 
              bgColor="bg-white dark:bg-slate-950 border-r border-slate-200" 
              textColor="text-slate-900 dark:text-white"
            />
            <StatsBox 
              value={stats?.totalUsers || 0} 
              label="USUARIOS ACTIVOS EN VARIOS PAISES" 
              bgColor="bg-slate-900" 
              textColor="text-white"
            />
            <StatsBox 
              value={stats?.totalCountriesPotential || 0} 
              label="PAÍSES CON USUARIOS POTENCIALES" 
              bgColor="bg-slate-50 dark:bg-slate-900" 
              textColor="text-slate-900 dark:text-white"
            />
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

function StatsBox({ value, label, bgColor, textColor }: { value: number, label: string, bgColor: string, textColor: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-8 text-center transition-all duration-300 relative group overflow-hidden", bgColor)}>
      <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
      <div className={cn("text-6xl md:text-8xl font-black tracking-tighter mb-3 relative z-10", textColor)}>
        {value}
      </div>
      <div className={cn("text-[10px] md:text-[11px] font-black tracking-[0.15em] leading-relaxed uppercase max-w-[200px] opacity-80 relative z-10", textColor)}>
        {label}
      </div>
    </div>
  );
}

