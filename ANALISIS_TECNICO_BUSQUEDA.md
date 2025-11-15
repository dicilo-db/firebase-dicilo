# ANÁLISIS TÉCNICO: IMPLEMENTACIÓN DE BÚSQUEDA Y MAPA

**Fecha:** 15 de Septiembre de 2025
**Proyecto:** dicilo.net

## 1. Resumen Ejecutivo

Este documento proporciona un análisis técnico detallado de la funcionalidad de búsqueda y mapa del proyecto dicilo.net. Su propósito es clarificar la tecnología utilizada, describir con precisión los errores funcionales reportados y proponer una solución técnica concreta. El problema principal es una desincronización entre la interfaz de búsqueda, la lista de resultados y el mapa interactivo, lo que resulta en una experiencia de usuario deficiente.

---

## 2. Arquitectura Tecnológica Actual

### 2.1. Librerías y Frameworks

- **Framework Principal:** **Next.js** (v15.3.3) con **React** (v18.3.1). La aplicación utiliza el App Router de Next.js para el enrutamiento y renderizado del lado del servidor/cliente.
- **Librería de Mapas:** **Leaflet.js** (v1.9.4). La integración con React se realiza a través de un componente wrapper personalizado (`src/components/dicilo-map.tsx`), no mediante la librería `react-leaflet`. Esto permite un control directo sobre la instancia y los marcadores del mapa.
- **Framework de UI y Estilos:**
  - **Tailwind CSS** (v3.4.1) para el diseño "utility-first".
  - **Shadcn/UI** como colección de componentes de UI reutilizables y accesibles, construidos sobre Radix UI.

### 2.2. Motor de Geocodificación

- **Servicio Utilizado:** **Nominatim**.
- **Endpoint:** `https://nominatim.openstreetmap.org/search`
- **Implementación:** Se realiza una llamada `fetch` directa a la API pública de Nominatim desde el lado del cliente (en el componente `src/components/dicilo-search-page.tsx`) cuando el usuario realiza una búsqueda por ubicación. No se utiliza una clave de API, ya que Nominatim es un servicio gratuito y de código abierto.

---

## 3. Descripción Detallada del Error

El problema se manifiesta en tres síntomas principales que degradan la funcionalidad de búsqueda a un estado inutilizable:

1.  **No se muestran pines al cargar la página:** Al visitar la página principal, el mapa aparece centrado en Hamburgo, pero sin ningún marcador (pin) visible, a pesar de que los datos de los negocios se cargan correctamente en el componente. Antes, se mostraban los negocios iniciales.

2.  **La interacción con las tarjetas no actualiza el mapa:** Al hacer clic en una tarjeta de negocio de la lista, el mapa no responde. No se centra en la ubicación del negocio, no se muestra el pin correspondiente y no se abre la ventana emergente (popup) con los detalles del negocio.

3.  **La búsqueda por nombre es insensible y parcial:** La búsqueda no funciona para términos que incluyen caracteres especiales o acentos (ej. "hör" no encuentra "HörComfort"). La lógica de filtrado de texto es defectuosa y no normaliza adecuadamente las cadenas de caracteres antes de la comparación.

La causa raíz es una combinación de lógica de estado incorrecta en el componente principal `dicilo-search-page.tsx` y una gestión de marcadores deficiente en el componente `dicilo-map.tsx`.

---

## 4. Fragmento de Código de la API de Búsqueda (Cliente)

La búsqueda de **negocios** se realiza en el lado del cliente (filtrando un array de datos), no mediante una llamada a una API de backend. El código relevante está en `src/components/dicilo-search-page.tsx`.

La búsqueda de **ubicaciones** (geocodificación) sí utiliza una API externa.

**Archivo:** `src/components/dicilo-search-page.tsx`
**Función:** `handleLocationSearch`

```typescript
const handleLocationSearch = async () => {
  if (!searchQuery.trim()) return;
  setIsGeocoding(true);
  setSelectedBusiness(null);
  try {
    // URL y parámetros de la llamada a la API de Nominatim
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&accept-language=${locale}`
    );
    const data = await response.json();
    if (data && data.length > 0) {
      const { lat, lon } = data[0];
      const newCenter: [number, number] = [parseFloat(lat), parseFloat(lon)];
      setMapCenter(newCenter);
      const isCountry = data[0].type === 'country';
      setMapZoom(isCountry ? 5 : 14);
    } else {
      toast({
        title: t('search.locationNotFound'),
        description: t('search.locationNotFoundDesc', { query: searchQuery }),
        variant: 'destructive',
      });
    }
  } catch (error) {
    console.error('Error fetching location:', error);
    toast({
      title: t('search.error'),
      description: t('search.errorDesc'),
      variant: 'destructive',
    });
  } finally {
    setIsGeocoding(false);
  }
};
```

---

## 5. Conclusión y Solución Propuesta

La arquitectura tecnológica es adecuada, pero la implementación de la lógica de estado y la interacción entre componentes es defectuosa. La solución no requiere cambiar librerías, sino refactorizar el código de los componentes `dicilo-search-page.tsx` y `dicilo-map.tsx` para asegurar una gestión de estado reactiva y coherente, y una correcta normalización del texto en las búsquedas.
