'use client';

import React from 'react';
import Link from 'next/link';
import { LogIn, FileText, Phone, Mail, Building2 } from 'lucide-react';

export default function ImprintPage() {
  return (
    <>
      <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 5%', backdropFilter: 'blur(20px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src="/dicicoin-logo.jpg" alt="DiciCoin" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--gold-primary)', objectFit: 'cover' }} />
          <span className="text-gold" style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.05em' }}>DICICOIN</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--blue-electric)', fontSize: '13px', fontWeight: 600 }}>
          <FileText size={16} />
          Imprint
        </div>
        <Link href="/login" className="btn-gold" style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <LogIn size={14} /><span>Login</span>
        </Link>
      </header>

      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '60px 5% 100px' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="glass" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(0,229,255,0.25)', background: 'rgba(0,229,255,0.05)', marginBottom: '1.25rem' }}>
            <FileText size={13} style={{ color: 'var(--blue-electric)' }} />
            <span style={{ color: 'var(--blue-electric)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Impressum · Aviso Legal</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2, marginBottom: '0.75rem' }}>Imprint</h1>
          <p style={{ color: '#A0A0A8', fontSize: '1rem' }}>Angaben gemäß § 5 TMG — DiciCoin es una marca de MILENIUM HOLDING &amp; CONSULTING (UG)</p>
        </div>

        <div className="glass" style={{ borderRadius: '20px', padding: 'clamp(1.5rem, 4vw, 2.5rem)', border: '1px solid var(--border-light)' }}>

          <section style={{ marginBottom: '0.25rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 700, color: 'var(--blue-electric)', marginBottom: '1rem' }}>
              <Building2 size={16} />
              Angaben gemäß § 5 TMG
            </h2>
            <div style={{ background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: '10px', padding: '1rem 1.25rem', margin: '0.75rem 0' }}>
              <p style={{ color: '#A0A0A8', fontSize: '0.75rem', marginBottom: '4px' }}>Una marca de / Eine Marke der</p>
              <p style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1rem', lineHeight: 1.8, margin: 0 }}>
                MILENIUM HOLDING &amp; CONSULTING (UG)<br />
                Mühlendamm 84a<br />
                22087 Hamburg – Deutschland
              </p>
            </div>
          </section>

          <D />

          <section style={{ marginBottom: '0.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--blue-electric)', marginBottom: '0.75rem' }}>Vertreten durch / Representado por</h2>
            <p style={{ color: '#D1D5DB', fontSize: '0.9rem', lineHeight: 1.75 }}>Nilo Escolar</p>
          </section>

          <D />

          <section style={{ marginBottom: '0.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--blue-electric)', marginBottom: '1rem' }}>
              Kontakt / Contacto
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#D1D5DB', fontSize: '0.9rem' }}>
                <Phone size={15} style={{ color: 'var(--blue-electric)', flexShrink: 0 }} />
                <span><span style={{ color: '#A0A0A8', marginRight: '6px' }}>Telefon:</span>+49 178 8338 735</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#D1D5DB', fontSize: '0.9rem' }}>
                <Mail size={15} style={{ color: 'var(--blue-electric)', flexShrink: 0 }} />
                <span>
                  <span style={{ color: '#A0A0A8', marginRight: '6px' }}>E-Mail:</span>
                  <a href="mailto:info@dicilo.net" style={{ color: 'var(--blue-electric)' }}>info@dicilo.net</a>
                </span>
              </div>
            </div>
          </section>

          <D />

          <section style={{ marginBottom: '0.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--blue-electric)', marginBottom: '0.75rem' }}>Umsatzsteuer-ID / NIF-IVA</h2>
            <p style={{ color: '#D1D5DB', fontSize: '0.9rem', lineHeight: 1.75, marginBottom: '0.5rem' }}>
              Umsatzsteuer-Identifikationsnummer gemäß §27 a Umsatzsteuergesetz:
            </p>
            <p style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.95rem' }}>DE323288362</p>
          </section>

          <D />

          <section style={{ marginBottom: '0.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--blue-electric)', marginBottom: '0.75rem' }}>Redaktionell verantwortlich</h2>
            <p style={{ color: '#D1D5DB', fontSize: '0.9rem', lineHeight: 1.75 }}>Nilo Escolar</p>
          </section>

          <D />

          <section style={{ marginBottom: '0.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--blue-electric)', marginBottom: '0.75rem' }}>EU-Streitschlichtung</h2>
            <p style={{ color: '#D1D5DB', fontSize: '0.9rem', lineHeight: 1.75 }}>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
              <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue-electric)' }}>
                https://ec.europa.eu/consumers/odr/
              </a>.{' '}
              Unsere E-Mail-Adresse finden Sie oben im Impressum.
            </p>
          </section>

          <D />

          <section>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--blue-electric)', marginBottom: '0.75rem' }}>Verbraucherstreitbeilegung / Universalschlichtungsstelle</h2>
            <p style={{ color: '#D1D5DB', fontSize: '0.9rem', lineHeight: 1.75 }}>
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

        </div>
      </main>

      <footer style={{ borderTop: '1px solid var(--border-light)', padding: '40px 5%', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '12px' }}>
          <img src="/dicicoin-logo.jpg" alt="DiciCoin" style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--gold-primary)', objectFit: 'cover' }} />
          <span className="text-gold" style={{ fontWeight: 800, fontSize: '14px' }}>DICICOIN</span>
        </div>
        <p style={{ color: '#6B7280', fontSize: '0.8rem', marginBottom: '12px' }}>© 2025 MILENIUM HOLDING &amp; CONSULTING (UG) · Mühlendamm 84a · 22087 Hamburg</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: '#A0A0A8', fontSize: '0.8rem' }}>Inicio</Link>
          <Link href="/imprint" style={{ color: 'var(--blue-electric)', fontSize: '0.8rem' }}>Imprint</Link>
          <Link href="/privacy" style={{ color: '#A0A0A8', fontSize: '0.8rem' }}>Privacy</Link>
        </div>
      </footer>
    </>
  );
}

function D() {
  return <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '1.75rem 0' }} />;
}
