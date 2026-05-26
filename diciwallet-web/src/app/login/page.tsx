'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { KeyRound, Mail, AlertTriangle, Globe } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { language, setLanguage, t } = useLanguage();
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

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError(t('login.error_credentials'));
      } else {
        setError(t('login.error_general'));
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
      <div style={{ position: 'absolute', top: '20%', left: '30%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0, 229, 255, 0.1) 0%, transparent 70%)', filter: 'blur(50px)', zIndex: -1 }} />
      <div style={{ position: 'absolute', bottom: '20%', right: '30%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%)', filter: 'blur(50px)', zIndex: -1 }} />

      <div className="glass-gold" style={{ width: '100%', maxWidth: '440px', borderRadius: 'var(--radius-md)', padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Logo and Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1 className="text-gold" style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '0.05em' }}>{t('login.title')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>{t('login.subtitle')}</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(235, 87, 87, 0.1)', border: '1px solid rgba(235, 87, 87, 0.2)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'center', color: '#EB5757', fontSize: '14px' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label className="premium-label" htmlFor="email-input">{t('login.email')}</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                id="email-input"
                type="email"
                required
                className="premium-input"
                style={{ paddingLeft: '48px' }}
                placeholder={t('login.email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="premium-label" htmlFor="password-input">{t('login.password')}</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                id="password-input"
                type="password"
                required
                className="premium-input"
                style={{ paddingLeft: '48px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button id="login-submit-btn" type="submit" className="btn-gold" style={{ width: '100%', marginTop: '8px' }} disabled={btnLoading}>
            {btnLoading ? t('login.btn_submit_loading') : t('login.btn_submit')}
          </button>
        </form>

        {/* Footer info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', fontSize: '14px' }}>
          <div style={{ color: 'var(--text-secondary)' }}>
            {t('login.no_account')}{' '}
            <Link id="go-to-register-link" href="/register" style={{ color: '#00E5FF', fontWeight: 600 }}>
              {t('login.register_here')}
            </Link>
          </div>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', lineHeight: '1.4' }}>
            {t('login.legal_disclaimer')}
          </div>
        </div>

      </div>
    </div>
  );
}
