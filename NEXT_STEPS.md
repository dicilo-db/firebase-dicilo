# Planificación Próxima Sesión: Gestión de Campañas y Métricas

## Objetivos Principales
1. **Creación de Campañas**:
   - Desarrollar flujo para que los administradores o clientes puedan crear nuevas campañas.
   - Definir parámetros: presupuesto, coste por clic, imágenes, descripción, target, etc.

2. **Registro de Métricas**:
   - Implementar el backend para registrar clicks reales, compartidos en redes sociales, y conversiones.
   - Asegurar que el sistema de tracking (enlaces `dicilo.net/r/...`) funcione correctamente y alimente la base de datos en tiempo real.

3. **Visualización para el Cliente**:
   - Crear dashboard para el cliente (anunciante) donde vea el rendimiento de su campaña.
   - Gráficos de clicks vs. presupuesto gastado.
   - Reportes de freelancers activos promocionando su marca.

## Notas Técnicas
- Revisar `src/app/actions/freelancer.ts` para la lógica de creación.
- Revisar `src/app/api/ads/click/route.ts` para la lógica de tracking.
- Diseñar componentes de gráficos (usando Recharts o similar) para el dashboard de cliente.
