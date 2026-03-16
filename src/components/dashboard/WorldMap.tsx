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
import { MapPin, Users, Globe, Building2, Target, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// TopoJSON for the world map
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export function WorldMap() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCountry, setHoveredCountry] = useState<any>(null);

  useEffect(() => {
    async function loadStats() {
      const res = await getGlobalStats();
      setStats(res);
      setIsLoading(false);
    }
    loadStats();
  }, []);

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

  // Color scale for countries with activity: Faded Slate to Dicilo Green
  // We use a domain that makes even 1 activity very visible
  const colorScale = scaleLinear<string>()
    .domain([0, 1, 10, 100])
    .range(["#f1f5f9", "#16a34a", "#15803d", "#14532d"]);

  return (
    <TooltipProvider>
      <Card className="w-full overflow-hidden border-0 shadow-[0_20px_50px_rgba(0,0,0,0.12)] bg-white dark:bg-slate-950 transition-all duration-1000">
        <CardHeader className="border-b bg-white dark:bg-slate-950 p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none mb-2">
                Presencia Global <span className="text-primary">Dicilo</span>
              </CardTitle>
              <CardDescription className="text-slate-500 font-bold text-xs md:text-sm tracking-[0.2em] uppercase">
                MONITOREO DE EXPANSIÓN Y ALIANZAS ESTRATÉGICAS
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 px-6 py-2 bg-primary text-white rounded-full text-xs font-black shadow-lg shadow-primary/20">
              <Globe className="h-4 w-4 animate-spin-slow" />
              LIVE DATA
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 relative">
          <div className="w-full min-h-[450px] md:min-h-[600px] bg-slate-50/50 dark:bg-black/20 relative overflow-hidden flex items-center justify-center">
            
            <ComposableMap
              projectionConfig={{ 
                rotate: [-10, 0, 0], 
                scale: 180, // Balanced scale for visibility
              }}
              style={{ width: "100%", height: "auto" }}
            >
              <ZoomableGroup zoom={1} minZoom={1} maxZoom={8}>
                <Sphere stroke="#cbd5e1" strokeWidth={0.5} fill="transparent" />
                <Graticule stroke="#cbd5e1" strokeWidth={0.5} opacity={0.3} />
                <Geographies geography={geoUrl}>
                  {({ geographies }: { geographies: any[] }) =>
                    geographies.map((geo: any) => {
                      const countryCode = geo.properties.IS_A2 || geo.properties.ISO_A2 || geo.properties.iso_a2;
                      const countryData = countryCode ? stats?.countries[countryCode.toUpperCase()] : null;
                      const isTarget = !!countryData;
                      
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onMouseEnter={() => {
                            if (isTarget) setHoveredCountry({ ...geo.properties, ...countryData });
                          }}
                          onMouseLeave={() => setHoveredCountry(null)}
                          style={{
                            default: {
                              fill: isTarget ? colorScale(countryData!.agencies + countryData!.users) : "#f8fafc",
                              outline: "none",
                              stroke: isTarget ? "#fff" : "#cbd5e1",
                              strokeWidth: isTarget ? 1.0 : 0.3,
                            },
                            hover: {
                              fill: isTarget ? "#15803d" : "#e2e8f0",
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
                        />
                      );
                    })
                  }
                </Geographies>

                {/* VISUAL MARKERS (PIN FLAGS) */}
                {stats?.markers.map((marker) => (
                  <Marker key={marker.id} coordinates={marker.coordinates}>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <g className="cursor-pointer">
                            <circle 
                              r={3} 
                              fill={marker.type === 'agency' ? "#16a34a" : "#3b82f6"} 
                              stroke="#fff" 
                              strokeWidth={1} 
                            />
                            <circle 
                              r={6} 
                              fill={marker.type === 'agency' ? "#16a34a" : "#3b82f6"} 
                              className="animate-ping opacity-20"
                            />
                          </g>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-900 text-white border-0 font-bold uppercase text-[10px]">
                          {marker.name}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Marker>
                ))}
              </ZoomableGroup>
            </ComposableMap>

            {/* HOVER TOOLTIP OVERLAY */}
            {hoveredCountry && (
              <div 
                className="absolute top-8 left-8 hidden md:block bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 p-6 rounded-3xl shadow-2xl z-50 animate-in fade-in slide-in-from-left-4 duration-300 min-w-[240px]"
              >
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-white/10">
                  <Flag className="h-5 w-5 text-primary" />
                  <h4 className="font-black text-xl text-slate-900 dark:text-white tracking-tight leading-none uppercase">
                    {hoveredCountry.name || hoveredCountry.NAME}
                  </h4>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">Agencias:</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white">{hoveredCountry.agencies || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">Usuarios:</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white">{hoveredCountry.users || 0}</span>
                  </div>
                </div>
              </div>
            )}
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
              bgColor="bg-[#344258]" 
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
    <div className={cn("flex flex-col items-center justify-center py-10 px-6 text-center transition-all duration-300", bgColor)}>
      <div className={cn("text-6xl md:text-7xl font-black tracking-tighter mb-2", textColor)}>
        {value}
      </div>
      <div className={cn("text-[10px] md:text-[11px] font-black tracking-[0.1em] leading-relaxed uppercase max-w-[200px] opacity-90", textColor)}>
        {label}
      </div>
    </div>
  );
}
