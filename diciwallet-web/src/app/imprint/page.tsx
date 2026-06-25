'use client';

import React from 'react';
import Link from 'next/link';
import { LogIn, FileText, Phone, Mail, Building2 } from 'lucide-react';

export default function ImprintPage() {
  return (
    <>
      {/* Same sticky header as landing page */}
      <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 5%', backdropFilter: 'blur(20px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src="/dicicoin-logo.jpg" alt="DiciCoin Logo" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--gold-primary)', objectFit: 'cover' }} />
          <span className="text-gold" style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.05em' }}>DICICOIN</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>
          <FileText size={16} style={{ color: 'var(--blue-electric)' }} />
          Imprint
        </div>
        <Link href="/login" className="btn-gold" style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '4px', boxShadow: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <LogIn size={14} />
          <span>Login</span>
        </Link>
      </header>

      <main style={{ flexGrow: 1, position: 'relative', zIndex: 1, padding: '60px 5% 80px', maxWidth: '900px', margin: '0 auto' }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="glass" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(0,229,255,0.2)', background: 'rgba(0,229,255,0.04)', marginBottom: '1.25rem' }}>
            <FileText size={13} style={{ color: 'var(--blue-electric)' }} />
            <span style={{ color: 'var(--blue-electric)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Impressum · Aviso Legal</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.75rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '0.75rem' }}>
            Imprint
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Angaben gemäß § 5 TMG — DiciCoin es una marca de MILENIUM HOLDING &amp; CONSULTING (UG)
          </p>
        </div>

        {/* Card */}
        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: 'clamp(1.5rem, 4vw, 2.5rem)', border: '1px solid var(--border-light)', lineHeight: 1.75 }}>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 700, color: 'var(--blue-electric)', marginBottom: '1rem' }}>
              <Building2 size={17} />
              Angaben gemäß § 5 TMG
            </h2>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 2 }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Una marca de / Eine Marke der</p>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>MILENIUM HOLDING &amp; CONSULTING (UG)</p>
              <p>Mühlendamm 84a</p>
              <p>22087 Hamburg – Deutschland</p>
            </div>
          </section>

          <LegalDivider />

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--blue-electric)', marginBottom: '0.75rem' }}>
              Vertreten durch / Representado por
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Nilo Escolar</p>
          </section>

          <LegalDivider />

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--blue-electric)', marginBottom: '1rem' }}>
              Kontakt / Contacto
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <Phone size={15} style={{ color: 'var(--blue-electric)', flexShrink: 0 }} />
                <span><span style={{ color: 'var(--text-muted)', marginRight: '6px' }}>Telefon:</span>+49 178 8338 735</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <Mail size={15} style={{ color: 'var(--blue-electric)', flexShrink: 0 }} />
                <span>
                  <span style={{ color: 'var(--text-muted)', marginRight: '6px' }}>E-Mail:</span>
                  <a href="mailto:info@dicilo.net" style={{ color: 'var(--blue-electric)' }}>info@dicilo.net</a>
                </span>
              </div>
            </div>
          </section>

          <LegalDivider />

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--blue-electric)', marginBottom: '0.75rem' }}>
              Umsatzsteuer-ID / NIF-IVA
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              Umsatzsteuer-Identifikationsnummer gemäß §27 a Umsatzsteuergesetz:
            </p>
            <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.95rem' }}>DE323288362</p>
          </section>

          <LegalDivider />

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--blue-electric)', marginBottom: '0.75rem' }}>
              Redaktionell verantwortlich
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Nilo Escolar</p>
          </section>

          <LegalDivider />

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--blue-electric)', marginBottom: '0.75rem' }}>
              EU-Streitschlichtung
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7 }}>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
              <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue-electric)' }}>
                https://ec.europa.eu/consumers/odr/
              </a>.{' '}
              Unsere E-Mail-Adresse finden Sie oben im Impressum.
            </p>
          </section>

          <LegalDivider />

          <section>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--blue-electric)', marginBottom: '0.75rem' }}>
              Verbraucherstreitbeilegung / Universalschlichtungsstelle
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7 }}>
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

        </div>
      </main>

      {/* Same footer style as landing page */}
      <footer style={{ borderTop: '1px solid var(--border-light)', padding: '40px 5%' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/dicicoin-logo.jpg" alt="DiciCoin" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--gold-primary)', objectFit: 'cover' }} />
            <span className="text-gold" style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '0.05em' }}>DICICOIN</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center' }}>
            © 2025 DiciCoin — MILENIUM HOLDING &amp; CONSULTING (UG) · Mühlendamm 84a · 22087 Hamburg
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Inicio</Link>
            <Link href="/imprint" style={{ color: 'var(--blue-electric)', fontSize: '0.8rem' }}>Imprint</Link>
            <Link href="/privacy" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Privacy</Link>
          </div>
        </div>
      </footer>
    </>
  );
}

function LegalDivider() {
  return <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '1.5rem 0' }} />;
}
