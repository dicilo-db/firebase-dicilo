'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { validateSaleSignature } from '@/app/actions/wallet-actions';
import { ShieldCheck, AlertTriangle, ShieldAlert, Award, Globe, Calendar, User, Percent, HelpCircle } from 'lucide-react';

interface VerificationData {
  id: string;
  coinId: string;
  serial: string;
  status: string;
  progressPercentage: number;
  paidAmount: number;
  totalAmount: number;
  country: string;
  ownerInitials: string;
  createdAt: string;
}

type Lang = 'ES' | 'EN' | 'DE';

const i18n = {
  ES: {
    loading: 'Verificando firma digital...',
    title_success: 'Firma Digital Verificada',
    subtitle_success: 'Certificado de reserva física verificado como auténtico.',
    title_error: 'Firma Inválida / Falsificada',
    subtitle_error: 'Este código de firma digital no es legítimo.',
    label_coin: 'Moneda ID',
    label_serial: 'Licencia / Serial Digital',
    label_owner: 'Titular Preasignado',
    label_country: 'País de Venta',
    label_status: 'Estado del Plan',
    label_progress: 'Propiedad Adquirida',
    label_date: 'Fecha de Emisión',
    status_active: 'En Plan de Pago',
    status_completed: 'Pagado 100%',
    desc_security: 'Este certificado digital cuenta con firma criptográfica HMAC-SHA256 sellada en tiempo real. La autenticidad física de la moneda de colección está vinculada inseparablemente a esta firma.',
    desc_fraud: 'ATENCIÓN: El checksum de seguridad ha fallado o el código no existe en el libro de actas oficial. Esta pieza no puede ser validada en el ecosistema Dicilo.',
    btn_back: 'Volver a DiciWallet',
    footer: 'Dicilo Ecosistema de Economía Circular Cerrada. Todos los derechos reservados.'
  },
  EN: {
    loading: 'Verifying digital signature...',
    title_success: 'Digital Signature Verified',
    subtitle_success: 'Physical reservation certificate verified as genuine.',
    title_error: 'Invalid / Counterfeit Signature',
    subtitle_error: 'This digital signature code is not legitimate.',
    label_coin: 'Coin ID',
    label_serial: 'License / Digital Serial',
    label_owner: 'Assigned Holder',
    label_country: 'Sale Country',
    label_status: 'Plan Status',
    label_progress: 'Ownership Progress',
    label_date: 'Issue Date',
    status_active: 'In Payment Plan',
    status_completed: 'Fully Paid 100%',
    desc_security: 'This digital certificate has a cryptographic HMAC-SHA256 signature sealed in real time. The physical authenticity of the collectible coin is inseparably linked to this signature.',
    desc_fraud: 'WARNING: The security checksum failed or the code does not exist in the official ledger. This piece cannot be validated within the Dicilo ecosystem.',
    btn_back: 'Back to DiciWallet',
    footer: 'Dicilo Closed Circular Economy Ecosystem. All rights reserved.'
  },
  DE: {
    loading: 'Digitale Signatur wird überprüft...',
    title_success: 'Digitale Signatur Verifiziert',
    subtitle_success: 'Physisches Reservierungszertifikat als echt verifiziert.',
    title_error: 'Ungültige / Gefälschte Signatur',
    subtitle_error: 'Dieser digitale Signaturcode ist nicht legitim.',
    label_coin: 'Münze ID',
    label_serial: 'Lizenz / Digitale Seriennummer',
    label_owner: 'Zugeordneter Inhaber',
    label_country: 'Verkaufsland',
    label_status: 'Planstatus',
    label_progress: 'Eigentumsfortschritt',
    label_date: 'Ausstellungsdatum',
    status_active: 'Im Zahlungsplan',
    status_completed: '100% Bezahlt',
    desc_security: 'Dieses digitale Zertifikat verfügt über eine in Echtzeit versiegelte kryptografische HMAC-SHA256-Signatur. Die physische Echtheit der Sammlermünze ist untrennbar mit dieser Signatur verbunden.',
    desc_fraud: 'WARNUNG: Die Sicherheitsprüfsumme ist fehlgeschlagen oder der Code existiert nicht im offiziellen Hauptbuch. Dieses Stück kann im Dicilo-Ökosystem nicht validiert werden.',
    btn_back: 'Zurück zu DiciWallet',
    footer: 'Dicilo Geschlossenes Kreislaufwirtschafts-Ökosystem. Alle Rechte vorbehalten.'
  }
};

function VerifyContent() {
  const searchParams = useSearchParams();
  const sig = searchParams.get('sig');
  
  const [lang, setLang] = useState<Lang>('ES');
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [data, setData] = useState<VerificationData | null>(null);

  useEffect(() => {
    // Detectar idioma del navegador si es posible
    if (typeof window !== 'undefined') {
      const locale = navigator.language.substring(0, 2).toUpperCase();
      if (locale === 'DE') setLang('DE');
      else if (locale === 'EN') setLang('EN');
      else setLang('ES');
    }
  }, []);

  useEffect(() => {
    async function performVerification() {
      if (!sig) {
        setLoading(false);
        setIsValid(false);
        return;
      }

      try {
        const res = await validateSaleSignature(sig);
        if (res.success && res.data) {
          setIsValid(true);
          setData(res.data as VerificationData);
        } else {
          setIsValid(false);
        }
      } catch (err) {
        console.error('Verification query failed:', err);
        setIsValid(false);
      } finally {
        setLoading(false);
      }
    }

    performVerification();
  }, [sig]);

  const t = (key: keyof typeof i18n['ES']) => {
    return i18n[lang][key] || i18n['ES'][key];
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at center, #1C1A17 0%, #060505 100%)',
      color: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      
      {/* Idioma Selector */}
      <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '8px', zIndex: 10 }}>
        {(['ES', 'EN', 'DE'] as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            style={{
              background: lang === l ? '#D4AF37' : 'rgba(255,255,255,0.05)',
              border: lang === l ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.1)',
              color: lang === l ? '#000000' : '#FFFFFF',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {l}
          </button>
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Logo / Header Branding */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <Award size={40} style={{ color: '#D4AF37' }} />
          <h1 style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '0.15em', color: '#D4AF37', margin: 0 }}>
            DICIWALLET
          </h1>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Official Cryptographic Validator
          </span>
        </div>

        {loading ? (
          /* Loading State */
          <div style={{
            background: 'rgba(255, 255, 255, 0.01)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '60px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(212, 175, 55, 0.1)',
              borderTopColor: '#D4AF37',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px' }}>{t('loading')}</p>
            <style jsx global>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : isValid && data ? (
          /* Success Verification Display */
          <div style={{
            background: 'rgba(255, 255, 255, 0.01)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            boxShadow: '0 8px 32px rgba(212, 175, 55, 0.05), inset 0 0 12px rgba(212, 175, 55, 0.05)',
            borderRadius: '16px',
            padding: '36px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '28px'
          }}>
            
            {/* Success Icon Block */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(46, 204, 113, 0.1)',
                border: '1px solid rgba(46, 204, 113, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2ECC71',
                boxShadow: '0 0 20px rgba(46, 204, 113, 0.15)'
              }}>
                <ShieldCheck size={36} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#2ECC71', margin: 0 }}>
                {t('title_success')}
              </h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: 0, padding: '0 12px' }}>
                {t('subtitle_success')}
              </p>
            </div>

            {/* Verification Metadata Grid */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '8px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    {t('label_coin')}
                  </span>
                  <strong style={{ fontSize: '14px', color: '#D4AF37' }}>{data.coinId}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    {t('label_country')}
                  </span>
                  <span style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Globe size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
                    {data.country}
                  </span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '14px' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  {t('label_serial')}
                </span>
                <strong style={{ fontSize: '13px', fontFamily: 'monospace', color: '#FFFFFF' }}>{data.serial}</strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '14px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    {t('label_owner')}
                  </span>
                  <span style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
                    {data.ownerInitials}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    {t('label_date')}
                  </span>
                  <span style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
                    {new Date(data.createdAt).toLocaleDateString(lang === 'ES' ? 'es-ES' : lang === 'DE' ? 'de-DE' : 'en-US', {
                      day: '2-digit', month: '2-digit', year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                    {t('label_progress')}
                  </span>
                  <strong style={{ color: '#D4AF37' }}>{data.progressPercentage}%</strong>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${data.progressPercentage}%`, height: '100%', background: 'linear-gradient(90deg, #B8952B 0%, #F3D060 100%)', borderRadius: '3px', boxShadow: '0 0 10px rgba(212, 175, 55, 0.4)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>
                  <span>{data.paidAmount} EUR</span>
                  <span>{data.totalAmount} EUR</span>
                </div>
              </div>
            </div>

            {/* Cryptographic Protection Statement */}
            <div style={{
              background: 'rgba(212,175,55,0.02)',
              border: '1px solid rgba(212,175,55,0.1)',
              borderRadius: '8px',
              padding: '16px',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: '1.5',
              display: 'flex',
              gap: '10px'
            }}>
              <HelpCircle size={16} style={{ color: '#D4AF37', flexShrink: 0, marginTop: '2px' }} />
              <span>{t('desc_security')}</span>
            </div>

          </div>
        ) : (
          /* Error State - Counterfeit Warning */
          <div style={{
            background: 'rgba(255, 255, 255, 0.01)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(235, 87, 87, 0.4)',
            boxShadow: '0 8px 32px rgba(235, 87, 87, 0.05)',
            borderRadius: '16px',
            padding: '40px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(235, 87, 87, 0.1)',
                border: '1px solid rgba(235, 87, 87, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EB5757',
                boxShadow: '0 0 20px rgba(235, 87, 87, 0.15)'
              }}>
                <ShieldAlert size={36} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#EB5757', margin: 0 }}>
                {t('title_error')}
              </h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                {t('subtitle_error')}
              </p>
            </div>

            <div style={{
              background: 'rgba(235, 87, 87, 0.03)',
              border: '1px solid rgba(235, 87, 87, 0.15)',
              borderRadius: '8px',
              padding: '20px',
              fontSize: '13px',
              color: 'rgba(255,255,255,0.6)',
              lineHeight: '1.5',
              display: 'flex',
              gap: '12px',
              textAlign: 'left'
            }}>
              <AlertTriangle size={18} style={{ color: '#EB5757', flexShrink: 0, marginTop: '2px' }} />
              <span>{t('desc_fraud')}</span>
            </div>
          </div>
        )}

        {/* Buttons / Back Actions */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <a
            href="/"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#FFFFFF',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.border = '1px solid rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)';
            }}
          >
            {t('btn_back')}
          </a>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.25)',
          marginTop: '16px',
          lineHeight: '1.4'
        }}>
          {t('footer')}
        </div>

      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at center, #1C1A17 0%, #060505 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF'
      }}>
        <div style={{ width: '32px', height: '32px', border: '2px solid rgba(212,175,55,0.1)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
