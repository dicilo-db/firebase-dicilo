# Community Roadmap (Comunidad Weithpaper)

## Propósito
Este documento sirve como hoja de ruta única para documentar todos los cambios, mejoras, correcciones y componentes relacionados con el módulo "Comunidad" (Muro Social, Círculo Privado, Vecinos, Amigos y Social Panel). Todo cambio futuro en este módulo debe registrarse aquí.

---

## 2026-03-25 - Corrección de Lista de Amigos Aceptados en Círculo Privado
**Descripción del Error:** Al aceptar una solicitud de amistad, la persona no aparecía en la lista de amigos ("Mi Círculo Privado") y el remitente de la solicitud no recibía confirmación de que fue aceptada.
**Causas:** 
1. `useFriends.ts` usaba una consulta a Firestore que dependía de índices compuestos (`toUserId` + `status` y `fromUserId` + `status`) que no existían en `firestore.indexes.json`. Como el índice no existía, la consulta fallaba silenciosamente y arrojaba una lista vacía de amigos.
2. La interfaz en `SocialPanel.tsx` no renderizaba la lista de `friends` recuperados, solo mostraba "Vecinos Sugeridos" y "Solicitudes Pendientes".
3. La "Action" en `social.ts` actualizaba Firebase, pero nunca generaba la notificación push/in-app correspondiente de "solicitud aceptada".

**Solución Técnica Planificada:**
- **Base de Datos:** Se agregaron los índices faltantes en `firestore.indexes.json` para la colección `friend_requests`.
- **Vista Social Panel:** Se modificó `src/components/dashboard/social/SocialPanel.tsx` para mapear el arreglo `friends` en la barra lateral para permitir a los usuarios iniciar chats.
- **Acciones (Actions):** Se modificó `src/app/actions/social.ts` en `respondToFriendRequestAction` para inyectar una nueva notificación en la colección `notifications` del usuario remitente validando visualmente la aceptación.

**Componentes y Archivos Clave Afectados:**
- `firestore.indexes.json`
- `src/components/dashboard/social/SocialPanel.tsx`
- `src/app/actions/social.ts`

---

## 2026-03-26 - Filtros Inteligentes de Vecinos y Solicitudes en el Muro
**Descripción del Error/Mejora:** La lista de "Vecinos Sugeridos" traía usuarios de manera indiscriminada (sin filtrar por ubicación) y el ícono de `UserPlus` en el Muro Social no reflejaba si ya existía una solicitud pendiente, permitiendo clics duplicados y confusión visual.
**Causas:** 
1. `useFriends.ts` usaba `limit(20)` sobre toda la base de `private_profiles` sin analizar los intereses o la cercanía del usuario, resultando en sugerencias poco relevantes.
2. `PostCard.tsx` utilizaba el ícono `UserPlus` pero no evaluaba si el usuario actual ya había enviado una solicitud (`sentRequests` no era recuperado), por lo que el estado revertía a visible al recargar.

**Solución Técnica Planificada:**
- **Filtro Inteligente:** Se reprogramó la función `useFriends.ts` para que primero recupere el perfil del usuario actual, luego busque en `private_profiles` usando filtros condicionales a nivel de barrio (`neighborhood`) o ciudad (`city`). Luego, se comparan los `interests` y se otorga un sistema de puntos (+3 barrio local, +2 ciudad, +1 interés en común). Los top 30 son barajados y se retorna una lista de 20 sugerencias orgánicas y dinámicas. 
- **Flujo en Muro Social:** Se extrajo `sentRequests` de `useFriends.ts` hacia `PostCard.tsx` para evaluar dinámicamente si `toUserId === post.userId`. Si es verdadero, el botón `UserPlus` se bloquea y se muestra el `<Check />` de color verde.

**Componentes y Archivos Clave Afectados:**
- `src/hooks/useFriends.ts`
- `src/components/community/PostCard.tsx`
