const OFFICIAL_WALLET = 'TYsyWy2eXtcPevdkW6vQkA5pFLCvQiacst';
const USDT_TRC20_CONTRACT = 'TR7NHqju6dC8QNq8g15h29px6Db31EH1KB';

async function testExchangeRate() {
  console.log('--- 1. PROBANDO COTIZACIÓN DINÁMICA EUR/USDT ---');
  try {
    const binanceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=EURUSDT');
    if (binanceRes.ok) {
      const data = await binanceRes.json();
      console.log('Binance API EURUSDT Rate:', parseFloat(data.price));
    } else {
      console.log('Binance API EURUSDT Rate: Fallido');
    }
  } catch (e) {
    console.error('Error fetching from Binance:', e.message);
  }

  try {
    const geckoRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=eur');
    if (geckoRes.ok) {
      const data = await geckoRes.json();
      const eurPerUsdt = data.tether?.eur;
      if (eurPerUsdt) {
        console.log('CoinGecko API USDT to EUR:', eurPerUsdt);
        console.log('CoinGecko Calculated EURUSDT Rate:', 1 / eurPerUsdt);
      }
    } else {
      console.log('CoinGecko API: Fallido');
    }
  } catch (e) {
    console.error('Error fetching from CoinGecko:', e.message);
  }
}

async function testTronGridScan() {
  console.log('\n--- 2. PROBANDO CONEXIÓN Y ESCANEO TRONGRID ---');
  const url = `https://api.trongrid.io/v1/accounts/${OFFICIAL_WALLET}/transactions/trc20?limit=10`;
  try {
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      console.log('TronGrid Status:', json.success ? 'EXITOSO' : 'FALLIDO');
      if (json.success && json.data) {
        console.log(`Transacciones TRC20 encontradas: ${json.data.length}`);
        if (json.data.length > 0) {
          const firstTx = json.data[0];
          console.log('\nEjemplo de Transacción Reciente detectada:');
          console.log('- Hash:', firstTx.transaction_id);
          console.log('- Desde:', firstTx.from);
          console.log('- Hacia:', firstTx.to);
          console.log('- Valor Raw:', firstTx.value);
          console.log('- Símbolo Token:', firstTx.token_info?.symbol);
          const decimalVal = parseFloat(firstTx.value) / Math.pow(10, firstTx.token_info?.decimals || 6);
          console.log('- Valor formateado:', decimalVal, firstTx.token_info?.symbol);
        }
      }
    } else {
      const body = await res.text();
      console.log(`TronGrid API falló con código http: ${res.status}. Body: ${body}`);
    }
  } catch (e) {
    console.error('Error en escaneo de TronGrid:', e.message);
  }
}

async function run() {
  await testExchangeRate();
  await testTronGridScan();
  console.log('\n--- PRUEBA FINALIZADA ---');
}

run();
