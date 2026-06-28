# Bitácora de Desarrollo — dicilo.net / firebase-dicilo

Registro completo de todas las decisiones técnicas, cambios y despliegues realizados en este proyecto.

---

## 2026-06-27 — Sesión 1: Mapa e infraestructura

### Cambio de zoom del mapa Leaflet
**Archivo:** `src/components/dicilo-search-page.tsx:226`  
**Cambio:** `useState(12)` → `useState(10)`  
**Motivo:** El usuario quería ver más empresas en el mapa inicial sin cambiar el tamaño del layout.

### Error 500 en producción (webpack vendor-chunks)
**Causa raíz:** `npx next build` se ejecutó con `NODE_ENV=development` heredado del shell, generando un bundle con `eval-source-map` y referencias a `vendor-chunks/next.js` que no existían en el deploy.  
**Síntoma:** `Cannot find module './vendor-chunks/next.js'` en Cloud Run logs.  
**Fix permanente:** Siempre usar `NODE_ENV=production firebase deploy`.  
**Commit:** `bgo0qyqxd` (deploy que solucionó el 500)

---

## 2026-06-27/28 — Sesión 2: Partner API (Apoyo Venezuela)

### Objetivo
Abrir endpoints públicos para que organizaciones humanitarias externas puedan conectarse con la campaña Venezuela de dicilo.net.

### Archivos creados
| Archivo | Propósito |
|---------|-----------|
| `src/app/api/apoyo-vzla/route.ts` | `GET /api/apoyo-vzla` — endpoint público sin auth |
| `src/app/api/apoyo-vzla/report/route.ts` | `POST /api/apoyo-vzla/report` — endpoint con API key |
| `PARTNER_API.md` | Documentación para organizaciones aliadas |

### Arquitectura de seguridad
- API key almacenada en Firestore colección `vzla_api_keys` (campo `key`, `org`, `active`)
- Autenticación: header `X-Dicilo-Key`
- Firestore rules: `allow read, write: if false` para ambas colecciones (Admin SDK bypassa rules)
- Índices desplegados: `vzla_field_reports (status+createdAt)`, `vzla_api_keys (key+active)`

### Colecciones Firestore nuevas
- `vzla_field_reports` — reportes de campo enviados por aliados
- `vzla_api_keys` — API keys de organizaciones verificadas

### Flujo de onboarding de nuevos aliados
1. Org envía email a info@dicilo.net
2. Dicilo crea documento en `vzla_api_keys` con key única
3. Dicilo envía `PARTNER_API.md` + key a la org
4. Para revocar: cambiar `active: false` en Firebase Console

### Actualización de la página apoyo-vzla
- `src/app/la-comunidad/apoyo-vzla/page.tsx` — añadido `useEffect` que carga reportes de campo desde `/api/apoyo-vzla`
- Los reportes aparecen en el log de actividad con punto verde (⬤ emerald) antes de los eventos USGS

---

## 2026-06-28 — Sesión 3: Red Solidaria (Fase 1 MVP)

### Objetivo
Centro de acopio digital geolocalizado con matching oferta-demanda para la respuesta humanitaria post-terremoto Venezuela.

### Arquitectura general
```
/la-comunidad/red-solidaria      ← página principal (nueva)
/la-comunidad/apoyo-vzla         ← página existente (actualizada con tab nav)

/api/red-solidaria/ofertas       ← GET (listar) + POST (crear)
/api/red-solidaria/centros       ← GET (listar) + POST (registrar)
/api/red-solidaria/stats         ← GET (contadores live)
```

### Archivos creados — Fase 1

#### Tipos TypeScript
| Archivo | Contenido |
|---------|-----------|
| `src/types/red-solidaria.ts` | `Oferta`, `CentroAcopio`, `Match`, `StatsRedSolidaria`, `CategoriaAyuda`, `CATEGORIA_EMOJI`, `CATEGORIAS` |

#### Internacionalización (3 idiomas)
| Archivo | Idioma |
|---------|--------|
| `src/locales/es/red_solidaria.json` | Español venezolano (idioma principal) |
| `src/locales/en/red_solidaria.json` | Inglés |
| `src/locales/de/red_solidaria.json` | Alemán |
| `src/i18n.ts` | Registrado namespace `red_solidaria` en los 3 idiomas |

**Nota de idiomas:** La plataforma muestra un banner de advertencia cuando el usuario accede en DE o EN, indicando que se prioriza el español para la coordinación en terreno en Venezuela.

#### Hooks
| Archivo | Propósito |
|---------|-----------|
| `src/hooks/useGeolocalizacion.ts` | GPS del navegador con estados: idle/loading/success/error/denied |

#### Lógica de matching
| Archivo | Propósito |
|---------|-----------|
| `src/lib/matching-engine.ts` | `haversineKm()` — distancia real entre dos coordenadas. `findMatches()` — top 3 centros más cercanos con la categoría correcta, ordenados por urgencia+proximidad |

#### API Routes (Admin SDK — sin exposición de WhatsApp)
| Ruta | Método | Auth | Descripción |
|------|--------|------|-------------|
| `/api/red-solidaria/ofertas` | GET | ninguna | Lista ofertas disponibles, con filtro por `categoria` |
| `/api/red-solidaria/ofertas` | POST | ninguna | Crea oferta; WhatsApp almacenado pero NUNCA devuelto en GET |
| `/api/red-solidaria/centros` | GET | ninguna | Lista centros de acopio |
| `/api/red-solidaria/centros` | POST | ninguna | Registra centro (verificado=false hasta revisión Dicilo) |
| `/api/red-solidaria/stats` | GET | ninguna | Contadores: ofertas activas, centros, entregas, personas |

#### Componentes React
| Componente | Descripción |
|-----------|-------------|
| `src/components/red-solidaria/TarjetaOferta.tsx` | Card de oferta con emoji de categoría, estado, sector, distancia |
| `src/components/red-solidaria/TarjetaCentro.tsx` | Card de centro con badge verificado, necesidades urgentes |
| `src/components/red-solidaria/ContadoresLive.tsx` | 4 contadores que se actualizan cada 30s |
| `src/components/red-solidaria/FormularioOferta.tsx` | Formulario 4 pasos: categoría → descripción → ubicación → contacto |
| `src/components/red-solidaria/MapaRedSolidaria.tsx` | Mapa Leaflet con pins emoji por categoría (verde=donación, azul=centro) |

#### Página principal
| Archivo | Descripción |
|---------|-------------|
| `src/app/la-comunidad/red-solidaria/page.tsx` | Vista principal: hero, ContadoresLive, mapa+lista toggle, formulario modal, CTA flotante mobile |

### Archivos actualizados — Fase 1

#### Navegación entre páginas
- `src/app/la-comunidad/apoyo-vzla/page.tsx` — añadida barra de tabs `[❤️ Campaña de Ayuda] | [🤝 Red Solidaria]`
- `src/app/la-comunidad/red-solidaria/page.tsx` — misma barra de tabs con Red Solidaria activo

#### Seguridad Firestore
- `firestore.rules` — añadidas reglas `allow read, write: if false` para `red_solidaria_ofertas` y `red_solidaria_centros`
- `firestore.indexes.json` — añadidos 3 índices:
  - `red_solidaria_ofertas: estado + creadoEn`
  - `red_solidaria_ofertas: estado + categoria + creadoEn`
  - `red_solidaria_centros: creadoEn`

### Decisiones de diseño

#### Privacidad del WhatsApp
El campo `contactoWhatsapp` se almacena en Firestore vía Admin SDK pero **nunca se devuelve** en los endpoints GET. En Fase 2 se implementará cifrado (AES-256) y solo se compartirá al confirmar un match bilateral.

#### Verificación de centros
Los centros se crean con `verificado: false`. El equipo de Dicilo los revisa manualmente y cambia el campo a `true` desde Firebase Console. Solo los centros verificados participan en el matching automático.

#### Idioma y prioridad
- `fallbackLng` en i18n.ts está configurado como `'de'` (empresa registrada en Alemania)
- La página Red Solidaria muestra un banner cuando el idioma no es `es`, explicando que la coordinación operativa en Venezuela se hace en español
- Los textos en EN y DE están completos para donantes internacionales

#### Mobile-first
- Formulario: máximo 4 campos por pantalla, botones `min-h-[48px]` (táctil)
- CTA flotante en mobile (`fixed bottom-6 right-4 sm:hidden`)
- Mapa responsive a 400px de alto, adaptable
- Pills de categoría con scroll horizontal sin scrollbar visible

### Colecciones Firestore nuevas — Fase 1
| Colección | Documentos |
|-----------|-----------|
| `red_solidaria_ofertas` | Una por oferta publicada |
| `red_solidaria_centros` | Una por centro registrado |

### Fase 2 — Roadmap (pendiente)
- [ ] `PATCH /api/red-solidaria/ofertas/[id]` — actualizar estado
- [ ] `DELETE /api/red-solidaria/ofertas/[id]` — retirar oferta
- [ ] `POST /api/red-solidaria/matches` — confirmar match
- [ ] Notificaciones WhatsApp vía Twilio Business API
- [ ] Cifrado AES-256 del número de WhatsApp en reposo
- [ ] Caducidad automática de ofertas (cron cada 6h)
- [ ] Renovación de oferta 24h antes de expirar (notificación)
- [ ] Panel admin para equipo Dicilo (gestión de centros + matches)
- [ ] `/api/red-solidaria/ofertas/[id]` — perfil público de oferta
- [ ] `src/app/la-comunidad/red-solidaria/centro/[id]/page.tsx` — perfil de centro
- [ ] `src/app/la-comunidad/red-solidaria/buscar/page.tsx` — búsqueda sin mapa
- [ ] Integración con timeline de apoyo-vzla (entregar = entry automático)
- [ ] Contadores Red Solidaria en hero de dicilo.net

---

## Reglas de despliegue

**CRÍTICO: Siempre usar `NODE_ENV=production` en builds y deploys.**

```bash
# Deploy completo
NODE_ENV=production firebase deploy

# Solo Firestore (reglas + índices)
firebase deploy --only firestore

# Solo hosting + functions
NODE_ENV=production firebase deploy --only hosting,functions
```

**Razón:** Si `NODE_ENV=development` está heredado del shell, Next.js genera un bundle con `eval-source-map` y referencias a `vendor-chunks/*.js` que no existen en el bundle de producción → Error 500 en Cloud Run.

---

## Arquitectura de seguridad (resumen)

```
Usuario/App externa
       ↓
Next.js API Route (servidor)
       ↓  ← único punto de entrada a datos
Firebase Admin SDK
       ↓
Firestore (colecciones específicas)
```

**Capas:**
1. **Lógica de ruta** — cada API route solo accede a las colecciones que necesita
2. **Firestore rules** — `allow read, write: if false` para colecciones internas
3. **API keys** — solo para endpoints partner (`X-Dicilo-Key`)
4. **WhatsApp** — nunca expuesto en GET, solo en servidor

---

## Stack confirmado

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Next.js | 14.2.35 | App Router, SSR, API Routes |
| TypeScript | — | Todo el código |
| React | — | UI components |
| Leaflet | 1.9.4 | Mapas interactivos |
| react-hook-form | 7.51.5 | Formularios |
| Zod | 3.23.8 | Validación de schemas |
| react-i18next | — | i18n (es/de/en + más) |
| Firebase Admin SDK | — | Firestore server-side |
| Firebase Hosting + Cloud Run Gen2 | — | Deploy |
| Tailwind CSS | — | Estilos |

---

*Última actualización: 2026-06-28*  
*Proyecto: Dicilo / MILENIUM HOLDING & CONSULTING UG — Hamburgo, Alemania*
