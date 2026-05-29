'use server';

import { getAdminDb, getFieldValue, getTimestamp } from '@/lib/firebase-admin';
import { generateSaleSignature } from '@/lib/signature';

/**
 * Registra una nueva moneda física en el catálogo (dici_coins).
 */
export async function createPhysicalCoin(
  coinId: string,
  continent: string,
  number: number
) {
  try {
    const db = getAdminDb();
    const coinRef = db.collection('dici_coins').doc(coinId);
    const coinDoc = await coinRef.get();

    if (coinDoc.exists) {
      return { success: false, messageKey: 'api.admin.error_coin_exists' };
    }

    await coinRef.set({
      id: coinId,
      serial: '',
      number,
      continent,
      status: 'available',
      valueEur: 5000,
      reserveAmount: 500, // 10%
      paidAmount: 0,
      currentOwnerId: null,
      createdAt: getTimestamp().now(),
      updatedAt: getTimestamp().now(),
    });

    return { success: true, messageKey: 'api.admin.success_register_coin' };
  } catch (error: any) {
    console.error('Error in createPhysicalCoin:', error);
    return { success: false, messageKey: 'api.server_error', errorDetails: error.message || String(error) };
  }
}

/**
 * Aprueba una transferencia de participación del marketplace de forma atómica.
 */
export async function approveTransfer(transferId: string, adminUserId: string) {
  try {
    const db = getAdminDb();
    const result = await db.runTransaction(async (transaction) => {
      const transferRef = db.collection('participation_transfers').doc(transferId);
      const transferDoc = await transaction.get(transferRef);

      if (!transferDoc.exists) {
        return { success: false, messageKey: 'api.admin.error_transfer_not_found' };
      }

      const transData = transferDoc.data();
      if (transData?.status !== 'pending_approval') {
        return { success: false, messageKey: 'api.admin.error_not_pending' };
      }

      const { coinId, reservationId, sellerId, buyerId, askingPrice, paidAmountSnapshot } = transData;
      if (!buyerId) {
        return { success: false, messageKey: 'api.admin.error_no_buyer' };
      }

      const reservationRef = db.collection('coin_reservations').doc(reservationId);
      const coinRef = db.collection('dici_coins').doc(coinId);
      const sellerWalletRef = db.collection('wallets').doc(sellerId);
      const buyerWalletRef = db.collection('wallets').doc(buyerId);

      // 1. Cambiar estado de la transferencia a completada
      transaction.update(transferRef, {
        status: 'completed',
        approvedBy: adminUserId,
        updatedAt: getTimestamp().now(),
      });

      // 2. Transferir la reserva al comprador
      transaction.update(reservationRef, {
        userId: buyerId,
        updatedAt: getTimestamp().now(),
      });

      // 3. Actualizar el titular en la moneda física
      transaction.update(coinRef, {
        currentOwnerId: buyerId,
        updatedAt: getTimestamp().now(),
      });

      // 4. Ajustar los EUR acumulados pagados en las wallets
      // Al vendedor se le resta el paidAmountSnapshot que ya abonó
      transaction.update(sellerWalletRef, {
        totalPaidEur: getFieldValue().increment(-paidAmountSnapshot),
        updatedAt: getTimestamp().now(),
      });

      // Al comprador se le suma el paidAmountSnapshot que asume como aportación
      transaction.update(buyerWalletRef, {
        totalPaidEur: getFieldValue().increment(paidAmountSnapshot),
        updatedAt: getTimestamp().now(),
      });

      // Registrar transacciones de historial
      const sellerTrx = db.collection('wallet_transactions').doc();
      transaction.set(sellerTrx, {
        userId: sellerId,
        amount: -paidAmountSnapshot,
        currency: 'EUR',
        type: 'TRANSFER_RESERVATION_SENT',
        description: `Transferida reserva ${coinId} a usuario ${buyerId}. Recuperado: ${askingPrice} €`,
        timestamp: getTimestamp().now(),
      });

      const buyerTrx = db.collection('wallet_transactions').doc();
      transaction.set(buyerTrx, {
        userId: buyerId,
        amount: paidAmountSnapshot,
        currency: 'EUR',
        type: 'TRANSFER_RESERVATION_RECEIVED',
        description: `Adquirida reserva ${coinId} de usuario ${sellerId}. Asumido: ${paidAmountSnapshot} €`,
        timestamp: getTimestamp().now(),
      });

      return { success: true, messageKey: 'api.admin.success_approve' };
    });

    return result;
  } catch (error: any) {
    console.error('Error in approveTransfer:', error);
    return { success: false, messageKey: 'api.server_error', errorDetails: error.message || String(error) };
  }
}

/**
 * Rechaza una solicitud de transferencia y la vuelve a listar en el marketplace.
 */
export async function rejectTransfer(transferId: string) {
  try {
    const db = getAdminDb();
    const transferRef = db.collection('participation_transfers').doc(transferId);
    const transferDoc = await transferRef.get();

    if (!transferDoc.exists) {
      return { success: false, messageKey: 'api.admin.error_transfer_not_found' };
    }

    const transData = transferDoc.data();
    if (transData?.status !== 'pending_approval') {
      return { success: false, messageKey: 'api.admin.error_not_pending' };
    }

    // Volver a poner en 'listed' y resetear el comprador
    await transferRef.update({
      buyerId: null,
      status: 'listed',
      updatedAt: getTimestamp().now(),
    });

    return { success: true, messageKey: 'api.admin.success_reject' };
  } catch (error: any) {
    console.error('Error in rejectTransfer:', error);
    return { success: false, messageKey: 'api.server_error', errorDetails: error.message || String(error) };
  }
}

/**
 * Registra manualmente la reserva/compra de una DiciCoin física para un usuario por su email.
 */
export async function reservePhysicalCoinAsAdmin(
  coinId: string,
  buyerEmailOrId: string,
  shippingInfo: {
    fullName: string;
    phone: string;
    country: string;
    city: string;
    address: string;
  },
  payWithDp: boolean = false,
  openCredit: boolean = false
) {
  try {
    const db = getAdminDb();
    let userId = '';
    let profileData: any = null;
    let buyerEmailResolved = '';

    const isEmail = buyerEmailOrId.includes('@');
    if (isEmail) {
      // 1. Buscar al usuario comprador por email en private_profiles
      const userSnapshot = await db
        .collection('private_profiles')
        .where('email', '==', buyerEmailOrId.trim().toLowerCase())
        .limit(1)
        .get();

      if (userSnapshot.empty) {
        return { success: false, messageKey: 'admin.error_user_not_found' };
      }
      const userDoc = userSnapshot.docs[0];
      userId = userDoc.id;
      profileData = userDoc.data();
      buyerEmailResolved = profileData?.email || buyerEmailOrId.trim().toLowerCase();
    } else {
      // 1. Buscar por ID directo
      const userDoc = await db.collection('private_profiles').doc(buyerEmailOrId.trim()).get();
      if (!userDoc.exists) {
        return { success: false, messageKey: 'admin.error_user_not_found' };
      }
      userId = userDoc.id;
      profileData = userDoc.data();
      buyerEmailResolved = profileData?.email || '';
    }

    const result = await db.runTransaction(async (transaction) => {
      const coinRef = db.collection('dici_coins').doc(coinId);
      const coinDoc = await transaction.get(coinRef);

      if (!coinDoc.exists) {
        return { success: false, messageKey: 'api.error_coin_not_found' };
      }

      const coinData = coinDoc.data();
      if (coinData?.status !== 'available') {
        return { success: false, messageKey: 'admin.error_coin_already_reserved' };
      }

      const walletRef = db.collection('wallets').doc(userId);
      const walletDoc = await transaction.get(walletRef);

      // Si pide pagar con DP, validar balance
      if (payWithDp && !openCredit) {
        if (!walletDoc.exists) {
          return { success: false, messageKey: 'api.validation_insufficient' };
        }
        const currentDpBalance = walletDoc.data()?.balance || 0;
        if (currentDpBalance < 5000) {
          return { success: false, messageKey: 'api.validation_insufficient' };
        }
      }

      // Generar serial digital
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
      const digitalSerial = `DC-${block1}-${block2}-${block3}`;

      // Generar Firma Digital de Venta
      const secretKey = process.env.ENCRYPTION_KEY || 'HA7Ct8eXPu2E6+awZKoFZAd5jXO8UJJ9MIdxOq9IWvM=';
      const saleSignature = generateSaleSignature(shippingInfo.country, continentCode, secretKey);

      const COIN_VALUE_EUR = 5000;
      const RESERVE_AMOUNT_EUR = openCredit ? 0 : 500;

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
        progressPercentage: openCredit ? 0 : 10,
        shippingInfo: {
          ...shippingInfo,
          email: buyerEmailResolved,
        },
        saleSignature,
        createdAt: getTimestamp().now(),
        updatedAt: getTimestamp().now(),
      });

      // 2. Registrar el pago inicial en el historial
      const paymentId = `pay_${Math.random().toString(36).substring(2, 10)}`;
      const paymentRef = db.collection('payment_history').doc(paymentId);
      
      transaction.set(paymentRef, {
        id: paymentId,
        userId,
        coinId,
        reservationId,
        amount: RESERVE_AMOUNT_EUR,
        paymentMethod: openCredit ? 'open_credit_admin' : (payWithDp ? 'dicipoints_reserve' : 'admin_cash_wire'),
        status: 'completed',
        createdAt: getTimestamp().now(),
      });

      // 3. Actualizar la moneda física
      transaction.update(coinRef, {
        status: 'reserved',
        currentOwnerId: userId,
        serial: digitalSerial,
        paidAmount: RESERVE_AMOUNT_EUR,
        shippingInfo: {
          ...shippingInfo,
          email: buyerEmailResolved,
        },
        saleSignature,
        updatedAt: getTimestamp().now(),
      });

      // 4. Actualizar wallet
      if (walletDoc.exists) {
        const walletUpdates: any = {
          totalPaidEur: getFieldValue().increment(RESERVE_AMOUNT_EUR),
          updatedAt: getTimestamp().now(),
        };
        if (payWithDp && !openCredit) {
          walletUpdates.balance = getFieldValue().increment(-5000);
        }
        transaction.update(walletRef, walletUpdates);
      } else {
        const initialWallet: any = {
          id: userId,
          totalPaidEur: RESERVE_AMOUNT_EUR,
          createdAt: getTimestamp().now(),
          updatedAt: getTimestamp().now(),
        };
        if (payWithDp && !openCredit) {
          initialWallet.balance = -5000;
        }
        transaction.set(walletRef, initialWallet);
      }

      // 5. Registrar transacciones en historial
      const walletTrx = db.collection('wallet_transactions').doc();
      transaction.set(walletTrx, {
        userId,
        amount: RESERVE_AMOUNT_EUR,
        currency: 'EUR',
        type: openCredit ? 'RESERVATION_OPEN_CREDIT_ADMIN' : 'RESERVATION_MANUAL_ADMIN',
        description: openCredit 
          ? `Reserva con crédito abierto registrada por administrador para la moneda ${coinId}. Deuda pendiente de 5000 €.`
          : `Reserva manual registrada por administrador para la moneda ${coinId}.`,
        timestamp: getTimestamp().now(),
      });

      if (payWithDp && !openCredit) {
        const walletTrxDp = db.collection('wallet_transactions').doc();
        transaction.set(walletTrxDp, {
          userId,
          amount: -5000,
          currency: 'DP',
          type: 'RESERVATION_DP_DEDUCTION',
          description: `Deducción de 5000 DP para reserva de moneda ${coinId}.`,
          timestamp: getTimestamp().now(),
        });
      }

      return { success: true, messageKey: 'admin.success_reserve' };
    });

    return result;
  } catch (error: any) {
    console.error('Error in reservePhysicalCoinAsAdmin:', error);
    return { success: false, messageKey: 'api.server_error', errorDetails: error.message || String(error) };
  }
}

/**
 * Aprueba una pre-reserva de Revolut pendiente de pago.
 * Genera el certificado digital, carga los 500 EUR y activa la reserva.
 */
export async function approveRevolutPayment(adminUserId: string, reservationId: string) {
  try {
    const db = getAdminDb();
    const reservationRef = db.collection('coin_reservations').doc(reservationId);
    const reservationDoc = await reservationRef.get();

    if (!reservationDoc.exists) {
      return { success: false, messageKey: 'api.error_reservation_not_found' };
    }

    const resData = reservationDoc.data();
    if (resData?.status !== 'pending_payment') {
      return { success: false, messageKey: 'api.admin.error_not_pending' };
    }

    const { userId, coinId, shippingInfo } = resData;

    // Buscar perfil privado del usuario para sus iniciales
    const profileDoc = await db.collection('private_profiles').doc(userId).get();
    const profileData = profileDoc.exists ? profileDoc.data() : null;
    const firstName = profileData?.firstName || 'U';
    const lastName = profileData?.lastName || 'D';
    const nameInit = firstName.trim().charAt(0).toUpperCase() || 'X';
    const lastNameInit = lastName.trim().charAt(0).toUpperCase() || 'X';
    const continentCode = coinId.substring(0, 2).toUpperCase();

    // Generar serial digital
    const block1 = `${continentCode}${nameInit}${lastNameInit}`;
    const block2 = Math.floor(1000 + Math.random() * 9000).toString();
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).substring(2);
    const block3 = `${month}${year}`;
    const digitalSerial = `DC-${block1}-${block2}-${block3}`;

    // Generar firma digital
    const secretKey = process.env.ENCRYPTION_KEY || 'HA7Ct8eXPu2E6+awZKoFZAd5jXO8UJJ9MIdxOq9IWvM=';
    const saleSignature = generateSaleSignature(shippingInfo?.country || 'España', continentCode, secretKey);

    const RESERVE_AMOUNT_EUR = 500;

    const result = await db.runTransaction(async (transaction) => {
      const coinRef = db.collection('dici_coins').doc(coinId);
      const walletRef = db.collection('wallets').doc(userId);

      // 1. Activar la reserva
      transaction.update(reservationRef, {
        status: 'active',
        paidAmount: RESERVE_AMOUNT_EUR,
        remainingAmount: 4500,
        progressPercentage: 10,
        serial: digitalSerial,
        saleSignature: saleSignature,
        updatedAt: getTimestamp().now(),
      });

      // 2. Actualizar la moneda física
      transaction.update(coinRef, {
        status: 'reserved',
        currentOwnerId: userId,
        serial: digitalSerial,
        paidAmount: RESERVE_AMOUNT_EUR,
        saleSignature: saleSignature,
        updatedAt: getTimestamp().now(),
      });

      // 3. Buscar y actualizar el registro de pago en el historial a 'completed'
      const paymentsQuery = await db.collection('payment_history')
        .where('reservationId', '==', reservationId)
        .where('status', '==', 'pending_verification')
        .get();

      let originalPaymentMethod = 'revolut_transfer';
      if (!paymentsQuery.empty) {
        const paymentDoc = paymentsQuery.docs[0];
        originalPaymentMethod = paymentDoc.data()?.paymentMethod || 'revolut_transfer';
        transaction.update(paymentDoc.ref, {
          status: 'completed',
          amount: RESERVE_AMOUNT_EUR,
          approvedBy: adminUserId,
          createdAt: getTimestamp().now()
        });
      } else {
        // Si no existiera por algún motivo, se crea uno nuevo
        const paymentId = `pay_${Math.random().toString(36).substring(2, 10)}`;
        const paymentRef = db.collection('payment_history').doc(paymentId);
        transaction.set(paymentRef, {
          id: paymentId,
          userId,
          coinId,
          reservationId,
          amount: RESERVE_AMOUNT_EUR,
          paymentMethod: originalPaymentMethod,
          status: 'completed',
          approvedBy: adminUserId,
          createdAt: getTimestamp().now(),
        });
      }

      // 4. Actualizar wallet
      transaction.update(walletRef, {
        totalPaidEur: getFieldValue().increment(RESERVE_AMOUNT_EUR),
        updatedAt: getTimestamp().now(),
      });

      // 5. Registrar transacción en wallet_transactions
      const walletTrx = db.collection('wallet_transactions').doc();
      const methodText = originalPaymentMethod === 'card_outside_eu' ? 'tarjeta de crédito/débito' : 'transferencia Revolut';
      transaction.set(walletTrx, {
        userId,
        amount: RESERVE_AMOUNT_EUR,
        currency: 'EUR',
        type: originalPaymentMethod === 'card_outside_eu' ? 'RESERVATION_CARD_APPROVED' : 'RESERVATION_REVOLUT_APPROVED',
        description: `Pre-reserva activada por administrador tras verificar pago con ${methodText} de ${RESERVE_AMOUNT_EUR} € para moneda ${coinId}.`,
        timestamp: getTimestamp().now(),
      });

      return { success: true };
    });

    return result;
  } catch (error: any) {
    console.error('Error in approveRevolutPayment:', error);
    return { success: false, messageKey: 'api.server_error', errorDetails: error.message || String(error) };
  }
}

/**
 * Cancela una pre-reserva de Revolut pendiente de pago.
 * Libera la moneda física y elimina el registro de pre-reserva.
 */
export async function cancelPreReservation(adminUserId: string, reservationId: string) {
  try {
    const db = getAdminDb();
    const reservationRef = db.collection('coin_reservations').doc(reservationId);
    const reservationDoc = await reservationRef.get();

    if (!reservationDoc.exists) {
      return { success: false, messageKey: 'api.error_reservation_not_found' };
    }

    const resData = reservationDoc.data();
    if (resData?.status !== 'pending_payment') {
      return { success: false, messageKey: 'api.admin.error_not_pending' };
    }

    const { coinId } = resData;

    const result = await db.runTransaction(async (transaction) => {
      const coinRef = db.collection('dici_coins').doc(coinId);

      // 1. Restablecer la moneda a disponible
      transaction.update(coinRef, {
        status: 'available',
        currentOwnerId: null,
        serial: '',
        paidAmount: 0,
        shippingInfo: null,
        saleSignature: '',
        updatedAt: getTimestamp().now(),
      });

      // 2. Eliminar la reserva pendiente de pago
      transaction.delete(reservationRef);

      // 3. Eliminar los registros de pago asociados que estén pendientes de verificación
      const paymentsQuery = await db.collection('payment_history')
        .where('reservationId', '==', reservationId)
        .where('status', '==', 'pending_verification')
        .get();

      for (const pDoc of paymentsQuery.docs) {
        transaction.delete(pDoc.ref);
      }

      return { success: true };
    });

    return result;
  } catch (error: any) {
    console.error('Error in cancelPreReservation:', error);
    return { success: false, messageKey: 'api.server_error', errorDetails: error.message || String(error) };
  }
}

/**
 * Aprueba una cuota de plan de pago realizada vía Revolut.
 */
export async function approveInstallmentPayment(adminUserId: string, paymentId: string) {
  try {
    const db = getAdminDb();
    const paymentRef = db.collection('payment_history').doc(paymentId);
    const paymentDoc = await paymentRef.get();

    if (!paymentDoc.exists) {
      return { success: false, messageKey: 'api.server_error' };
    }

    const pData = paymentDoc.data();
    if (pData?.status !== 'pending_verification') {
      return { success: false, messageKey: 'api.admin.error_not_pending' };
    }

    const { userId, reservationId, coinId, amount } = pData;

    const result = await db.runTransaction(async (transaction) => {
      const reservationRef = db.collection('coin_reservations').doc(reservationId);
      const coinRef = db.collection('dici_coins').doc(coinId);
      const walletRef = db.collection('wallets').doc(userId);

      const resSnap = await transaction.get(reservationRef);
      if (!resSnap.exists) {
        throw new Error('La reserva no existe.');
      }

      const resData = resSnap.data();
      const currentPaid = resData?.paidAmount || 0;
      const currentRemaining = resData?.remainingAmount || 0;

      if (amount > currentRemaining) {
        return { success: false, messageKey: 'api.error_installment_exceeds' };
      }

      const newPaidAmount = currentPaid + amount;
      const newRemaining = currentRemaining - amount;
      const newProgress = Math.min(100, (newPaidAmount / (resData?.totalAmount || 5000)) * 100);
      const isCompleted = newRemaining === 0;

      // 1. Actualizar reserva
      transaction.update(reservationRef, {
        paidAmount: newPaidAmount,
        remainingAmount: newRemaining,
        progressPercentage: newProgress,
        status: isCompleted ? 'completed' : 'active',
        updatedAt: getTimestamp().now(),
      });

      // 2. Actualizar moneda
      transaction.update(coinRef, {
        paidAmount: newPaidAmount,
        status: isCompleted ? 'fully_paid' : 'payment_plan',
        updatedAt: getTimestamp().now(),
      });

      // 3. Confirmar pago
      transaction.update(paymentRef, {
        status: 'completed',
        approvedBy: adminUserId,
        createdAt: getTimestamp().now()
      });

      // 4. Actualizar wallet
      transaction.update(walletRef, {
        totalPaidEur: getFieldValue().increment(amount),
        updatedAt: getTimestamp().now(),
      });

      // 5. Registrar transacción en wallet_transactions
      const walletTrx = db.collection('wallet_transactions').doc();
      const methodText = pData?.paymentMethod === 'card_outside_eu' ? 'tarjeta de crédito/débito' : 'Revolut';
      transaction.set(walletTrx, {
        userId,
        amount: amount,
        currency: 'EUR',
        type: pData?.paymentMethod === 'card_outside_eu' ? 'INSTALLMENT_CARD_APPROVED' : 'INSTALLMENT_REVOLUT_APPROVED',
        description: `Pago parcial con ${methodText} verificado para moneda ${coinId}. Importe: ${amount} €`,
        timestamp: getTimestamp().now(),
      });

      return { success: true };
    });

    return result;
  } catch (error: any) {
    console.error('Error in approveInstallmentPayment:', error);
    return { success: false, messageKey: 'api.server_error', errorDetails: error.message || String(error) };
  }
}

/**
 * Rechaza un pago de cuota realizado vía Revolut.
 */
export async function rejectInstallmentPayment(adminUserId: string, paymentId: string) {
  try {
    const db = getAdminDb();
    const paymentRef = db.collection('payment_history').doc(paymentId);
    
    await paymentRef.update({
      status: 'rejected',
      updatedAt: getTimestamp().now()
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error in rejectInstallmentPayment:', error);
    return { success: false, messageKey: 'api.server_error' };
  }
}

