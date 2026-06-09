'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  LayoutDashboard, 
  Wallet, 
  Coins, 
  ShoppingBag, 
  ShieldAlert, 
  LogOut, 
  Menu, 
  X, 
  Award,
  Gem,
  Globe
} from 'lucide-react';

export default function Navigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, wallet, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  // Proteger ruta en el cliente
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0B0B0C' }}>
        <div className="animate-spin-slow" style={{ width: '40px', height: '40px', border: '3px solid rgba(212, 175, 55, 0.1)', borderTopColor: '#D4AF37', borderRadius: '50%' }} />
      </div>
    );
  }

  const menuItems = [
    { name: t('nav.dashboard'), icon: LayoutDashboard, path: '/dashboard', id: 'nav-dashboard-link' },
    { name: t('nav.wallet'), icon: Wallet, path: '/wallet', id: 'nav-wallet-link' },
    { name: t('nav.reservations'), icon: Coins, path: '/reservations', id: 'nav-reservations-link' },
    { name: t('nav.marketplace'), icon: ShoppingBag, path: '/marketplace', id: 'nav-marketplace-link' },
  ];

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
  if (isAdmin) {
    menuItems.push({ name: t('nav.admin'), icon: ShieldAlert, path: '/admin', id: 'nav-admin-link' });
  }

  const toggleMobile = () => setMobileOpen(!mobileOpen);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0B0B0C', color: '#FFFFFF' }}>
      
      {/* Sidebar Desktop (Uses responsive class defined in globals.css) */}
      <aside className="glass sidebar-desktop">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', height: '100%' }}>
          {/* Logo */}
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="text-gold" style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '0.05em' }}>DICICOIN</span>
          </Link>

          {/* User Info Card */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--gold-metallic)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000000',
              fontWeight: 700
            }}>
              {profile?.firstName?.charAt(0) || 'U'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontWeight: 600, fontSize: '15px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {profile?.firstName} {profile?.lastName}
              </span>
              <span style={{ fontSize: '11px', color: isAdmin ? '#D4AF37' : 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                {profile?.role === 'superadmin' ? 'SuperAdmin' :
                 profile?.role === 'admin' ? 'Admin' :
                 profile?.role === 'team_office' ? 'Team Office' :
                 profile?.role === 'team_leader' ? 'Team Leader' :
                 profile?.role === 'freelancer' ? 'Freelancer' : t('nav.member')}
              </span>
            </div>
          </div>

          {/* Menu */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
            {menuItems.map((item) => {
              const active = pathname === item.path;
              const Icon = item.icon;
              return (
                <Link 
                  id={item.id}
                  key={item.path} 
                  href={item.path} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '15px',
                    fontWeight: active ? 600 : 500,
                    color: active ? '#000000' : 'var(--text-secondary)',
                    background: active ? 'var(--gold-metallic)' : 'transparent',
                    boxShadow: active ? '0 4px 12px rgba(212,175,55,0.2)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Icon size={18} style={{ strokeWidth: active ? 2.5 : 2 }} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <button 
            id="sidebar-logout-btn"
            onClick={logout}
            className="btn-outline" 
            style={{ 
              width: '100%', 
              justifyContent: 'flex-start',
              padding: '12px 16px',
              color: '#EB5757',
              borderColor: 'rgba(235, 87, 87, 0.2)'
            }}
          >
            <LogOut size={18} />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Navbar Header */}
      <div className="glass navbar-mobile">
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="text-gold" style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.05em' }}>DICICOIN</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Mobile Language Selector */}
          <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 6px', borderRadius: 'var(--radius-sm)' }}>
            <Globe size={12} style={{ color: 'var(--text-secondary)' }} />
            <div style={{ display: 'flex', gap: '2px' }}>
              {(['ES', 'EN', 'DE'] as const).map((lang) => {
                const active = language === lang;
                return (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    style={{
                      background: active ? 'var(--gold-metallic)' : 'transparent',
                      border: 'none',
                      color: active ? '#000000' : 'var(--text-secondary)',
                      padding: '2px 4px',
                      borderRadius: '3px',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>
          <button id="mobile-menu-toggle-btn" onClick={toggleMobile} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="glass" style={{
          position: 'fixed',
          top: '70px',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 25,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px'
        }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {menuItems.map((item) => {
              const active = pathname === item.path;
              const Icon = item.icon;
              return (
                <Link 
                  id={`${item.id}-mobile`}
                  key={item.path} 
                  href={item.path} 
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '16px',
                    fontWeight: active ? 600 : 500,
                    color: active ? '#000000' : 'var(--text-secondary)',
                    background: active ? 'var(--gold-metallic)' : 'transparent',
                    boxShadow: active ? '0 4px 12px rgba(212,175,55,0.2)' : 'none'
                  }}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          
          <button 
            id="mobile-logout-btn"
            onClick={() => {
              setMobileOpen(false);
              logout();
            }}
            className="btn-outline" 
            style={{ 
              width: '100%', 
              color: '#EB5757',
              borderColor: 'rgba(235, 87, 87, 0.2)'
            }}
          >
            <LogOut size={20} />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="main-content-layout">
        
        {/* Quick Header Widget - Balances (Desktop) */}
        <div className="quick-header-balances" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '24px',
          marginBottom: '32px',
          width: '100%',
          flexWrap: 'wrap'
        }}>
          {/* Language Selector with Globe Icon */}
          <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px 4px 8px', borderRadius: 'var(--radius-sm)' }}>
            <Globe size={14} style={{ color: 'var(--text-secondary)' }} />
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['ES', 'EN', 'DE'] as const).map((lang) => {
                const active = language === lang;
                return (
                  <button
                    key={lang}
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

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {/* DP Balance */}
            <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: 'var(--radius-sm)' }}>
              <Award size={16} style={{ color: '#00E5FF' }} />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{t('balance.dp')}:</span>
              <span style={{ fontSize: '14px', fontWeight: 700 }}>{wallet?.balance?.toLocaleString() || '0'}</span>
            </div>
            {/* DC Balance */}
            <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: 'var(--radius-sm)' }}>
              <Gem size={16} style={{ color: '#D4AF37' }} />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{t('balance.dc')}:</span>
              <span style={{ fontSize: '14px', fontWeight: 700 }}>{wallet?.balanceDC?.toLocaleString() || '0'}</span>
            </div>
            {/* EUR Total Paid */}
            <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#D4AF37' }}>€</span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{t('balance.paid')}:</span>
              <span style={{ fontSize: '14px', fontWeight: 700 }}>{wallet?.totalPaidEur?.toLocaleString() || '0'} €</span>
            </div>
          </div>
        </div>

        <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
