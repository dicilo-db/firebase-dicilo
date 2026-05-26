'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { KeyRound, Mail, User, AlertTriangle, Globe } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [btnLoading, setBtnLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBtnLoading(true);

    if (password.length < 6) {
      setError(t('register.error_length'));
      setBtnLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // 1. Crear documento en private_profiles (compatible con Dicilo.net)
      const profileRef = doc(db, 'private_profiles', newUser.uid);
      await setDoc(profileRef, {
        firstName,
        lastName,
        email,
        role: 'user',
        isFreelancer: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // 2. Crear monedero en wallets
      const walletRef = doc(db, 'wallets', newUser.uid);
      await setDoc(walletRef, {
        balance: 0,      // Puntos DP
        balanceDC: 0,    // DiciCoins DC
        totalPaidEur: 0, // Euros pagados
        createdAt: new Date(),
        updatedAt: new Date()
      });

      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError(t('register.error_email_in_use'));
      } else if (err.code === 'auth/invalid-email') {
        setError(t('register.error_invalid_email'));
      } else {
        setError(t('register.error_general'));
      }
    } finally {
      setBtnLoading(false);
    }
  };

  if (loading || user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0B0B0C' }}>
        <div className="animate-spin-slow" style={{ width: '40px', height: '40px', border: '3px solid rgba(212, 175, 55, 0.1)', borderTopColor: '#D4AF37', borderRadius: '50%' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', padding: '24px', position: 'relative' }}>
      
      {/* Floating Language Selector */}
      <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 10 }}>
        <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px 6px 8px', borderRadius: 'var(--radius-sm)' }}>
          <Globe size={14} style={{ color: 'var(--text-secondary)' }} />
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['ES', 'EN', 'DE'] as const).map((lang) => {
              const active = language === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  style={{
                    background: active ? 'var(--gold-metallic)' : 'transparent',
                    border: 'none',
                    color: active ? '#000000' : 'var(--text-secondary)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    letterSpacing: '0.05em'
                  }}
                >
                  {lang}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Decorative Blur Backgrounds */}
      <div style={{ position: 'absolute', top: '15%', right: '20%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0, 229, 255, 0.08) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: -1 }} />
      <div style={{ position: 'absolute', bottom: '15%', left: '20%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: -1 }} />

      <div className="glass-gold" style={{ width: '100%', maxWidth: '480px', borderRadius: 'var(--radius-md)', padding: '40px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1 className="text-gold" style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '0.05em' }}>{t('register.title')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>{t('register.subtitle')}</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(235, 87, 87, 0.1)', border: '1px solid rgba(235, 87, 87, 0.2)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'center', color: '#EB5757', fontSize: '14px' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="premium-label" htmlFor="first-name-input">{t('register.first_name')}</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  id="first-name-input"
                  type="text"
                  required
                  className="premium-input"
                  style={{ paddingLeft: '44px' }}
                  placeholder={t('register.first_name_placeholder')}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="premium-label" htmlFor="last-name-input">{t('register.last_name')}</label>
              <input
                id="last-name-input"
                type="text"
                required
                className="premium-input"
                placeholder={t('register.last_name_placeholder')}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="premium-label" htmlFor="email-input">{t('register.email')}</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                id="email-input"
                type="email"
                required
                className="premium-input"
                style={{ paddingLeft: '44px' }}
                placeholder={t('register.email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="premium-label" htmlFor="password-input">{t('register.password')}</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                id="password-input"
                type="password"
                required
                className="premium-input"
                style={{ paddingLeft: '44px' }}
                placeholder={t('register.password_placeholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button id="register-submit-btn" type="submit" className="btn-gold" style={{ width: '100%', marginTop: '8px' }} disabled={btnLoading}>
            {btnLoading ? t('register.btn_submit_loading') : t('register.btn_submit')}
          </button>
        </form>

        {/* Footer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', fontSize: '14px' }}>
          <div style={{ color: 'var(--text-secondary)' }}>
            {t('register.has_account')}{' '}
            <Link id="go-to-login-link" href="/login" style={{ color: '#00E5FF', fontWeight: 600 }}>
              {t('register.login_here')}
            </Link>
          </div>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', lineHeight: '1.4' }}>
            {t('register.legal_disclaimer')}
          </div>
        </div>

      </div>
    </div>
  );
}
