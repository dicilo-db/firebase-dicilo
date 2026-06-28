'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { StatsRedSolidaria } from '@/types/red-solidaria';

export function ContadoresLive() {
  const { t } = useTranslation('red_solidaria');
  const [stats, setStats] = useState<StatsRedSolidaria>({
    ofertasActivas: 0,
    centrosRegistrados: 0,
    entregasCompletadas: 0,
    personasAlcanzadas: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/red-solidaria/stats');
        const data = await res.json();
        setStats(data);
      } catch { /* silent */ }
    };
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  const items = [
    { value: stats.ofertasActivas,      label: t('stats.ofertasActivas'),      icon: '📦', color: 'text-emerald-700' },
    { value: stats.centrosRegistrados,  label: t('stats.centrosRegistrados'),   icon: '🏠', color: 'text-blue-700' },
    { value: stats.entregasCompletadas, label: t('stats.entregasCompletadas'), icon: '✅', color: 'text-amber-700' },
    { value: stats.personasAlcanzadas,  label: t('stats.personasAlcanzadas'),  icon: '👥', color: 'text-rose-700' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(({ value, label, icon, color }) => (
        <div key={label} className="rounded-xl bg-white border border-slate-200 p-3 text-center shadow-sm">
          <div className="text-2xl mb-1">{icon}</div>
          <div className={`text-2xl font-extrabold ${color}`}>
            {value.toLocaleString('es-VE')}
          </div>
          <div className="text-xs text-slate-500 leading-tight mt-0.5">{label}</div>
        </div>
      ))}
    </div>
  );
}
