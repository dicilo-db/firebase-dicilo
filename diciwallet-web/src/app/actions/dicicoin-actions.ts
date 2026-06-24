'use server';

import { getAdminDb, getFieldValue, getTimestamp } from '@/lib/firebase-admin';
import { generateSaleSignature } from '@/lib/signature';

const USDT_TRC20_CONTRACT = 'TR7NHqju6dC8QNq8g15h29px6Db31EH1KB';
const OFFICIAL_WALLET = 'TYsyWy2eXtcPevdkW6vQkA5pFLCvQiacst';
const COIN_BASE_PRICE_EUR = 5000;
const REQUIRED_CONFIRMATIONS = 20;

/**
 * Obtiene el tipo de cambio dinámico de EUR a USDT (1 EUR = X USDT).
 */
export async function getUsdtExchangeRate(): Promise<{ success: boolean; rate: number; source: string }> {
  try {
    // 1. Intentar Binance EURUSDT
    const binanceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=EURUSDT', {
      next: { revalidate: 60 } // Cachear por 1 minuto
    });
    if (binanceRes.ok) {
      const data = await binanceRes.json();
      const rate = parseFloat(data.price);
      if (!isNaN(rate) && rate > 0) {
        return { success: true, rate, source: 'Binance API' };
      }
    }
  } catch (e) {
    console.warn('Error fetching exchange rate from Binance:', e);
  }

  try {
    // 2. Fallback a CoinGecko (Tether vs EUR)
    const geckoRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=eur', {
      next: { revalidate: 60 }
    });
    if (geckoRes.ok) {
      const data = await geckoRes.json();
      const eurPerUsdt = data.tether?.eur;
      if (eurPerUsdt && eurPerUsdt > 0) {
        const rate = 1 / eurPerUsdt;
        return { success: true, rate, source: 'CoinGecko' };
      }
    }
  } catch (e) {
    console.warn('Error fetching exchange rate from CoinGecko:', e);
  }

  // 3. Fallback estático
  return { success: true, rate: 1.08, source: 'Fallback estático' };
}

/**
 * Crea una orden de compra cripto (USDT TRC20) o fiat para DiciCoin (completa o fraccionada).
 */
export async function createCoinOrder(
  userId: string,
  coinId: string,
  percentage: number,
  purchaseType: 'full_dicicoin' | 'fractional_master' | 'fractional_participant' | 'installment',
  paymentMethod: 'usdt_trc20' | 'revolut_transfer' | 'bank_wire',
  reservationId?: string
) {
  if (percentage < 1 || percentage > 100) {
    return { success: false, messageKey: 'Porcentaje inválido.' };
  }

  try {
    const db = getAdminDb();

    // 1. Obtener cotización USDT
    const rateInfo = await getUsdtExchangeRate();
    const rate = rateInfo.rate;

    // Calcular montos
    const expectedAmountEur = COIN_BASE_PRICE_EUR * (percentage / 100);
    const expectedAmountUsdt = parseFloat((expectedAmountEur * rate).toFixed(2));

    // Validar el estado actual de la moneda y verificar reglas de propiedad fraccionada
    const result = await db.runTransaction(async (transaction) => {
      const coinRef = db.collection('dici_coins').doc(coinId);
      const coinDoc = await transaction.get(coinRef);

      let coinData = coinDoc.exists ? coinDoc.data() : null;

      // Si la moneda no existe en Firestore, la creamos (Just-in-Time para la escala de 10M)
      if (!coinDoc.exists) {
        // Formato ID: [Continente]-DC[Numero]
        const parts = coinId.split('-');
        const continent = parts[0];
        const numStr = parts[1]?.replace('DC', '') || '1';
        const num = parseInt(numStr) || 1;

        coinData = {
          id: coinId,
          serial: '',
          number: num,
          continent,
          status: 'available',
          valueEur: COIN_BASE_PRICE_EUR,
          paidAmount: 0,
          currentOwnerId: null,
          fractionsSold: 0,
          createdAt: getTimestamp().now(),
          updatedAt: getTimestamp().now()
        };
        transaction.set(coinRef, coinData);
      }

      // Validar disponibilidad
      if (coinData?.status === 'reserved' && purchaseType !== 'installment') {
        return { success: false, messageKey: 'Esta moneda ya se encuentra reservada en su totalidad.' };
      }

      // Obtener participaciones actuales de la moneda
      const fractionsSnapshot = await db.collection('dicicoin_fractions')
        .where('dicicoin_id', '==', coinId)
        .where('status', '==', 'active')
        .get();

      let soldPercentage = 0;
      let hasMaster = false;

      fractionsSnapshot.forEach((doc) => {
        const frac = doc.data();
        soldPercentage += (frac.ownership_percentage || 0);
        if (frac.master_user_id) {
          hasMaster = true;
        }
      });

      // Consultar órdenes pendientes que bloquean el porcentaje
      const pendingOrdersSnapshot = await db.collection('coin_orders')
        .where('dicicoin_id', '==', coinId)
        .where('payment_status', 'in', ['created', 'waiting_payment', 'detected', 'under_confirmation'])
        .get();

      let pendingPercentage = 0;
      pendingOrdersSnapshot.forEach((doc) => {
        const ord = doc.data();
        // Evitar contar expiradas (60 minutos expiración)
        const ageInMs = Date.now() - (ord.created_at?.toDate ? ord.created_at.toDate().getTime() : Date.now());
        if (ageInMs < 60 * 60 * 1000) {
          pendingPercentage += (ord.ownership_percentage || 0);
        }
      });

      // Validar si la compra excede el 100% de la moneda
      if (soldPercentage + pendingPercentage + percentage > 100) {
        return { 
          success: false, 
          messageKey: `La compra de ${percentage}% supera la disponibilidad. Vendido: ${soldPercentage}%, Pendiente en cola: ${pendingPercentage}%. Disponible: ${100 - soldPercentage - pendingPercentage}%.` 
        };
      }

      // Validaciones del rol Master
      if (purchaseType === 'fractional_master') {
        if (hasMaster) {
          return { success: false, messageKey: 'Esta moneda fraccionada ya posee un Master propietario.' };
        }
        if (percentage < 51) {
          return { success: false, messageKey: 'El Master debe adquirir como mínimo el 51% de la moneda.' };
        }
      } else if (purchaseType === 'fractional_participant') {
        if (percentage >= 51 && !hasMaster) {
          return { success: false, messageKey: 'Para adquirir el 51% o más, debe realizar la compra como Master.' };
        }
      }

      // Crear la orden de compra
      const orderId = `ord_${Math.random().toString(36).substring(2, 12)}`;
      const orderRef = db.collection('coin_orders').doc(orderId);

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 60); // 60 minutos de validez

      const orderData = {
        order_id: orderId,
        user_id: userId,
        dicicoin_id: coinId,
        reservation_id: reservationId || null,
        serial: coinData?.serial || '',
        purchase_type: purchaseType,
        ownership_percentage: percentage,
        is_master_purchase: purchaseType === 'full_dicicoin' || purchaseType === 'fractional_master',
        payment_method: paymentMethod,
        payment_status: 'created',
        expected_amount_eur: expectedAmountEur,
        expected_amount_usdt: expectedAmountUsdt,
        received_amount_usdt: 0,
        official_wallet_address: OFFICIAL_WALLET,
        tx_hash: '',
        network: paymentMethod === 'usdt_trc20' ? 'TRON_TRC20' : 'SEPA_IBAN',
        token: paymentMethod === 'usdt_trc20' ? 'USDT' : 'EUR',
        created_at: getTimestamp().now(),
        expires_at: getTimestamp().fromDate(expiresAt),
        paid_at: null,
        confirmed_at: null,
        assigned_at: null,
        status: 'pending'
      };

      transaction.set(orderRef, orderData);

      // Si es una compra fiat de transferencia, actualizamos a waiting_payment inmediatamente
      if (paymentMethod !== 'usdt_trc20') {
        transaction.update(orderRef, { payment_status: 'waiting_payment' });
      }

      return {
        success: true,
        orderId,
        expectedAmountEur,
        expectedAmountUsdt,
        officialWallet: OFFICIAL_WALLET,
        exchangeRate: rate,
        expiresAt: expiresAt.toISOString()
      };
    });

    return result;
  } catch (error: any) {
    console.error('Error in createCoinOrder:', error);
    return { success: false, messageKey: 'Error interno del servidor al crear la orden.', errorDetails: error.message };
  }
}

/**
 * Consulta la red Tron mediante la API de TronGrid para verificar un hash de transacción USDT TRC20.
 */
export async function verifyCryptoPayment(userId: string, orderId: string, txHash: string) {
  if (!txHash || txHash.trim().length !== 64) {
    return { success: false, messageKey: 'El formato del hash de transacción es inválido.' };
  }

  try {
    const db = getAdminDb();
    const cleanedHash = txHash.trim();

    // 1. Verificar si el hash ya ha sido utilizado en órdenes anteriores
    const hashUsedQuery = await db.collection('coin_orders')
      .where('tx_hash', '==', cleanedHash)
      .where('payment_status', '==', 'paid')
      .limit(1)
      .get();

    if (!hashUsedQuery.empty) {
      return { success: false, messageKey: 'Este hash de transacción ya ha sido verificado y procesado previamente.' };
    }

    // 2. Obtener la orden de compra
    const orderRef = db.collection('coin_orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return { success: false, messageKey: 'La orden de compra no existe.' };
    }

    const orderData = orderDoc.data();
    if (orderData?.user_id !== userId) {
      return { success: false, messageKey: 'No está autorizado para verificar esta orden.' };
    }

    if (orderData.payment_status === 'paid') {
      return { success: true, messageKey: 'La orden ya está marcada como pagada.', status: 'paid' };
    }

    // 3. Consultar la blockchain TRON usando la API pública de TronGrid
    // Buscamos el historial TRC20 de nuestra wallet receptora
    const tronGridUrl = `https://api.trongrid.io/v1/accounts/${OFFICIAL_WALLET}/transactions/trc20?limit=50`;
    const response = await fetch(tronGridUrl);
    if (!response.ok) {
      return { success: false, messageKey: 'Error al consultar el servicio TronGrid. Por favor, intente de nuevo en unos minutos.' };
    }

    const json = await response.json();
    if (!json.success || !json.data) {
      return { success: false, messageKey: 'No se pudieron recuperar las transacciones de TronGrid.' };
    }

    // Buscar coincidencia por hash de transacción
    const tx = json.data.find((t: any) => t.transaction_id === cleanedHash);

    if (!tx) {
      return { 
        success: false, 
        messageKey: 'Transacción no encontrada en la blockchain para la wallet receptora oficial. Asegúrese de que la dirección destino y el hash sean correctos.' 
      };
    }

    // Validar destinatario y contrato de USDT
    if (tx.to !== OFFICIAL_WALLET) {
      return { success: false, messageKey: 'La dirección de destino de la transacción no corresponde a la wallet oficial de Dicilo.' };
    }

    if (tx.token_info?.address !== USDT_TRC20_CONTRACT) {
      return { success: false, messageKey: 'El token transferido no corresponde a USDT en la red TRON/TRC20.' };
    }

    // Validar importe. USDT tiene 6 decimales en TRON.
    const rawValue = parseFloat(tx.value);
    const receivedUsdt = rawValue / Math.pow(10, tx.token_info.decimals || 6);
    const expectedUsdt = orderData.expected_amount_usdt;

    // Permitir pequeña tolerancia por redondeos decimales (ej: 0.05 USDT)
    if (receivedUsdt < (expectedUsdt - 0.05)) {
      return { 
        success: false, 
        messageKey: `El importe recibido (${receivedUsdt} USDT) es inferior al esperado para esta orden (${expectedUsdt} USDT).` 
      };
    }

    // 4. Verificar confirmaciones de bloque
    // Consultamos la información detallada del bloque de la transacción
    let txBlockNumber = 0;
    try {
      const txInfoRes = await fetch('https://api.trongrid.io/wallet/gettransactioninfobyid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: cleanedHash })
      });
      if (txInfoRes.ok) {
        const info = await txInfoRes.json();
        if (info.blockNumber) {
          txBlockNumber = info.blockNumber;
        }
      }
    } catch (e) {
      console.error('Error fetching blockNumber for tx:', e);
    }

    // Obtener bloque actual de la red TRON
    let currentBlockNumber = 0;
    try {
      const nowBlockRes = await fetch('https://api.trongrid.io/wallet/getnowblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (nowBlockRes.ok) {
        const blockInfo = await nowBlockRes.json();
        if (blockInfo.block_header?.raw_data?.number) {
          currentBlockNumber = blockInfo.block_header.raw_data.number;
        }
      }
    } catch (e) {
      console.error('Error fetching latest block:', e);
    }

    let confirmations = 0;
    if (currentBlockNumber > 0 && txBlockNumber > 0) {
      confirmations = currentBlockNumber - txBlockNumber;
    } else {
      // Fallback: usar una aproximación basada en el timestamp de TronGrid (bloques cada 3 segundos)
      const txTimeMs = tx.block_timestamp || Date.now();
      const elapsedSeconds = (Date.now() - txTimeMs) / 1000;
      confirmations = Math.floor(elapsedSeconds / 3);
    }

    if (confirmations < REQUIRED_CONFIRMATIONS) {
      // Actualizar a estado "under_confirmation"
      await orderRef.update({
        payment_status: 'under_confirmation',
        tx_hash: cleanedHash,
        received_amount_usdt: receivedUsdt,
        updated_at: getTimestamp().now()
      });

      return { 
        success: true, 
        messageKey: `Pago detectado en blockchain con ${confirmations}/${REQUIRED_CONFIRMATIONS} confirmaciones. Procesando liberación automática al completar 20 confirmaciones.`,
        status: 'under_confirmation',
        confirmations
      };
    }

    // 5. Procesar la liberación atómica de la moneda / fracciones en Firestore
    const finalResult = await db.runTransaction(async (transaction) => {
      // Re-verificar estado de la orden dentro de la transacción
      const tOrderDoc = await transaction.get(orderRef);
      if (tOrderDoc.data()?.payment_status === 'paid') {
        return { success: true, messageKey: 'La orden ya fue pagada y liberada.', status: 'paid' };
      }

      const coinId = orderData.dicicoin_id;
      const coinRef = db.collection('dici_coins').doc(coinId);
      const coinDoc = await transaction.get(coinRef);
      const coinData = coinDoc.data();

      // Generar serial digital
      const profileRef = db.collection('private_profiles').doc(userId);
      const profileDoc = await transaction.get(profileRef);
      const profileData = profileDoc.exists ? profileDoc.data() : null;
      const firstName = profileData?.firstName || 'U';
      const lastName = profileData?.lastName || 'D';
      const nameInit = firstName.trim().charAt(0).toUpperCase() || 'X';
      const lastNameInit = lastName.trim().charAt(0).toUpperCase() || 'X';
      const continentCode = coinId.substring(0, 2).toUpperCase();

      const block1 = `${continentCode}${nameInit}${lastNameInit}`;
      const block2 = Math.floor(1000 + Math.random() * 9000).toString();
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).substring(2);
      const block3 = `${month}${year}`;
      const digitalSerial = coinData?.serial || `DC-${block1}-${block2}-${block3}`;

      // Obtener participaciones actuales de la moneda
      const fractionsSnapshot = await db.collection('dicicoin_fractions')
        .where('dicicoin_id', '==', coinId)
        .where('status', '==', 'active')
        .get();

      let soldPercentage = 0;
      let hasMaster = false;
      let currentMasterId = null;

      fractionsSnapshot.forEach((doc) => {
        const frac = doc.data();
        soldPercentage += (frac.ownership_percentage || 0);
        if (frac.master_user_id) {
          hasMaster = true;
          currentMasterId = frac.master_user_id;
        }
      });

      const percentage = orderData.ownership_percentage;
      const isMaster = orderData.is_master_purchase;
      const isInstallment = orderData.purchase_type === 'installment' && orderData.reservation_id;

      let finalCoinStatus = 'forming_team';
      let isCompletePurchase = percentage === 100;
      let updatedPaidAmount = (coinData?.paidAmount || 0) + orderData.expected_amount_eur;

      if (isInstallment) {
        const reservationRef = db.collection('coin_reservations').doc(orderData.reservation_id);
        const reservationDoc = await transaction.get(reservationRef);
        if (!reservationDoc.exists) {
          throw new Error('La reserva asociada a este pago no existe.');
        }
        const resData = reservationDoc.data();
        updatedPaidAmount = (resData?.paidAmount || 0) + orderData.expected_amount_eur;
        const newRemaining = (resData?.remainingAmount || 0) - orderData.expected_amount_eur;
        const newProgress = Math.min(100, (updatedPaidAmount / resData?.totalAmount) * 100);
        const isCompleted = newRemaining <= 0;
        isCompletePurchase = isCompleted;
        finalCoinStatus = isCompleted ? 'fully_paid' : 'payment_plan';

        transaction.update(reservationRef, {
          paidAmount: updatedPaidAmount,
          remainingAmount: newRemaining,
          progressPercentage: newProgress,
          status: isCompleted ? 'completed' : 'active',
          updatedAt: getTimestamp().now()
        });
      } else {
        if (soldPercentage + percentage > 100) {
          throw new Error('La asignación excede el límite del 100% de la moneda.');
        }
        if (isCompletePurchase) {
          finalCoinStatus = 'paid';
        } else {
          if (isMaster || hasMaster || (soldPercentage + percentage >= 51)) {
            finalCoinStatus = 'active_fractional';
          } else {
            finalCoinStatus = 'forming_team';
          }
        }
      }

      // A. Actualizar la orden de compra
      transaction.update(orderRef, {
        payment_status: 'paid',
        tx_hash: cleanedHash,
        received_amount_usdt: receivedUsdt,
        paid_at: getTimestamp().now(),
        confirmed_at: getTimestamp().now(),
        assigned_at: getTimestamp().now(),
        serial: digitalSerial,
        status: 'completed'
      });

      // B. Registrar el pago en el historial general
      const paymentId = `pay_${Math.random().toString(36).substring(2, 12)}`;
      const paymentRef = db.collection('payment_history').doc(paymentId);
      transaction.set(paymentRef, {
        id: paymentId,
        userId,
        coinId,
        orderId,
        amount: orderData.expected_amount_eur,
        amountUsdt: receivedUsdt,
        paymentMethod: 'usdt_trc20',
        txHash: cleanedHash,
        status: 'completed',
        createdAt: getTimestamp().now()
      });

      // C. Actualizar catálogo de monedas
      transaction.update(coinRef, {
        status: finalCoinStatus,
        serial: digitalSerial,
        paidAmount: updatedPaidAmount,
        currentOwnerId: isCompletePurchase ? userId : (isMaster ? userId : (currentMasterId || userId)),
        updatedAt: getTimestamp().now()
      });

      // D. Crear el registro de fracción (solo si NO es pago de cuota)
      if (!isInstallment) {
        const fractionId = `frac_${Math.random().toString(36).substring(2, 12)}`;
        const fractionRef = db.collection('dicicoin_fractions').doc(fractionId);
        transaction.set(fractionRef, {
          fraction_id: fractionId,
          dicicoin_id: coinId,
          serial: digitalSerial,
          master_user_id: isMaster ? userId : null,
          participant_user_id: !isMaster ? userId : null,
          ownership_percentage: percentage,
          amount_paid_eur: orderData.expected_amount_eur,
          amount_paid_usdt: receivedUsdt,
          payment_method: 'usdt_trc20',
          purchase_date: getTimestamp().now(),
          status: 'active',
          transaction_hash: cleanedHash,
          team_id: coinId
        });
      }

      // E. Actualizar la wallet del usuario
      const walletRef = db.collection('wallets').doc(userId);
      transaction.update(walletRef, {
        totalPaidEur: getFieldValue().increment(orderData.expected_amount_eur),
        updatedAt: getTimestamp().now()
      });

      // F. Registrar transacciones de historial
      const walletTrx = db.collection('wallet_transactions').doc();
      transaction.set(walletTrx, {
        userId,
        amount: orderData.expected_amount_eur,
        currency: 'EUR',
        type: isMaster ? 'DICICOIN_MASTER_PURCHASE' : 'DICICOIN_PARTICIPATION_PURCHASE',
        description: `Adquisición del ${percentage}% de DiciCoin ${coinId}. Pago USDT TRC20 verificado.`,
        timestamp: getTimestamp().now()
      });

      // G. Log de Auditoría
      const auditRef = db.collection('audit_logs').doc();
      transaction.set(auditRef, {
        userId,
        timestamp: getTimestamp().now(),
        action: 'BUY_DICICOIN',
        amount_eur: orderData.expected_amount_eur,
        amount_usdt: receivedUsdt,
        serial: digitalSerial,
        percentage,
        role: isMaster ? 'Master' : 'Participant',
        payment_type: 'usdt_trc20',
        wallet_destination: OFFICIAL_WALLET,
        tx_hash: cleanedHash,
        old_status: coinData?.status || 'available',
        new_status: finalCoinStatus
      });

      return { 
        success: true, 
        messageKey: 'Pago verificado con éxito. Su DiciCoin / participación ha sido asignada.', 
        status: 'paid',
        serial: digitalSerial
      };
    });

    return finalResult;
  } catch (error: any) {
    console.error('Error in verifyCryptoPayment:', error);
    return { success: false, messageKey: 'Error al verificar el pago cripto.', errorDetails: error.message };
  }
}

/**
 * Aprueba manualmente un pedido fiat desde el panel de administración.
 */
export async function adminApproveFiatOrder(adminUserId: string, orderId: string) {
  try {
    const db = getAdminDb();

    // Validar la orden
    const orderRef = db.collection('coin_orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return { success: false, messageKey: 'La orden no existe.' };
    }

    const orderData = orderDoc.data();
    if (orderData?.payment_status === 'paid') {
      return { success: false, messageKey: 'La orden ya está pagada.' };
    }

    const userId = orderData?.user_id;

    // Procesar la aprobación en una transacción
    const result = await db.runTransaction(async (transaction) => {
      const coinId = orderData?.dicicoin_id;
      const coinRef = db.collection('dici_coins').doc(coinId);
      const coinDoc = await transaction.get(coinRef);
      const coinData = coinDoc.data();

      // Generar serial digital
      const profileDoc = await transaction.get(db.collection('private_profiles').doc(userId));
      const profileData = profileDoc.exists ? profileDoc.data() : null;
      const firstName = profileData?.firstName || 'U';
      const lastName = profileData?.lastName || 'D';
      const nameInit = firstName.trim().charAt(0).toUpperCase() || 'X';
      const lastNameInit = lastName.trim().charAt(0).toUpperCase() || 'X';
      const continentCode = coinId.substring(0, 2).toUpperCase();

      const block1 = `${continentCode}${nameInit}${lastNameInit}`;
      const block2 = Math.floor(1000 + Math.random() * 9000).toString();
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).substring(2);
      const block3 = `${month}${year}`;
      const digitalSerial = coinData?.serial || `DC-${block1}-${block2}-${block3}`;

      // Obtener participaciones actuales de la moneda
      const fractionsSnapshot = await db.collection('dicicoin_fractions')
        .where('dicicoin_id', '==', coinId)
        .where('status', '==', 'active')
        .get();

      let soldPercentage = 0;
      let hasMaster = false;
      let currentMasterId = null;

      fractionsSnapshot.forEach((doc) => {
        const frac = doc.data();
        soldPercentage += (frac.ownership_percentage || 0);
        if (frac.master_user_id) {
          hasMaster = true;
          currentMasterId = frac.master_user_id;
        }
      });

      const percentage = orderData?.ownership_percentage || 100;
      const isMaster = orderData?.is_master_purchase;

      if (soldPercentage + percentage > 100) {
        throw new Error('La asignación excede el límite del 100% de la moneda.');
      }

      const isCompletePurchase = percentage === 100;
      let finalCoinStatus = 'forming_team';

      if (isCompletePurchase) {
        finalCoinStatus = 'paid';
      } else {
        if (isMaster || hasMaster || (soldPercentage + percentage >= 51)) {
          finalCoinStatus = 'active_fractional';
        } else {
          finalCoinStatus = 'forming_team';
        }
      }

      // A. Actualizar la orden de compra
      transaction.update(orderRef, {
        payment_status: 'paid',
        paid_at: getTimestamp().now(),
        confirmed_at: getTimestamp().now(),
        assigned_at: getTimestamp().now(),
        serial: digitalSerial,
        status: 'completed',
        approved_by: adminUserId
      });

      // B. Registrar el pago en el historial general
      const paymentId = `pay_${Math.random().toString(36).substring(2, 12)}`;
      const paymentRef = db.collection('payment_history').doc(paymentId);
      transaction.set(paymentRef, {
        id: paymentId,
        userId,
        coinId,
        orderId,
        amount: orderData?.expected_amount_eur,
        paymentMethod: orderData?.payment_method,
        status: 'completed',
        approvedBy: adminUserId,
        createdAt: getTimestamp().now()
      });

      // C. Actualizar catálogo de monedas
      const updatedPaidAmount = (coinData?.paidAmount || 0) + orderData?.expected_amount_eur;
      transaction.update(coinRef, {
        status: finalCoinStatus,
        serial: digitalSerial,
        paidAmount: updatedPaidAmount,
        currentOwnerId: isCompletePurchase ? userId : (isMaster ? userId : (currentMasterId || userId)),
        updatedAt: getTimestamp().now()
      });

      // D. Crear el registro de fracción
      const fractionId = `frac_${Math.random().toString(36).substring(2, 12)}`;
      const fractionRef = db.collection('dicicoin_fractions').doc(fractionId);
      transaction.set(fractionRef, {
        fraction_id: fractionId,
        dicicoin_id: coinId,
        serial: digitalSerial,
        master_user_id: isMaster ? userId : null,
        participant_user_id: !isMaster ? userId : null,
        ownership_percentage: percentage,
        amount_paid_eur: orderData?.expected_amount_eur,
        amount_paid_usdt: 0,
        payment_method: orderData?.payment_method,
        purchase_date: getTimestamp().now(),
        status: 'active',
        transaction_hash: 'MANUAL_ADMIN_FIAT',
        team_id: coinId
      });

      // E. Actualizar la wallet del usuario
      const walletRef = db.collection('wallets').doc(userId);
      transaction.update(walletRef, {
        totalPaidEur: getFieldValue().increment(orderData?.expected_amount_eur),
        updatedAt: getTimestamp().now()
      });

      // F. Registrar transacciones de historial
      const walletTrx = db.collection('wallet_transactions').doc();
      transaction.set(walletTrx, {
        userId,
        amount: orderData?.expected_amount_eur,
        currency: 'EUR',
        type: isMaster ? 'DICICOIN_MASTER_MANUAL_APPROVED' : 'DICICOIN_PARTICIPATION_MANUAL_APPROVED',
        description: `Adquisición del ${percentage}% de DiciCoin ${coinId}. Aprobada manualmente por admin.`,
        timestamp: getTimestamp().now()
      });

      // G. Log de Auditoría
      const auditRef = db.collection('audit_logs').doc();
      transaction.set(auditRef, {
        userId,
        timestamp: getTimestamp().now(),
        action: 'BUY_DICICOIN_MANUAL_APPROVE',
        amount_eur: orderData?.expected_amount_eur,
        amount_usdt: 0,
        serial: digitalSerial,
        percentage,
        role: isMaster ? 'Master' : 'Participant',
        payment_type: orderData?.payment_method,
        wallet_destination: '',
        tx_hash: 'MANUAL_ADMIN_FIAT',
        old_status: coinData?.status || 'available',
        new_status: finalCoinStatus,
        admin_id: adminUserId
      });

      return { success: true };
    });

    return result;
  } catch (error: any) {
    console.error('Error in adminApproveFiatOrder:', error);
    return { success: false, messageKey: 'Error al aprobar manualmente la orden.' };
  }
}

/**
 * Obtiene el resumen financiero para el Superadmin Financiero.
 */
export async function adminGetFinancialSummary() {
  try {
    const db = getAdminDb();

    // 1. Obtener todas las órdenes completadas
    const ordersSnapshot = await db.collection('coin_orders')
      .where('payment_status', '==', 'paid')
      .get();

    let totalEur = 0;
    let totalUsdt = 0;
    let countUsdt = 0;
    let countRevolut = 0;
    let countWire = 0;

    ordersSnapshot.forEach((doc) => {
      const data = doc.data();
      totalEur += (data.expected_amount_eur || 0);
      if (data.payment_method === 'usdt_trc20') {
        totalUsdt += (data.received_amount_usdt || 0);
        countUsdt++;
      } else if (data.payment_method === 'revolut_transfer') {
        countRevolut++;
      } else {
        countWire++;
      }
    });

    // 2. Obtener estadísticas de monedas
    const coinsSnapshot = await db.collection('dici_coins').get();
    let countAvailable = 0;
    let countReserved = 0;
    let countFractional = 0;
    let countPaid = 0;

    coinsSnapshot.forEach((doc) => {
      const status = doc.data().status;
      if (status === 'available') countAvailable++;
      else if (status === 'reserved' || status === 'forming_team') countReserved++;
      else if (status === 'active_fractional') countFractional++;
      else if (status === 'paid' || status === 'fully_paid') countPaid++;
    });

    // 3. Obtener el número de másters y participantes activos
    const fractionsSnapshot = await db.collection('dicicoin_fractions')
      .where('status', '==', 'active')
      .get();

    const uniqueMasters = new Set();
    const uniqueParticipants = new Set();

    fractionsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.master_user_id) {
        uniqueMasters.add(data.master_user_id);
      } else if (data.participant_user_id) {
        uniqueParticipants.add(data.participant_user_id);
      }
    });

    // 4. Obtener últimos pagos pendientes
    const pendingOrdersSnapshot = await db.collection('coin_orders')
      .where('payment_status', 'in', ['created', 'waiting_payment', 'detected', 'under_confirmation'])
      .limit(10)
      .get();

    const pendingOrders: any[] = [];
    pendingOrdersSnapshot.forEach((doc) => {
      pendingOrders.push({ id: doc.id, ...doc.data() });
    });

    return {
      success: true,
      summary: {
        totalReceivedEur: totalEur,
        totalReceivedUsdt: totalUsdt,
        coinsAvailable: countAvailable,
        coinsReserved: countReserved,
        coinsFractional: countFractional,
        coinsPaid: countPaid,
        activeMastersCount: uniqueMasters.size,
        activeParticipantsCount: uniqueParticipants.size,
        paymentMethodsCount: {
          usdt_trc20: countUsdt,
          revolut_transfer: countRevolut,
          bank_wire: countWire
        }
      },
      pendingOrders
    };
  } catch (error: any) {
    console.error('Error in adminGetFinancialSummary:', error);
    return { success: false, messageKey: 'Error al recuperar resumen financiero.' };
  }
}

/**
 * Obtiene el historial de logs de auditoría para el administrador.
 */
export async function adminGetAuditLogs(limitCount = 50) {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection('audit_logs')
      .orderBy('timestamp', 'desc')
      .limit(limitCount)
      .get();

    const logs: any[] = [];
    snapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, logs };
  } catch (error: any) {
    console.error('Error in adminGetAuditLogs:', error);
    return { success: false, messageKey: 'Error al recuperar logs de auditoría.' };
  }
}

/**
 * Filtra monedas en base a criterios avanzados (inventario maestro).
 */
export async function searchDiciCoins(filters: {
  serial?: string;
  ownerId?: string;
  continent?: string;
  status?: string;
}) {
  try {
    const db = getAdminDb();
    let queryRef: any = db.collection('dici_coins');

    if (filters.continent) {
      queryRef = queryRef.where('continent', '==', filters.continent);
    }
    if (filters.status) {
      queryRef = queryRef.where('status', '==', filters.status);
    }
    if (filters.ownerId) {
      queryRef = queryRef.where('currentOwnerId', '==', filters.ownerId);
    }

    const snapshot = await queryRef.limit(100).get();
    let coins: any[] = [];
    snapshot.forEach((doc: any) => {
      coins.push({ id: doc.id, ...doc.data() });
    });

    // Filtros manuales en memoria para campos no indexables compuestos de forma sencilla
    if (filters.serial) {
      coins = coins.filter(c => c.serial?.toLowerCase().includes(filters.serial!.toLowerCase()));
    }

    return { success: true, coins };
  } catch (error: any) {
    console.error('Error in searchDiciCoins:', error);
    return { success: false, messageKey: 'Error al buscar monedas.' };
  }
}
