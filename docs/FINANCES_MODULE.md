# Documentación: Actualización Promocional Finanzas (Laura)

## 1. Visión General
Se ha rediseñado la pantalla de "Upselling" del módulo de finanzas dirigida a los Usuarios Regulares (no-Freelancers). Se sustituyó el texto y el diseño original por un diseño moderno de doble columna (*Side-by-side Layout*) incorporando la fotografía enviada (identificada como "Laura") junto con un esquema de texto tipo "Preguntas Frecuentes" con íconos emojis y distintivos visuales estructurados.

## 2. Nuevo Diseño (UI/UX)
- **Responsive Flexbox:** Se integró un layout de cuadrícula dinámica `flex-col lg:flex-row`.
- **Columna de Imagen (Izquierda):** Ocupa el `40%` del ancho en pantallas grandes (`lg:w-2/5`) y muestra la imagen importada desde la raíz local del proyecto empleando el motor optimizador `next/image` (`object-cover`). Se adapta al 100% como banner en pantallas móviles.
- **Columna de Contenido (Derecha):** Ocupa el `60%` (`lg:w-3/5`) sobre un fondo sutil en degradé verde esmeralda (`bg-gradient-to-br`). El contenido ha sido formateado con etiquetas `h2`, `h3`, `h4` y múltiples listas (`ul > li`) que emulan "Píldoras Informativas" o _Badges_.

## 3. Internacionalización (i18n) Segmentada
El texto no ha sido insertado "en duro" o *hardcoded* dentro del componente de React. En su lugar, se inyectaron exitosamente las llaves individuales correspondientes al texto traducido proporcionado:
1. `es/common.json` (Español)
2. `de/common.json` (Alemán)
3. `en/common.json` (Inglés)

De esta manera, la estructura JSX (`FinancesSection.tsx`) consume dinámicamente las cadenas mediante `t('finances.locked.title')`, `t('finances.locked.h1')`, entre muchas otras, asegurando que el nuevo Copywriting cambie instantáneamente su lenguaje respetando los estilos visuales de las nuevas 14 etiquetas.

## 4. Archivos Modificados
- `src/components/dashboard/finances/FinancesSection.tsx`: Reconstrucción completa de la UI de *Lock Screen*.
- `src/locales/{es,en,de}/common.json`: Carga e inicialización de 14 nuevas claves traduccionales personalizadas bajo el segmento estructurado `finances.locked`.
- Directorio Externo (`public/laura-freelancer.png`): Integración del recurso estático proporcionado por el promto.
