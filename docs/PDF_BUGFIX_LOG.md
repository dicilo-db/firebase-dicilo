# Bug Fix: jsPDF Module Dynamic Import
**Date:** March 28, 2026
**Component:** `/admin/dicipoints/page.tsx`

## Root Cause Analysis
El usuario reportó que el botón "Descargar Recibo PDF" dentro del módulo de DiciPoints no generaba ni descargaba ningún archivo.
Al revisar el código fuente, notamos que el problema radicaba en cómo Next.js importaba de manera dinámica el módulo `jspdf` para el navegador (`await import('jspdf')`).

Anteriormente, la importación se realizaba asumiendo un Default Export de CommonJS puro:
```typescript
const jsPDF = (await import('jspdf')).default;
const doc = new jsPDF(); // <- Error
```
Sin embargo, en el ecosistema empaquetado actual de ESM/CJS, el `default` devuelto es en realidad un envoltorio (wrapper) de módulo completo, por lo que el constructor de `jsPDF` está anidado (formato `{ default: { jsPDF: [...] } }`). Esto causaba que la llamada a `new jsPDF()` detuviera la ejecución y lanzara un error silencioso capturado por nuestro Try/Catch, imposibilitando la creación del documento.

## Fix
Implementamos una validación condicional que extrae correctamente el constructor independientemente de la envoltura que el motor JavaScript devuelva:

```typescript
const jsPDFModule = await import('jspdf');
const jsPDF = jsPDFModule.default ? (typeof jsPDFModule.default === 'function' ? jsPDFModule.default : jsPDFModule.default.jsPDF) : jsPDFModule.jsPDF;
if (!jsPDF) throw new Error("Could not load jsPDF constructor");
```

## Outcome
Este parche de seguridad se ha aplicado a todos los manejadores de generación de reportes DiciPoints y Recibos. La descarga y renderizado son ahora de nuevo estables y listos.
