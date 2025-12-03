# Bitácora de Cambios - Dicilo.net

Este documento registra los 30 cambios más recientes realizados en el proyecto. Sirve como un historial para rastrear modificaciones, entender la evolución del código y facilitar la depuración de errores.

---

### **158. FIX: BOTÓN DE CERRAR MAPA EN MÓVIL - CÓDIGO: FIX-MAP-CLOSE-BTN-V1**

- **Fecha y Hora:** 03 de Diciembre de 2025, 14:55 (CET)
- **Módulos Afectados:** `src/components/dicilo-search-page.tsx`, `CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Problema:** El botón para cerrar la vista de mapa en dispositivos móviles quedaba oculto detrás de las capas del mapa (Leaflet) o parpadeaba al interactuar, debido a un índice de apilamiento (`z-index`) insuficiente.
  - **Solución:** Se aumentó el `z-index` del botón a `2000` y se añadió una sombra (`shadow-md`) para garantizar que siempre permanezca visible y accesible por encima de cualquier elemento del mapa.
  - **Resultado:** El botón de cierre es ahora perfectamente visible y funcional en todo momento.

### **157. FIX: ERROR DE MAPA EN MÓVIL Y VALIDACIÓN DE COORDENADAS - CÓDIGO: FIX-MAP-NAN-V1**
...
