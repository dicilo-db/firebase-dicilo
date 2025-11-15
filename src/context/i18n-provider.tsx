// src/context/i18n-provider.tsx
'use client';

import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { ReactNode, useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Este es un proveedor de contexto de i18n que es seguro para el App Router de Next.js
// y evita errores de hidratación.

// La instancia de i18n se inicializa una sola vez a nivel de módulo en i18n.ts.
// Esto elimina las condiciones de carrera durante el renderizado.

export function I18nProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // La inicialización de i18next es asíncrona.
    // Usamos un estado para asegurarnos de que la UI no se renderice
    // hasta que las traducciones estén listas en el cliente.
    if (!i18n.isInitialized) {
      i18n.init().then(() => {
        setIsInitialized(true);
      });
    } else {
      setIsInitialized(true);
    }
  }, []);

  // Mientras i18next se está inicializando, mostramos un esqueleto simple
  // para evitar el parpadeo de las claves de traducción en bruto.
  if (!isInitialized) {
    return (
      <div className="flex h-screen w-screen flex-col">
        <header className="flex-shrink-0 border-b p-4">
          <Skeleton className="h-8 w-1/3" />
        </header>
        <main className="flex-grow p-4">
          <Skeleton className="h-full w-full" />
        </main>
      </div>
    );
  }

  // Una vez inicializado, envolvemos la aplicación con el proveedor oficial.
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
