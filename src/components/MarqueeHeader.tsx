// src/components/MarqueeHeader.tsx
'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';

const MarqueeHeader = () => {
  // Aunque el texto es estático, usamos el hook por si se quisiera traducir en el futuro.
  const { t } = useTranslation();

  return (
    <div className="flex items-center space-x-4 bg-[#333] p-2 text-white">
      {/* Sección Izquierda */}
      <div className="flex flex-shrink-0 items-center space-x-2">
        <Button className="h-8 bg-red-600 text-sm font-bold text-white hover:bg-red-700">
          Angebot
        </Button>
        <span className="text-sm font-bold text-yellow-400">365 Tage</span>
        <Button className="h-8 bg-green-500 text-sm font-bold text-white hover:bg-green-600">
          Club
        </Button>
      </div>

      {/* Sección Central (Marquesina) */}
      <div className="marquesina-container flex-grow">
        <p className="texto-movil text-sm">
          Wählen Sie Ihr Traumziel. Treten Sie unserem Club bei und genießen Sie
          exklusive Rabatte auf all Ihre Reisen.
        </p>
      </div>

      {/* Sección Derecha */}
      <div className="flex flex-shrink-0 items-center space-x-2">
        <Button className="h-8 bg-green-500 text-sm font-bold text-white hover:bg-green-500">
          Sprache
        </Button>
        <Button className="h-8 bg-green-500 text-sm font-bold text-white hover:bg-green-500">
          Reiseziele
        </Button>
      </div>
    </div>
  );
};

export default MarqueeHeader;
