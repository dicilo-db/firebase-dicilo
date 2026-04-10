// src/lib/color-utils.ts

/**
 * Convierte un color HEX a RGB.
 * @param hex El color en formato HEX (ej. '#FFFFFF').
 * @returns Un array de [R, G, B].
 */
const hexToRgb = (hex: string): [number, number, number] | null => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : null;
};

/**
 * Calcula la luminancia de un color RGB.
 * La fórmula de luminancia (YIQ) se utiliza para determinar si un color es "claro" u "oscuro".
 * @param r - Valor de Rojo (0-255).
 * @param g - Valor de Verde (0-255).
 * @param b - Valor de Azul (0-255).
 * @returns Un valor de luminancia entre 0 y 255.
 */
const getLuminance = (r: number, g: number, b: number): number => {
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

/**
 * Determina el color del texto (blanco o negro) en función del color de fondo.
 * @param backgroundColor - El color de fondo en formato HEX.
 * @returns 'black' o 'white'.
 */
export const getTextColor = (backgroundColor: string): 'black' | 'white' => {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) {
    return 'black'; // Por defecto, si el formato es inválido
  }
  const luminance = getLuminance(rgb[0], rgb[1], rgb[2]);
  // Un umbral de 128 es un buen punto de partida para decidir si el color es claro u oscuro.
  return luminance > 128 ? 'black' : 'white';
};
