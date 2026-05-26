'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import { 
  Award, 
  Gem, 
  Coins, 
  ArrowRight, 
  AlertCircle,
  Clock,
  TrendingUp,
  Percent
} from 'lucide-react';

interface Reservation {
  id: string;
  coinId: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  status: string;
}

export default function DashboardPage() {
  const { user, wallet, profile } = useAuth();
  const { t } = useLanguage();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingRes, setLoadingRes] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Escuchar las reservas del usuario en tiempo real
    const q = query(
      collection(db, 'coin_reservations'),
      where('userId', '==', user.uid),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const resList: Reservation[] = [];
      snapshot.forEach((doc) => {
        resList.push(doc.data() as Reservation);
      });
      setReservations(resList);
      setLoadingRes(false);
    }, (error) => {
      console.error("Error fetching reservations:", error);
      setLoadingRes(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <Navigation>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Welcome Header */}
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 800 }}>{t('dashboard.hello')} {profile?.firstName || t('nav.member')}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '4px' }}>{t('dashboard.welcome')}</p>
        </div>

        {/* Balance Cards (Fintech Luxury style) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {/* DP points */}
          <div className="glass" style={{
            padding: '28px',
            borderRadius: 'var(--radius-md)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(0, 229, 255, 0.05)', filter: 'blur(30px)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{t('dashboard.dp_title')}</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0, 229, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00E5FF', marginLeft: 'auto' }}>
                <Award size={18} style={{ margin: 'auto' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '32px', fontWeight: 800 }}>{wallet?.balance?.toLocaleString() || '0'}</span>
              <span style={{ fontSize: '14px', color: '#00E5FF', fontWeight: 600 }}>DP</span>
            </div>
            <div style={{ marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
              {t('dashboard.dp_desc')}
            </div>
          </div>

          {/* DC digital */}
          <div className="glass" style={{
            padding: '28px',
            borderRadius: 'var(--radius-md)',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid var(--border-gold)'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.05)', filter: 'blur(30px)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{t('dashboard.dc_title')}</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', marginLeft: 'auto' }}>
                <Gem size={18} style={{ margin: 'auto' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '32px', fontWeight: 800, color: '#D4AF37' }}>{wallet?.balanceDC?.toLocaleString() || '0'}</span>
              <span style={{ fontSize: '14px', color: '#D4AF37', fontWeight: 600 }}>DC</span>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('dashboard.dc_desc')}</span>
              <Link id="convert-dp-link" href="/wallet" style={{ color: '#00E5FF', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                {t('dashboard.dc_convert')} <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* EUR accumulated */}
          <div className="glass" style={{
            padding: '28px',
            borderRadius: 'var(--radius-md)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', filter: 'blur(30px)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{t('dashboard.eur_title')}</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', marginLeft: 'auto', fontWeight: 700, fontSize: '16px' }}>
                €
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '32px', fontWeight: 800 }}>{wallet?.totalPaidEur?.toLocaleString() || '0'} €</span>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('balance.paid')}</span>
            </div>
            <div style={{ marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
              {t('dashboard.eur_desc')}
            </div>
          </div>
        </div>

        {/* Mid Section: Active Reservation and Quick actions */}
        <div className="dashboard-grid">
          
          {/* Active Reservation Progress Widget */}
          <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{t('dashboard.my_plans')}</h3>
              <Clock size={18} style={{ color: 'var(--text-secondary)' }} />
            </div>

            {loadingRes ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <div className="animate-spin-slow" style={{ width: '24px', height: '24px', border: '2px solid rgba(212, 175, 55, 0.1)', borderTopColor: '#D4AF37', borderRadius: '50%' }} />
              </div>
            ) : reservations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <Coins size={36} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-secondary)' }}>{t('dashboard.no_plans')}</p>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>{t('dashboard.no_plans_desc')}</p>
                </div>
                <Link id="dashboard-reserve-btn" href="/reservations" className="btn-gold" style={{ padding: '10px 20px', fontSize: '14px', marginTop: '8px' }}>
                  {t('dashboard.reserve_btn')}
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {reservations.map((res) => {
                  return (
                    <div key={res.id} style={{ padding: '20px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '16px' }}>{res.coinId}</span>
                          <span style={{ fontSize: '11px', background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', padding: '2px 8px', borderRadius: '12px', marginLeft: '12px', fontWeight: 600 }}>
                            {(() => {
                              const code = res.coinId.substring(0, 2).toUpperCase();
                              const normalized = code === 'NA' ? 'OC' : code;
                              return t(`continent.${normalized}`).toUpperCase();
                            })()}
                          </span>
                        </div>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                          {t('balance.paid')}: <strong style={{ color: '#FFFFFF' }}>{res.paidAmount} €</strong> / {res.totalAmount} €
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                          <span>{t('dashboard.progress_prop')}</span>
                          <span style={{ fontWeight: 700, color: '#00E5FF' }}>{res.progressPercentage.toFixed(1)}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                          <div style={{ width: `${res.progressPercentage}%`, height: '100%', background: 'var(--blue-electric-gradient)', borderRadius: '4px', transition: 'width 1s ease-in-out' }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {t('dashboard.remaining_prefix')} {res.remainingAmount} € {t('dashboard.remaining_suffix')}
                        </span>
                        <Link id={`go-to-res-detail-${res.id}`} href="/reservations" style={{ color: '#D4AF37', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {t('dashboard.manage_payments')} <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions Panel */}
          <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{t('dashboard.quick_actions')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link id="action-reserve" href="/reservations" className="btn-outline-gold" style={{ justifyContent: 'flex-start', padding: '14px' }}>
                <Coins size={18} />
                <span style={{ textAlign: 'left' }}>{t('dashboard.action_reserve')}</span>
              </Link>
              <Link id="action-wallet" href="/wallet" className="btn-outline" style={{ justifyContent: 'flex-start', padding: '14px', borderColor: 'var(--border-light)' }}>
                <Gem size={18} style={{ color: '#D4AF37' }} />
                <span style={{ textAlign: 'left' }}>{t('dashboard.action_convert')}</span>
              </Link>
              <Link id="action-marketplace" href="/marketplace" className="btn-outline" style={{ justifyContent: 'flex-start', padding: '14px', borderColor: 'var(--border-light)' }}>
                <TrendingUp size={18} style={{ color: '#00E5FF' }} />
                <span style={{ textAlign: 'left' }}>{t('dashboard.action_market')}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer Box (Extremely Important) */}
        <div className="glass" style={{
          padding: '24px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(212, 175, 55, 0.02)',
          border: '1px solid rgba(212, 175, 55, 0.1)',
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start'
        }}>
          <AlertCircle size={20} style={{ color: '#D4AF37', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#D4AF37' }}>{t('dashboard.legal_title')}</span>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {t('dashboard.legal_text')}
            </p>
          </div>
        </div>

      </div>

      <style jsx global>{`
        @media (min-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 2fr 1fr !important;
          }
        }
      `}</style>
    </Navigation>
  );
}
