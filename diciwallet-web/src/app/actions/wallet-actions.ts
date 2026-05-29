'use server';

import { getApps } from 'firebase-admin/app';
import { getAdminDb, getFieldValue, getTimestamp } from '@/lib/firebase-admin';
import { generateSaleSignature, verifySaleSignature } from '@/lib/signature';

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

  try {
    const db = getAdminDb();
    const amountDc = amountDp / DP_TO_DC_RATE;
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
    return { success: false, messageKey: 'api.server_error', errorDetails: error.message || String(error) };
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
  },
  paymentMethod: 'simulated_card' | 'revolut_transfer' | 'card_outside_eu' = 'simulated_card'
) {
  try {
    const db = getAdminDb();
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

      const isPendingPayment = paymentMethod === 'revolut_transfer' || paymentMethod === 'card_outside_eu';
      let digitalSerial = '';
      let saleSignature = '';

      if (!isPendingPayment) {
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
        digitalSerial = `DC-${block1}-${block2}-${block3}`;

        // Generar Firma Digital de Venta
        const secretKey = process.env.ENCRYPTION_KEY || 'HA7Ct8eXPu2E6+awZKoFZAd5jXO8UJJ9MIdxOq9IWvM=';
        saleSignature = generateSaleSignature(shippingInfo.country, continentCode, secretKey);
      }

      const PAID_AMOUNT = isPendingPayment ? 0 : RESERVE_AMOUNT_EUR;

      // 1. Crear documento de reserva
      const reservationId = `res_${Math.random().toString(36).substring(2, 10)}`;
      const reservationRef = db.collection('coin_reservations').doc(reservationId);
      
      transaction.set(reservationRef, {
        id: reservationId,
        userId,
        coinId,
        serial: digitalSerial,
        status: isPendingPayment ? 'pending_payment' : 'active',
        totalAmount: COIN_VALUE_EUR,
        paidAmount: PAID_AMOUNT,
        remainingAmount: COIN_VALUE_EUR - PAID_AMOUNT,
        progressPercentage: isPendingPayment ? 0 : 10,
        shippingInfo,
        saleSignature,
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
        paymentMethod: paymentMethod,
        status: isPendingPayment ? 'pending_verification' : 'completed',
        createdAt: getTimestamp().now(),
      });

      // 3. Actualizar la moneda física
      transaction.update(coinRef, {
        status: isPendingPayment ? 'pre_reserved' : 'reserved',
        currentOwnerId: userId,
        serial: digitalSerial,
        paidAmount: PAID_AMOUNT,
        shippingInfo,
        saleSignature,
        updatedAt: getTimestamp().now(),
      });

      // 4. Actualizar el saldo acumulado en la wallet del usuario
      if (!isPendingPayment) {
        transaction.update(walletRef, {
          totalPaidEur: getFieldValue().increment(RESERVE_AMOUNT_EUR),
          updatedAt: getTimestamp().now(),
        });
      }

      return { 
        success: true, 
        messageKey: isPendingPayment ? 'api.success_pre_reserve' : 'api.success_reserve', 
        reservationId, 
        serial: digitalSerial, 
        saleSignature,
        status: isPendingPayment ? 'pending_payment' : 'active'
      };
    });

    return result;
  } catch (error: any) {
    console.error('Error in reserveCoin:', error);
    return { success: false, messageKey: 'api.server_error', errorDetails: error.message || String(error) };
  }
}

/**
 * Realiza un pago parcial sobre una reserva activa.
 */
export async function payInstallment(
  userId: string, 
  reservationId: string, 
  amountEur: number,
  paymentMethod: 'simulated_installment' | 'revolut_transfer' | 'card_outside_eu' = 'simulated_installment'
) {
  if (amountEur <= 0) {
    return { success: false, messageKey: 'api.server_error' };
  }

  try {
    const db = getAdminDb();
    const isPendingPayment = paymentMethod === 'revolut_transfer' || paymentMethod === 'card_outside_eu';

    if (isPendingPayment) {
      // Si es pendiente, no alteramos la reserva directamente. Creamos un registro de pago pendiente.
      const reservationRef = db.collection('coin_reservations').doc(reservationId);
      const resDoc = await reservationRef.get();
      if (!resDoc.exists) {
        return { success: false, messageKey: 'api.server_error' };
      }
      const resData = resDoc.data();
      if (resData?.userId !== userId) {
        return { success: false, messageKey: 'api.server_error' };
      }
      if (resData?.status !== 'active' && resData?.status !== 'payment_plan') {
        return { success: false, messageKey: 'api.error_status_not_active' };
      }

      const remaining = resData.remainingAmount || 0;
      if (amountEur > remaining) {
        return { success: false, messageKey: 'api.error_installment_exceeds' };
      }

      const paymentId = `pay_${Math.random().toString(36).substring(2, 10)}`;
      const paymentRef = db.collection('payment_history').doc(paymentId);
      
      await paymentRef.set({
        id: paymentId,
        userId,
        coinId: resData.coinId,
        reservationId,
        amount: amountEur,
        paymentMethod: paymentMethod,
        status: 'pending_verification',
        createdAt: getTimestamp().now(),
      });

      return { success: true, messageKey: 'api.success_installment_pending' };
    }

    const result = await db.runTransaction(async (transaction) => {
      const reservationRef = db.collection('coin_reservations').doc(reservationId);
      const reservationDoc = await transaction.get(reservationRef);

      if (!reservationDoc.exists) {
        return { success: false, messageKey: 'api.server_error' };
      }

      const resData = reservationDoc.data();
      if (resData?.status !== 'active' && resData?.status !== 'payment_plan') {
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
    return { success: false, messageKey: 'api.server_error', errorDetails: error.message || String(error) };
  }
}

/**
 * Publica una reserva en el marketplace interno para transferir la participación.
 */
export async function listParticipationInMarketplace(userId: string, reservationId: string, askingPrice: number) {
  try {
    const db = getAdminDb();
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
    return { success: false, messageKey: 'api.server_error', errorDetails: error.message || String(error) };
  }
}

/**
 * Solicita comprar una participación listada en el Marketplace.
 * Esto la pasa a estado 'pending_approval' y registra al comprador.
 * Requiere aprobación del administrador para transferirse formalmente.
 */
export async function buyParticipation(buyerId: string, transferId: string) {
  try {
    const db = getAdminDb();
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
    return { success: false, messageKey: 'api.server_error', errorDetails: error.message || String(error) };
  }
}

/**
 * Valida una Firma Digital de Venta y retorna los datos asociados a la reserva de la moneda.
 */
export async function validateSaleSignature(signature: string) {
  if (!signature) {
    return { success: false, messageKey: 'api.error_invalid_signature' };
  }

  const secretKey = process.env.ENCRYPTION_KEY || 'HA7Ct8eXPu2E6+awZKoFZAd5jXO8UJJ9MIdxOq9IWvM=';
  
  // 1. Validar la firma digital criptográficamente
  const isValid = verifySaleSignature(signature, secretKey);
  if (!isValid) {
    return { success: false, messageKey: 'api.error_invalid_signature' };
  }

  try {
    const db = getAdminDb();
    // 2. Buscar en Firestore si existe alguna reserva con esta firma
    const snapshot = await db.collection('coin_reservations')
      .where('saleSignature', '==', signature.trim())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { success: false, messageKey: 'api.error_reservation_not_found' };
    }

    const resDoc = snapshot.docs[0];
    const resData = resDoc.data();

    // Obtener los datos públicos del propietario (iniciales)
    let ownerInitials = 'U. D.';
    try {
      const profileDoc = await db.collection('private_profiles').doc(resData.userId).get();
      if (profileDoc.exists) {
        const pData = profileDoc.data();
        const first = pData?.firstName?.trim().charAt(0).toUpperCase() || 'U';
        const last = pData?.lastName?.trim().charAt(0).toUpperCase() || 'D';
        ownerInitials = `${first}. ${last}.`;
      }
    } catch (e) {
      console.error('Error fetching profile for verification:', e);
    }

    // Retornar los datos decodificados de la reserva
    return {
      success: true,
      data: {
        id: resDoc.id,
        coinId: resData.coinId,
        serial: resData.serial,
        status: resData.status,
        progressPercentage: resData.progressPercentage,
        paidAmount: resData.paidAmount,
        totalAmount: resData.totalAmount,
        country: resData.shippingInfo?.country || 'Desconocido',
        ownerInitials,
        createdAt: resData.createdAt?.toDate ? resData.createdAt.toDate().toISOString() : new Date().toISOString()
      }
    };
  } catch (error: any) {
    console.error('Error in validateSaleSignature:', error);
    return { success: false, messageKey: 'api.server_error', errorDetails: error.message || String(error) };
  }
}

/**
 * Diagnostic action to troubleshoot serverless environments on GCP Cloud Run
 */
export async function runDiagnostics() {
  try {
    const env = {
      PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '***' : '',
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY ? '***' : '',
      FIREBASE_SERVICE_ACCOUNT_KEY: process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? '***' : '',
      FIREBASE_CONFIG: process.env.FIREBASE_CONFIG ? '***' : '',
      GCLOUD_PROJECT: process.env.GCLOUD_PROJECT || '',
    };

    const results: any = {
      env,
      apps: getApps().map((a: any) => a?.name),
    };

    try {
      const db = getAdminDb();
      results.initSuccess = true;
      
      const snapshot = await db.collection('dici_coins').limit(1).get();
      results.firestoreSuccess = true;
      results.firestoreCoinsCount = snapshot.size;
    } catch (err: any) {
      results.initSuccess = false;
      results.error = err.message || String(err);
      results.errorStack = err.stack;
    }

    try {
      const res = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/email', {
        headers: { 'Metadata-Flavor': 'Google' },
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        results.serviceAccount = await res.text();
      } else {
        results.serviceAccount = `Metadata status: ${res.status}`;
      }
    } catch (e: any) {
      results.serviceAccountError = e.message || String(e);
    }

    return results;
  } catch (globalError: any) {
    return {
      success: false,
      error: `Global diagnostics error: ${globalError.message || String(globalError)}`,
      errorStack: globalError.stack,
    };
  }
}

/**
 * Actualiza los detalles de contacto/envío de una reserva y su moneda asociada.
 * Aplica límites y cooldowns si la llamada es hecha por el cliente.
 */
export async function updateReservationDetails(
  callerId: string,
  reservationId: string,
  updatedFields: {
    fullName: string;
    email: string;
    phone: string;
    country: string;
    city: string;
    address: string;
  }
) {
  try {
    const db = getAdminDb();
    
    // 1. Obtener perfil de quien llama para validar si es admin
    const callerRef = db.collection('private_profiles').doc(callerId);
    const callerDoc = await callerRef.get();
    
    if (!callerDoc.exists) {
      return { success: false, messageKey: 'api.error_user_not_found' };
    }
    
    const callerData = callerDoc.data();
    const isAdmin = callerData?.role === 'admin' || callerData?.role === 'superadmin';
    
    // 2. Obtener la reserva actual
    const reservationRef = db.collection('coin_reservations').doc(reservationId);
    const reservationDoc = await reservationRef.get();
    
    if (!reservationDoc.exists) {
      return { success: false, messageKey: 'api.error_reservation_not_found' };
    }
    
    const reservationData = reservationDoc.data();
    const currentShipping = reservationData?.shippingInfo || {};
    
    // 3. Validar permisos del comprador
    if (!isAdmin) {
      if (reservationData?.userId !== callerId) {
        return { success: false, messageKey: 'api.error_seller_mismatch' };
      }
      
      // El nombre del titular (fullName) NO es editable por el cliente.
      if (updatedFields.fullName !== currentShipping.fullName) {
        return { success: false, messageKey: 'api.error_name_immutable' };
      }
      
      // Validar límites y cooldowns en base al historial
      const history: any[] = reservationData?.changeHistory || [];
      const clientEdits = history.filter(h => !h.changedBy.startsWith('admin:'));
      
      const nowMs = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;
      const rollingYearMs = 365 * 24 * 60 * 60 * 1000;
      
      // A. Límite de 3 cambios en las últimas 24 horas.
      const editsInLast24h = clientEdits.filter(h => {
        const timestamp = h.timestamp?.toDate ? h.timestamp.toDate().getTime() : new Date(h.timestamp).getTime();
        return (nowMs - timestamp) < oneDayMs;
      });
      
      if (editsInLast24h.length >= 3) {
        return { success: false, messageKey: 'api.error_limit_24h' };
      }
      
      // B. Bloqueo (Cooldown) de 6 meses (180 días) desde el último cambio.
      if (clientEdits.length > 0) {
        const lastEdit = clientEdits[clientEdits.length - 1];
        const lastEditTimestamp = lastEdit.timestamp?.toDate ? lastEdit.timestamp.toDate().getTime() : new Date(lastEdit.timestamp).getTime();
        const elapsedDays = (nowMs - lastEditTimestamp) / (24 * 60 * 60 * 1000);
        
        // Determinar el primer cambio de la sesión de edición de 24 horas en curso
        let sessionStartIndex = clientEdits.length - 1;
        while (sessionStartIndex > 0) {
          const prevTime = clientEdits[sessionStartIndex - 1].timestamp?.toDate ? clientEdits[sessionStartIndex - 1].timestamp.toDate().getTime() : new Date(clientEdits[sessionStartIndex - 1].timestamp).getTime();
          const currTime = clientEdits[sessionStartIndex].timestamp?.toDate ? clientEdits[sessionStartIndex].timestamp.toDate().getTime() : new Date(clientEdits[sessionStartIndex].timestamp).getTime();
          if ((currTime - prevTime) > oneDayMs) {
            break;
          }
          sessionStartIndex--;
        }
        
        const firstEditOfSession = clientEdits[sessionStartIndex];
        const firstEditTimestamp = firstEditOfSession.timestamp?.toDate ? firstEditOfSession.timestamp.toDate().getTime() : new Date(firstEditOfSession.timestamp).getTime();
        
        if ((nowMs - firstEditTimestamp) >= oneDayMs && elapsedDays < 180) {
          return { success: false, messageKey: 'api.error_cooldown_active' };
        }
      }
      
      // C. Límite de 2 veces al año
      let sessionsCount = 0;
      let lastSessionTime = 0;
      for (const edit of clientEdits) {
        const editTime = edit.timestamp?.toDate ? edit.timestamp.toDate().getTime() : new Date(edit.timestamp).getTime();
        if (nowMs - editTime < rollingYearMs) {
          if (editTime - lastSessionTime > oneDayMs) {
            sessionsCount++;
            lastSessionTime = editTime;
          }
        }
      }
      
      if (sessionsCount >= 2) {
        const lastEdit = clientEdits[clientEdits.length - 1];
        const lastEditTimestamp = lastEdit.timestamp?.toDate ? lastEdit.timestamp.toDate().getTime() : new Date(lastEdit.timestamp).getTime();
        if ((nowMs - lastEditTimestamp) >= oneDayMs) {
          return { success: false, messageKey: 'api.error_yearly_limit' };
        }
      }
    }
    
    // 4. Ejecutar la actualización en una transacción
    const coinId = reservationData?.coinId;
    const result = await db.runTransaction(async (transaction) => {
      const resRef = db.collection('coin_reservations').doc(reservationId);
      const coinRef = db.collection('dici_coins').doc(coinId);
      
      const resSnap = await transaction.get(resRef);
      const coinSnap = await transaction.get(coinRef);
      
      if (!resSnap.exists || !coinSnap.exists) {
        throw new Error('La reserva o la moneda no existe.');
      }
      
      const prevShipping = resSnap.data()?.shippingInfo || {};
      const newFullName = isAdmin ? updatedFields.fullName : prevShipping.fullName;
      
      const newShipping = {
        fullName: newFullName,
        email: updatedFields.email,
        phone: updatedFields.phone,
        country: updatedFields.country,
        city: updatedFields.city,
        address: updatedFields.address,
      };
      
      let finalSignature = resSnap.data()?.saleSignature || '';
      if (prevShipping.country !== updatedFields.country) {
        const continentCode = coinId.substring(0, 2).toUpperCase();
        const secretKey = process.env.ENCRYPTION_KEY || 'HA7Ct8eXPu2E6+awZKoFZAd5jXO8UJJ9MIdxOq9IWvM=';
        finalSignature = generateSaleSignature(updatedFields.country, continentCode, secretKey);
      }
      
      const newLog = {
        timestamp: getTimestamp().now(),
        changedBy: isAdmin ? `admin:${callerId}` : 'client',
        previousValues: {
          fullName: prevShipping.fullName || '',
          email: prevShipping.email || '',
          phone: prevShipping.phone || '',
          country: prevShipping.country || '',
          city: prevShipping.city || '',
          address: prevShipping.address || '',
        },
        newValues: {
          fullName: newFullName,
          email: updatedFields.email,
          phone: updatedFields.phone,
          country: updatedFields.country,
          city: updatedFields.city,
          address: updatedFields.address,
        }
      };
      
      transaction.update(resRef, {
        shippingInfo: newShipping,
        saleSignature: finalSignature,
        changeHistory: getFieldValue().arrayUnion(newLog),
        updatedAt: getTimestamp().now()
      });
      
      transaction.update(coinRef, {
        shippingInfo: newShipping,
        saleSignature: finalSignature,
        updatedAt: getTimestamp().now()
      });
      
      return { success: true };
    });
    
    return result;
  } catch (error: any) {
    console.error('Error in updateReservationDetails:', error);
    return { success: false, messageKey: 'api.server_error', errorDetails: error.message || String(error) };
  }
}

/**
 * Permite a usuarios con rol 'team_leader', 'team_office', 'admin' o 'superadmin' 
 * transferir puntos DP de su cuenta a otro usuario a través de su ID de Dicilo (uniqueCode).
 */
export async function transferDpPoints(senderUid: string, targetDiciloId: string, amountDp: number) {
  if (amountDp <= 0) {
    return { success: false, messageKey: 'api.validation_invalid_amount' };
  }

  try {
    const db = getAdminDb();
    
    // 1. Obtener perfil de quien envía
    const senderProfileRef = db.collection('private_profiles').doc(senderUid);
    const senderProfileDoc = await senderProfileRef.get();
    if (!senderProfileDoc.exists) {
      return { success: false, messageKey: 'api.error_sender_not_found' };
    }
    
    const senderProfile = senderProfileDoc.data();
    if (!senderProfile) {
      return { success: false, messageKey: 'api.error_sender_not_found' };
    }
    const senderRole = (senderProfile?.role || 'user').toLowerCase();
    
    const allowedRoles = ['team_leader', 'team_office', 'admin', 'superadmin'];
    if (!allowedRoles.includes(senderRole)) {
      return { success: false, messageKey: 'api.error_not_authorized' };
    }

    if (senderProfile?.uniqueCode === targetDiciloId) {
      return { success: false, messageKey: 'api.error_self_transfer' };
    }

    // 2. Buscar al destinatario por su ID de Dicilo (uniqueCode)
    const recipientQuery = await db.collection('private_profiles')
      .where('uniqueCode', '==', targetDiciloId.trim())
      .limit(1)
      .get();

    if (recipientQuery.empty) {
      return { success: false, messageKey: 'api.error_recipient_not_found' };
    }

    const recipientDoc = recipientQuery.docs[0];
    const recipientUid = recipientDoc.id;
    const recipientData = recipientDoc.data();

    // 3. Ejecutar la transferencia en una transacción de Firestore
    const result = await db.runTransaction(async (transaction) => {
      const senderWalletRef = db.collection('wallets').doc(senderUid);
      const recipientWalletRef = db.collection('wallets').doc(recipientUid);

      const senderWalletDoc = await transaction.get(senderWalletRef);
      const recipientWalletDoc = await transaction.get(recipientWalletRef);

      if (!senderWalletDoc.exists) {
        return { success: false, messageKey: 'api.error_sender_wallet_not_found' };
      }

      const senderBalance = senderWalletDoc.data()?.balance || 0;
      if (senderBalance < amountDp) {
        return { success: false, messageKey: 'api.validation_insufficient' };
      }

      // Restar DP de la wallet del remitente
      transaction.update(senderWalletRef, {
        balance: getFieldValue().increment(-amountDp),
        updatedAt: getTimestamp().now(),
      });

      // Sumar DP a la wallet del destinatario (upsert en caso de que no exista wallet aún)
      if (recipientWalletDoc.exists) {
        transaction.update(recipientWalletRef, {
          balance: getFieldValue().increment(amountDp),
          totalEarned: getFieldValue().increment(amountDp),
          updatedAt: getTimestamp().now(),
        });
      } else {
        transaction.set(recipientWalletRef, {
          balance: amountDp,
          balanceDC: 0,
          totalPaidEur: 0,
          totalEarned: amountDp,
          createdAt: getTimestamp().now(),
          updatedAt: getTimestamp().now(),
        });
      }

      // Registrar transacciones en el historial
      const trxSenderRef = db.collection('wallet_transactions').doc();
      transaction.set(trxSenderRef, {
        userId: senderUid,
        amount: -amountDp,
        currency: 'DP',
        type: 'TRANSFER_SENT',
        description: `Envío de ${amountDp} DP a ${recipientData.firstName || ''} ${recipientData.lastName || ''} (${targetDiciloId.trim()})`,
        recipientId: recipientUid,
        timestamp: getTimestamp().now(),
      });

      const trxRecipientRef = db.collection('wallet_transactions').doc();
      transaction.set(trxRecipientRef, {
        userId: recipientUid,
        amount: amountDp,
        currency: 'DP',
        type: 'TRANSFER_RECEIVED',
        description: `Recibido ${amountDp} DP de ${senderProfile.firstName || ''} ${senderProfile.lastName || ''} (${senderProfile.uniqueCode || ''})`,
        senderId: senderUid,
        timestamp: getTimestamp().now(),
      });

      return { success: true, messageKey: 'api.transfer_success' };
    });

    return result;
  } catch (error: any) {
    console.error('Error in transferDpPoints:', error);
    return { success: false, messageKey: 'api.server_error', errorDetails: error.message || String(error) };
  }
}

