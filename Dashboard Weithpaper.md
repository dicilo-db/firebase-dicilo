# Dashboard Roadmap (Dashboard Weithpaper)

## Propósito
Este documento sirve como hoja de ruta única para documentar todos los cambios, mejoras, correcciones y componentes relacionados con el módulo "Dashboard". Todo cambio futuro en este módulo debe registrarse aquí.

---

## 2026-03-25 - Corrección Contador de Intereses
**Descripción del Error:** El contador de "Intereses" en el dashboard (PrivateDashboard) siempre mostraba 0 a pesar de que el usuario había seleccionado subcategorías y categorías.
**Causa:** La matriz exportada `CATEGORIES` en el componente `CategorySelector.tsx` estaba vacía por retrocompatibilidad. Al intentar filtrar los intereses de `formData.interests`, siempre regresaba vacío.
**Solución Técnica:**
- Archivo modificado: `src/components/dashboard/PrivateDashboard.tsx`
- Se removió el método `.filter` que dependía de `CATEGORIES`.
- Ahora el sistema calcula `[...new Set(formData.interests)].length` para contabilizar tanto categorías principales como subcategorías de forma unificada.
- Se verificó que las subcategorías seleccionadas se guardan de la misma manera que las categorías (`private_profiles` -> `interests`), manteniendo la funcionalidad nativa de Firebase para recibir publicidad de los aliados en esas subcategorías (`array-contains`).

**Componentes y Archivos Clave Afectados:**
- `src/components/dashboard/PrivateDashboard.tsx`
- `src/components/dashboard/CategorySelector.tsx`
