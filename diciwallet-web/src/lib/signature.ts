import { createHmac } from 'crypto';

const COUNTRY_MAP: Record<string, string> = {
  'peru': 'PE',
  'perú': 'PE',
  'alemania': 'DE',
  'deutschland': 'DE',
  'germany': 'DE',
  'españa': 'ES',
  'spain': 'ES',
  'spanien': 'ES',
  'estados unidos': 'US',
  'usa': 'US',
  'united states': 'US',
  'canada': 'CA',
  'canadá': 'CA',
  'mexico': 'MX',
  'méxico': 'MX',
  'colombia': 'CO',
  'venezuela': 'VE',
  'brasil': 'BR',
  'brazil': 'BR',
  'argentina': 'AR',
  'chile': 'CL',
  'ecuador': 'EC',
  'panama': 'PA',
  'panamá': 'PA',
  'paraguay': 'PY',
  'portugal': 'PT',
  'polonia': 'PL',
  'poland': 'PL',
  'china': 'CN',
  'india': 'IN',
  'sudafrica': 'ZA',
  'sudáfrica': 'ZA',
  'south africa': 'ZA',
  'nigeria': 'NG'
};

/**
 * Obtiene el código ISO de 2 letras de un país.
 */
export function getCountryCode(countryName: string): string {
  if (!countryName) return 'XX';
  const cleanName = countryName.trim().toLowerCase();
  
  // Buscar en el mapa
  if (COUNTRY_MAP[cleanName]) {
    return COUNTRY_MAP[cleanName];
  }
  
  // Si no está, remover acentos básicos y extraer las primeras 2 letras
  const sanitized = cleanName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
    
  const lettersOnly = sanitized.replace(/[^A-Z]/g, '');
  if (lettersOnly.length >= 2) {
    return lettersOnly.substring(0, 2);
  }
  
  return sanitized.substring(0, 2).padEnd(2, 'X');
}

/**
 * Genera caracteres aleatorios de un conjunto dado.
 */
function generateRandomChars(length: number, alphabet: string): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return result;
}

/**
 * Genera una Firma Digital de Venta única y encriptada con formato:
 * [PAÍS+CONTROL]-[CONTINENTE+AÑO]-[NUM]-[MIX]-[MIX]-[MIX]-[MIX]-[CHECK]
 */
export function generateSaleSignature(
  countryName: string,
  continent: string,
  secretKey: string
): string {
  const countryCode = getCountryCode(countryName);
  
  // Bloque 1: PAÍS (2 letras) + CONTROL (2 caracteres alfanuméricos en mayúsculas)
  const blockControl = generateRandomChars(2, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'); // Omitimos I, O, 0, 1 para evitar confusión visual
  const block1 = `${countryCode}${blockControl}`;
  
  // Bloque 2: CONTINENTE (2 letras) + AÑO (2 dígitos, por ejemplo '26' para 2026)
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const block2 = `${continent.substring(0, 2).toUpperCase()}${currentYear}`;
  
  // Bloque 3: NUM (4 dígitos numéricos aleatorios)
  const block3 = generateRandomChars(4, '0123456789');
  
  // Bloques 4 a 7: MIX (mezclas alfanuméricas de 4 caracteres)
  const capsAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const mixedAlphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Omitimos visualmente problemáticos
  
  const block4 = generateRandomChars(4, capsAlphabet); // Bloque alfanumérico mayúsculas
  const block5 = generateRandomChars(4, mixedAlphabet); // Bloque mixto (sensible a mayúsculas/minúsculas)
  const block6 = generateRandomChars(4, mixedAlphabet); // Bloque mixto
  const block7 = generateRandomChars(4, capsAlphabet); // Bloque de seguridad en mayúsculas
  
  // Concatenar los primeros 7 bloques con guiones
  const baseString = `${block1}-${block2}-${block3}-${block4}-${block5}-${block6}-${block7}`;
  
  // Bloque 8: CHECK (Checksum de 4 caracteres calculando HMAC-SHA256 sobre la base usando la clave secreta)
  const hmac = createHmac('sha256', secretKey);
  hmac.update(baseString);
  const hash = hmac.digest('base64');
  
  // Saneamiento de base64 y obtención de los 4 primeros caracteres válidos en mayúsculas
  const cleanHash = hash.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const checksum = cleanHash.substring(0, 4).padEnd(4, 'X');
  
  return `${baseString}-${checksum}`;
}

/**
 * Valida criptográficamente la integridad de la Firma Digital de Venta recalculando su checksum.
 */
export function verifySaleSignature(signature: string, secretKey: string): boolean {
  if (!signature) return false;
  
  const parts = signature.trim().split('-');
  if (parts.length !== 8) return false;
  
  // Comprobar que cada parte tenga longitud 4
  for (const part of parts) {
    if (part.length !== 4) return false;
  }
  
  // Separar la firma base del checksum
  const baseString = parts.slice(0, 7).join('-');
  const providedChecksum = parts[7].toUpperCase();
  
  // Recalcular checksum
  const hmac = createHmac('sha256', secretKey);
  hmac.update(baseString);
  const hash = hmac.digest('base64');
  const cleanHash = hash.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const expectedChecksum = cleanHash.substring(0, 4).padEnd(4, 'X');
  
  return providedChecksum === expectedChecksum;
}
