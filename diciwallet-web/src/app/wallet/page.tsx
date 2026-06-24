'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { convertDpToDc, transferDpPoints } from '@/app/actions/wallet-actions';
import { Award, Gem, ArrowRightLeft, Clock, Info, Send, Coins, ShieldCheck, User, Copy, ExternalLink, ChevronRight } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  type: string;
  description: string;
  timestamp: any;
}

export default function WalletPage() {
  const { user, profile, wallet } = useAuth();
  const { t, language } = useLanguage();
  const [dpAmount, setDpAmount] = useState('');
  const [dcPreview, setDcPreview] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTrx, setLoadingTrx] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Puntos DP transfer variables
  const [transferTargetId, setTransferTargetId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferMessage, setTransferMessage] = useState({ text: '', type: '' });

  // DiciCoin Fractions and USDT Orders state
  const [fractions, setFractions] = useState<any[]>([]);
  const [loadingFractions, setLoadingFractions] = useState(true);
  const [cryptoOrders, setCryptoOrders] = useState<any[]>([]);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  const userRole = (profile?.role || 'user').toLowerCase();
  const allowedRoles = ['team_leader', 'team_office', 'admin', 'superadmin'];
  const showTransfer = allowedRoles.includes(userRole);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amountVal = parseInt(transferAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setTransferMessage({ text: t('api.validation_invalid_amount'), type: 'error' });
      return;
    }

    if (amountVal > (wallet?.balance || 0)) {
      setTransferMessage({ text: t('wallet.validation_insufficient'), type: 'error' });
      return;
    }

    const confirmMsg = t('wallet.confirm_transfer')
      .replace('{amount}', String(amountVal))
      .replace('{target}', transferTargetId.trim());
      
    if (!window.confirm(confirmMsg)) return;

    setTransferLoading(true);
    setTransferMessage({ text: '', type: '' });

    try {
      const res = await transferDpPoints(user.uid, transferTargetId.trim(), amountVal);
      if (res.success) {
        setTransferMessage({ text: t(res.messageKey || 'api.transfer_success'), type: 'success' });
        setTransferTargetId('');
        setTransferAmount('');
      } else {
        setTransferMessage({ text: t(res.messageKey || 'api.server_error'), type: 'error' });
      }
    } catch (err: any) {
      console.error(err);
      setTransferMessage({ text: t('api.server_error'), type: 'error' });
    } finally {
      setTransferLoading(false);
    }
  };

  // Calcular la previsualización de DC
  useEffect(() => {
    const val = parseInt(dpAmount) || 0;
    setDcPreview(val / 10);
  }, [dpAmount]);

  // Cargar historial de transacciones del usuario
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'wallet_transactions'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Transaction[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      // Ordenar por fecha desc en memoria para evitar requerimiento de índice compuesto
      list.sort((a, b) => {
        const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
        const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
        return timeB - timeA;
      });
      setTransactions(list);
      setLoadingTrx(false);
    }, (error) => {
      console.error("Error loading transactions:", error);
      setLoadingTrx(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Cargar fracciones del usuario (Master y Participante)
  useEffect(() => {
    if (!user) return;
    setLoadingFractions(true);
    const q1 = query(collection(db, 'dicicoin_fractions'), where('master_user_id', '==', user.uid));
    const q2 = query(collection(db, 'dicicoin_fractions'), where('participant_user_id', '==', user.uid));

    const unsub1 = onSnapshot(q1, (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setFractions(prev => {
        const others = prev.filter(f => f.participant_user_id === user.uid);
        const merged = [...others, ...list];
        return Array.from(new Map(merged.map(item => [item.fraction_id || item.id, item])).values());
      });
      setLoadingFractions(false);
    });

    const unsub2 = onSnapshot(q2, (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setFractions(prev => {
        const others = prev.filter(f => f.master_user_id === user.uid);
        const merged = [...others, ...list];
        return Array.from(new Map(merged.map(item => [item.fraction_id || item.id, item])).values());
      });
      setLoadingFractions(false);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [user]);

  // Cargar órdenes cripto USDT TRC20 del usuario
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'coin_orders'),
      where('user_id', '==', user.uid),
      where('payment_method', '==', 'usdt_trc20')
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const timeA = a.created_at?.toDate ? a.created_at.toDate().getTime() : 0;
        const timeB = b.created_at?.toDate ? b.created_at.toDate().getTime() : 0;
        return timeB - timeA;
      });
      setCryptoOrders(list);
    });
    return unsubscribe;
  }, [user]);

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const dpVal = parseInt(dpAmount);
    if (isNaN(dpVal) || dpVal <= 0 || dpVal % 10 !== 0) {
      setMessage({ text: t('wallet.validation_multiple'), type: 'error' });
      return;
    }

    if (dpVal > (wallet?.balance || 0)) {
      setMessage({ text: t('wallet.validation_insufficient'), type: 'error' });
      return;
    }

    setBtnLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await convertDpToDc(user.uid, dpVal);
      if (res.success) {
        setMessage({ text: t(res.messageKey || 'api.conversion_success'), type: 'success' });
        setDpAmount('');
      } else {
        setMessage({ text: t(res.messageKey || 'api.server_error'), type: 'error' });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ text: t('wallet.error_conversion'), type: 'error' });
    } finally {
      setBtnLoading(false);
    }
  };

  const getFormatDate = (timestamp: any) => {
    if (!timestamp) return t('wallet.recent');
    const date = timestamp.toDate ? timestamp.timestamp?.toDate() || timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOrderId(id);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  // Localized string values
  const textTitlePortfolio = language === 'DE' ? 'DiciCoin Portfolio' : language === 'EN' ? 'DiciCoin Portfolio' : 'Portafolio DiciCoin';
  const textSubPortfolio = language === 'DE' ? 'Verwalten Sie Ihre physischen, digitalen und fraktionierten DiciCoins.' : language === 'EN' ? 'Manage your physical, digital, and fractional DiciCoins.' : 'Administre sus DiciCoins físicas, digitales y de propiedad fraccionada.';
  const textFractionalCoins = language === 'DE' ? 'Fraktionierte DiciCoins' : language === 'EN' ? 'Fractional DiciCoins' : 'Monedas Fraccionadas';
  const textEquivalentCoins = language === 'DE' ? 'Äquivalente Münzen' : language === 'EN' ? 'Equivalent Coins' : 'Monedas Equivalentes';
  const textActiveFractions = language === 'DE' ? 'Aktive Fraktionen' : language === 'EN' ? 'Active Fractions' : 'Fracciones Activas';
  const textMasterRole = language === 'DE' ? 'Master-Rolle' : language === 'EN' ? 'Master Role' : 'Rol Master';
  const textParticipantRole = language === 'DE' ? 'Teilnehmer-Rolle' : language === 'EN' ? 'Participant Role' : 'Rol Participante';
  const textSerialLicense = language === 'DE' ? 'Serienlizenz' : language === 'EN' ? 'Serial License' : 'Licencia Serial';
  const textCryptoTransactions = language === 'DE' ? 'USDT Krypto-Transaktionen' : language === 'EN' ? 'USDT Crypto Transactions' : 'Transacciones Cripto USDT';
  const textNoFractions = language === 'DE' ? 'Sie besitzen noch keine fraktionierten DiciCoins.' : language === 'EN' ? 'You do not own any fractional DiciCoins yet.' : 'Aún no posee participaciones de propiedad fraccionada.';
  const textNoOrders = language === 'DE' ? 'Keine USDT Krypto-Bestellungen gefunden.' : language === 'EN' ? 'No USDT crypto orders found.' : 'No se encontraron órdenes cripto USDT.';

  // Calculo de métricas DiciCoin
  const totalFractionPercentage = fractions.reduce((acc, curr) => acc + (curr.ownership_percentage || 0), 0);
  const masterFractionsCount = fractions.filter(f => f.master_user_id === user?.uid).length;
  const participantFractionsCount = fractions.filter(f => f.participant_user_id === user?.uid).length;
  const equivalentCoinsVal = (totalFractionPercentage / 100).toFixed(2);

  return (
    <Navigation>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Header */}
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 800 }}>{t('wallet.title')}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '4px' }}>{t('wallet.subtitle')}</p>
        </div>

        {/* Global Wallet metrics section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px'
        }}>
          {/* Card 1: Balance DP */}
          <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #00E5FF' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Balance DiciPoints (DP)</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '12px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#FFFFFF' }}>{wallet?.balance || 0}</span>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>DP</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Utilizados para comisiones y canjes.</p>
          </div>

          {/* Card 2: Balance DC */}
          <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #D4AF37' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>DiciCoins Digitales (DC)</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '12px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#D4AF37' }}>{wallet?.balanceDC || 0}</span>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>DC</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Monedas en su billetera digital.</p>
          </div>

          {/* Card 3: Inversión Acumulada */}
          <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #2ECC71' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Inversión Acumulada</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '12px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#2ECC71' }}>{wallet?.totalPaidEur || 0}</span>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>EUR</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Monto total pagado sobre DiciCoins.</p>
          </div>

          {/* Card 4: Propiedad Fraccionada */}
          <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #9B59B6' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>{textFractionalCoins}</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '12px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#FFFFFF' }}>{equivalentCoinsVal}</span>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>DC ({totalFractionPercentage}%)</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Master: <strong>{masterFractionsCount}</strong> | Participante: <strong>{participantFractionsCount}</strong>
            </p>
          </div>
        </div>

        {/* Double Column layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '24px'
        }} className="wallet-grid">
          
          {/* Actions Column (Conversion + optional Transfer) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Conversion Card */}
            <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(0, 229, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00E5FF' }}>
                  <ArrowRightLeft size={20} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{t('wallet.convert_card_title')}</h3>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '16px', display: 'flex', gap: '12px' }}>
                <Info size={16} style={{ color: '#00E5FF', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {t('wallet.rule_desc')}
                </div>
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

              <form onSubmit={handleConvert} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label className="premium-label" style={{ margin: 0 }} htmlFor="convert-dp-amount">{t('wallet.input_label')}</label>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('wallet.available')}: <strong>{wallet?.balance || 0} DP</strong></span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Award size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#00E5FF' }} />
                    <input
                      id="convert-dp-amount"
                      type="number"
                      required
                      step="10"
                      min="10"
                      className="premium-input"
                      style={{ paddingLeft: '48px' }}
                      placeholder={t('wallet.placeholder')}
                      value={dpAmount}
                      onChange={(e) => setDpAmount(e.target.value)}
                    />
                  </div>
                </div>

                {/* Conversion Graphic */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('wallet.give')}</span>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: '#00E5FF', marginTop: '4px' }}>{parseInt(dpAmount) || 0} DP</p>
                  </div>
                  <ArrowRightLeft size={16} style={{ color: 'var(--text-muted)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('wallet.receive')}</span>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: '#D4AF37', marginTop: '4px' }}>{dcPreview} DC</p>
                  </div>
                </div>

                <button id="convert-submit-btn" type="submit" className="btn-gold" style={{ width: '100%', marginTop: '8px' }} disabled={btnLoading || !dpAmount}>
                  {btnLoading ? t('wallet.btn_submit_loading') : t('wallet.btn_submit')}
                </button>
              </form>
            </div>

            {/* Transfer DP Card (visible for leadership roles) */}
            {showTransfer && (
              <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}>
                    <Send size={20} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{t('wallet.transfer_card_title')}</h3>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '16px', display: 'flex', gap: '12px' }}>
                  <Info size={16} style={{ color: '#D4AF37', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {t('wallet.transfer_desc')}
                  </div>
                </div>

                {transferMessage.text && (
                  <div style={{ 
                    background: transferMessage.type === 'success' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(235, 87, 87, 0.1)', 
                    border: transferMessage.type === 'success' ? '1px solid rgba(46, 204, 113, 0.2)' : '1px solid rgba(235, 87, 87, 0.2)', 
                    borderRadius: 'var(--radius-sm)', 
                    padding: '14px 16px', 
                    color: transferMessage.type === 'success' ? '#2ECC71' : '#EB5757', 
                    fontSize: '14px' 
                  }}>
                    {transferMessage.text}
                  </div>
                )}

                <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label className="premium-label" htmlFor="transfer-dicilo-id">{t('wallet.transfer_dicilo_id_label')}</label>
                    <input
                      id="transfer-dicilo-id"
                      type="text"
                      required
                      className="premium-input"
                      placeholder={t('wallet.transfer_dicilo_id_placeholder')}
                      value={transferTargetId}
                      onChange={(e) => setTransferTargetId(e.target.value.replace(/\s+/g, ''))}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label className="premium-label" style={{ margin: 0 }} htmlFor="transfer-amount">{t('wallet.transfer_amount_label')}</label>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('wallet.available')}: <strong>{wallet?.balance || 0} DP</strong></span>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Award size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#D4AF37' }} />
                      <input
                        id="transfer-amount"
                        type="number"
                        required
                        min="1"
                        className="premium-input"
                        style={{ paddingLeft: '48px' }}
                        placeholder={t('wallet.transfer_amount_placeholder')}
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  <button id="transfer-submit-btn" type="submit" className="btn-gold" style={{ width: '100%', marginTop: '8px' }} disabled={transferLoading || !transferTargetId || !transferAmount}>
                    {transferLoading ? t('wallet.transfer_btn_submit_loading') : t('wallet.transfer_btn_submit')}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Transactions List */}
          <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}>
                <Clock size={20} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{t('wallet.history_title')}</h3>
            </div>

            {loadingTrx ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <div className="animate-spin-slow" style={{ width: '24px', height: '24px', border: '2px solid rgba(212, 175, 55, 0.1)', borderTopColor: '#D4AF37', borderRadius: '50%' }} />
              </div>
            ) : transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
                {t('wallet.history_empty')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '420px', overflowY: 'auto', paddingRight: '8px' }}>
                {transactions.map((trx) => {
                  const isPositive = trx.amount > 0;
                  return (
                    <div key={trx.id} style={{
                      padding: '16px',
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                        <span style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {trx.description || t('wallet.transaction')}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {getFormatDate(trx.timestamp)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 }}>
                        <span style={{ 
                          fontSize: '15px', 
                          fontWeight: 700, 
                          color: isPositive ? '#2ECC71' : '#EB5757' 
                        }}>
                          {isPositive ? '+' : ''}{trx.amount} {trx.currency || 'DP'}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {trx.type?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* SECTION: Fractional DiciCoin Portfolio List */}
        <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(46, 204, 113, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2ECC71' }}>
              <Gem size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{textTitlePortfolio}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{textSubPortfolio}</p>
            </div>
          </div>

          {loadingFractions ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <div className="animate-spin-slow" style={{ width: '24px', height: '24px', border: '2px solid rgba(46, 204, 113, 0.1)', borderTopColor: '#2ECC71', borderRadius: '50%' }} />
            </div>
          ) : fractions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-muted)', fontSize: '14px', background: 'rgba(255,255,255,0.01)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
              {textNoFractions}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px 16px' }}>Moneda / ID</th>
                    <th style={{ padding: '12px 16px' }}>{textSerialLicense}</th>
                    <th style={{ padding: '12px 16px' }}>Participación (%)</th>
                    <th style={{ padding: '12px 16px' }}>Rol Asignado</th>
                    <th style={{ padding: '12px 16px' }}>Monto Aportado</th>
                    <th style={{ padding: '12px 16px' }}>Transacción Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {fractions.map((frac) => {
                    const isMaster = frac.master_user_id === user?.uid;
                    const cleanedHash = frac.transaction_hash === 'MANUAL_ADMIN_FIAT' ? 'Aprobación Manual' : (frac.transaction_hash || '');
                    const isManual = frac.transaction_hash === 'MANUAL_ADMIN_FIAT';

                    return (
                      <tr key={frac.id} style={{ borderBottom: '1px solid var(--border-light)', fontSize: '13.5px', background: 'rgba(255,255,255,0.005)' }}>
                        <td style={{ padding: '16px', fontWeight: 700, color: '#FFFFFF' }}>{frac.dicicoin_id}</td>
                        <td style={{ padding: '16px', fontFamily: 'monospace', color: '#00E5FF' }}>{frac.serial || 'Pendiente'}</td>
                        <td style={{ padding: '16px', fontWeight: 600 }}>{frac.ownership_percentage}%</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: isMaster ? 'rgba(212, 175, 55, 0.15)' : 'rgba(0, 229, 255, 0.1)',
                            color: isMaster ? '#D4AF37' : '#00E5FF'
                          }}>
                            {isMaster ? 'MASTER' : 'PARTICIPANT'}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: '#2ECC71', fontWeight: 600 }}>
                          {frac.amount_paid_eur} EUR {frac.amount_paid_usdt > 0 && `(${frac.amount_paid_usdt} USDT)`}
                        </td>
                        <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: '12px' }}>
                          {isManual ? (
                            <span style={{ color: 'var(--text-muted)' }}>{cleanedHash}</span>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={cleanedHash}>
                                {cleanedHash}
                              </span>
                              <button 
                                onClick={() => copyToClipboard(cleanedHash, frac.id)}
                                style={{ background: 'none', border: 'none', color: '#D4AF37', cursor: 'pointer', padding: '2px' }}
                                title="Copiar Hash"
                              >
                                <Copy size={13} />
                              </button>
                              {cleanedHash && (
                                <a 
                                  href={`https://tronscan.org/#/transaction/${cleanedHash}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{ color: '#00E5FF', display: 'flex', alignItems: 'center' }}
                                  title="Ver en Tronscan"
                                >
                                  <ExternalLink size={13} />
                                </a>
                              )}
                            </div>
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

        {/* SECTION: USDT TRC20 Crypto Orders & Confirmations List */}
        <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(0, 229, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00E5FF' }}>
              <Coins size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{textCryptoTransactions}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Historial de compras utilizando USDT TRC20 en la blockchain TRON.</p>
            </div>
          </div>

          {cryptoOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-muted)', fontSize: '14px', background: 'rgba(255,255,255,0.01)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
              {textNoOrders}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px 16px' }}>Orden ID</th>
                    <th style={{ padding: '12px 16px' }}>Moneda / Fracción</th>
                    <th style={{ padding: '12px 16px' }}>Monto (USDT)</th>
                    <th style={{ padding: '12px 16px' }}>Estado Pago</th>
                    <th style={{ padding: '12px 16px' }}>Fecha Creación</th>
                    <th style={{ padding: '12px 16px' }}>Blockchain Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {cryptoOrders.map((ord) => {
                    const isPaid = ord.payment_status === 'paid';
                    const isUnderConf = ord.payment_status === 'under_confirmation';
                    const isPending = ord.payment_status === 'created' || ord.payment_status === 'waiting_payment' || ord.payment_status === 'detected';

                    let statusBg = 'rgba(255, 255, 255, 0.05)';
                    let statusColor = '#FFFFFF';
                    let statusLabel = ord.payment_status;

                    if (isPaid) {
                      statusBg = 'rgba(46, 204, 113, 0.15)';
                      statusColor = '#2ECC71';
                      statusLabel = 'COMPLETADO';
                    } else if (isUnderConf) {
                      statusBg = 'rgba(212, 175, 55, 0.15)';
                      statusColor = '#D4AF37';
                      statusLabel = 'CONFIRMANDO';
                    } else if (isPending) {
                      statusBg = 'rgba(0, 229, 255, 0.1)';
                      statusColor = '#00E5FF';
                      statusLabel = 'ESPERANDO PAGO';
                    }

                    return (
                      <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-light)', fontSize: '13.5px', background: 'rgba(255,255,255,0.005)' }}>
                        <td style={{ padding: '16px', fontWeight: 600 }}>{ord.order_id}</td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong style={{ color: '#FFFFFF' }}>{ord.dicicoin_id}</strong>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fracción del {ord.ownership_percentage}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px', fontWeight: 700, color: '#00E5FF' }}>
                          {ord.expected_amount_usdt} USDT
                          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>({ord.expected_amount_eur} EUR)</span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: statusBg,
                            color: statusColor,
                            display: 'inline-block'
                          }}>
                            {statusLabel}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{getFormatDate(ord.created_at)}</td>
                        <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: '12px' }}>
                          {ord.tx_hash ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ord.tx_hash}>
                                {ord.tx_hash}
                              </span>
                              <button 
                                onClick={() => copyToClipboard(ord.tx_hash, ord.id)}
                                style={{ background: 'none', border: 'none', color: '#D4AF37', cursor: 'pointer', padding: '2px' }}
                                title="Copiar Hash"
                              >
                                <Copy size={13} />
                              </button>
                              <a 
                                href={`https://tronscan.org/#/transaction/${ord.tx_hash}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ color: '#00E5FF', display: 'flex', alignItems: 'center' }}
                                title="Ver en Tronscan"
                              >
                                <ExternalLink size={13} />
                              </a>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>No enviado</span>
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

      </div>

      <style jsx global>{`
        @media (min-width: 1024px) {
          .wallet-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </Navigation>
  );
}
