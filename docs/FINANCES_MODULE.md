# Documentación: Módulo de Finanzas (Freelancer)

## 1. Visión General
Se agregó la nueva pestaña **"Finanzas"** en la página de Ajustes (`/dashboard?view=settings`). Su objetivo central es recolectar y almacenar de forma segura la información bancaria y los métodos de pago elegidos por el usuario para percibir sus ganancias.

## 2. Restricciones y Permisos (Candado)
- **Roles Permitidos**: `freelancer`, `team_leader`, `manager`, `admin`, `superadmin` o usuarios con mas de 10 referidos.
- **Vista Oculta**: Si el usuario no cumple los criterios (por ejemplo, clientes regulares o suscriptores que apenas inician), se les muestra una pantalla persuasiva impulsándolos a "Gana dinero mientras recomiendas Dicilo". Esto incluye un candado visual tanto en la pestaña del menú como en la tarjeta principal.

## 3. Reordenamiento visual del Menú
El menú horizontal de preferencias del usuario (`TabsList`) ha sido reordenado para cumplir con la prioridad deseada de producto:
1. Datos Personales
2. Intereses
3. **Finanzas (NUEVO)**
4. Mi Box
5. Empresas de Interés
6. Social y Recompensas

## 4. Estructura del Formulario Financiero
Ubicado en `src/components/dashboard/finances/FinancesSection.tsx`, el formulario recolecta los siguientes datos:
-  Nombres y Apellidos.
-  **País de Destino**: Opciones pre-cargadas (USA - Zelle, PayPal Europa, Venezuela Transferencia, etc.)
-  **Documento**: Tipo (V, E, J, G, P) y Número de cédula.
-  **Banco**: Lista minuciosa de **62 Entidades Bancarias** solicitadas.
-  **Tipo y Número de Cuenta**: Corriente / Ahorro y dígitos completos.
-  **Beneficiario**: Nombre y Apellidos (puede ser distinto al titular del perfil de Dicilo).
-  **Contacto**: Email, teléfono fijo (Opcional) y móvil principal.
-  **Documento de Indentidad (Upload)**: Contenedor HTML configurado (`type="file"`) con el *disclaimer* exigido para transacciones mayores a 100 $/€ (Su procesamiento de carga recae en el sistema *Backend*).

## 5. Privacidad y Seguridad en Firebase
- Los campos se empaquetan en el objeto `financialData` dentro del correspondiente documento del usuario en la subcolección `private_profiles`.
- Se usó el hook `handleUpdate` de `PrivateDashboard`, enviando únicamente el objeto blindado directamente a Firebase Firestore.
- Estos datos **no** quedan expuestos públicamente en ningún módulo comunitario ni social de la plataforma. Solo son leídos por la administración financiera y el propio redactor.

## 6. Internacionalización Completa (i18n)
Se han extraído de forma estructurada los Textos/Labels del formulario.
- Hemos escrito dinámicamente un Script en NodeJS ejecutado en la terminal y actualizado los archivos locales de idiomas (`src/locales/en/common.json`, `es/common.json`, `de/common.json`):
- Los lenguajes soportados actualmente procesan y traducen instantáneamente todo el formulario hacia el Inglés, Alemán y Español, dejando el `JSON` abierto a cualquier adición futura (hasta 12 idiomas).
