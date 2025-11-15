// src/app/[locale]/vorteile/page.tsx
import { Suspense } from 'react';
import {
  VorteileClientContent,
  VorteilePageSkeleton,
} from './VorteileClientContent';
import { getTranslations } from 'next-intl/server';
import { Header } from '@/components/header';
import Footer from '@/components/footer';

// El componente de servidor ahora recibe 'lang' de la URL para usar el idioma correcto.
export default async function VorteilePage() {
  // Usamos el 'lang' dinámico para obtener las traducciones del servidor.
  const t = await getTranslations('benefits');

  return (
    <>
      <Header />
      <main className="container mx-auto flex-grow space-y-16 px-4 py-12">
        <section className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-800">
            {t('page_title')}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {t('page_subtitle')}
          </p>
        </section>

        {/* Suspense muestra el esqueleto mientras el componente cliente se carga */}
        <Suspense fallback={<VorteilePageSkeleton />}>
          <VorteileClientContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
