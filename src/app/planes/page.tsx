// src/app/planes/page.tsx
'use client';

import { PlansClientContent } from './PlansClientContent';
import { Header } from '@/components/header';
import Footer from '@/components/footer';

export default function PlansPage() {
  return (
    <>
      <Header />
      <PlansClientContent />
      <Footer />
    </>
  );
}
