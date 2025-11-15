// src/app/[locale]/planes/page.tsx
import { Suspense } from 'react';
import { PlansClientContent, PlansPageSkeleton } from './PlansClientContent';
import { Header } from '@/components/header';
import Footer from '@/components/footer';

// El componente de servidor ahora es un simple contenedor que delega toda la lógica
// de renderizado y datos al componente cliente.
export default function PlansPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<PlansPageSkeleton />}>
        <PlansClientContent />
      </Suspense>
      <Footer />
    </>
  );
}
