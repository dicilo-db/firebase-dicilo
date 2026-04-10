// src/app/fonts.ts
import { PT_Sans } from 'next/font/google';

// Configura la fuente PT Sans con los pesos y subconjuntos necesarios.
export const ptSans = PT_Sans({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap', // Mejora el rendimiento de carga de la fuente
});
