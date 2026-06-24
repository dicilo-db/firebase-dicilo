'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { reserveCoin, payInstallment, listParticipationInMarketplace, runDiagnostics, updateReservationDetails } from '@/app/actions/wallet-actions';
import { createCoinOrder, verifyCryptoPayment } from '@/app/actions/dicicoin-actions';
import { Coins, Award, Award as RarityIcon, AlertTriangle, ShieldCheck, HelpCircle, X, Check, Eye, MapPin, Phone, Mail, User, Clock, Copy, ShieldAlert } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Enlace de pago para tarjeta de crédito/débito o fuera de la Comunidad Europea (Stripe / Revolut Pro, etc.)
// Reemplazar con el enlace de pago del cliente (500 € para la reserva de la moneda DICICOIN)
const PAYMENT_LINK_OUTSIDE_EU = "https://checkout.revolut.com/pay/241ca4f1-b832-41a9-bad1-7dfe84bc3149";

interface DiciCoin {
  id: string;
  serial: string;
  number: number;
  continent: string;
  status: string;
  valueEur: number;
  reserveAmount: number;
  paidAmount: number;
  currentOwnerId: string | null;
}

interface Reservation {
  id: string;
  coinId: string;
  serial?: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  saleSignature?: string;
  shippingInfo?: {
    fullName: string;
    email: string;
    phone: string;
    country: string;
    city: string;
    address: string;
  };
}

interface PaymentRecord {
  id: string;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: any;
  coinId: string;
  reservationId: string;
}

export default function ReservationsPage() {
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  
  const [selectedContinent, setSelectedContinent] = useState('EU');
  const [continentCoins, setContinentCoins] = useState<{[key: number]: DiciCoin}>({});
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  
  const [loadingCoins, setLoadingCoins] = useState(true);
  const [loadingRes, setLoadingRes] = useState(true);
  
  // Modals and action states
  const [selectedCoin, setSelectedCoin] = useState<DiciCoin | null>(null);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalChecked, setLegalChecked] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'simulated_card' | 'revolut_transfer' | 'card_outside_eu' | 'usdt_trc20'>('simulated_card');
  const [reserveLoading, setReserveLoading] = useState(false);
  
  // DiciCoin purchase mode and crypto states
  const [purchaseMode, setPurchaseMode] = useState<'reserve' | 'full' | 'fractional'>('reserve');
  const [fractionPercentage, setFractionPercentage] = useState(51);
  const [cryptoOrder, setCryptoOrder] = useState<any>(null);
  const [txHashInput, setTxHashInput] = useState('');
  const [cryptoVerifyLoading, setCryptoVerifyLoading] = useState(false);
  const [cryptoVerifyMessage, setCryptoVerifyMessage] = useState({ text: '', type: '' });
  const [fractions, setFractions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  
  // Shipping info form state
  const [instPaymentMethod, setInstPaymentMethod] = useState<{[key: string]: 'simulated_installment' | 'revolut_transfer' | 'card_outside_eu'}>({});
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    address: ''
  });
  
  const [activeTab, setActiveTab] = useState<'my_plans' | 'catalog' | 'faq'>('my_plans');
  const [paymentAmount, setPaymentAmount] = useState<{[key: string]: string}>({});
  const [paymentLoading, setPaymentLoading] = useState<{[key: string]: boolean}>({});
  const [diagResults, setDiagResults] = useState<any>(null);
  const [diagLoading, setDiagLoading] = useState(false);

  const runServerDiagnostics = async () => {
    setDiagLoading(true);
    setDiagResults(null);
    try {
      const res = await runDiagnostics();
      setDiagResults(res);
    } catch (e: any) {
      setDiagResults({ error: e.message || String(e) });
    } finally {
      setDiagLoading(false);
    }
  };
  
  const [sellCoin, setSellCoin] = useState<Reservation | null>(null);
  const [sellPrice, setSellPrice] = useState('');
  const [sellLoading, setSellLoading] = useState(false);

  const [certCoinId, setCertCoinId] = useState<string | null>(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isMobile, setIsMobile] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  // States for updating shipping/contact details
  const [editingRes, setEditingRes] = useState<Reservation | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    address: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState(false);

  const checkClientLimits = (res: Reservation) => {
    const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
    if (isAdmin) return { allowed: true };

    const history: any[] = (res as any).changeHistory || [];
    const clientEdits = history.filter(h => !h.changedBy.startsWith('admin:'));
    
    const nowMs = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const rollingYearMs = 365 * 24 * 60 * 60 * 1000;
    
    // 1. Límite de 3 cambios en las últimas 24 horas.
    const editsInLast24h = clientEdits.filter(h => {
      const timestamp = h.timestamp?.toDate ? h.timestamp.toDate().getTime() : new Date(h.timestamp).getTime();
      return (nowMs - timestamp) < oneDayMs;
    });
    
    if (editsInLast24h.length >= 3) {
      return { 
        allowed: false, 
        messageKey: 'api.error_limit_24h', 
        reason: t('api.error_limit_24h') || 'Límite diario alcanzado (máximo 3 cambios en 24 horas). Bloqueo de 6 meses activo.' 
      };
    }
    
    // 2. Bloqueo (Cooldown) de 6 meses (180 días) desde el último cambio si se superó la sesión inicial.
    if (clientEdits.length > 0) {
      const lastEdit = clientEdits[clientEdits.length - 1];
      const lastEditTimestamp = lastEdit.timestamp?.toDate ? lastEdit.timestamp.toDate().getTime() : new Date(lastEdit.timestamp).getTime();
      const elapsedDays = (nowMs - lastEditTimestamp) / (24 * 60 * 60 * 1000);
      
      // Encontrar el inicio de la sesión actual de 24 horas
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
        return { 
          allowed: false, 
          messageKey: 'api.error_cooldown_active', 
          reason: t('api.error_cooldown_active') || 'Bloqueo activo de 6 meses. Debes esperar 180 días desde tu última edición.' 
        };
      }
    }
    
    // 3. Límite de 2 veces al año (sesiones independientes)
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
        return { 
          allowed: false, 
          messageKey: 'api.error_yearly_limit', 
          reason: t('api.error_yearly_limit') || 'Límite anual de 2 actualizaciones alcanzado.' 
        };
      }
    }
    
    return { allowed: true };
  };

  const handleEditShippingClick = (res: Reservation) => {
    setEditingRes(res);
    setEditForm({
      fullName: res.shippingInfo?.fullName || '',
      email: res.shippingInfo?.email || '',
      phone: res.shippingInfo?.phone || '',
      country: res.shippingInfo?.country || '',
      city: res.shippingInfo?.city || '',
      address: res.shippingInfo?.address || ''
    });
    setEditError('');
    setEditSuccess(false);
  };

  const handleSaveEdit = async () => {
    if (!user || !editingRes) return;
    
    // Validar campos requeridos
    if (
      !editForm.email.trim() ||
      !editForm.phone.trim() ||
      !editForm.country.trim() ||
      !editForm.city.trim() ||
      !editForm.address.trim()
    ) {
      setEditError(t('res.error_invalid_shipping'));
      return;
    }
    
    setEditLoading(true);
    setEditError('');
    setEditSuccess(false);
    
    try {
      const res = await updateReservationDetails(user.uid, editingRes.id, editForm);
      if (res.success) {
        setEditSuccess(true);
        setTimeout(() => {
          setEditingRes(null);
        }, 1500);
      } else {
        setEditError(t((res as any).messageKey || 'api.server_error'));
      }
    } catch (err: any) {
      console.error(err);
      setEditError(err.message || 'Error al guardar los cambios');
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent));
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  const downloadCertificatePdf = async () => {
    const element = document.getElementById('printable-certificate');
    if (!element) return;
    
    setPdfDownloading(true);
    try {
      const closeBtn = document.getElementById('close-cert-modal-btn');
      const actionBtns = document.getElementById('print-actions-area');
      
      if (closeBtn) closeBtn.style.display = 'none';
      if (actionBtns) actionBtns.style.display = 'none';
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0C0B0A',
        logging: false
      } as any);
      
      if (closeBtn) closeBtn.style.display = 'block';
      if (actionBtns) actionBtns.style.display = 'block';
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`certificado-${certCoinId}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error al generar el PDF. Por favor, inténtelo de nuevo.');
    } finally {
      setPdfDownloading(false);
    }
  };

  // Autocompletar datos de perfil cuando estén disponibles
  useEffect(() => {
    if (profile) {
      setShippingInfo(prev => ({
        ...prev,
        fullName: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
        email: profile.email || user?.email || ''
      }));
    }
  }, [profile, user]);

  // 1. Escuchar catálogo de monedas para el continente seleccionado
  useEffect(() => {
    setLoadingCoins(true);
    const q = query(
      collection(db, 'dici_coins'), 
      where('continent', '==', selectedContinent)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map: {[key: number]: DiciCoin} = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        map[data.number] = { id: doc.id, ...data } as DiciCoin;
      });
      setContinentCoins(map);
      setLoadingCoins(false);
    }, (err) => {
      console.error("Error loading coins:", err);
      setLoadingCoins(false);
    });
    return () => unsubscribe();
  }, [selectedContinent]);

  // 2. Escuchar todas las reservas del usuario
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'coin_reservations'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Reservation[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Reservation);
      });
      setReservations(list);
      setLoadingRes(false);
    }, (err) => {
      console.error("Error loading reservations:", err);
      setLoadingRes(false);
    });
    return () => unsubscribe();
  }, [user]);

  // 3. Escuchar historial de pagos del usuario
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'payment_history'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: PaymentRecord[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as PaymentRecord);
      });
      list.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return timeB - timeA;
      });
      setPayments(list);
    });
    return () => unsubscribe();
  }, [user]);

  // Escuchar fracciones del usuario
  useEffect(() => {
    if (!user) return;
    const q1 = query(collection(db, 'dicicoin_fractions'), where('master_user_id', '==', user.uid));
    const q2 = query(collection(db, 'dicicoin_fractions'), where('participant_user_id', '==', user.uid));
    
    const unsub1 = onSnapshot(q1, (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setFractions(prev => {
        const others = prev.filter(f => f.participant_user_id === user.uid);
        const merged = [...others, ...list];
        const unique = Array.from(new Map(merged.map(item => [item.fraction_id || item.id, item])).values());
        return unique;
      });
    });

    const unsub2 = onSnapshot(q2, (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setFractions(prev => {
        const others = prev.filter(f => f.master_user_id === user.uid);
        const merged = [...others, ...list];
        const unique = Array.from(new Map(merged.map(item => [item.fraction_id || item.id, item])).values());
        return unique;
      });
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [user]);

  // Escuchar órdenes cripto o fiat pendientes del usuario
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'coin_orders'), where('user_id', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setOrders(list);
    });
    return () => unsubscribe();
  }, [user]);

  // Lógica de click en cuadrícula
  const handleGridCellClick = (num: number) => {
    const coin = continentCoins[num];
    if (!coin) return;

    if (coin.status === 'available' || coin.status === 'forming_team' || coin.status === 'active_fractional') {
      setSelectedCoin(coin);
      setLegalChecked(false);
      setPaymentMethod('simulated_card');
      setCryptoOrder(null);
      setTxHashInput('');
      setCryptoVerifyMessage({ text: '', type: '' });
      
      // Si la moneda ya es fraccionada, forzar modo de compra a fractional
      if (coin.status === 'forming_team' || coin.status === 'active_fractional') {
        setPurchaseMode('fractional');
      } else {
        setPurchaseMode('reserve');
      }
      
      setShowLegalModal(true);
    } else if (coin.currentOwnerId === user?.uid) {
      setCertCoinId(coin.id);
    }
  };

  const confirmReservation = async () => {
    if (!user || !selectedCoin || !legalChecked) return;

    // Validar campos de envío requeridos
    if (
      !shippingInfo.fullName.trim() ||
      !shippingInfo.email.trim() ||
      !shippingInfo.phone.trim() ||
      !shippingInfo.country.trim() ||
      !shippingInfo.city.trim() ||
      !shippingInfo.address.trim()
    ) {
      alert(t('res.error_invalid_shipping') || 'Por favor, complete todos los campos de titularidad y envío.');
      return;
    }

    setReserveLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Si el método es USDT o el modo de compra es fraccionado/completo, creamos orden en Firestore
      if (paymentMethod === 'usdt_trc20' || purchaseMode === 'full' || purchaseMode === 'fractional') {
        const pct = purchaseMode === 'full' ? 100 : (purchaseMode === 'reserve' ? 10 : fractionPercentage);
        const purchaseType = purchaseMode === 'full' 
          ? 'full_dicicoin' 
          : (purchaseMode === 'reserve' 
              ? 'installment' 
              : (pct >= 51 ? 'fractional_master' : 'fractional_participant'));

        const mappedPaymentMethod = paymentMethod === 'usdt_trc20' 
          ? 'usdt_trc20' 
          : (paymentMethod === 'revolut_transfer' ? 'revolut_transfer' : 'bank_wire');

        const orderRes = await createCoinOrder(
          user.uid, 
          selectedCoin.id, 
          pct, 
          purchaseType, 
          mappedPaymentMethod
        );

        if (orderRes.success) {
          if (paymentMethod === 'usdt_trc20') {
            // Guardar orden cripto para desplegar la pasarela QR
            setCryptoOrder(orderRes);
            setTxHashInput('');
            setCryptoVerifyMessage({ text: '', type: '' });
          } else {
            // Aprobación SEPA o Revolut diferida
            setMessage({ 
              text: 'Su orden de compra fiat ha sido creada. Realice la transferencia correspondiente por el importe especificado.', 
              type: 'success' 
            });
            setShowLegalModal(false);
            setSelectedCoin(null);
            setActiveTab('my_plans');
          }
        } else {
          setMessage({ text: orderRes.messageKey || 'Error al procesar la orden de compra.', type: 'error' });
        }
      } else {
        // Ejecución clásica de reserva fiat
        const res = await reserveCoin(user.uid, selectedCoin.id, shippingInfo, paymentMethod as any);
        if (res.success) {
          setMessage({ text: t(res.messageKey || 'api.success_reserve'), type: 'success' });
          setShowLegalModal(false);
          setSelectedCoin(null);
          setActiveTab('my_plans');
        } else {
          const detail = (res as any).errorDetails ? ` (${(res as any).errorDetails})` : '';
          setMessage({ text: `${t(res.messageKey || 'api.server_error')}${detail}`, type: 'error' });
        }
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ text: `${t('res.error_reserve')} (${err.message || 'Error de conexión'})`, type: 'error' });
    } finally {
      setReserveLoading(false);
    }
  };

  const handleCryptoVerify = async () => {
    if (!user || !cryptoOrder || !txHashInput.trim()) return;
    setCryptoVerifyLoading(true);
    setCryptoVerifyMessage({ text: '', type: '' });

    try {
      const res = await verifyCryptoPayment(user.uid, cryptoOrder.orderId, txHashInput.trim());
      if (res.success) {
        if (res.status === 'paid') {
          setCryptoVerifyMessage({ text: '¡Pago confirmado! Su DiciCoin ha sido asignada con éxito.', type: 'success' });
          setTimeout(() => {
            setShowLegalModal(false);
            setSelectedCoin(null);
            setCryptoOrder(null);
            setTxHashInput('');
            setActiveTab('my_plans');
          }, 2000);
        } else {
          setCryptoVerifyMessage({ text: res.messageKey || 'Transacción detectada en red. Esperando confirmaciones...', type: 'warning' });
        }
      } else {
        setCryptoVerifyMessage({ text: res.messageKey || 'Error de verificación de pago.', type: 'error' });
      }
    } catch (err: any) {
      console.error(err);
      setCryptoVerifyMessage({ text: 'Error al conectar con la pasarela blockchain.', type: 'error' });
    } finally {
      setCryptoVerifyLoading(false);
    }
  };

  // Lógica de pago parcial
  const handleInstallmentSubmit = async (resId: string, coinId: string) => {
    if (!user) return;
    const amount = parseFloat(paymentAmount[resId]);

    if (isNaN(amount) || amount <= 0) {
      alert(t('res.error_invalid_amount'));
      return;
    }

    setPaymentLoading(prev => ({ ...prev, [resId]: true }));
    setMessage({ text: '', type: '' });

    const pMethod = instPaymentMethod[resId] || 'simulated_installment';

    try {
      const res = await payInstallment(user.uid, resId, amount, pMethod);
      if (res.success) {
        setMessage({ text: t(res.messageKey || 'api.success_installment'), type: 'success' });
        setPaymentAmount(prev => ({ ...prev, [resId]: '' }));
        setInstPaymentMethod(prev => ({ ...prev, [resId]: 'simulated_installment' }));
      } else {
        setMessage({ text: t(res.messageKey || 'api.server_error'), type: 'error' });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ text: t('res.error_reserve'), type: 'error' });
    } finally {
      setPaymentLoading(prev => ({ ...prev, [resId]: false }));
    }
  };

  // Lógica de Marketplace (Venta)
  const handleSellClick = (res: Reservation) => {
    setSellCoin(res);
    setSellPrice(res.paidAmount.toString());
  };

  const confirmSellListing = async () => {
    if (!user || !sellCoin) return;
    const price = parseFloat(sellPrice);

    if (isNaN(price) || price <= 0 || price > sellCoin.paidAmount) {
      alert(`${t('res.error_price_invalid')} (${sellCoin.paidAmount} €)`);
      return;
    }

    setSellLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await listParticipationInMarketplace(user.uid, sellCoin.id, price);
      if (res.success) {
        setMessage({ text: t(res.messageKey || 'api.success_listed'), type: 'success' });
        setSellCoin(null);
      } else {
        setMessage({ text: t(res.messageKey || 'api.server_error'), type: 'error' });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ text: t('res.error_publish_sale'), type: 'error' });
    } finally {
      setSellLoading(false);
    }
  };

  // Lista de números del 1 al 100
  const gridNumbers = Array.from({ length: 100 }, (_, i) => i + 1);

  // Obtener estado visual de cada celda
  const getCellStatus = (num: number) => {
    const coin = continentCoins[num];
    if (!coin) return 'available';

    if (coin.status === 'available') return 'available';
    
    if (coin.status === 'reserved' || coin.status === 'payment_plan') {
      return coin.currentOwnerId === user?.uid ? 'reserved_me' : 'reserved_other';
    }

    if (coin.status === 'fully_paid') {
      return coin.currentOwnerId === user?.uid ? 'fully_paid_me' : 'reserved_other';
    }

    return 'available';
  };

  // Formateador de fechas localizado
  const formatTrxDate = (timestamp: any) => {
    if (!timestamp) return t('wallet.recent');
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(language === 'DE' ? 'de-DE' : language === 'EN' ? 'en-US' : 'es-ES');
  };

  return (
    <Navigation>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Header */}
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 800 }}>{t('res.title')}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '4px' }}>{t('res.subtitle')}</p>
        </div>

        {message.text && (
          <div style={{ 
            background: message.type === 'success' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(235, 87, 87, 0.1)', 
            border: message.type === 'success' ? '1px solid rgba(46, 204, 113, 0.2)' : '1px solid rgba(235, 87, 87, 0.2)', 
            borderRadius: 'var(--radius-sm)', 
            padding: '14px 16px', 
            color: message.type === 'success' ? '#2ECC71' : '#EB5757', 
            fontSize: '14px' 
          }}>
            {message.text}
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', gap: '24px' }}>
          <button 
            id="tab-my-plans"
            onClick={() => setActiveTab('my_plans')} 
            style={{
              padding: '12px 8px',
              background: 'none',
              border: 'none',
              color: activeTab === 'my_plans' ? '#D4AF37' : 'var(--text-secondary)',
              borderBottom: activeTab === 'my_plans' ? '2px solid #D4AF37' : 'none',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {t('res.tab_my_plans')} ({reservations.length})
          </button>
          <button 
            id="tab-catalog"
            onClick={() => setActiveTab('catalog')} 
            style={{
              padding: '12px 8px',
              background: 'none',
              border: 'none',
              color: activeTab === 'catalog' ? '#D4AF37' : 'var(--text-secondary)',
              borderBottom: activeTab === 'catalog' ? '2px solid #D4AF37' : 'none',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {t('res.tab_catalog')}
          </button>
          <button 
            id="tab-faq"
            onClick={() => setActiveTab('faq')} 
            style={{
              padding: '12px 8px',
              background: 'none',
              border: 'none',
              color: activeTab === 'faq' ? '#D4AF37' : 'var(--text-secondary)',
              borderBottom: activeTab === 'faq' ? '2px solid #D4AF37' : 'none',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {t('res.tab_faq')}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'my_plans' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {loadingRes ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <div className="animate-spin-slow" style={{ width: '24px', height: '24px', border: '2px solid rgba(212, 175, 55, 0.1)', borderTopColor: '#D4AF37', borderRadius: '50%' }} />
              </div>
            ) : (reservations.length === 0 && fractions.length === 0 && orders.filter(o => o.payment_status !== 'paid' && o.payment_status !== 'failed' && o.payment_status !== 'expired').length === 0) ? (
              <div className="glass" style={{ textAlign: 'center', padding: '60px 24px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <Coins size={40} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: 700 }}>{t('res.no_active_plans')}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>{t('res.no_active_plans_desc')}</p>
                </div>
                <button id="go-to-catalog-tab-btn" onClick={() => setActiveTab('catalog')} className="btn-gold" style={{ fontSize: '14px', padding: '10px 20px' }}>
                  {t('res.view_catalog')}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* 1. RENDER PENDING ORDERS */}
                {orders.filter(o => o.payment_status !== 'paid' && o.payment_status !== 'failed' && o.payment_status !== 'expired').map((ord) => {
                  const num = parseInt(ord.dicicoin_id.split('-')[1]?.replace('DC', '')) || 1;
                  const targetCoin = continentCoins[num] || { id: ord.dicicoin_id, continent: ord.dicicoin_id.split('-')[0] };
                  return (
                    <div key={ord.order_id} className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '20px', borderLeft: '4px solid #00E5FF' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: 800 }}>{ord.dicicoin_id}</h3>
                            <span style={{ 
                              fontSize: '11px', 
                              fontWeight: 700, 
                              padding: '2px 8px', 
                              borderRadius: '12px',
                              background: ord.payment_status === 'under_confirmation' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(0, 229, 255, 0.1)',
                              color: ord.payment_status === 'under_confirmation' ? '#D4AF37' : '#00E5FF',
                              textTransform: 'uppercase'
                            }}>
                              {ord.payment_status === 'under_confirmation' ? 'Verificando Red' : 'Orden Pendiente'}
                            </span>
                          </div>
                          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                            Adquisición de Fracción: {ord.ownership_percentage}% ({ord.is_master_purchase ? 'Master' : 'Participante'})
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          {ord.payment_method === 'usdt_trc20' && (
                            <button 
                              onClick={() => {
                                setSelectedCoin(targetCoin as any);
                                setCryptoOrder({
                                  orderId: ord.order_id,
                                  expectedAmountUsdt: ord.expected_amount_usdt,
                                  expectedAmountEur: ord.expected_amount_eur,
                                  officialWallet: ord.official_wallet_address,
                                  exchangeRate: ord.expected_amount_usdt / ord.expected_amount_eur
                                });
                                setTxHashInput(ord.tx_hash || '');
                                setCryptoVerifyMessage({ text: '', type: '' });
                                setShowLegalModal(true);
                              }} 
                              className="btn-gold" 
                              style={{ padding: '10px 16px', fontSize: '13px' }}
                            >
                              Completar Pago / Verificar
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Monto Esperado: <strong>{ord.expected_amount_eur} EUR</strong> {ord.payment_method === 'usdt_trc20' && <>({ord.expected_amount_usdt} USDT)</>} | Método: <span style={{ textTransform: 'capitalize' }}>{ord.payment_method.replace('_', ' ')}</span>
                      </div>
                    </div>
                  );
                })}

                {/* 2. RENDER CONFIRMED FRACTIONS */}
                {fractions.map((frac: any) => {
                  const isMaster = frac.master_user_id === user?.uid;
                  return (
                    <div key={frac.id} className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '24px', borderLeft: '4px solid #2ECC71' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: 800 }}>{frac.dicicoin_id}</h3>
                            <span style={{ 
                              fontSize: '11px', 
                              fontWeight: 700, 
                              padding: '2px 8px', 
                              borderRadius: '12px',
                              background: 'rgba(46, 204, 113, 0.1)',
                              color: '#2ECC71',
                              textTransform: 'uppercase'
                            }}>
                              Propiedad Fraccionada ({frac.ownership_percentage}%)
                            </span>
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#FFFFFF' }}>
                              {isMaster ? 'MASTER' : 'PARTICIPANTE'}
                            </span>
                          </div>
                          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Serial Licencia: {frac.serial || 'Pendiente'}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button onClick={() => setCertCoinId(frac.dicicoin_id)} className="btn-outline" style={{ padding: '10px 16px', fontSize: '13px' }}>
                            <Eye size={14} />
                            <span>Ver Certificado</span>
                          </button>
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Inversión: <strong>{frac.amount_paid_eur} EUR</strong> {frac.amount_paid_usdt > 0 && <>({frac.amount_paid_usdt} USDT)</>} | Método: <span style={{ textTransform: 'uppercase' }}>{frac.payment_method.replace('_', ' ')}</span>
                      </div>
                    </div>
                  );
                })}

                {/* 3. RENDER CLASSIC FIAT RESERVATIONS */}
                {reservations.map((res) => {
                  const isCompleted = res.status === 'completed';
                  const isPending = res.status === 'pending_payment';
                  return (
                    <div key={res.id} className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {/* Title Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: 800 }}>{res.coinId}</h3>
                            <span style={{ 
                              fontSize: '11px', 
                              fontWeight: 700, 
                              padding: '2px 8px', 
                              borderRadius: '12px',
                              background: isPending ? 'rgba(212, 175, 55, 0.1)' : (isCompleted ? 'rgba(46, 204, 113, 0.1)' : 'rgba(0, 229, 255, 0.1)'),
                              color: isPending ? '#D4AF37' : (isCompleted ? '#2ECC71' : '#00E5FF'),
                              textTransform: 'uppercase'
                            }}>
                              {isPending ? 'Pendiente de Pago' : (isCompleted ? t('res.status_fully_paid') : t('res.status_payment_plan'))}
                            </span>
                          </div>
                          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>ID Reserva: {res.id}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          {!isPending && (
                            <button id={`btn-cert-${res.coinId}`} onClick={() => setCertCoinId(res.coinId)} className="btn-outline" style={{ padding: '10px 16px', fontSize: '13px' }}>
                              <Eye size={14} />
                              <span>{t('res.cert_title')}</span>
                            </button>
                          )}
                          <button id={`btn-edit-shipping-${res.id}`} onClick={() => handleEditShippingClick(res)} className="btn-outline" style={{ padding: '10px 16px', fontSize: '13px' }}>
                            <span>{t('res.btn_edit_data') || 'Editar Datos'}</span>
                          </button>
                          {!isCompleted && !isPending && (
                            <button id={`btn-sell-${res.id}`} onClick={() => handleSellClick(res)} className="btn-outline-gold" style={{ padding: '10px 16px', fontSize: '13px' }}>
                              <span>{t('market.btn_buy')}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Progress Line */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{t('balance.paid')}: <strong>{res.paidAmount} €</strong> (de {res.totalAmount} €)</span>
                          <span style={{ fontWeight: 700, color: '#00E5FF' }}>{res.progressPercentage.toFixed(1)}%</span>
                        </div>
                        <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
                          <div style={{ width: `${res.progressPercentage}%`, height: '100%', background: 'var(--blue-electric-gradient)', borderRadius: '5px', transition: 'width 1s ease' }} />
                        </div>
                      </div>

                      {/* Payments Actions/Details Grid */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr',
                        gap: '24px',
                        marginTop: '8px'
                      }} className="res-details-grid">
                        
                        {/* Installment Payment Form / Instructions */}
                        {isPending ? (
                          <div style={{ padding: '24px', background: 'rgba(212, 175, 55, 0.02)', border: '1px solid rgba(212, 175, 55, 0.15)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D4AF37' }}>
                              <Clock size={16} className="animate-pulse" />
                              <span style={{ fontWeight: 700, fontSize: '15px' }}>Instrucciones de Activación de Reserva (Revolut)</span>
                            </div>
                            <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <p>
                                La reserva queda en estado <strong style={{ color: '#FFFFFF' }}>"Pendiente de Pago"</strong>. El cliente no puede ver su certificado digital todavía.
                              </p>
                              <p>
                                Una vez que verificas la transferencia bancaria en tu banco Revolut, vas a la pestaña <strong style={{ color: '#FFFFFF' }}>"Usuarios y Reservas"</strong> de la administración y haces clic en <strong style={{ color: '#FFFFFF' }}>"Aprobar Pago"</strong> (o "Cancelar Pre-Reserva" si no pagan). Al aprobarse, la reserva se activa, se cargan los 500 € (10%) y se genera automáticamente su certificado digital.
                              </p>
                              <p>
                                Realiza una transferencia bancaria de <strong>500 €</strong> (10%) para activar el certificado y tu plan de pago progresivo:
                              </p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px', color: '#FFFFFF' }}>
                              <div>Beneficiario: DiciCoin</div>
                              <div>IBAN: LT60 3250 0696 7631 8667</div>
                              <div>BIC: REVOLT21</div>
                              <div>BIC Intermediario (fuera de EWR): CHASDEFX</div>
                              <div>Concepto / Referencia: <strong style={{ color: '#00E5FF' }}>DICI-RES-{res.coinId}</strong></div>
                              <div>Importe a Transferir: <strong style={{ color: '#D4AF37' }}>500.00 €</strong></div>
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              * Una vez realizada la transferencia, nuestro equipo de soporte verificará el ingreso en la cuenta Revolut para activar tu reserva.
                            </p>
                          </div>
                        ) : !isCompleted ? (
                          <div style={{ padding: '24px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 700, fontSize: '15px' }}>{t('res.form_pay_installment')}</span>
                              
                              {/* Payment Method Selector inside active plans */}
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => setInstPaymentMethod(prev => ({ ...prev, [res.id]: 'simulated_installment' }))}
                                  style={{
                                    background: 'none', border: 'none',
                                    color: (instPaymentMethod[res.id] || 'simulated_installment') === 'simulated_installment' ? '#00E5FF' : 'var(--text-muted)',
                                    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                                    padding: '4px 8px', borderBottom: (instPaymentMethod[res.id] || 'simulated_installment') === 'simulated_installment' ? '2px solid #00E5FF' : 'none'
                                  }}
                                >
                                  {t('res.payment_method_card')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setInstPaymentMethod(prev => ({ ...prev, [res.id]: 'revolut_transfer' }))}
                                  style={{
                                    background: 'none', border: 'none',
                                    color: instPaymentMethod[res.id] === 'revolut_transfer' ? '#D4AF37' : 'var(--text-muted)',
                                    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                                    padding: '4px 8px', borderBottom: instPaymentMethod[res.id] === 'revolut_transfer' ? '2px solid #D4AF37' : 'none'
                                  }}
                                >
                                  {t('res.payment_method_revolut')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setInstPaymentMethod(prev => ({ ...prev, [res.id]: 'card_outside_eu' }))}
                                  style={{
                                    background: 'none', border: 'none',
                                    color: instPaymentMethod[res.id] === 'card_outside_eu' ? '#00E5FF' : 'var(--text-muted)',
                                    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                                    padding: '4px 8px', borderBottom: instPaymentMethod[res.id] === 'card_outside_eu' ? '2px solid #00E5FF' : 'none'
                                  }}
                                >
                                  {t('res.payment_method_card_outside')}
                                </button>
                              </div>
                            </div>

                            {instPaymentMethod[res.id] === 'revolut_transfer' ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                  {t('res.revolut_installment_desc')}
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px', color: '#FFFFFF' }}>
                                  <div>{t('res.revolut_beneficiary')}</div>
                                  <div>IBAN: LT60 3250 0696 7631 8667</div>
                                  <div>BIC: REVOLT21</div>
                                  <div>{t('res.revolut_concept')} <strong style={{ color: '#00E5FF' }}>DICI-PAY-{res.id}</strong></div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                                  <div style={{ position: 'relative', flexGrow: 1 }}>
                                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 600 }}>€</span>
                                    <input
                                      id={`input-pay-${res.id}`}
                                      type="number"
                                      className="premium-input"
                                      style={{ paddingLeft: '32px' }}
                                      placeholder={t('res.transfer_amount_placeholder')}
                                      value={paymentAmount[res.id] || ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setPaymentAmount(prev => ({ ...prev, [res.id]: val }));
                                      }}
                                    />
                                  </div>
                                  <button
                                    onClick={() => handleInstallmentSubmit(res.id, res.coinId)}
                                    className="btn-gold"
                                    style={{ flexShrink: 0, padding: '12px 24px', fontSize: '14px' }}
                                    disabled={paymentLoading[res.id]}
                                  >
                                    {paymentLoading[res.id] ? t('res.btn_pay_loading') : t('res.register_transfer')}
                                  </button>
                                </div>
                              </div>
                            ) : instPaymentMethod[res.id] === 'card_outside_eu' ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                  {t('res.card_outside_desc2')}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0' }}>
                                  <a
                                    href={PAYMENT_LINK_OUTSIDE_EU}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-blue"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      padding: '10px 20px',
                                      textDecoration: 'none',
                                      fontWeight: 700,
                                      fontSize: '13px',
                                      borderRadius: 'var(--radius-sm)',
                                      background: 'linear-gradient(135deg, #00E5FF 0%, #0083B0 100%)',
                                      color: '#FFFFFF',
                                      boxShadow: '0 0 10px rgba(0, 229, 255, 0.3)'
                                    }}
                                  >
                                    {t('res.card_outside_btn')}
                                  </a>
                                </div>
                                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                                  {t('res.card_outside_footer')}
                                </p>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                                  <div style={{ position: 'relative', flexGrow: 1 }}>
                                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 600 }}>€</span>
                                    <input
                                      id={`input-pay-${res.id}`}
                                      type="number"
                                      className="premium-input"
                                      style={{ paddingLeft: '32px' }}
                                      placeholder={t('res.payment_amount_placeholder')}
                                      value={paymentAmount[res.id] || ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setPaymentAmount(prev => ({ ...prev, [res.id]: val }));
                                      }}
                                    />
                                  </div>
                                  <button
                                    onClick={() => handleInstallmentSubmit(res.id, res.coinId)}
                                    className="btn-gold"
                                    style={{ flexShrink: 0, padding: '12px 24px', fontSize: '14px' }}
                                    disabled={paymentLoading[res.id]}
                                  >
                                    {paymentLoading[res.id] ? t('res.btn_pay_loading') : t('res.register_payment')}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ position: 'relative', flexGrow: 1 }}>
                                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 600 }}>€</span>
                                  <input
                                    id={`input-pay-${res.id}`}
                                    type="number"
                                    className="premium-input"
                                    style={{ paddingLeft: '32px' }}
                                    placeholder={t('res.payment_amount_placeholder')}
                                    value={paymentAmount[res.id] || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setPaymentAmount(prev => ({ ...prev, [res.id]: val }));
                                    }}
                                  />
                                </div>
                                <button 
                                  id={`submit-pay-${res.id}`}
                                  onClick={() => handleInstallmentSubmit(res.id, res.coinId)} 
                                  className="btn-blue" 
                                  style={{ flexShrink: 0, padding: '12px 24px', fontSize: '14px' }}
                                  disabled={paymentLoading[res.id]}
                                >
                                  {paymentLoading[res.id] ? t('res.btn_pay_loading') : t('res.btn_pay')}
                                </button>
                              </div>
                            )}

                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                              {t('res.installment_remaining')} <strong>{res.remainingAmount} €</strong>
                            </span>
                          </div>
                        ) : (
                          <div style={{ padding: '24px', background: 'rgba(46, 204, 113, 0.03)', border: '1px solid rgba(46, 204, 113, 0.2)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#2ECC71' }}>
                              <ShieldCheck size={20} />
                              <span style={{ fontWeight: 700, fontSize: '15px' }}>{t('res.fully_paid_title')}</span>
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                              {t('res.fully_paid_desc')}
                            </p>
                          </div>
                        )}

                        {/* Specific Payment List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-secondary)' }}>{t('res.payment_history_title')}</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                            {payments.filter(p => p.reservationId === res.id).map(p => (
                              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)', borderRadius: '4px', fontSize: '13px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>
                                  {formatTrxDate(p.createdAt)}
                                </span>
                                <span style={{ fontWeight: 700, color: p.status === 'pending_verification' ? '#D4AF37' : (p.status === 'rejected' ? '#EB5757' : '#FFFFFF') }}>
                                  +{p.amount} € {p.status === 'pending_verification' ? ' (Pendiente)' : (p.status === 'rejected' ? ' (Rechazado)' : '')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === 'catalog' ? (
          /* Catalog Visual Grid View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Continent Selector horizontal */}
            <div>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '12px' }}>
                {t('res.select_continent')}
              </span>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {[
                  { code: 'EU', flag: '🇪🇺' },
                  { code: 'LA', flag: '🌎' },
                  { code: 'AF', flag: '🌍' },
                  { code: 'AS', flag: '🌏' },
                  { code: 'OC', flag: '🇦🇺' }
                ].map((item) => {
                  const isActive = selectedContinent === item.code;
                  return (
                    <button
                      key={item.code}
                      onClick={() => setSelectedContinent(item.code)}
                      style={{
                        padding: '12px 20px',
                        borderRadius: 'var(--radius-sm)',
                        background: isActive ? 'var(--gold-metallic)' : 'rgba(255, 255, 255, 0.02)',
                        border: isActive ? '1px solid var(--gold-primary)' : '1px solid var(--border-light)',
                        color: isActive ? '#000000' : 'var(--text-secondary)',
                        fontWeight: 700,
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease',
                        boxShadow: isActive ? '0 0 15px rgba(212, 175, 55, 0.2)' : 'none'
                      }}
                    >
                      <span>{item.flag}</span>
                      <span>{t(`continent.${item.code}`)} ({item.code})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid Explanation & Legend */}
            <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {t('res.grid_desc')}
              </span>
              
              {/* Legend */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212, 175, 55, 0.3)' }} />
                  <span>{t('res.status_available')} (5000 €)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(235, 87, 87, 0.15)', border: '1px solid #EB5757' }} />
                  <span>{t('res.status_reserved_other')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(0, 229, 255, 0.15)', border: '1px solid #00E5FF' }} />
                  <span>{t('res.status_reserved_me')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(212, 175, 55, 0.25)', border: '1px solid #D4AF37' }} />
                  <span>{t('res.status_fully_paid')}</span>
                </div>
              </div>
            </div>

            {/* Grid Box */}
            {loadingCoins ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <div className="animate-spin-slow" style={{ width: '24px', height: '24px', border: '2px solid rgba(212, 175, 55, 0.1)', borderTopColor: '#D4AF37', borderRadius: '50%' }} />
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(68px, 1fr))',
                gap: '12px',
                padding: '24px',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)'
              }}>
                {gridNumbers.map((num) => {
                  const status = getCellStatus(num);
                  const isAvailable = status === 'available';
                  const isReservedOther = status === 'reserved_other';
                  const isReservedMe = status === 'reserved_me';
                  const isFullyPaidMe = status === 'fully_paid_me';

                  let bg = 'rgba(255, 255, 255, 0.02)';
                  let border = '1px solid rgba(212, 175, 55, 0.2)';
                  let color = '#D4AF37';
                  let cursor = 'pointer';

                  if (isReservedOther) {
                    bg = 'rgba(235, 87, 87, 0.1)';
                    border = '1px solid rgba(235, 87, 87, 0.3)';
                    color = 'rgba(255, 255, 255, 0.2)';
                    cursor = 'not-allowed';
                  } else if (isReservedMe) {
                    bg = 'rgba(0, 229, 255, 0.15)';
                    border = '2px solid #00E5FF';
                    color = '#FFFFFF';
                  } else if (isFullyPaidMe) {
                    bg = 'rgba(212, 175, 55, 0.25)';
                    border = '2px solid #D4AF37';
                    color = '#FFFFFF';
                  }

                  return (
                    <button
                      key={num}
                      disabled={isReservedOther}
                      onClick={() => handleGridCellClick(num)}
                      style={{
                        aspectRatio: '1',
                        borderRadius: 'var(--radius-sm)',
                        background: bg,
                        border: border,
                        color: color,
                        fontWeight: 800,
                        fontSize: '15px',
                        cursor: cursor,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        boxShadow: isReservedMe ? '0 0 10px rgba(0, 229, 255, 0.2)' : isFullyPaidMe ? '0 0 10px rgba(212, 175, 55, 0.2)' : 'none'
                      }}
                      className={isAvailable ? 'grid-cell-available' : ''}
                      title={
                        isReservedOther 
                          ? t('res.status_reserved_other') 
                          : isReservedMe 
                            ? t('res.status_reserved_me') 
                            : isFullyPaidMe 
                              ? t('res.status_fully_paid') 
                              : t('res.status_available')
                      }
                    >
                      <span style={{ fontSize: '11px', opacity: 0.6, fontWeight: 500 }}>#</span>
                      <span>{String(num).padStart(3, '0')}</span>
                    </button>
                  );
                })}
              </div>
            )}

          </div>
        ) : (
          /* FAQ View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <HelpCircle size={40} style={{ color: '#D4AF37', margin: '0 auto 8px auto' }} />
              <h3 style={{ fontSize: '22px', fontWeight: 800 }}>{t('faq.title')}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>{t('faq.subtitle')}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                <div key={i} className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-sm)' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#D4AF37', marginBottom: '8px' }}>{t(`faq.q${i}`)}</h4>
                  <p 
                    style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }} 
                    dangerouslySetInnerHTML={{ __html: t(`faq.a${i}`) }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal: Legal Acceptance for Reservation & Shipping Form */}
        {showLegalModal && selectedCoin && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 50, padding: '24px'
          }}>
            <div className="glass-gold" style={{
              width: '100%', maxWidth: '580px', borderRadius: 'var(--radius-md)',
              padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px',
              position: 'relative', maxHeight: '90vh', overflowY: 'auto'
            }}>
              <button 
                id="close-legal-modal-btn"
                onClick={() => {
                  setShowLegalModal(false);
                  setCryptoOrder(null);
                }} 
                style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>

              {/* Si existe orden cripto activa, mostramos pasarela de pago */}
              {cryptoOrder ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: '#D4AF37' }}>
                    <Coins size={24} className="animate-pulse" />
                    <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Pasarela de Pago USDT TRC20</h3>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Monto Exacto a Transferir:</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '26px', fontWeight: 800, color: '#00E5FF' }}>
                        {cryptoOrder.expectedAmountUsdt} USDT
                      </span>
                      <button 
                        type="button" 
                        onClick={() => {
                          navigator.clipboard.writeText(cryptoOrder.expectedAmountUsdt.toString());
                          alert("Importe copiado al portapapeles");
                        }}
                        style={{ background: 'none', border: 'none', color: '#00E5FF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                      >
                        <Copy size={14} /> Copiar
                      </button>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Tasa de conversión: 1 EUR = {cryptoOrder.exchangeRate.toFixed(4)} USDT (Monto Base: {cryptoOrder.expectedAmountEur} EUR)
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#D4AF37' }}>Escanee el QR para pagar:</span>
                    <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '8px' }}>
                      <QRCodeSVG value={cryptoOrder.officialWallet} size={150} />
                    </div>
                    <div style={{ width: '100%', marginTop: '8px' }}>
                      <label className="premium-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Dirección Receptora Oficial TRON / TRC20:</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                        <span style={{ fontSize: '12px', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexGrow: 1, color: '#FFFFFF' }}>
                          {cryptoOrder.officialWallet}
                        </span>
                        <button 
                          type="button" 
                          onClick={() => {
                            navigator.clipboard.writeText(cryptoOrder.officialWallet);
                            alert("Dirección copiada");
                          }}
                          style={{ background: 'none', border: 'none', color: '#D4AF37', cursor: 'pointer' }}
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label className="premium-label" htmlFor="crypto-tx-hash-input">Hash de Transacción (Tx Hash)</label>
                    <input 
                      id="crypto-tx-hash-input"
                      type="text" 
                      className="premium-input" 
                      placeholder="Ingrese el hash hexadecimal de 64 caracteres..."
                      value={txHashInput}
                      onChange={(e) => setTxHashInput(e.target.value.trim())}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      * Ingrese el hash una vez enviado el pago. El sistema requiere al menos 20 confirmaciones en la blockchain TRON para la asignación definitiva.
                    </span>
                  </div>

                  {cryptoVerifyMessage.text && (
                    <div style={{ 
                      background: cryptoVerifyMessage.type === 'success' ? 'rgba(46, 204, 113, 0.1)' : (cryptoVerifyMessage.type === 'warning' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(235, 87, 87, 0.1)'), 
                      border: cryptoVerifyMessage.type === 'success' ? '1px solid rgba(46, 204, 113, 0.2)' : (cryptoVerifyMessage.type === 'warning' ? '1px solid rgba(212, 175, 55, 0.2)' : '1px solid rgba(235, 87, 87, 0.2)'), 
                      borderRadius: 'var(--radius-sm)', 
                      padding: '12px 14px', 
                      color: cryptoVerifyMessage.type === 'success' ? '#2ECC71' : (cryptoVerifyMessage.type === 'warning' ? '#D4AF37' : '#EB5757'), 
                      fontSize: '13px' 
                    }}>
                      {cryptoVerifyMessage.text}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                    <button 
                      type="button" 
                      onClick={() => setCryptoOrder(null)} 
                      className="btn-outline" 
                      style={{ flexGrow: 1, padding: '12px' }}
                      disabled={cryptoVerifyLoading}
                    >
                      Volver
                    </button>
                    <button 
                      type="button" 
                      onClick={handleCryptoVerify} 
                      className="btn-gold" 
                      style={{ flexGrow: 1, padding: '12px' }}
                      disabled={cryptoVerifyLoading || !txHashInput.trim()}
                    >
                      {cryptoVerifyLoading ? 'Verificando...' : 'Verificar Pago'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <AlertTriangle size={24} style={{ color: '#D4AF37' }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{t('res.modal_title')}</h3>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {t('res.modal_desc')}
                  </p>

                  {/* Mode of Purchase Selector */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span className="premium-label" style={{ fontSize: '11px', fontWeight: 600 }}>Tipo de Adquisición</span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setPurchaseMode('reserve');
                          if (paymentMethod === 'usdt_trc20') setPaymentMethod('simulated_card');
                        }}
                        disabled={selectedCoin.status === 'forming_team' || selectedCoin.status === 'active_fractional'}
                        style={{
                          padding: '10px 4px',
                          borderRadius: 'var(--radius-sm)',
                          background: purchaseMode === 'reserve' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255,255,255,0.01)',
                          border: purchaseMode === 'reserve' ? '1px solid #D4AF37' : '1px solid var(--border-light)',
                          color: purchaseMode === 'reserve' ? '#D4AF37' : 'var(--text-secondary)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          opacity: (selectedCoin.status === 'forming_team' || selectedCoin.status === 'active_fractional') ? 0.3 : 1
                        }}
                      >
                        Reserva (10%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPurchaseMode('full')}
                        disabled={selectedCoin.status === 'forming_team' || selectedCoin.status === 'active_fractional'}
                        style={{
                          padding: '10px 4px',
                          borderRadius: 'var(--radius-sm)',
                          background: purchaseMode === 'full' ? 'rgba(0, 229, 255, 0.1)' : 'rgba(255,255,255,0.01)',
                          border: purchaseMode === 'full' ? '1px solid #00E5FF' : '1px solid var(--border-light)',
                          color: purchaseMode === 'full' ? '#00E5FF' : 'var(--text-secondary)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          opacity: (selectedCoin.status === 'forming_team' || selectedCoin.status === 'active_fractional') ? 0.3 : 1
                        }}
                      >
                        Compra Completa
                      </button>
                      <button
                        type="button"
                        onClick={() => setPurchaseMode('fractional')}
                        style={{
                          padding: '10px 4px',
                          borderRadius: 'var(--radius-sm)',
                          background: purchaseMode === 'fractional' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(255,255,255,0.01)',
                          border: purchaseMode === 'fractional' ? '1px solid #2ECC71' : '1px solid var(--border-light)',
                          color: purchaseMode === 'fractional' ? '#2ECC71' : 'var(--text-secondary)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Propiedad Fraccionada
                      </button>
                    </div>

                    {purchaseMode === 'fractional' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-light)', marginTop: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                          <span>Porcentaje a comprar:</span>
                          <strong style={{ color: '#2ECC71' }}>{fractionPercentage}%</strong>
                        </div>
                        <input 
                          type="range" 
                          min="1" 
                          max="100" 
                          value={fractionPercentage} 
                          onChange={(e) => setFractionPercentage(parseInt(e.target.value))}
                          style={{ accentColor: '#2ECC71', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          * Mínimo 51% para ser Master del equipo. Si compra menos, se unirá como participante.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Payment Method Selector */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span className="premium-label" style={{ fontSize: '11px', fontWeight: 600 }}>{t('res.payment_method_title')}</span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('simulated_card')}
                        disabled={purchaseMode !== 'reserve'}
                        style={{
                          padding: '10px 2px',
                          borderRadius: 'var(--radius-sm)',
                          background: paymentMethod === 'simulated_card' ? 'rgba(0, 229, 255, 0.1)' : 'rgba(255,255,255,0.01)',
                          border: paymentMethod === 'simulated_card' ? '1px solid #00E5FF' : '1px solid var(--border-light)',
                          color: paymentMethod === 'simulated_card' ? '#00E5FF' : 'var(--text-secondary)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          opacity: purchaseMode !== 'reserve' ? 0.3 : 1
                        }}
                      >
                        {t('res.payment_method_card')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('revolut_transfer')}
                        style={{
                          padding: '10px 2px',
                          borderRadius: 'var(--radius-sm)',
                          background: paymentMethod === 'revolut_transfer' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255,255,255,0.01)',
                          border: paymentMethod === 'revolut_transfer' ? '1px solid #D4AF37' : '1px solid var(--border-light)',
                          color: paymentMethod === 'revolut_transfer' ? '#D4AF37' : 'var(--text-secondary)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Revolut
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card_outside_eu')}
                        disabled={purchaseMode !== 'reserve'}
                        style={{
                          padding: '10px 2px',
                          borderRadius: 'var(--radius-sm)',
                          background: paymentMethod === 'card_outside_eu' ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255,255,255,0.01)',
                          border: paymentMethod === 'card_outside_eu' ? '1px solid #00E5FF' : '1px solid var(--border-light)',
                          color: paymentMethod === 'card_outside_eu' ? '#00E5FF' : 'var(--text-secondary)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          opacity: purchaseMode !== 'reserve' ? 0.3 : 1
                        }}
                      >
                        Fuera UE
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('usdt_trc20')}
                        style={{
                          padding: '10px 2px',
                          borderRadius: 'var(--radius-sm)',
                          background: paymentMethod === 'usdt_trc20' ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255,255,255,0.01)',
                          border: paymentMethod === 'usdt_trc20' ? '1px solid #00E5FF' : '1px solid var(--border-light)',
                          color: paymentMethod === 'usdt_trc20' ? '#00E5FF' : 'var(--text-secondary)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        USDT Cripto
                      </button>
                    </div>

                    {paymentMethod === 'revolut_transfer' && (
                      <div style={{
                        marginTop: '8px', padding: '16px', background: 'rgba(212, 175, 55, 0.03)',
                        border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: 'var(--radius-sm)',
                        fontSize: '13px', lineHeight: '1.5', color: 'var(--text-secondary)'
                      }}>
                        <p style={{ color: '#D4AF37', fontWeight: 700, marginBottom: '8px' }}>
                          {t('res.revolut_title')}
                        </p>
                        <p style={{ marginBottom: '8px' }}>
                          Realice una transferencia al siguiente IBAN. Indique el concepto correspondiente.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px', color: '#FFFFFF' }}>
                          <div>{t('res.revolut_beneficiary')}</div>
                          <div>IBAN: LT60 3250 0696 7631 8667</div>
                          <div>BIC: REVOLT21</div>
                          <div>{t('res.revolut_concept')} <strong style={{ color: '#00E5FF' }}>DICI-RES-{selectedCoin.id}</strong></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Shipping Information Form */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#D4AF37', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
                      {t('res.cert_owner_info')}
                    </span>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                      <div>
                        <label className="premium-label" style={{ fontSize: '11px' }}>{t('res.form_name')}</label>
                        <div style={{ position: 'relative' }}>
                          <User size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input 
                            type="text" 
                            className="premium-input" 
                            style={{ paddingLeft: '34px', fontSize: '13px' }}
                            value={shippingInfo.fullName}
                            onChange={(e) => setShippingInfo(prev => ({ ...prev, fullName: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label className="premium-label" style={{ fontSize: '11px' }}>{t('res.form_email')}</label>
                          <div style={{ position: 'relative' }}>
                            <Mail size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                              type="email" 
                              className="premium-input" 
                              style={{ paddingLeft: '34px', fontSize: '13px' }}
                              value={shippingInfo.email}
                              onChange={(e) => setShippingInfo(prev => ({ ...prev, email: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="premium-label" style={{ fontSize: '11px' }}>{t('res.form_phone')}</label>
                          <div style={{ position: 'relative' }}>
                            <Phone size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                              type="text" 
                              className="premium-input" 
                              style={{ paddingLeft: '34px', fontSize: '13px' }}
                              placeholder="+34 600 000 000"
                              value={shippingInfo.phone}
                              onChange={(e) => setShippingInfo(prev => ({ ...prev, phone: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label className="premium-label" style={{ fontSize: '11px' }}>{t('res.form_country')}</label>
                          <div style={{ position: 'relative' }}>
                            <MapPin size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                              type="text" 
                              className="premium-input" 
                              style={{ paddingLeft: '34px', fontSize: '13px' }}
                              placeholder="España"
                              value={shippingInfo.country}
                              onChange={(e) => setShippingInfo(prev => ({ ...prev, country: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="premium-label" style={{ fontSize: '11px' }}>{t('res.form_city')}</label>
                          <input 
                            type="text" 
                            className="premium-input" 
                            style={{ fontSize: '13px' }}
                            placeholder="Madrid"
                            value={shippingInfo.city}
                            onChange={(e) => setShippingInfo(prev => ({ ...prev, city: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="premium-label" style={{ fontSize: '11px' }}>{t('res.form_address')}</label>
                        <input 
                          type="text" 
                          className="premium-input" 
                          style={{ fontSize: '13px' }}
                          placeholder="Calle Gran Vía 12, 4ºB"
                          value={shippingInfo.address}
                          onChange={(e) => setShippingInfo(prev => ({ ...prev, address: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Terms Checkbox */}
                  <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', userSelect: 'none' }}>
                    <input 
                      id="legal-checkbox"
                      type="checkbox" 
                      checked={legalChecked} 
                      onChange={(e) => setLegalChecked(e.target.checked)} 
                      style={{ marginTop: '3px' }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 500, lineHeight: '1.4' }}>
                      {t('res.legal_declaration')}
                    </span>
                  </label>

                  {message.text && (
                    <div style={{ 
                      background: message.type === 'success' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(235, 87, 87, 0.1)', 
                      border: message.type === 'success' ? '1px solid rgba(46, 204, 113, 0.2)' : '1px solid rgba(235, 87, 87, 0.2)', 
                      borderRadius: 'var(--radius-sm)', 
                      padding: '12px 14px', 
                      color: message.type === 'success' ? '#2ECC71' : '#EB5757', 
                      fontSize: '13px' 
                    }}>
                      {message.text}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                    <button 
                      id="cancel-reserve-btn"
                      onClick={() => setShowLegalModal(false)} 
                      className="btn-outline" 
                      style={{ flexGrow: 1, padding: '12px' }}
                    >
                      Cancelar
                    </button>
                    <button 
                      id="confirm-reserve-btn"
                      onClick={confirmReservation} 
                      className="btn-gold" 
                      style={{ flexGrow: 1, padding: '12px' }}
                      disabled={!legalChecked || reserveLoading}
                    >
                      {reserveLoading ? t('res.btn_confirm_loading') : t('res.btn_confirm')}
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        )}

        {/* Modal: Sell Participation in Marketplace */}
        {sellCoin && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 50, padding: '24px'
          }}>
            <div className="glass-gold" style={{
              width: '100%', maxWidth: '460px', borderRadius: 'var(--radius-md)',
              padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px',
              position: 'relative'
            }}>
              <button 
                id="close-sell-modal-btn"
                onClick={() => setSellCoin(null)} 
                style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>

              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{t('res.form_pay_installment')}</h3>
              
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span>Moneda: <strong>{sellCoin.coinId}</strong></span>
                <span>Tus aportaciones totales: <strong>{sellCoin.paidAmount} €</strong></span>
              </div>

              <div>
                <label className="premium-label" htmlFor="sell-asking-price">Precio de Venta Sugerido (€)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 600 }}>€</span>
                  <input
                    id="sell-asking-price"
                    type="number"
                    max={sellCoin.paidAmount}
                    min="1"
                    className="premium-input"
                    style={{ paddingLeft: '32px' }}
                    placeholder="e.g. 1500"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                  />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                  El precio de venta no puede superar los {sellCoin.paidAmount} € que ya has pagado. El comprador asumirá tu posición y el saldo pendiente.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <button 
                  id="cancel-sell-btn"
                  onClick={() => setSellCoin(null)} 
                  className="btn-outline" 
                  style={{ flexGrow: 1, padding: '12px' }}
                >
                  Cancelar
                </button>
                <button 
                  id="confirm-sell-btn"
                  onClick={confirmSellListing} 
                  className="btn-gold" 
                  style={{ flexGrow: 1, padding: '12px' }}
                  disabled={sellLoading}
                >
                  {sellLoading ? 'Publicando...' : 'Publicar Venta'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Modal: Interactive Certificate Viewer */}
        {certCoinId && (
          <div id="printable-certificate-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 50, padding: '24px'
          }}>
            <div id="printable-certificate" className="glass-gold" style={{
              width: '100%', maxWidth: '640px', borderRadius: 'var(--radius-md)',
              padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px',
              position: 'relative', background: 'radial-gradient(circle at center, #1C1A17 0%, #0C0B0A 100%)',
              textAlign: 'center', border: '2px solid #D4AF37', boxShadow: '0 0 35px rgba(212, 175, 55, 0.25)',
              maxHeight: '95vh', overflowY: 'auto'
            }}>
              <button 
                id="close-cert-modal-btn"
                onClick={() => setCertCoinId(null)} 
                style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: '#D4AF37', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>

              {/* Certificate Border decoration */}
              <div style={{ border: '1px solid rgba(212, 175, 55, 0.2)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Award size={48} style={{ color: '#D4AF37', filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.4))' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ color: '#D4AF37', fontSize: '12px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                    {t('res.cert_title')}
                  </span>
                  <h3 className="text-gold" style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'serif', letterSpacing: '0.05em' }}>
                    {t('res.cert_collectible')}
                  </h3>
                </div>

                <div style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p>{t('res.cert_desc')}</p>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.05em' }}>
                    DiciCoin ID: {certCoinId}
                  </p>
                </div>
                {/* QR Code and Meta */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '32px', margin: '16px 0', flexWrap: 'wrap' }}>
                  {(() => {
                    const resDoc = reservations.find(r => r.coinId === certCoinId);
                    const qrValue = resDoc?.saleSignature 
                      ? `${window.location.origin}/verify?sig=${resDoc.saleSignature}`
                      : `https://dicilo.net/verify/coin/${certCoinId}`;
                    return (
                      <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '8px', display: 'inline-flex' }}>
                        <QRCodeSVG value={qrValue} size={100} />
                      </div>
                    );
                  })()}
                  <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {t('res.cert_status')}: <strong style={{ color: '#D4AF37' }}>{t('res.cert_status_value')}</strong>
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {t('res.cert_continent')}: <strong style={{ color: '#FFFFFF' }}>{(() => {
                        const code = certCoinId ? certCoinId.substring(0, 2).toUpperCase() : '';
                        const normalized = code === 'NA' ? 'OC' : code;
                        return t(`continent.${normalized}`);
                      })()}</strong>
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {t('res.cert_license')}: <strong style={{ color: '#00E5FF', fontFamily: 'monospace', fontSize: '11px' }}>
                        {reservations.find(r => r.coinId === certCoinId)?.serial || fractions.find(f => f.dicicoin_id === certCoinId)?.serial || 'Pendiente'}
                      </strong>
                    </span>
                    {(() => {
                      const fracDoc = fractions.find(f => f.dicicoin_id === certCoinId);
                      if (!fracDoc) return null;
                      return (
                        <>
                          <span style={{ color: 'var(--text-muted)' }}>
                            Participación: <strong style={{ color: '#2ECC71' }}>{fracDoc.ownership_percentage}%</strong>
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            Rol: <strong style={{ color: '#D4AF37' }}>{fracDoc.master_user_id === user?.uid ? 'MASTER' : 'PARTICIPANTE'}</strong>
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Shipping & Holder Details display inside Certificate */}
                {(() => {
                  const resDoc = reservations.find(r => r.coinId === certCoinId);
                  let fullName = resDoc?.shippingInfo?.fullName;
                  let email = resDoc?.shippingInfo?.email;
                  let phone = resDoc?.shippingInfo?.phone;
                  let address = resDoc?.shippingInfo?.address;
                  let city = resDoc?.shippingInfo?.city;
                  let country = resDoc?.shippingInfo?.country;

                  if (!fullName && profile) {
                    fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.email;
                    email = profile.email;
                    phone = (profile as any).phone || '';
                    address = (profile as any).address || '';
                    city = (profile as any).city || '';
                    country = (profile as any).country || '';
                  }

                  if (!fullName) return null;

                  return (
                    <div style={{
                      textAlign: 'left',
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(212, 175, 55, 0.1)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '13px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <span style={{ fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>
                        {t('res.cert_owner_info')}
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px', color: 'var(--text-secondary)' }}>
                        <div>{t('res.form_name')}: <strong style={{ color: '#FFFFFF' }}>{fullName}</strong></div>
                        {email && <div>{t('res.form_email')}: <strong style={{ color: '#FFFFFF' }}>{email}</strong></div>}
                        {phone && <div>{t('res.form_phone')}: <strong style={{ color: '#FFFFFF' }}>{phone}</strong></div>}
                      </div>
                      {address && (
                        <>
                          <span style={{ fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em', marginTop: '6px' }}>
                            {t('res.cert_shipping_dest')}
                          </span>
                          <div style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                            <strong>{address}</strong>{city ? `, ${city}` : ''}{country ? `, ${country}` : ''}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {t('res.cert_footer')}
                </div>

              </div>

              <div id="print-actions-area">
                {isMobile ? (
                  <button 
                    id="download-cert-btn" 
                    onClick={downloadCertificatePdf} 
                    className="btn-gold" 
                    style={{ padding: '12px 32px' }}
                    disabled={pdfDownloading}
                  >
                    {pdfDownloading ? 'Descargando...' : 'Descargar PDF'}
                  </button>
                ) : (
                  <button id="print-cert-btn" onClick={() => window.print()} className="btn-gold" style={{ padding: '12px 32px' }}>
                    {t('res.cert_print')}
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Modal: Edit Contact / Shipping Data */}
        {editingRes && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 50, padding: '24px'
          }}>
            <div className="glass-gold" style={{
              width: '100%', maxWidth: '600px', borderRadius: 'var(--radius-md)',
              padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px',
              position: 'relative', maxHeight: '90vh', overflowY: 'auto'
            }}>
              <button 
                id="close-edit-modal-btn"
                onClick={() => setEditingRes(null)} 
                style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <User size={24} style={{ color: '#D4AF37' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
                  {t('res.edit_modal_title') || 'Editar Información de Contacto'} ({editingRes.coinId})
                </h3>
              </div>

              {(() => {
                const limitCheck = checkClientLimits(editingRes);
                const isFormDisabled = !limitCheck.allowed || editLoading;

                return (
                  <>
                    {!limitCheck.allowed && (
                      <div style={{ 
                        background: 'rgba(235, 87, 87, 0.1)', 
                        border: '1px solid rgba(235, 87, 87, 0.2)', 
                        borderRadius: 'var(--radius-sm)', 
                        padding: '14px 16px', 
                        color: '#EB5757', 
                        fontSize: '13px',
                        lineHeight: '1.5'
                      }}>
                        <strong>Límites de Edición Activos:</strong><br />
                        {limitCheck.reason}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <label className="premium-label" style={{ fontSize: '11px' }}>{t('res.form_name')}</label>
                        <input 
                          type="text" 
                          className="premium-input" 
                          style={{ fontSize: '13px', background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)' }}
                          value={editForm.fullName}
                          disabled={true}
                          title={t('api.error_name_immutable')}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                          * El nombre del titular es inmutable por seguridad. Contacte con administración para cambios de titularidad.
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label className="premium-label" style={{ fontSize: '11px' }}>{t('res.form_email')}</label>
                          <input 
                            type="email" 
                            className="premium-input" 
                            style={{ fontSize: '13px' }}
                            value={editForm.email}
                            onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                            disabled={isFormDisabled}
                          />
                        </div>
                        <div>
                          <label className="premium-label" style={{ fontSize: '11px' }}>{t('res.form_phone')}</label>
                          <input 
                            type="text" 
                            className="premium-input" 
                            style={{ fontSize: '13px' }}
                            value={editForm.phone}
                            onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                            disabled={isFormDisabled}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label className="premium-label" style={{ fontSize: '11px' }}>{t('res.form_country')}</label>
                          <input 
                            type="text" 
                            className="premium-input" 
                            style={{ fontSize: '13px' }}
                            value={editForm.country}
                            onChange={(e) => setEditForm(prev => ({ ...prev, country: e.target.value }))}
                            disabled={isFormDisabled}
                          />
                        </div>
                        <div>
                          <label className="premium-label" style={{ fontSize: '11px' }}>{t('res.form_city')}</label>
                          <input 
                            type="text" 
                            className="premium-input" 
                            style={{ fontSize: '13px' }}
                            value={editForm.city}
                            onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                            disabled={isFormDisabled}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="premium-label" style={{ fontSize: '11px' }}>{t('res.form_address')}</label>
                        <input 
                          type="text" 
                          className="premium-input" 
                          style={{ fontSize: '13px' }}
                          value={editForm.address}
                          onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                          disabled={isFormDisabled}
                        />
                      </div>
                    </div>

                    {editError && (
                      <div style={{ 
                        background: 'rgba(235, 87, 87, 0.1)', 
                        border: '1px solid rgba(235, 87, 87, 0.2)', 
                        borderRadius: 'var(--radius-sm)', 
                        padding: '12px 14px', 
                        color: '#EB5757', 
                        fontSize: '13px' 
                      }}>
                        {editError}
                      </div>
                    )}

                    {editSuccess && (
                      <div style={{ 
                        background: 'rgba(46, 204, 113, 0.1)', 
                        border: '1px solid rgba(46, 204, 113, 0.2)', 
                        borderRadius: 'var(--radius-sm)', 
                        padding: '12px 14px', 
                        color: '#2ECC71', 
                        fontSize: '13px' 
                      }}>
                        ¡Datos actualizados correctamente!
                      </div>
                    )}

                    {/* Change History for Buyers */}
                    {(() => {
                      const history: any[] = (editingRes as any).changeHistory || [];
                      if (history.length === 0) return null;
                      return (
                        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                          <span style={{ fontWeight: 700, fontSize: '14px', color: '#D4AF37', display: 'block', marginBottom: '12px' }}>
                            {t('res.edit_history_title') || 'Historial de Cambios'}
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '150px', overflowY: 'auto' }}>
                            {history.map((log, idx) => (
                              <div key={idx} style={{ padding: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)', borderRadius: '4px', fontSize: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                  <span>{formatTrxDate(log.timestamp)}</span>
                                  <span>Modificado por: {log.changedBy === 'client' ? 'Cliente' : 'Admin'}</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: 'var(--text-secondary)' }}>
                                  <div>
                                    <span style={{ color: '#EB5757' }}>Anterior:</span><br />
                                    {log.previousValues?.fullName && <span>Nombre: {log.previousValues.fullName}<br /></span>}
                                    {log.previousValues?.email && <span>Email: {log.previousValues.email}<br /></span>}
                                    {log.previousValues?.phone && <span>Tel: {log.previousValues.phone}<br /></span>}
                                    {log.previousValues?.address && <span>Dir: {log.previousValues.address}, {log.previousValues.city}, {log.previousValues.country}</span>}
                                  </div>
                                  <div>
                                    <span style={{ color: '#2ECC71' }}>Nuevo:</span><br />
                                    {log.newValues?.fullName && <span>Nombre: {log.newValues.fullName}<br /></span>}
                                    {log.newValues?.email && <span>Email: {log.newValues.email}<br /></span>}
                                    {log.newValues?.phone && <span>Tel: {log.newValues.phone}<br /></span>}
                                    {log.newValues?.address && <span>Dir: {log.newValues.address}, {log.newValues.city}, {log.newValues.country}</span>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                      <button 
                        id="cancel-edit-btn"
                        onClick={() => setEditingRes(null)} 
                        className="btn-outline" 
                        style={{ flexGrow: 1, padding: '12px' }}
                      >
                        Cancelar
                      </button>
                      <button 
                        id="save-edit-btn"
                        onClick={handleSaveEdit} 
                        className="btn-gold" 
                        style={{ flexGrow: 1, padding: '12px' }}
                        disabled={isFormDisabled}
                      >
                        {editLoading ? 'Guardando...' : 'Guardar Cambios'}
                      </button>
                    </div>
                  </>
                );
              })()}

            </div>
          </div>
        )}

        {/* Superadmin Diagnostics Panel */}
        {user?.email === 'superadmin@dicilo.net' && (
          <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)', marginTop: '24px', border: '1px solid rgba(235, 87, 87, 0.3)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#EB5757', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} />
              Panel de Diagnóstico del Servidor (Superadmin)
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Utiliza esta herramienta para verificar el estado de conexión de Firebase Admin SDK en el contenedor Cloud Run.
            </p>
            <button 
              onClick={runServerDiagnostics} 
              disabled={diagLoading}
              className="btn-gold" 
              style={{ fontSize: '13px', padding: '10px 20px', background: '#EB5757', borderColor: '#EB5757' }}
            >
              {diagLoading ? 'Ejecutando Diagnóstico...' : 'Ejecutar Diagnóstico de Conexión'}
            </button>

            {diagResults && (
              <pre style={{ 
                marginTop: '16px', 
                padding: '16px', 
                background: 'rgba(0,0,0,0.5)', 
                borderRadius: 'var(--radius-sm)', 
                fontSize: '12px', 
                overflowX: 'auto',
                color: '#2ECC71',
                border: '1px solid var(--border-light)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {JSON.stringify(diagResults, null, 2)}
              </pre>
            )}
          </div>
        )}

      </div>

      <style jsx global>{`
        .grid-cell-available:hover {
          transform: scale(1.05);
          box-shadow: 0 0 15px rgba(212, 175, 55, 0.25);
          border-color: var(--gold-primary) !important;
        }
        @media (min-width: 768px) {
          .res-details-grid {
            grid-template-columns: 1.2fr 1fr !important;
          }
        }
        @media print {
          body {
            background: #FFFFFF !important;
            color: #000000 !important;
          }
          /* Ocultar toda la web excepto el overlay del certificado */
          body > *:not(#printable-certificate-overlay) {
            display: none !important;
            height: 0 !important;
            overflow: hidden !important;
          }
          #printable-certificate-overlay {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: #FFFFFF !important;
            margin: 0 !important;
            padding: 0 !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            visibility: visible !important;
          }
          #printable-certificate {
            border: 2px solid #D4AF37 !important;
            box-shadow: none !important;
            background: #FFFFFF !important;
            color: #000000 !important;
            max-width: 100% !important;
            width: 600px !important;
            padding: 24px !important;
            margin: 0 !important;
            visibility: visible !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
          }
          #printable-certificate * {
            color: #000000 !important;
            visibility: visible !important;
          }
          #printable-certificate .text-gold, 
          #printable-certificate strong,
          #printable-certificate h3 {
            color: #C5A028 !important;
          }
          #close-cert-modal-btn, 
          #print-actions-area,
          #print-cert-btn,
          #download-cert-btn {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `}</style>
    </Navigation>
  );
}
