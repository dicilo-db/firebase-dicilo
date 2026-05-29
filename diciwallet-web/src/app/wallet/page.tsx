'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { convertDpToDc, transferDpPoints } from '@/app/actions/wallet-actions';
import { Award, Gem, ArrowRightLeft, Clock, Info, Send } from 'lucide-react';

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
  const { t } = useLanguage();
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
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Navigation>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Header */}
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 800 }}>{t('wallet.title')}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '4px' }}>{t('wallet.subtitle')}</p>
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
