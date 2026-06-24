'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { 
  createPhysicalCoin, 
  approveTransfer, 
  rejectTransfer, 
  reservePhysicalCoinAsAdmin,
  approveRevolutPayment,
  cancelPreReservation,
  approveInstallmentPayment,
  rejectInstallmentPayment
} from '@/app/actions/admin-actions';
import { updateReservationDetails } from '@/app/actions/wallet-actions';
import { 
  adminApproveFiatOrder, 
  adminGetFinancialSummary, 
  adminGetAuditLogs, 
  searchDiciCoins 
} from '@/app/actions/dicicoin-actions';
import { Plus, Check, X, ShieldAlert, Award, FileText, Activity, Eye, User, Clock, AlertCircle, TrendingUp, BarChart3, Database, FileSpreadsheet, Copy, ExternalLink, Search } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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

interface PendingTransfer {
  id: string;
  coinId: string;
  reservationId: string;
  sellerId: string;
  buyerId: string;
  askingPrice: number;
  paidAmountSnapshot: number;
  status: string;
}

export default function AdminPage() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();

  const getFormatDate = (timestamp: any) => {
    if (!timestamp) return 'Reciente';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('es-ES');
  };
  
  // Coin creation form state
  const [continent, setContinent] = useState('EU');
  const [number, setNumber] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Buyer / Reservation states
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerFullName, setBuyerFullName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerCountry, setBuyerCountry] = useState('España');
  const [buyerCity, setBuyerCity] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [payWithDp, setPayWithDp] = useState(false);
  const [openCredit, setOpenCredit] = useState(false);

  // Lists state
  const [allCoins, setAllCoins] = useState<DiciCoin[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<PendingTransfer[]>([]);
  const [loadingCoins, setLoadingCoins] = useState(true);
  const [loadingTransfers, setLoadingTransfers] = useState(true);

  const [message, setMessage] = useState({ text: '', type: '' });
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});

  // Tab control
  const [activeTab, setActiveTab] = useState<'inventory' | 'pending_payments' | 'users_reservations' | 'financials'>('inventory');

  // Superadmin Financial Dashboard states
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const [loadingFinancials, setLoadingFinancials] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [searchFilters, setSearchFilters] = useState({ serial: '', ownerId: '', continent: '', status: '' });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingCoins, setSearchingCoins] = useState(false);
  const [fiatOrders, setFiatOrders] = useState<any[]>([]);

  // Reservations state
  const [allReservations, setAllReservations] = useState<any[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);

  // Administrative editing and modals state
  const [editingRes, setEditingRes] = useState<any | null>(null);
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
  const [historyRes, setHistoryRes] = useState<any | null>(null);
  const [certCoinId, setCertCoinId] = useState<string | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);

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

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';

  // Calcular de forma reactiva las pre-reservas y cuotas pendientes de verificación
  const pendingPreReservations = allReservations.filter(r => r.status === 'pending_payment');
  const pendingInstallmentPayments = pendingPayments.filter(p => {
    const res = allReservations.find(r => r.id === p.reservationId);
    return res && res.status !== 'pending_payment';
  });
  const pendingCount = pendingPreReservations.length + pendingInstallmentPayments.length;

  // Filtrar monedas según el continente seleccionado en el formulario
  const filteredCoins = allCoins.filter((coin) => {
    const coinCont = coin.continent === 'NA' ? 'OC' : coin.continent;
    return coinCont === continent;
  });

  const prefix = continent === 'EU' ? 'EU-DC' : continent === 'LA' ? 'LA-DC' : continent === 'AF' ? 'AF-DC' : continent === 'AS' ? 'AS-DC' : 'OC-DC';
  const numVal = parseInt(number);
  const generatedCoinId = (!isNaN(numVal) && number) ? `${prefix}${String(numVal).padStart(7, '0')}` : '';
  const existingCoin = allCoins.find(c => c.id === generatedCoinId);


  // 1. Escuchar todas las monedas
  useEffect(() => {
    if (!isAdmin) return;
    const q = collection(db, 'dici_coins');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: DiciCoin[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as DiciCoin);
      });
      // Ordenar por ID para fácil auditoría visual
      list.sort((a, b) => a.id.localeCompare(b.id));
      setAllCoins(list);
      setLoadingCoins(false);
    }, (err) => {
      console.error("Error loading admin coins:", err);
      setLoadingCoins(false);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  // 2. Escuchar transferencias pendientes
  useEffect(() => {
    if (!isAdmin) return;
    const q = query(
      collection(db, 'participation_transfers'),
      where('status', '==', 'pending_approval')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: PendingTransfer[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as PendingTransfer);
      });
      setPendingTransfers(list);
      setLoadingTransfers(false);
    }, (err) => {
      console.error("Error loading pending transfers:", err);
      setLoadingTransfers(false);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  // 3. Escuchar todas las reservas
  useEffect(() => {
    if (!isAdmin) return;
    const q = collection(db, 'coin_reservations');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      // Ordenar por ID de moneda
      list.sort((a, b) => a.coinId.localeCompare(b.coinId));
      setAllReservations(list);
      setLoadingReservations(false);
    }, (err) => {
      console.error("Error loading admin reservations:", err);
      setLoadingReservations(false);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  // Escuchar pagos por transferencia Revolut o Tarjeta pendientes de verificación
  useEffect(() => {
    if (!isAdmin) return;
    const q = query(
      collection(db, 'payment_history'),
      where('paymentMethod', 'in', ['revolut_transfer', 'card_outside_eu']),
      where('status', '==', 'pending_verification')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setPendingPayments(list);
    }, (err) => {
      console.error("Error loading pending payments:", err);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  // Load Superadmin Financial Dashboard data
  const loadFinancialData = async () => {
    setLoadingFinancials(true);
    setLoadingLogs(true);
    setMessage({ text: '', type: '' });
    try {
      const summaryRes = await adminGetFinancialSummary();
      if (summaryRes.success) {
        setFinancialSummary(summaryRes.summary);
        setFiatOrders(summaryRes.pendingOrders || []);
      } else {
        setMessage({ text: 'Error al recuperar resumen financiero.', type: 'error' });
      }
      
      const logsRes = await adminGetAuditLogs(50);
      if (logsRes.success) {
        setAuditLogs(logsRes.logs || []);
      }
    } catch (err: any) {
      console.error('Error loading financials:', err);
      setMessage({ text: 'Error de conexión al cargar datos financieros.', type: 'error' });
    } finally {
      setLoadingFinancials(false);
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'financials') {
      loadFinancialData();
    }
  }, [activeTab]);

  const handleApproveFiat = async (orderId: string) => {
    if (!isAdmin || !user) return;
    if (!window.confirm("¿Está seguro de que desea aprobar esta orden manualmente? Esto asignará la propiedad/fracción de forma definitiva.")) return;
    
    setActionLoading(prev => ({ ...prev, [orderId]: true }));
    setMessage({ text: '', type: '' });
    try {
      const res = await adminApproveFiatOrder(user.uid, orderId);
      if (res.success) {
        setMessage({ text: "Orden fiat aprobada manualmente con éxito.", type: 'success' });
        loadFinancialData();
      } else {
        setMessage({ text: (res as any).messageKey || "Error al aprobar la orden fiat.", type: 'error' });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || "Error al conectar con el servidor.", type: 'error' });
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleSearchCoins = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchingCoins(true);
    try {
      const res = await searchDiciCoins(searchFilters);
      if (res.success) {
        setSearchResults(res.coins || []);
      } else {
        setMessage({ text: "Error al buscar monedas.", type: 'error' });
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setSearchingCoins(false);
    }
  };

  const exportToCSV = () => {
    if (!financialSummary) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Metrica,Valor\n";
    csvContent += `Total EUR Recibido (Fiat),${financialSummary.totalReceivedEur} EUR\n`;
    csvContent += `Total USDT Recibido (Cripto),${financialSummary.totalReceivedUsdt} USDT\n`;
    csvContent += `Monedas Disponibles,${financialSummary.coinsAvailable}\n`;
    csvContent += `Monedas Reservadas,${financialSummary.coinsReserved}\n`;
    csvContent += `Monedas Fraccionadas,${financialSummary.coinsFractional}\n`;
    csvContent += `Monedas Pagadas Completas,${financialSummary.coinsPaid}\n`;
    csvContent += `Masters Activos,${financialSummary.activeMastersCount}\n`;
    csvContent += `Participantes Activos,${financialSummary.activeParticipantsCount}\n`;
    csvContent += `Compras USDT TRC20,${financialSummary.paymentMethodsCount?.usdt_trc20 || 0}\n`;
    csvContent += `Compras Revolut,${financialSummary.paymentMethodsCount?.revolut_transfer || 0}\n`;
    csvContent += `Compras Transferencia Bancaria,${financialSummary.paymentMethodsCount?.bank_wire || 0}\n\n`;
    
    if (fiatOrders.length > 0) {
      csvContent += "Ordenes Pendientes:\n";
      csvContent += "Orden ID,Usuario ID,Moneda ID,Porcentaje,Monto EUR,Monto USDT,Metodo Pago,Estado\n";
      fiatOrders.forEach(o => {
        csvContent += `${o.order_id},${o.user_id},${o.dicicoin_id},${o.ownership_percentage}%,${o.expected_amount_eur} EUR,${o.expected_amount_usdt || 0} USDT,${o.payment_method},${o.payment_status}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `resumen_financiero_dicicoin_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApproveRevolutPayment = async (reservationId: string) => {
    if (!isAdmin || !user) return;
    if (!window.confirm(t('admin.confirm_approve_payment_reservation'))) return;

    setActionLoading(prev => ({ ...prev, [reservationId]: true }));
    setMessage({ text: '', type: '' });

    try {
      const res = await approveRevolutPayment(user.uid, reservationId);
      if (res.success) {
        setMessage({ text: t('admin.success_activate_pre_reservation'), type: 'success' });
      } else {
        setMessage({ text: t('admin.error_activate_pre_reservation'), type: 'error' });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ text: t('admin.error_server_activate_pre_reservation'), type: 'error' });
    } finally {
      setActionLoading(prev => ({ ...prev, [reservationId]: false }));
    }
  };

  const handleCancelPreReservation = async (reservationId: string) => {
    if (!isAdmin || !user) return;
    if (!window.confirm(t('admin.confirm_cancel_pre_reservation'))) return;

    setActionLoading(prev => ({ ...prev, [reservationId]: true }));
    setMessage({ text: '', type: '' });

    try {
      const res = await cancelPreReservation(user.uid, reservationId);
      if (res.success) {
        setMessage({ text: t('admin.success_cancel_pre_reservation'), type: 'success' });
      } else {
        setMessage({ text: t('admin.error_cancel_pre_reservation'), type: 'error' });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ text: t('admin.error_server_cancel_pre_reservation'), type: 'error' });
    } finally {
      setActionLoading(prev => ({ ...prev, [reservationId]: false }));
    }
  };

  const handleApproveInstallmentPayment = async (paymentId: string) => {
    if (!isAdmin || !user) return;
    if (!window.confirm(t('admin.confirm_approve_payment_installment'))) return;

    setActionLoading(prev => ({ ...prev, [paymentId]: true }));
    setMessage({ text: '', type: '' });

    try {
      const res = await approveInstallmentPayment(user.uid, paymentId);
      if (res.success) {
        setMessage({ text: t('admin.success_approve_installment'), type: 'success' });
      } else {
        setMessage({ text: t('admin.error_approve_installment'), type: 'error' });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ text: t('admin.error_server_approve_installment'), type: 'error' });
    } finally {
      setActionLoading(prev => ({ ...prev, [paymentId]: false }));
    }
  };

  const handleRejectInstallmentPayment = async (paymentId: string) => {
    if (!isAdmin || !user) return;
    if (!window.confirm(t('admin.confirm_reject_payment_installment'))) return;

    setActionLoading(prev => ({ ...prev, [paymentId]: true }));
    setMessage({ text: '', type: '' });

    try {
      const res = await rejectInstallmentPayment(user.uid, paymentId);
      if (res.success) {
        setMessage({ text: t('admin.success_reject_installment'), type: 'success' });
      } else {
        setMessage({ text: t('admin.error_reject_installment'), type: 'error' });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ text: t('admin.error_server_reject_installment'), type: 'error' });
    } finally {
      setActionLoading(prev => ({ ...prev, [paymentId]: false }));
    }
  };

  const handleEditAdminClick = (res: any) => {
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

  const handleSaveAdminEdit = async () => {
    if (!user || !editingRes) return;

    if (
      !editForm.fullName.trim() ||
      !editForm.email.trim() ||
      !editForm.phone.trim() ||
      !editForm.country.trim() ||
      !editForm.city.trim() ||
      !editForm.address.trim()
    ) {
      setEditError(t('res.error_invalid_shipping') || 'Por favor, rellene todos los campos.');
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

  // Manejar creación de moneda o registro de reserva/compra
  const handleCreateCoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !user) return;

    const numVal = parseInt(number);
    if (!number || isNaN(numVal) || numVal < 1 || numVal > 2000000) {
      setMessage({ text: t('admin.error_invalid_number'), type: 'error' });
      return;
    }

    setFormLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const prefix = continent === 'EU' ? 'EU-DC' : continent === 'LA' ? 'LA-DC' : continent === 'AF' ? 'AF-DC' : continent === 'AS' ? 'AS-DC' : 'OC-DC';
      const generatedCoinId = `${prefix}${String(numVal).padStart(7, '0')}`;

      // Verificar si la moneda ya existe en la lista local
      const existingCoin = allCoins.find(c => c.id === generatedCoinId);

      if (existingCoin) {
        if (existingCoin.status !== 'available') {
          setMessage({ text: t('admin.error_coin_already_reserved'), type: 'error' });
          setFormLoading(false);
          return;
        }

        // Si existe y está disponible, registramos la reserva/compra
        if (!buyerEmail || !buyerFullName || !buyerPhone || !buyerCountry || !buyerCity || !buyerAddress) {
          setMessage({ text: t('admin.error_fill_all'), type: 'error' });
          setFormLoading(false);
          return;
        }

        const res = await reservePhysicalCoinAsAdmin(generatedCoinId, buyerEmail, {
          fullName: buyerFullName,
          phone: buyerPhone,
          country: buyerCountry,
          city: buyerCity,
          address: buyerAddress
        }, payWithDp, openCredit);

        if (res.success) {
          setMessage({ text: t(res.messageKey || 'admin.success_reserve'), type: 'success' });
          setNumber('');
          setBuyerEmail('');
          setBuyerFullName('');
          setBuyerPhone('');
          setBuyerCity('');
          setBuyerAddress('');
          setPayWithDp(false);
          setOpenCredit(false);
        } else {
          setMessage({ text: t(res.messageKey || 'admin.error_register_coin'), type: 'error' });
        }
      } else {
        // Si no existe, la damos de alta en el catálogo
        const res = await createPhysicalCoin(generatedCoinId, continent, numVal);
        if (res.success) {
          setMessage({ text: t(res.messageKey || 'api.admin.success_register_coin'), type: 'success' });
          setNumber('');
        } else {
          setMessage({ text: t(res.messageKey || 'api.admin.error_register_coin'), type: 'error' });
        }
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ text: t('admin.error_register_coin'), type: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  // Aprobar transferencia
  const handleApprove = async (transferId: string) => {
    if (!isAdmin || !user) return;

    const confirmApprove = window.confirm(t('admin.confirm_approve'));
    if (!confirmApprove) return;

    setActionLoading(prev => ({ ...prev, [transferId]: true }));
    setMessage({ text: '', type: '' });

    try {
      const res = await approveTransfer(transferId, user.uid);
      if (res.success) {
        setMessage({ text: t(res.messageKey || 'api.admin.success_approve'), type: 'success' });
      } else {
        setMessage({ text: t(res.messageKey || 'api.server_error'), type: 'error' });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ text: t('admin.error_approve_transfer'), type: 'error' });
    } finally {
      setActionLoading(prev => ({ ...prev, [transferId]: false }));
    }
  };

  // Rechazar transferencia
  const handleReject = async (transferId: string) => {
    if (!isAdmin || !user) return;

    const confirmReject = window.confirm(t('admin.confirm_reject'));
    if (!confirmReject) return;

    setActionLoading(prev => ({ ...prev, [transferId]: true }));
    setMessage({ text: '', type: '' });

    try {
      const res = await rejectTransfer(transferId);
      if (res.success) {
        setMessage({ text: t(res.messageKey || 'api.admin.success_reject'), type: 'success' });
      } else {
        setMessage({ text: t(res.messageKey || 'api.server_error'), type: 'error' });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ text: t('admin.error_reject_transfer'), type: 'error' });
    } finally {
      setActionLoading(prev => ({ ...prev, [transferId]: false }));
    }
  };

  if (!isAdmin) {
    return (
      <Navigation>
        <div className="glass" style={{
          textAlign: 'center', padding: '60px 24px', borderRadius: 'var(--radius-md)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '40px'
        }}>
          <ShieldAlert size={48} style={{ color: '#EB5757' }} />
          <div>
            <h4 style={{ fontSize: '20px', fontWeight: 700, color: '#EB5757' }}>{t('admin.access_denied')}</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
              {t('admin.access_denied_desc')}
            </p>
          </div>
        </div>
      </Navigation>
    );
  }

  return (
    <Navigation>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Header */}
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 800 }}>{t('admin.title')}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '4px' }}>{t('admin.subtitle')}</p>
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
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', gap: '24px', flexWrap: 'wrap' }}>
          <button 
            id="tab-inventory"
            onClick={() => setActiveTab('inventory')} 
            style={{
              padding: '12px 8px',
              background: 'none',
              border: 'none',
              color: activeTab === 'inventory' ? '#D4AF37' : 'var(--text-secondary)',
              borderBottom: activeTab === 'inventory' ? '2px solid #D4AF37' : 'none',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {t('admin.tab_inventory')}
          </button>
          <button 
            id="tab-pending-payments"
            onClick={() => setActiveTab('pending_payments')} 
            style={{
              padding: '12px 8px',
              background: 'none',
              border: 'none',
              color: activeTab === 'pending_payments' ? '#D4AF37' : 'var(--text-secondary)',
              borderBottom: activeTab === 'pending_payments' ? '2px solid #D4AF37' : 'none',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {t('admin.tab_pending_payments_count').replace('{count}', String(pendingCount))}
          </button>
          <button 
            id="tab-users-reservations"
            onClick={() => setActiveTab('users_reservations')} 
            style={{
              padding: '12px 8px',
              background: 'none',
              border: 'none',
              color: activeTab === 'users_reservations' ? '#D4AF37' : 'var(--text-secondary)',
              borderBottom: activeTab === 'users_reservations' ? '2px solid #D4AF37' : 'none',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {t('admin.tab_users_reservations_count').replace('{count}', String(allReservations.length))}
          </button>
          {profile?.role === 'superadmin' && (
            <button 
              id="tab-financials"
              onClick={() => setActiveTab('financials')} 
              style={{
                padding: '12px 8px',
                background: 'none',
                border: 'none',
                color: activeTab === 'financials' ? '#D4AF37' : 'var(--text-secondary)',
                borderBottom: activeTab === 'financials' ? '2px solid #D4AF37' : 'none',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Finanzas & Cripto (Superadmin)
            </button>
          )}
        </div>

        {activeTab === 'inventory' && (
          <>

        {/* Double Column layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '24px'
        }} className="admin-grid">
          
          {/* List of Pending Transfers */}
          <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Activity size={20} style={{ color: '#00E5FF' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{t('admin.pending_approvals')} ({pendingTransfers.length})</h3>
            </div>

            {loadingTransfers ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <div className="animate-spin-slow" style={{ width: '24px', height: '24px', border: '2px solid rgba(212, 175, 55, 0.1)', borderTopColor: '#D4AF37', borderRadius: '50%' }} />
              </div>
            ) : pendingTransfers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-muted)', fontSize: '14px' }}>
                {t('admin.no_pending')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {pendingTransfers.map((trans) => (
                  <div key={trans.id} style={{
                    padding: '20px',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--border-gold)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '16px' }}>{trans.coinId}</span>
                      <span style={{ fontSize: '12px', background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                        {trans.askingPrice} € Pactado
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span>{t('admin.seller')}: <strong style={{ color: '#FFFFFF' }}>{trans.sellerId}</strong></span>
                      <span>{t('admin.buyer')}: <strong style={{ color: '#FFFFFF' }}>{trans.buyerId}</strong></span>
                      <span>{t('admin.paid_snapshot')}: <strong style={{ color: '#FFFFFF' }}>{trans.paidAmountSnapshot} €</strong></span>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                      <button 
                        id={`btn-approve-trans-${trans.id}`}
                        onClick={() => handleApprove(trans.id)}
                        className="btn-gold" 
                        style={{ flexGrow: 1, padding: '10px 16px', fontSize: '13px' }}
                        disabled={actionLoading[trans.id]}
                      >
                        <Check size={14} />
                        <span>{t('admin.btn_approve')}</span>
                      </button>
                      <button 
                        id={`btn-reject-trans-${trans.id}`}
                        onClick={() => handleReject(trans.id)}
                        className="btn-outline" 
                        style={{ flexGrow: 1, padding: '10px 16px', fontSize: '13px', color: '#EB5757', borderColor: 'rgba(235,87,87,0.2)' }}
                        disabled={actionLoading[trans.id]}
                      >
                        <X size={14} />
                        <span>{t('admin.btn_reject')}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form to Register Coin */}
          <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Plus size={20} style={{ color: '#D4AF37' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{t('admin.form_title')}</h3>
            </div>

            <form onSubmit={handleCreateCoin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="premium-label" htmlFor="admin-coin-continent">{t('admin.inv_continent')}</label>
                  <select
                    id="admin-coin-continent"
                    className="premium-input"
                    value={continent}
                    onChange={(e) => setContinent(e.target.value)}
                    style={{ background: '#141416', cursor: 'pointer' }}
                  >
                    <option value="EU">{t('continent.EU')} (EU)</option>
                    <option value="LA">{t('continent.LA')} (LA)</option>
                    <option value="AF">{t('continent.AF')} (AF)</option>
                    <option value="AS">{t('continent.AS')} (AS)</option>
                    <option value="OC">{t('continent.OC')} (OC)</option>
                  </select>
                </div>
                <div>
                  <label className="premium-label" htmlFor="admin-coin-number">{t('admin.form_num_seq')}</label>
                  <input
                    id="admin-coin-number"
                    type="text"
                    required
                    className="premium-input"
                    placeholder="e.g. 0000001"
                    value={number}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, ''); // Solo números/dígitos
                      setNumber(clean);
                    }}
                    onBlur={() => {
                      if (number && !isNaN(parseInt(number))) {
                        setNumber(String(parseInt(number)).padStart(7, '0'));
                      }
                    }}
                  />
                </div>
              </div>

              {/* Formulario de Datos del Comprador (si la moneda ya existe en el catálogo y está libre para reservar) */}
              {existingCoin && existingCoin.status === 'available' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#D4AF37', margin: '0 0 8px 0' }}>
                    {t('admin.form_btn_reserve')} ({existingCoin.id})
                  </h4>
                  
                  <div>
                    <label className="premium-label" htmlFor="admin-buyer-email">Email o User ID del Comprador</label>
                    <input
                      id="admin-buyer-email"
                      type="text"
                      required
                      className="premium-input"
                      placeholder="cliente@email.com o UID del usuario (ej: 6OWAhw...)"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                    />
                  </div>

                  {user?.email === 'superadmin@dicilo.net' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <input
                        id="admin-open-credit"
                        type="checkbox"
                        checked={openCredit}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setOpenCredit(checked);
                          if (checked) {
                            setPayWithDp(false);
                            setBuyerEmail('superadmin@dicilo.net');
                            setBuyerFullName(profile?.firstName && profile?.lastName ? `${profile.firstName} ${profile.lastName}` : 'Super Admin');
                            setBuyerPhone('+34 600 000 000');
                            setBuyerCountry('España');
                            setBuyerCity('Madrid');
                            setBuyerAddress('Oficina Central DiciCoin');
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      <label htmlFor="admin-open-credit" style={{ fontSize: '13px', color: '#D4AF37', cursor: 'pointer', userSelect: 'none', fontWeight: 600 }}>
                        Reservar para mí con Crédito Abierto (0 € inicial / deuda de 5,000 €)
                      </label>
                    </div>
                  )}

                  {!openCredit && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <input
                        id="admin-pay-with-dp"
                        type="checkbox"
                        checked={payWithDp}
                        onChange={(e) => setPayWithDp(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <label htmlFor="admin-pay-with-dp" style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
                        Descontar automáticamente 5,000 DP (DiciPoints) de la wallet del usuario
                      </label>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="premium-label" htmlFor="admin-buyer-name">{t('admin.buyer_name')}</label>
                      <input
                        id="admin-buyer-name"
                        type="text"
                        required
                        className="premium-input"
                        placeholder="Juan Pérez"
                        value={buyerFullName}
                        onChange={(e) => setBuyerFullName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="premium-label" htmlFor="admin-buyer-phone">{t('admin.buyer_phone')}</label>
                      <input
                        id="admin-buyer-phone"
                        type="text"
                        required
                        className="premium-input"
                        placeholder="+34 600 000 000"
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="premium-label" htmlFor="admin-buyer-country">{t('admin.buyer_country')}</label>
                      <input
                        id="admin-buyer-country"
                        type="text"
                        required
                        className="premium-input"
                        value={buyerCountry}
                        onChange={(e) => setBuyerCountry(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="premium-label" htmlFor="admin-buyer-city">{t('admin.buyer_city')}</label>
                      <input
                        id="admin-buyer-city"
                        type="text"
                        required
                        className="premium-input"
                        placeholder="Madrid"
                        value={buyerCity}
                        onChange={(e) => setBuyerCity(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="premium-label" htmlFor="admin-buyer-address">{t('admin.buyer_address')}</label>
                      <input
                        id="admin-buyer-address"
                        type="text"
                        required
                        className="premium-input"
                        placeholder="Calle Gran Vía 12"
                        value={buyerAddress}
                        onChange={(e) => setBuyerAddress(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Mensaje de error si la moneda existe pero no está disponible */}
              {existingCoin && existingCoin.status !== 'available' && (
                <div style={{ padding: '16px', background: 'rgba(235, 87, 87, 0.05)', border: '1px solid rgba(235, 87, 87, 0.2)', borderRadius: 'var(--radius-sm)', color: '#EB5757', fontSize: '13px' }}>
                  {t('admin.error_coin_already_reserved')}
                </div>
              )}

              {/* Vista previa del ID que se registrará */}
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('admin.form_preview')}:</span>
                <p style={{ fontSize: '18px', fontWeight: 800, color: '#D4AF37', marginTop: '4px', letterSpacing: '0.05em' }}>
                  {(() => {
                    const numPart = number ? String(parseInt(number)).padStart(7, '0') : 'XXXXXXX';
                    return `${prefix}${numPart}`;
                  })()}
                </p>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('admin.form_preview_note')}</span>
              </div>

              <button 
                id="admin-coin-submit-btn" 
                type="submit" 
                className="btn-gold" 
                style={{ width: '100%', marginTop: '8px' }} 
                disabled={formLoading || (existingCoin && existingCoin.status !== 'available')}
              >
                {formLoading 
                  ? t('admin.form_btn_submit_loading') 
                  : existingCoin 
                    ? t('admin.form_btn_reserve') 
                    : t('admin.form_btn_submit')
                }
              </button>
            </form>
          </div>

        </div>

        {/* Global Inventory List */}
        <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileText size={20} style={{ color: 'var(--text-secondary)' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
                {t('admin.inventory_title')} - {t(`continent.${continent}`)} ({filteredCoins.length})
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 0 32px' }}>
              {t('admin.inventory_instructions')}
            </p>
          </div>

          {loadingCoins ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <div className="animate-spin-slow" style={{ width: '24px', height: '24px', border: '2px solid rgba(212, 175, 55, 0.1)', borderTopColor: '#D4AF37', borderRadius: '50%' }} />
            </div>
          ) : filteredCoins.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-muted)', fontSize: '14px' }}>
              {t('admin.inventory_empty')}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px 16px' }}>{t('admin.inv_coin_id')}</th>
                    <th style={{ padding: '12px 16px' }}>{t('admin.inv_serial')}</th>
                    <th style={{ padding: '12px 16px' }}>{t('admin.inv_continent')}</th>
                    <th style={{ padding: '12px 16px' }}>{t('admin.inv_status')}</th>
                    <th style={{ padding: '12px 16px' }}>{t('admin.inv_paid')}</th>
                    <th style={{ padding: '12px 16px' }}>{t('admin.inv_owner')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoins.map((coin) => {
                    const normalized = coin.continent === 'NA' ? 'OC' : coin.continent;
                    return (
                      <tr key={coin.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td 
                          style={{ padding: '16px', fontWeight: 700, cursor: 'pointer', color: '#D4AF37', textDecoration: 'underline' }}
                          onClick={() => {
                            setNumber(String(coin.number).padStart(7, '0'));
                            const formElement = document.getElementById('admin-coin-number');
                            if (formElement) {
                              formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              formElement.focus();
                            }
                          }}
                          title={t('admin.click_to_populate')}
                        >
                          {coin.id}
                        </td>
                        <td style={{ padding: '16px', color: coin.serial ? '#00E5FF' : 'var(--text-muted)', fontFamily: 'monospace', fontSize: '12px' }}>
                          {coin.serial || t('admin.inv_available')}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ color: '#D4AF37', fontWeight: 600 }}>{t(`continent.${normalized}`)}</span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: coin.status === 'available' ? 'rgba(46,204,113,0.1)' : 'rgba(212,175,55,0.1)',
                            color: coin.status === 'available' ? '#2ECC71' : '#D4AF37'
                          }}>
                            {coin.status?.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '16px', fontWeight: 600 }}>{coin.paidAmount} €</td>
                        <td style={{ padding: '16px', color: coin.currentOwnerId ? '#FFFFFF' : 'var(--text-muted)' }}>
                          {coin.currentOwnerId || t('admin.inv_owner_none')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
          </>
        )}

        {activeTab === 'pending_payments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* PAGOS PENDIENTES REVOLUT */}
            {(() => {
              const hasPending = pendingPreReservations.length > 0 || pendingInstallmentPayments.length > 0;
              return (
                <div className="glass-gold" style={{ padding: '32px', borderRadius: 'var(--radius-md)', border: '1px solid #D4AF37', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#D4AF37' }}>
                    <Clock size={22} className={hasPending ? "animate-pulse" : ""} />
                    <h3 style={{ fontSize: '18px', fontWeight: 800 }}>
                      {t('admin.pending_payments_title')} ({(pendingPreReservations.length + pendingInstallmentPayments.length)})
                    </h3>
                  </div>
                  
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {t('admin.pending_payments_desc')}
                  </p>

                  {!hasPending ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '14px', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(212,175,55,0.15)', borderRadius: 'var(--radius-sm)' }}>
                      {t('admin.no_pending_payments')}
                    </div>
                  ) : (
                    <>
                      {/* Subsección: Pre-reservas iniciales */}
                      {pendingPreReservations.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#D4AF37', borderBottom: '1px solid rgba(212,175,55,0.1)', paddingBottom: '6px' }}>
                            {t('admin.pre_reservations_subtitle')}
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }} className="admin-grid">
                            {pendingPreReservations.map(res => {
                              const relatedPayment = pendingPayments.find(p => p.reservationId === res.id);
                              const pMethod = relatedPayment?.paymentMethod || 'revolut_transfer';
                              const isCard = pMethod === 'card_outside_eu';
                              return (
                                <div key={res.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '15px' }}>{res.coinId}</span>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <span style={{
                                        fontSize: '11px',
                                        background: isCard ? 'rgba(0, 229, 255, 0.15)' : 'rgba(212, 175, 55, 0.15)',
                                        color: isCard ? '#00E5FF' : '#D4AF37',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontWeight: 700
                                      }}>
                                        {isCard ? t('admin.payment_method_card') : t('admin.payment_method_revolut')}
                                      </span>
                                      <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                                        500.00 € {t('admin.amount_pending')}
                                      </span>
                                    </div>
                                  </div>
                                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    <div>{t('admin.col_owner')}: <strong style={{ color: '#FFFFFF' }}>{res.shippingInfo?.fullName}</strong></div>
                                    <div>{t('login.email')}: <strong>{res.shippingInfo?.email}</strong></div>
                                    <div>{t('admin.buyer_phone')}: <strong>{res.shippingInfo?.phone}</strong></div>
                                    <div>{isCard ? t('admin.reference_card') : t('admin.reference_revolut')}: <strong style={{ color: '#00E5FF', fontFamily: 'monospace' }}>DICI-RES-{res.coinId}</strong></div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                                    <button
                                      onClick={() => handleApproveRevolutPayment(res.id)}
                                      className="btn-gold"
                                      style={{ flexGrow: 1, padding: '8px 16px', fontSize: '13px' }}
                                      disabled={actionLoading[res.id]}
                                    >
                                      {t('admin.btn_approve_reservation')}
                                    </button>
                                    <button
                                      onClick={() => handleCancelPreReservation(res.id)}
                                      className="btn-outline"
                                      style={{ flexGrow: 1, padding: '8px 16px', fontSize: '13px', color: '#EB5757', borderColor: 'rgba(235,87,87,0.2)' }}
                                      disabled={actionLoading[res.id]}
                                    >
                                      {t('admin.btn_cancel_pre_reservation')}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Subsección: Cuotas e Installments */}
                      {pendingInstallmentPayments.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#D4AF37', borderBottom: '1px solid rgba(212,175,55,0.1)', paddingBottom: '6px' }}>
                            {t('admin.installments_subtitle')}
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }} className="admin-grid">
                            {pendingInstallmentPayments.map(pay => {
                              const isCard = pay.paymentMethod === 'card_outside_eu';
                              return (
                                <div key={pay.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '15px' }}>{pay.coinId}</span>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <span style={{
                                        fontSize: '11px',
                                        background: isCard ? 'rgba(0, 229, 255, 0.15)' : 'rgba(212, 175, 55, 0.15)',
                                        color: isCard ? '#00E5FF' : '#D4AF37',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontWeight: 700
                                      }}>
                                        {isCard ? t('admin.payment_method_card') : t('admin.payment_method_revolut')}
                                      </span>
                                      <span style={{ fontSize: '11px', background: 'rgba(0, 229, 255, 0.1)', color: '#00E5FF', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                                        {pay.amount.toFixed(2)} € {t('admin.amount_pending')}
                                      </span>
                                    </div>
                                  </div>
                                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    <div>{t('admin.uid_user')}: <strong>{pay.userId}</strong></div>
                                    <div>{t('admin.res_id')}: <strong>{pay.reservationId}</strong></div>
                                    <div>{isCard ? t('admin.reference_card') : t('admin.reference_revolut')}: <strong style={{ color: '#00E5FF', fontFamily: 'monospace' }}>DICI-PAY-{pay.reservationId}</strong></div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                                    <button
                                      onClick={() => handleApproveInstallmentPayment(pay.id)}
                                      className="btn-gold"
                                      style={{ flexGrow: 1, padding: '8px 16px', fontSize: '13px' }}
                                      disabled={actionLoading[pay.id]}
                                    >
                                      {t('admin.btn_approve_installment')}
                                    </button>
                                    <button
                                      onClick={() => handleRejectInstallmentPayment(pay.id)}
                                      className="btn-outline"
                                      style={{ flexGrow: 1, padding: '8px 16px', fontSize: '13px', color: '#EB5757', borderColor: 'rgba(235,87,87,0.2)' }}
                                      disabled={actionLoading[pay.id]}
                                    >
                                      {t('admin.btn_reject_installment')}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'users_reservations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* LISTADO GLOBAL DE RESERVAS */}
            <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FileText size={20} style={{ color: '#D4AF37' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{t('admin.reservations_list_title')}</h3>
              </div>

              {loadingReservations ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                  <div className="animate-spin-slow" style={{ width: '24px', height: '24px', border: '2px solid rgba(212, 175, 55, 0.1)', borderTopColor: '#D4AF37', borderRadius: '50%' }} />
                </div>
              ) : allReservations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-muted)', fontSize: '14px' }}>
                  {t('admin.no_reservations')}
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '12px 16px' }}>{t('admin.col_coin_res_id')}</th>
                        <th style={{ padding: '12px 16px' }}>{t('admin.col_owner')}</th>
                        <th style={{ padding: '12px 16px' }}>{t('admin.col_contact')}</th>
                        <th style={{ padding: '12px 16px' }}>{t('admin.col_shipping_address')}</th>
                        <th style={{ padding: '12px 16px' }}>{t('admin.col_status_progress')}</th>
                        <th style={{ padding: '12px 16px' }}>{t('admin.col_actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allReservations.map((res) => {
                        const isCompleted = res.status === 'completed';
                        const isPending = res.status === 'pending_payment';
                        const ship = res.shippingInfo || {};
                        return (
                          <tr key={res.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ padding: '16px' }}>
                              <strong style={{ color: '#D4AF37', display: 'block' }}>{res.coinId}</strong>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {res.id}</span>
                            </td>
                            <td style={{ padding: '16px', fontWeight: 600, color: '#FFFFFF' }}>
                              {ship.fullName || t('admin.not_defined')}
                            </td>
                            <td style={{ padding: '16px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span>{ship.email || 'N/D'}</span>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ship.phone || 'N/D'}</span>
                              </div>
                            </td>
                            <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                              {ship.address ? (
                                <span>{ship.address}, {ship.city}, {ship.country}</span>
                              ) : (
                                <span>{t('admin.no_address')}</span>
                              )}
                            </td>
                            <td style={{ padding: '16px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: '10px',
                                  background: isPending ? 'rgba(212,175,55,0.1)' : (isCompleted ? 'rgba(46,204,113,0.1)' : 'rgba(0,229,255,0.1)'),
                                  color: isPending ? '#D4AF37' : (isCompleted ? '#2ECC71' : '#00E5FF'),
                                  display: 'inline-block',
                                  width: 'fit-content'
                                }}>
                                  {res.status?.toUpperCase()}
                                </span>
                                <span style={{ fontSize: '11px', fontWeight: 600 }}>
                                  {res.paidAmount} € / {res.totalAmount} € ({res.progressPercentage?.toFixed(0)}%)
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '16px' }}>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                  onClick={() => handleEditAdminClick(res)}
                                  className="btn-outline" 
                                  style={{ padding: '6px 12px', fontSize: '12px' }}
                                  title={t('admin.tooltip_edit')}
                                >
                                  {t('admin.btn_edit')}
                                </button>
                                <button 
                                  onClick={() => setHistoryRes(res)}
                                  className="btn-outline" 
                                  style={{ padding: '6px 12px', fontSize: '12px' }}
                                  title={t('admin.tooltip_history')}
                                >
                                  {t('admin.btn_history')}
                                </button>
                                <button 
                                  onClick={() => setCertCoinId(res.coinId)}
                                  className="btn-outline" 
                                  title={t('admin.tooltip_cert')}
                                  disabled={isPending}
                                  style={{
                                    padding: '6px 12px',
                                    fontSize: '12px',
                                    opacity: isPending ? 0.4 : 1,
                                    cursor: isPending ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  {t('admin.btn_certificate')}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'financials' && profile?.role === 'superadmin' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* KPI METRICS */}
            {loadingFinancials ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <div className="animate-spin-slow" style={{ width: '24px', height: '24px', border: '2px solid rgba(212, 175, 55, 0.1)', borderTopColor: '#D4AF37', borderRadius: '50%' }} />
              </div>
            ) : financialSummary ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Resumen de Métricas Financieras</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Control de ingresos totales, métodos de cobro y distribución de licencias DiciCoin.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={loadFinancialData} 
                      className="btn-outline" 
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '13px' }}
                    >
                      <Activity size={14} /> Refrescar
                    </button>
                    <button 
                      onClick={exportToCSV} 
                      className="btn-gold" 
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '13px' }}
                    >
                      <FileSpreadsheet size={14} /> Exportar CSV
                    </button>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '20px'
                }}>
                  <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #2ECC71' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Recibido EUR (Fiat)</span>
                    <h4 style={{ fontSize: '24px', fontWeight: 800, color: '#2ECC71', marginTop: '8px' }}>{financialSummary.totalReceivedEur} €</h4>
                  </div>
                  <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #00E5FF' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Recibido USDT (Cripto)</span>
                    <h4 style={{ fontSize: '24px', fontWeight: 800, color: '#00E5FF', marginTop: '8px' }}>{financialSummary.totalReceivedUsdt} USDT</h4>
                  </div>
                  <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Masters Activos</span>
                    <h4 style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', marginTop: '8px' }}>{financialSummary.activeMastersCount}</h4>
                  </div>
                  <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Participantes Activos</span>
                    <h4 style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', marginTop: '8px' }}>{financialSummary.activeParticipantsCount}</h4>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '20px'
                }}>
                  <div className="glass" style={{ padding: '16px', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Métricas por Método</span>
                    <div style={{ marginTop: '10px', fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>USDT TRC20:</span><strong>{financialSummary.paymentMethodsCount?.usdt_trc20 || 0}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Revolut Transfer:</span><strong>{financialSummary.paymentMethodsCount?.revolut_transfer || 0}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Bank Wire:</span><strong>{financialSummary.paymentMethodsCount?.bank_wire || 0}</strong></div>
                    </div>
                  </div>
                  <div className="glass" style={{ padding: '16px', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Estatus Catálogo</span>
                    <div style={{ marginTop: '10px', fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Disponibles:</span><strong>{financialSummary.coinsAvailable}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Reservadas/Equipo:</span><strong>{financialSummary.coinsReserved}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Fraccionadas:</span><strong>{financialSummary.coinsFractional}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Pagadas/Completas:</span><strong>{financialSummary.coinsPaid}</strong></div>
                    </div>
                  </div>
                </div>

                {/* 1. SECCIÓN: ÓRDENES FIAT/MANUALES PENDIENTES DE APROBACIÓN */}
                <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <TrendingUp size={20} style={{ color: '#D4AF37' }} />
                    <h4 style={{ fontSize: '16px', fontWeight: 800 }}>Órdenes Fiat & Manuales Pendientes</h4>
                  </div>
                  {fiatOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
                      No hay órdenes fiat o cripto pendientes de procesamiento en el sistema.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '10px 12px' }}>Orden ID</th>
                            <th style={{ padding: '10px 12px' }}>Usuario ID</th>
                            <th style={{ padding: '10px 12px' }}>Moneda / Frac</th>
                            <th style={{ padding: '10px 12px' }}>Importe Esperado</th>
                            <th style={{ padding: '10px 12px' }}>Método Pago</th>
                            <th style={{ padding: '10px 12px' }}>Estado</th>
                            <th style={{ padding: '10px 12px' }}>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fiatOrders.map(ord => (
                            <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                              <td style={{ padding: '12px', fontWeight: 600 }}>{ord.order_id}</td>
                              <td style={{ padding: '12px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '11px' }}>{ord.user_id}</td>
                              <td style={{ padding: '12px' }}>
                                <strong style={{ color: '#FFFFFF' }}>{ord.dicicoin_id}</strong>
                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)' }}>Fracción del {ord.ownership_percentage}%</span>
                              </td>
                              <td style={{ padding: '12px', fontWeight: 700, color: '#D4AF37' }}>
                                {ord.expected_amount_eur} EUR {ord.expected_amount_usdt > 0 && `(${ord.expected_amount_usdt} USDT)`}
                              </td>
                              <td style={{ padding: '12px', textTransform: 'capitalize' }}>{ord.payment_method?.replace(/_/g, ' ')}</td>
                              <td style={{ padding: '12px' }}>
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: '10px',
                                  background: 'rgba(212, 175, 55, 0.1)',
                                  color: '#D4AF37'
                                }}>
                                  {ord.payment_status?.toUpperCase()}
                                </span>
                              </td>
                              <td style={{ padding: '12px' }}>
                                <button 
                                  onClick={() => handleApproveFiat(ord.order_id)}
                                  className="btn-gold"
                                  style={{ padding: '6px 12px', fontSize: '11.5px' }}
                                  disabled={actionLoading[ord.order_id]}
                                >
                                  Aprobar Manual
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 2. SECCIÓN: INVENTARIO / BÚSQUEDA AVANZADA */}
                <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Search size={20} style={{ color: '#00E5FF' }} />
                    <h4 style={{ fontSize: '16px', fontWeight: 800 }}>Búsqueda Avanzada de Monedas & Propietarios</h4>
                  </div>
                  <form onSubmit={handleSearchCoins} style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '16px',
                    alignItems: 'end'
                  }}>
                    <div>
                      <label className="premium-label" style={{ fontSize: '11px' }}>Continente</label>
                      <select 
                        className="premium-input" 
                        value={searchFilters.continent} 
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, continent: e.target.value }))}
                        style={{ background: '#141416' }}
                      >
                        <option value="">Todos</option>
                        <option value="EU">Europa</option>
                        <option value="LA">Latinoamérica</option>
                        <option value="AF">África</option>
                        <option value="AS">Asia</option>
                        <option value="OC">Oceanía</option>
                      </select>
                    </div>
                    <div>
                      <label className="premium-label" style={{ fontSize: '11px' }}>Estado</label>
                      <select 
                        className="premium-input" 
                        value={searchFilters.status} 
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, status: e.target.value }))}
                        style={{ background: '#141416' }}
                      >
                        <option value="">Todos</option>
                        <option value="available">Disponible</option>
                        <option value="forming_team">Formando Equipo</option>
                        <option value="active_fractional">Fraccionada Activa</option>
                        <option value="paid">Pagada / Completa</option>
                      </select>
                    </div>
                    <div>
                      <label className="premium-label" style={{ fontSize: '11px' }}>Serial Digital</label>
                      <input 
                        type="text" 
                        className="premium-input" 
                        placeholder="e.g. DC-EUJ..." 
                        value={searchFilters.serial} 
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, serial: e.target.value }))} 
                      />
                    </div>
                    <div>
                      <label className="premium-label" style={{ fontSize: '11px' }}>ID de Propietario</label>
                      <input 
                        type="text" 
                        className="premium-input" 
                        placeholder="UID del propietario..." 
                        value={searchFilters.ownerId} 
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, ownerId: e.target.value }))} 
                      />
                    </div>
                    <button type="submit" className="btn-gold" style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Search size={14} /> Buscar
                    </button>
                  </form>

                  {searchingCoins ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                      <div className="animate-spin-slow" style={{ width: '20px', height: '20px', border: '2px solid rgba(0, 229, 255, 0.1)', borderTopColor: '#00E5FF', borderRadius: '50%' }} />
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div style={{ overflowX: 'auto', marginTop: '8px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '8px 10px' }}>Moneda ID</th>
                            <th style={{ padding: '8px 10px' }}>Serial Licencia</th>
                            <th style={{ padding: '8px 10px' }}>Continente</th>
                            <th style={{ padding: '8px 10px' }}>Estado</th>
                            <th style={{ padding: '8px 10px' }}>Monto Pagado</th>
                            <th style={{ padding: '8px 10px' }}>Propietario / Master ID</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchResults.map(coin => (
                            <tr key={coin.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                              <td style={{ padding: '10px', fontWeight: 700, color: '#D4AF37' }}>{coin.id}</td>
                              <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '11px', color: '#00E5FF' }}>{coin.serial || 'N/D'}</td>
                              <td style={{ padding: '10px' }}>{coin.continent}</td>
                              <td style={{ padding: '10px' }}>
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: '10px',
                                  background: coin.status === 'available' ? 'rgba(46,204,113,0.1)' : 'rgba(212,175,55,0.1)',
                                  color: coin.status === 'available' ? '#2ECC71' : '#D4AF37',
                                  textTransform: 'uppercase'
                                }}>
                                  {coin.status}
                                </span>
                              </td>
                              <td style={{ padding: '10px', fontWeight: 600 }}>{coin.paidAmount} €</td>
                              <td style={{ padding: '10px', color: coin.currentOwnerId ? '#FFFFFF' : 'var(--text-muted)', fontSize: '11px', fontFamily: 'monospace' }}>
                                {coin.currentOwnerId || 'Ninguno'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    searchResults.length === 0 && searchFilters.serial && (
                      <div style={{ textAlign: 'center', padding: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>
                        No se encontraron monedas que coincidan con los filtros ingresados.
                      </div>
                    )
                  )}
                </div>

                {/* 3. SECCIÓN: LOGS DE AUDITORÍA GENERAL */}
                <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Database size={20} style={{ color: '#9B59B6' }} />
                    <h4 style={{ fontSize: '16px', fontWeight: 800 }}>Historial de Auditoría en Tiempo Real</h4>
                  </div>
                  {loadingLogs ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                      <div className="animate-spin-slow" style={{ width: '20px', height: '20px', border: '2px solid rgba(155, 89, 182, 0.1)', borderTopColor: '#9B59B6', borderRadius: '50%' }} />
                    </div>
                  ) : auditLogs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No se han registrado eventos de auditoría todavía.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left', minWidth: '700px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '8px 10px' }}>Fecha y Hora</th>
                            <th style={{ padding: '8px 10px' }}>Usuario ID</th>
                            <th style={{ padding: '8px 10px' }}>Acción</th>
                            <th style={{ padding: '8px 10px' }}>Licencia Serial</th>
                            <th style={{ padding: '8px 10px' }}>Porcentaje</th>
                            <th style={{ padding: '8px 10px' }}>Rol</th>
                            <th style={{ padding: '8px 10px' }}>Monto EUR / USDT</th>
                            <th style={{ padding: '8px 10px' }}>Hash Transacción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditLogs.map(log => {
                            const isCrypto = log.payment_type === 'usdt_trc20';
                            return (
                              <tr key={log.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{getFormatDate(log.timestamp)}</td>
                                <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '11px' }}>{log.userId}</td>
                                <td style={{ padding: '10px', fontWeight: 600 }}>
                                  <span style={{
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: log.action?.includes('APPROVE') ? 'rgba(46,204,113,0.1)' : 'rgba(0, 229, 255, 0.1)',
                                    color: log.action?.includes('APPROVE') ? '#2ECC71' : '#00E5FF'
                                  }}>
                                    {log.action}
                                  </span>
                                </td>
                                <td style={{ padding: '10px', fontFamily: 'monospace', color: '#00E5FF' }}>{log.serial}</td>
                                <td style={{ padding: '10px', fontWeight: 600 }}>{log.percentage}%</td>
                                <td style={{ padding: '10px' }}>{log.role}</td>
                                <td style={{ padding: '10px', fontWeight: 600, color: '#2ECC71' }}>
                                  {log.amount_eur} € {log.amount_usdt > 0 && `(${log.amount_usdt} USDT)`}
                                </td>
                                <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '11px' }}>
                                  {log.tx_hash === 'MANUAL_ADMIN_FIAT' ? (
                                    <span style={{ color: 'var(--text-muted)' }}>Aprobado Manual</span>
                                  ) : (
                                    <span title={log.tx_hash} style={{ maxWidth: '80px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {log.tx_hash}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No se pudieron cargar los datos financieros del Superadmin.
              </div>
            )}
          </div>
        )}

        {/* Modal: Admin Edit Reservation */}
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
                id="close-admin-edit-modal-btn"
                onClick={() => setEditingRes(null)} 
                style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <ShieldAlert size={24} style={{ color: '#D4AF37' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
                  {t('admin.edit_title').replace('{coinId}', editingRes.coinId)}
                </h3>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {t('admin.edit_desc')}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="premium-label" style={{ fontSize: '11px' }}>{t('res.form_name')}</label>
                  <input 
                    type="text" 
                    className="premium-input" 
                    style={{ fontSize: '13px' }}
                    value={editForm.fullName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="premium-label" style={{ fontSize: '11px' }}>{t('login.email')}</label>
                    <input 
                      type="email" 
                      className="premium-input" 
                      style={{ fontSize: '13px' }}
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="premium-label" style={{ fontSize: '11px' }}>{t('admin.buyer_phone')}</label>
                    <input 
                      type="text" 
                      className="premium-input" 
                      style={{ fontSize: '13px' }}
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="premium-label" style={{ fontSize: '11px' }}>{t('admin.buyer_country')}</label>
                    <input 
                      type="text" 
                      className="premium-input" 
                      style={{ fontSize: '13px' }}
                      value={editForm.country}
                      onChange={(e) => setEditForm(prev => ({ ...prev, country: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="premium-label" style={{ fontSize: '11px' }}>{t('admin.buyer_city')}</label>
                    <input 
                      type="text" 
                      className="premium-input" 
                      style={{ fontSize: '13px' }}
                      value={editForm.city}
                      onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="premium-label" style={{ fontSize: '11px' }}>{t('admin.col_shipping_address')}</label>
                  <input 
                    type="text" 
                    className="premium-input" 
                    style={{ fontSize: '13px' }}
                    value={editForm.address}
                    onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
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
                  {t('admin.success_saved')}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                <button 
                  onClick={() => setEditingRes(null)} 
                  className="btn-outline" 
                  style={{ flexGrow: 1, padding: '12px' }}
                >
                  {t('admin.btn_cancel')}
                </button>
                <button 
                  onClick={handleSaveAdminEdit} 
                  className="btn-gold" 
                  style={{ flexGrow: 1, padding: '12px' }}
                  disabled={editLoading}
                >
                  {editLoading ? t('admin.btn_saving_changes') : t('admin.btn_save_changes')}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Modal: View Audit History */}
        {historyRes && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 50, padding: '24px'
          }}>
            <div className="glass-gold" style={{
              width: '100%', maxWidth: '700px', borderRadius: 'var(--radius-md)',
              padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px',
              position: 'relative', maxHeight: '90vh', overflowY: 'auto'
            }}>
              <button 
                onClick={() => setHistoryRes(null)} 
                style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Activity size={24} style={{ color: '#D4AF37' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
                  {t('admin.history_title').replace('{coinId}', historyRes.coinId)}
                </h3>
              </div>

              {(() => {
                const history: any[] = historyRes.changeHistory || [];
                if (history.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-muted)' }}>
                      {t('admin.no_history_records')}
                    </div>
                  );
                }

                const formatHistoryDate = (timestamp: any) => {
                  if (!timestamp) return 'Reciente';
                  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
                  return date.toLocaleString('es-ES');
                };

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {history.map((log, idx) => (
                      <div key={idx} style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#D4AF37', fontWeight: 700, marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                          <span>{t('admin.history_log_entry').replace('{number}', String(idx + 1)).replace('{date}', formatHistoryDate(log.timestamp))}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {t('admin.modified_by')} <strong style={{ color: '#FFFFFF' }}>{log.changedBy}</strong>
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px' }}>
                          <div>
                            <span style={{ color: '#EB5757', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>{t('admin.previous_values')}</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              <span>{t('res.form_name')}: <strong>{log.previousValues?.fullName || 'N/D'}</strong></span>
                              <span>{t('login.email')}: <strong>{log.previousValues?.email || 'N/D'}</strong></span>
                              <span>{t('admin.buyer_phone')}: <strong>{log.previousValues?.phone || 'N/D'}</strong></span>
                              <span>{t('admin.col_shipping_address')}: <strong>{log.previousValues?.address || 'N/D'}</strong></span>
                              <span>{t('admin.buyer_city')}/{t('admin.buyer_country')}: <strong>{log.previousValues?.city || 'N/D'}, {log.previousValues?.country || 'N/D'}</strong></span>
                            </div>
                          </div>

                          <div>
                            <span style={{ color: '#2ECC71', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>{t('admin.new_values')}</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              <span>{t('res.form_name')}: <strong>{log.newValues?.fullName || 'N/D'}</strong></span>
                              <span>{t('login.email')}: <strong>{log.newValues?.email || 'N/D'}</strong></span>
                              <span>{t('admin.buyer_phone')}: <strong>{log.newValues?.phone || 'N/D'}</strong></span>
                              <span>{t('admin.col_shipping_address')}: <strong>{log.newValues?.address || 'N/D'}</strong></span>
                              <span>{t('admin.buyer_city')}/{t('admin.buyer_country')}: <strong>{log.newValues?.city || 'N/D'}, {log.newValues?.country || 'N/D'}</strong></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button 
                  onClick={() => setHistoryRes(null)} 
                  className="btn-gold" 
                  style={{ padding: '10px 24px' }}
                >
                  {t('admin.btn_close_history')}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Modal: Admin Certificate Viewer */}
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
                  <p>
                    {t('res.cert_verification_text')}
                  </p>
                </div>

                {/* QR Code and Meta */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '32px', margin: '16px 0', flexWrap: 'wrap' }}>
                  {(() => {
                    const resDoc = allReservations.find(r => r.coinId === certCoinId);
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
                        {allReservations.find(r => r.coinId === certCoinId)?.serial || 'Pendiente'}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Shipping & Holder Details display inside Certificate */}
                {(() => {
                  const resDoc = allReservations.find(r => r.coinId === certCoinId);
                  const ship = resDoc?.shippingInfo;
                  if (!ship) return null;
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
                        <div>{t('res.form_name')}: <strong style={{ color: '#FFFFFF' }}>{ship.fullName}</strong></div>
                        <div>{t('res.form_email')}: <strong style={{ color: '#FFFFFF' }}>{ship.email}</strong></div>
                        <div>{t('res.form_phone')}: <strong style={{ color: '#FFFFFF' }}>{ship.phone}</strong></div>
                      </div>
                      <span style={{ fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em', marginTop: '6px' }}>
                        {t('res.cert_shipping_dest')}
                      </span>
                      <div style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        <strong>{ship.address}</strong>, {ship.city}, {ship.country}
                      </div>
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

      </div>

      <style jsx global>{`
        @media (min-width: 1024px) {
          .admin-grid {
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
            z-index: 9999999 !important;
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
