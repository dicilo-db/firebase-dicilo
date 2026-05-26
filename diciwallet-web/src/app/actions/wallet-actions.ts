'use server';

import { getAdminDb, getFieldValue, getTimestamp } from '@/lib/firebase-admin';

// Reglas y Paridades
const DP_TO_DC_RATE = 10; // 10 DP = 1 DC
const COIN_VALUE_EUR = 5000;
const RESERVE_AMOUNT_EUR = 500; // 10%

/**
 * Convierte Dicipoints (DP) a DiciCoins digitales (DC).
 * Regla: 10 DP = 1 DC (1 DC = 1 EUR de uso interno)
 */
export async function convertDpToDc(userId: string, amountDp: number) {
  if (amountDp <= 0 || amountDp % DP_TO_DC_RATE !== 0) {
    return { success: false, messageKey: 'api.validation_multiple' };
  }

  const db = getAdminDb();
  const amountDc = amountDp / DP_TO_DC_RATE;

  try {
    const result = await db.runTransaction(async (transaction) => {
      const walletRef = db.collection('wallets').doc(userId);
      const walletDoc = await transaction.get(walletRef);

      if (!walletDoc.exists) {
        return { success: false, messageKey: 'api.error_no_wallet' };
      }

      const currentBalance = walletDoc.data()?.balance || 0;
      if (currentBalance < amountDp) {
        return { success: false, messageKey: 'api.validation_insufficient' };
      }

      // Restar DP e incrementar DC
      transaction.update(walletRef, {
        balance: getFieldValue().increment(-amountDp),
        balanceDC: getFieldValue().increment(amountDc),
        updatedAt: getTimestamp().now(),
      });

      // Registrar transacciones en el historial
      const trxRef = db.collection('wallet_transactions').doc();
      transaction.set(trxRef, {
        userId,
        amount: -amountDp,
        currency: 'DP',
        type: 'CONVERSION_TO_DC',
        description: `Conversión de ${amountDp} DP a ${amountDc} DC`,
        timestamp: getTimestamp().now(),
      });

      const trxRefDc = db.collection('wallet_transactions').doc();
      transaction.set(trxRefDc, {
        userId,
        amount: amountDc,
        currency: 'DC',
        type: 'CONVERSION_FROM_DP',
        description: `Recibido por conversión de ${amountDp} DP`,
        timestamp: getTimestamp().now(),
      });

      return { success: true, messageKey: 'api.conversion_success' };
    });

    return result;
  } catch (error: any) {
    console.error('Error in convertDpToDc:', error);
    return { success: false, messageKey: 'api.server_error' };
  }
}

/**
 * Reserva una DiciCoin física pagando inicialmente el 10% (500 EUR).
 */
export async function reserveCoin(
  userId: string, 
  coinId: string,
  shippingInfo: {
    fullName: string;
    email: string;
    phone: string;
    country: string;
    city: string;
    address: string;
  }
) {
  const db = getAdminDb();

  try {
    const result = await db.runTransaction(async (transaction) => {
      const coinRef = db.collection('dici_coins').doc(coinId);
      const coinDoc = await transaction.get(coinRef);

      if (!coinDoc.exists) {
        return { success: false, messageKey: 'api.error_coin_not_found' };
      }

      const coinData = coinDoc.data();
      if (coinData?.status !== 'available') {
        return { success: false, messageKey: 'api.error_coin_unavailable' };
      }

      const walletRef = db.collection('wallets').doc(userId);
      const walletDoc = await transaction.get(walletRef);

      if (!walletDoc.exists) {
        return { success: false, messageKey: 'api.error_wallet_not_found' };
      }

      // Obtener el perfil privado del usuario para las iniciales del serial digital
      const profileRef = db.collection('private_profiles').doc(userId);
      const profileDoc = await transaction.get(profileRef);
      const profileData = profileDoc.exists ? profileDoc.data() : null;
      const firstName = profileData?.firstName || 'U';
      const lastName = profileData?.lastName || 'D';

      const nameInit = firstName.trim().charAt(0).toUpperCase() || 'X';
      const lastNameInit = lastName.trim().charAt(0).toUpperCase() || 'X';

      // Prefijo del continente (primeras dos letras del ID del coin, ej: EU de EU-DC0000001)
      const continentCode = coinId.substring(0, 2).toUpperCase();

      // Formato: [Continente][Initials] -> EUNE
      const block1 = `${continentCode}${nameInit}${lastNameInit}`;

      // Número aleatorio de 4 cifras
      const block2 = Math.floor(1000 + Math.random() * 9000).toString();

      // Fecha de compra: MMYY
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).substring(2);
      const block3 = `${month}${year}`;

      // Serial digital único de reserva
      const digitalSerial = `DC-${block1}-${block2}-${block3}`;

      // 1. Crear documento de reserva
      const reservationId = `res_${Math.random().toString(36).substring(2, 10)}`;
      const reservationRef = db.collection('coin_reservations').doc(reservationId);
      
      transaction.set(reservationRef, {
        id: reservationId,
        userId,
        coinId,
        serial: digitalSerial,
        status: 'active',
        totalAmount: COIN_VALUE_EUR,
        paidAmount: RESERVE_AMOUNT_EUR,
        remainingAmount: COIN_VALUE_EUR - RESERVE_AMOUNT_EUR,
        progressPercentage: 10,
        shippingInfo,
        createdAt: getTimestamp().now(),
        updatedAt: getTimestamp().now(),
      });

      // 2. Registrar el pago inicial en el historial de pagos
      const paymentId = `pay_${Math.random().toString(36).substring(2, 10)}`;
      const paymentRef = db.collection('payment_history').doc(paymentId);
      
      transaction.set(paymentRef, {
        id: paymentId,
        userId,
        coinId,
        reservationId,
        amount: RESERVE_AMOUNT_EUR,
        paymentMethod: 'simulated_card',
        status: 'completed',
        createdAt: getTimestamp().now(),
      });

      // 3. Actualizar la moneda física
      transaction.update(coinRef, {
        status: 'reserved',
        currentOwnerId: userId,
        serial: digitalSerial,
        paidAmount: RESERVE_AMOUNT_EUR,
        shippingInfo,
        updatedAt: getTimestamp().now(),
      });

      // 4. Actualizar el saldo acumulado en la wallet del usuario
      transaction.update(walletRef, {
        totalPaidEur: getFieldValue().increment(RESERVE_AMOUNT_EUR),
        updatedAt: getTimestamp().now(),
      });

      return { success: true, messageKey: 'api.success_reserve', reservationId, serial: digitalSerial };
    });

    return result;
  } catch (error: any) {
    console.error('Error in reserveCoin:', error);
    return { success: false, messageKey: 'api.server_error' };
  }
}

/**
 * Realiza un pago parcial sobre una reserva activa.
 */
export async function payInstallment(userId: string, reservationId: string, amountEur: number) {
  if (amountEur <= 0) {
    return { success: false, messageKey: 'api.server_error' };
  }

  const db = getAdminDb();

  try {
    const result = await db.runTransaction(async (transaction) => {
      const reservationRef = db.collection('coin_reservations').doc(reservationId);
      const reservationDoc = await transaction.get(reservationRef);

      if (!reservationDoc.exists) {
        return { success: false, messageKey: 'api.server_error' };
      }

      const resData = reservationDoc.data();
      if (resData?.status !== 'active') {
        return { success: false, messageKey: 'api.error_status_not_active' };
      }

      if (resData.userId !== userId) {
        return { success: false, messageKey: 'api.server_error' };
      }

      const remaining = resData.remainingAmount || 0;
      if (amountEur > remaining) {
        return { success: false, messageKey: 'api.error_installment_exceeds' };
      }

      const coinId = resData.coinId;
      const coinRef = db.collection('dici_coins').doc(coinId);
      const walletRef = db.collection('wallets').doc(userId);

      const newPaidAmount = (resData.paidAmount || 0) + amountEur;
      const newRemaining = remaining - amountEur;
      const newProgress = Math.min(100, (newPaidAmount / resData.totalAmount) * 100);
      const isCompleted = newRemaining === 0;

      // 1. Actualizar la reserva
      transaction.update(reservationRef, {
        paidAmount: newPaidAmount,
        remainingAmount: newRemaining,
        progressPercentage: newProgress,
        status: isCompleted ? 'completed' : 'active',
        updatedAt: getTimestamp().now(),
      });

      // 2. Registrar el pago parcial
      const paymentId = `pay_${Math.random().toString(36).substring(2, 10)}`;
      const paymentRef = db.collection('payment_history').doc(paymentId);
      transaction.set(paymentRef, {
        id: paymentId,
        userId,
        coinId,
        reservationId,
        amount: amountEur,
        paymentMethod: 'simulated_installment',
        status: 'completed',
        createdAt: getTimestamp().now(),
      });

      // 3. Actualizar la moneda física
      transaction.update(coinRef, {
        paidAmount: newPaidAmount,
        status: isCompleted ? 'fully_paid' : 'payment_plan',
        updatedAt: getTimestamp().now(),
      });

      // 4. Actualizar la wallet
      transaction.update(walletRef, {
        totalPaidEur: getFieldValue().increment(amountEur),
        updatedAt: getTimestamp().now(),
      });

      return { 
        success: true, 
        messageKey: isCompleted ? 'api.success_installment_completed' : 'api.success_installment' 
      };
    });

    return result;
  } catch (error: any) {
    console.error('Error in payInstallment:', error);
    return { success: false, messageKey: 'api.server_error' };
  }
}

/**
 * Publica una reserva en el marketplace interno para transferir la participación.
 */
export async function listParticipationInMarketplace(userId: string, reservationId: string, askingPrice: number) {
  const db = getAdminDb();

  try {
    const result = await db.runTransaction(async (transaction) => {
      const reservationRef = db.collection('coin_reservations').doc(reservationId);
      const reservationDoc = await transaction.get(reservationRef);

      if (!reservationDoc.exists) {
        return { success: false, messageKey: 'api.server_error' };
      }

      const resData = reservationDoc.data();
      if (resData?.userId !== userId) {
        return { success: false, messageKey: 'api.error_seller_mismatch' };
      }

      if (resData?.status !== 'active') {
        return { success: false, messageKey: 'api.error_status_not_active' };
      }

      if (askingPrice <= 0 || askingPrice > (resData.paidAmount || 0)) {
        return { success: false, messageKey: 'api.error_price_invalid' };
      }

      // Crear publicación de transferencia
      const transferId = `trans_${Math.random().toString(36).substring(2, 10)}`;
      const transferRef = db.collection('participation_transfers').doc(transferId);

      transaction.set(transferRef, {
        id: transferId,
        coinId: resData.coinId,
        reservationId,
        sellerId: userId,
        buyerId: null,
        askingPrice,
        paidAmountSnapshot: resData.paidAmount,
        status: 'listed',
        createdAt: getTimestamp().now(),
        updatedAt: getTimestamp().now(),
      });

      return { success: true, messageKey: 'api.success_listed' };
    });

    return result;
  } catch (error: any) {
    console.error('Error in listParticipation:', error);
    return { success: false, messageKey: 'api.server_error' };
  }
}

/**
 * Solicita comprar una participación listada en el Marketplace.
 * Esto la pasa a estado 'pending_approval' y registra al comprador.
 * Requiere aprobación del administrador para transferirse formalmente.
 */
export async function buyParticipation(buyerId: string, transferId: string) {
  const db = getAdminDb();

  try {
    const result = await db.runTransaction(async (transaction) => {
      const transferRef = db.collection('participation_transfers').doc(transferId);
      const transferDoc = await transaction.get(transferRef);

      if (!transferDoc.exists) {
        return { success: false, messageKey: 'api.server_error' };
      }

      const transData = transferDoc.data();
      if (transData?.status !== 'listed') {
        return { success: false, messageKey: 'api.error_not_listed' };
      }

      if (transData?.sellerId === buyerId) {
        return { success: false, messageKey: 'api.error_self_buy' };
      }

      // Pasar a aprobación pendiente y registrar comprador
      transaction.update(transferRef, {
        buyerId,
        status: 'pending_approval',
        updatedAt: getTimestamp().now(),
      });

      return { 
        success: true, 
        messageKey: 'api.success_requested' 
      };
    });

    return result;
  } catch (error: any) {
    console.error('Error in buyParticipation:', error);
    return { success: false, messageKey: 'api.server_error' };
  }
}

