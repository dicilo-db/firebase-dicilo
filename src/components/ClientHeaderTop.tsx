// src/components/ClientHeaderTop.tsx

import React from 'react';
import Image from 'next/image';

interface ClientHeaderTopProps {
  clientName: string;
  clientLogoUrl: string;
  welcomeText?: string;
  headerImageUrl?: string;
  clientLogoWidth?: number;
  textClassName?: string; // Prop para recibir la clase de color
}

export const ClientHeaderTop = ({
  clientName,
  clientLogoUrl,
  welcomeText,
  headerImageUrl,
  clientLogoWidth = 80,
  textClassName = 'text-gray-800', // Valor por defecto
}: ClientHeaderTopProps) => {
  // Se elimina el contenedor 'container' para que la alineación sea controlada por el padre.
  return (
    <div className="flex flex-col items-center justify-between gap-6 rounded-lg p-8 shadow-sm md:flex-row">
      <div className="z-10 flex w-full flex-col justify-between gap-6 md:flex-row md:items-center">
        {/* Contenedor Izquierdo: Logo y Texto */}
        <div className={`flex flex-1 items-center gap-6 ${textClassName}`}>
          {clientLogoUrl && (
            <Image
              src={clientLogoUrl}
              alt={`${clientName} Logo`}
              width={clientLogoWidth}
              height={clientLogoWidth}
              className="rounded-md object-contain"
            />
          )}
          <div>
            <h2 className="text-2xl font-bold">{clientName}</h2>
            {welcomeText && <p className={textClassName}>{welcomeText}</p>}
          </div>
        </div>

        {/* Contenedor Derecho: Imagen de Cabecera (Grafik) */}
        {headerImageUrl && (
          <div className="relative z-10 h-48 w-full flex-shrink-0 md:h-32 md:w-56">
            <Image
              src={headerImageUrl}
              alt="Header Graphic"
              fill
              className="rounded-md object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
};
