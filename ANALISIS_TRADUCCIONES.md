# ANÁLISIS Y SOLUCIÓN DEL PROBLEMA DE TRADUCCIONES (i18n)

**Fecha:** 17 de Septiembre de 2025
**Proyecto:** dicilo.net

## 1. Resumen del Problema

La aplicación presentaba un error crítico y persistente en el que todos los componentes del lado del cliente (`"use client"`) mostraban las claves de traducción en bruto (ej. `search.title`) en lugar de los textos traducidos. Este problema afectaba a toda la interfaz, incluyendo la página de búsqueda, el pie de página y otras secciones, haciendo la aplicación inutilizable.

---

## 2. Diagnóstico de la Causa Raíz

Tras múltiples intentos fallidos de solucionar el problema a nivel de componente (corrigiendo la carga de datos, especificando `namespaces`, etc.), se realizó un análisis más profundo de la configuración de la internacionalización. La causa raíz no estaba en los componentes individuales, sino en los cimientos de la integración de `i18next` con React y Next.js.

El problema principal era una **condición de carrera (`race condition`)** provocada por una implementación incorrecta del proveedor de contexto de i18n (`src/context/i18n-provider.tsx`).

### 2.1. Implementación Incorrecta del Proveedor de Contexto

El archivo `i18n-provider.tsx` intentaba gestionar la inicialización de `i18next` dentro de un `useEffect`. Este enfoque es propenso a errores en el App Router de Next.js porque el componente proveedor y sus hijos podían intentar renderizarse _antes_ de que la instancia de `i18next` estuviera completamente configurada y hubiera cargado los archivos de traducción del idioma detectado.

El estado `isReady` que se intentaba propagar nunca se actualizaba de manera fiable, por lo que los componentes cliente nunca "sabían" cuándo era seguro renderizar los textos.

### 2.2. Error en la Configuración de la Instancia de `i18next`

La instancia de `i18next` se estaba inicializando sin una pieza fundamental: el método `.use(initReactI18next)`. Este método es el pegamento que une la librería `i18next` con el ecosistema de React. Sin él, React no puede reaccionar a los cambios de estado internos de `i18next`, como la carga de nuevos idiomas o la inicialización de los recursos.

---

## 3. Solución Implementada

La solución consistió en reescribir por completo el proveedor de contexto `i18n-provider.tsx` para seguir el patrón recomendado y robusto para el App Router de Next.js.

1.  **Inicialización a Nivel de Módulo:** La instancia de `i18next` se configuró e inicializó **una sola vez** a nivel de módulo, fuera del componente del proveedor. Esto elimina la condición de carrera, ya que la instancia está disponible desde el momento en que se importa el archivo.

2.  **Uso Correcto de `initReactI18next`:** Se añadió la llamada `.use(initReactI18next)` a la cadena de inicialización de `i18next`. Esto aseguró la correcta integración con React.

3.  **Simplificación del Proveedor:** Se eliminó toda la lógica de estado manual (`useState`, `useEffect`) que gestionaba la inicialización. El nuevo proveedor (`I18nClientProvider`) ahora se apoya en el `I18nextProvider` oficial de la librería `react-i18next` y en el estado interno de la instancia de `i18next` para funcionar correctamente.

4.  **Gestión del Estado `isReady`:** El hook `useClientTranslation` ahora obtiene el estado `isReady` directamente del contexto de `I18nContext`, que a su vez refleja el estado real de la instancia `i18n.isInitialized`. Esto garantiza que los componentes cliente esperen de forma fiable a que las traducciones estén listas antes de renderizarse.

Esta corrección estructural solucionó de raíz el problema, estabilizando el sistema de internacionalización y permitiendo que todos los componentes de la aplicación muestren los textos traducidos correctamente.
