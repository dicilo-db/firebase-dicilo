'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { createPhysicalCoin, approveTransfer, rejectTransfer, reservePhysicalCoinAsAdmin } from '@/app/actions/admin-actions';
import { Plus, Check, X, ShieldAlert, Award, FileText, Activity } from 'lucide-react';

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

  // Lists state
  const [allCoins, setAllCoins] = useState<DiciCoin[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<PendingTransfer[]>([]);
  const [loadingCoins, setLoadingCoins] = useState(true);
  const [loadingTransfers, setLoadingTransfers] = useState(true);

  const [message, setMessage] = useState({ text: '', type: '' });
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';

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
        }, payWithDp);

        if (res.success) {
          setMessage({ text: t(res.messageKey || 'admin.success_reserve'), type: 'success' });
          setNumber('');
          setBuyerEmail('');
          setBuyerFullName('');
          setBuyerPhone('');
          setBuyerCity('');
          setBuyerAddress('');
          setPayWithDp(false);
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

      </div>

      <style jsx global>{`
        @media (min-width: 1024px) {
          .admin-grid {
            grid-template-columns: 1.2fr 1fr !important;
          }
        }
      `}</style>
    </Navigation>
  );
}
