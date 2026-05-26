'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { buyParticipation } from '@/app/actions/wallet-actions';
import { ShoppingBag, Coins, ArrowRight, ShieldAlert, Tag, CheckCircle2 } from 'lucide-react';

interface ParticipationTransfer {
  id: string;
  coinId: string;
  reservationId: string;
  sellerId: string;
  askingPrice: number;
  paidAmountSnapshot: number;
  status: string;
  createdAt: any;
}

export default function MarketplacePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [listings, setListings] = useState<ParticipationTransfer[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [buyLoading, setBuyLoading] = useState<{[key: string]: boolean}>({});
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    // Escuchar todas las participaciones activas listadas en el marketplace
    const q = query(
      collection(db, 'participation_transfers'),
      where('status', '==', 'listed')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ParticipationTransfer[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as ParticipationTransfer);
      });
      setListings(list);
      setLoadingListings(false);
    }, (error) => {
      console.error("Error loading marketplace listings:", error);
      setLoadingListings(false);
    });

    return () => unsubscribe();
  }, []);

  const handleBuyClick = async (transferId: string) => {
    if (!user) return;
    
    const confirmBuy = window.confirm(t('market.confirm_buy'));
    if (!confirmBuy) return;

    setBuyLoading(prev => ({ ...prev, [transferId]: true }));
    setMessage({ text: '', type: '' });

    try {
      const res = await buyParticipation(user.uid, transferId);
      if (res.success) {
        setMessage({ text: t(res.messageKey || 'api.success_requested'), type: 'success' });
      } else {
        setMessage({ text: t(res.messageKey || 'api.server_error'), type: 'error' });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ text: t('market.error_buy'), type: 'error' });
    } finally {
      setBuyLoading(prev => ({ ...prev, [transferId]: false }));
    }
  };

  return (
    <Navigation>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Header */}
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 800 }}>{t('market.title')}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '4px' }}>{t('market.subtitle')}</p>
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

        {/* Informative block */}
        <div className="glass" style={{
          padding: '20px',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          gap: '16px',
          background: 'rgba(0, 229, 255, 0.02)',
          border: '1px solid rgba(0, 229, 255, 0.1)',
          alignItems: 'center'
        }}>
          <ShieldAlert size={20} style={{ color: '#00E5FF', flexShrink: 0 }} />
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            <strong>{t('market.how_works_title')}</strong> {t('market.how_works_text')}
          </p>
        </div>

        {/* Listings Grid */}
        {loadingListings ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div className="animate-spin-slow" style={{ width: '24px', height: '24px', border: '2px solid rgba(212, 175, 55, 0.1)', borderTopColor: '#D4AF37', borderRadius: '50%' }} />
          </div>
        ) : listings.length === 0 ? (
          <div className="glass" style={{ textAlign: 'center', padding: '65px 24px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <ShoppingBag size={40} style={{ color: 'var(--text-muted)' }} />
            <div>
              <h4 style={{ fontSize: '18px', fontWeight: 700 }}>{t('market.no_listings')}</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>{t('market.no_listings_desc')}</p>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
            gap: '24px'
          }}>
            {listings.map((list) => {
              const remainingAmount = 5000 - list.paidAmountSnapshot;
              const isOwnListing = list.sellerId === user?.uid;

              return (
                <div key={list.id} className="glass-gold" style={{
                  borderRadius: 'var(--radius-md)',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  position: 'relative'
                }}>
                  {/* Asking Price Tag */}
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'var(--gold-metallic)',
                    color: '#000000',
                    fontWeight: 700,
                    fontSize: '14px',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: '0 4px 10px rgba(212, 175, 55, 0.2)'
                  }}>
                    {list.askingPrice} €
                  </div>

                  {/* Info Header */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {t('market.listing_tag')} - {(() => {
                        const code = list.coinId.substring(0, 2).toUpperCase();
                        const normalized = code === 'NA' ? 'OC' : code;
                        return t(`continent.${normalized}`);
                      })()}
                    </span>
                    <h4 style={{ fontSize: '20px', fontWeight: 800 }}>{list.coinId}</h4>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('market.transfer_id')}: {list.id}</span>
                  </div>

                  {/* Financial Progression */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{t('market.seller_paid')}:</span>
                      <span style={{ fontWeight: 600, color: '#00E5FF' }}>{list.paidAmountSnapshot} €</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{t('market.pending_assumed')}:</span>
                      <span style={{ fontWeight: 600 }}>{remainingAmount} €</span>
                    </div>
                    <hr style={{ border: 0, borderTop: '1px solid var(--border-light)', margin: '4px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{t('market.coin_total_value')}:</span>
                      <span>5.000 €</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  {isOwnListing ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '12px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      fontWeight: 600,
                      marginTop: 'auto'
                    }}>
                      {t('market.own_listing')}
                    </div>
                  ) : (
                    <button
                      id={`btn-buy-${list.id}`}
                      onClick={() => handleBuyClick(list.id)}
                      className="btn-gold"
                      style={{ width: '100%', marginTop: 'auto', padding: '12px' }}
                      disabled={buyLoading[list.id]}
                    >
                      {buyLoading[list.id] ? t('res.btn_confirm_loading') : t('market.btn_buy')}
                    </button>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>
    </Navigation>
  );
}
