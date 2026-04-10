# Documentación: Ocultamiento automático de búsqueda en móvil (Mobile Search Auto-Hide)

## Descripción General
Para optimizar el espacio vertical en pantallas pequeñas (móviles) y permitir que los usuarios visualicen más comercios directamente en la pantalla, se implementó una función de ocultamiento (`auto-hide`) para el módulo principal de búsqueda de Dicilo.

## Funcionamiento
1. **Defecto**: La caja de búsqueda y los filtros se muestran normalmente al cargar la página.
2. **Acción de Teclado**: Cuando el usuario escribe el término que busca y pulsa el botón **Enter** (o `Ir` / `Buscar` en el teclado móvil virtual), el teclado se esconde (`blur`) y paralelamente se minimiza la caja de búsqueda.
3. **Gesto Intuitivo (Scroll)**: En el instante en que el usuario toca los resultados y desliza su dedo para ver más empresas hacia abajo (scroll), la caja de búsqueda se oculta instantáneamente para proveer automáticamente la máxima altura de lectura posible en móviles.
4. **Botón Colapsar (Manual)**: También se agregó un icono `X` en la esquina superior derecha del buscador para colapsar la tarjeta manualmente y ganar espacio aunque no se realice ninguna escritura.
5. **Recuperación**: Una vez que la caja principal de búsqueda está oculta, queda a la vista un **botón flotante centrado en la parte superior** (Lupa verde) envuelto en un estilo `sticky` que acompaña al scroll. Al tocar esta lupa, reaparece la caja de búsqueda al instante.

## Archivos Modificados
- `src/components/dicilo-search-page.tsx`:
  - Se añadió la variable de estado `isMobileSearchHidden`.
  - Se modificaron las clases responsivas del `<Card>` que envuelve la búsqueda (`md:hidden`).
  - Se integró el botón circular re-abridor con los estilos verdes acordados corporativamente. 
  - Se implementó el evento `onKeyDown` en el `<Input>` de búsqueda.

## Responsive y Seguridad
- Todas las ocultaciones están garantizadas de afectar **solo** vía media queries (vía clases nativas de tailwind `md:hidden` / `md:block`) o vía JavaScript (`window.innerWidth < 768`), asegurando que la experiencia en PC o Tablets grandes permanezca inalterada.
