// Este código ha sido optimizado para la API de Frankfurter, que es gratuita y no requiere API key.

import { NextResponse } from 'next/server';

// Usamos una API gratuita que no requiere API key para mayor fiabilidad.
// Frankfurter es un servicio gratuito de tasas de cambio.
const EXCHANGE_RATE_API_URL = 'https://api.frankfurter.app/latest?from=EUR';

// Datos falsos (mocked data) en caso de que la API real falle.
const MOCKED_RATES = {
  amount: 1,
  base: 'EUR',
  date: new Date().toISOString().split('T')[0],
  rates: {
    USD: 1.07,
    GBP: 0.85,
    JPY: 169.8,
    CHF: 0.96,
    CAD: 1.47,
    AUD: 1.63,
    MXN: 19.85,
    BRL: 5.76,
    ARS: 969.57,
    COP: 4410.79,
    PEN: 4.07,
    CLP: 1002.58,
    UYU: 42.15,
    PYG: 8072.11,
    NIO: 39.46,
    CUP: 28.36,
    DOP: 62.86,
    SVC: 9.36,
    BSD: 1.07,
    HTG: 141.74,
    HNL: 26.47,
    JMD: 167.31,
    XCD: 2.89,
    INR: 89.33,
    DKK: 7.46,
    CNY: 7.78,
    KRW: 1481.44,
    SGD: 1.45,
    HKD: 8.36,
    MYR: 5.05,
    THB: 39.29,
    IDR: 17460.61,
    NZD: 1.76,
    PHP: 62.91,
    SAR: 4.01,
    AED: 3.93,
    QAR: 3.9,
    ZAR: 19.86,
    EGP: 51.27,
    TND: 3.36,
    NGN: 1587.21,
    KES: 138.41,
    GHS: 16.14,
    MAD: 10.7,
    ILS: 4.01,
    TRY: 34.82,
    RUB: 94.38,
    CZK: 24.8,
    PLN: 4.3,
    SEK: 11.23,
    NOK: 11.45,
    HUF: 396.95,
    VND: 27236.8,
  },
};

export async function GET(request: Request) {
  try {
    const response = await fetch(EXCHANGE_RATE_API_URL, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.error(
        `Error de red al intentar obtener tasas de cambio. Estado: ${response.status}. Usando datos de prueba.`
      );
      return NextResponse.json(MOCKED_RATES, { status: 200 });
    }

    const data = await response.json();

    if (!data || !data.rates) {
      console.warn(
        '⚠️ La respuesta de la API no es válida. Usando datos de prueba.'
      );
      return NextResponse.json(MOCKED_RATES, { status: 200 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error de la API Route:', error);
    console.warn(
      '⚠️ Error en la conexión. Usando datos de prueba para fallback.'
    );
    return NextResponse.json(MOCKED_RATES, { status: 200 });
  }
}
