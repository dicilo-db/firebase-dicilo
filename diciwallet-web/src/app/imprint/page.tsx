'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Phone, Mail, Building2 } from 'lucide-react';

export default function ImprintPage() {
  return (
    <div style={{ backgroundColor: '#0A0A0F', minHeight: '100vh', color: '#E0E0E0' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(0,229,255,0.15)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#00E5FF', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
          <ArrowLeft size={16} />
          DiciCoin.com
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#00E5FF' }}>
          <FileText size={18} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Imprint / Impressum</span>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        {/* Title block */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)', borderRadius: '999px', padding: '0.375rem 1rem', marginBottom: '1.25rem' }}>
            <FileText size={14} style={{ color: '#00E5FF' }} />
            <span style={{ fontSize: '0.75rem', color: '#00E5FF', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Impressum / Aviso Legal</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2, marginBottom: '0.75rem' }}>
            Imprint
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '1rem' }}>
            Angaben gemäß § 5 TMG — DiciCoin es una marca de MILENIUM HOLDING &amp; CONSULTING (UG)
          </p>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: 'clamp(1.5rem, 4vw, 2.5rem)', lineHeight: 1.7 }}>

          {/* Legal info */}
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#00E5FF', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={18} />
              Angaben gemäß § 5 TMG
            </h2>
            <div style={{ color: '#D1D5DB', fontSize: '0.9rem', lineHeight: 2 }}>
              <p style={{ color: '#9CA3AF', marginBottom: '0.25rem' }}>Una marca de / Eine Marke der</p>
              <p style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '1rem' }}>MILENIUM HOLDING &amp; CONSULTING (UG)</p>
              <p>Mühlendamm 84a</p>
              <p>22087 Hamburg – Deutschland</p>
            </div>
          </section>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', margin: '1.5rem 0' }} />

          {/* Represented by */}
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#00E5FF', marginBottom: '0.75rem' }}>
              Vertreten durch / Representado por
            </h2>
            <p style={{ color: '#D1D5DB', fontSize: '0.9rem' }}>Nilo Escolar</p>
          </section>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', margin: '1.5rem 0' }} />

          {/* Contact */}
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#00E5FF', marginBottom: '1rem' }}>
              Kontakt / Contacto
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#D1D5DB', fontSize: '0.9rem' }}>
                <Phone size={16} style={{ color: '#00E5FF', flexShrink: 0 }} />
                <span><strong style={{ color: '#9CA3AF' }}>Telefon:</strong> +49 178 8338 735</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#D1D5DB', fontSize: '0.9rem' }}>
                <Mail size={16} style={{ color: '#00E5FF', flexShrink: 0 }} />
                <span>
                  <strong style={{ color: '#9CA3AF' }}>E-Mail:</strong>{' '}
                  <a href="mailto:info@dicilo.net" style={{ color: '#00E5FF', textDecoration: 'none' }}>info@dicilo.net</a>
                </span>
              </div>
            </div>
          </section>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', margin: '1.5rem 0' }} />

          {/* VAT */}
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#00E5FF', marginBottom: '0.75rem' }}>
              Umsatzsteuer-ID / NIF-IVA
            </h2>
            <p style={{ color: '#9CA3AF', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
              Umsatzsteuer-Identifikationsnummer gemäß §27 a Umsatzsteuergesetz:
            </p>
            <p style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.95rem' }}>DE323288362</p>
          </section>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', margin: '1.5rem 0' }} />

          {/* Editorial responsibility */}
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#00E5FF', marginBottom: '0.75rem' }}>
              Redaktionell verantwortlich
            </h2>
            <p style={{ color: '#D1D5DB', fontSize: '0.9rem' }}>Nilo Escolar</p>
          </section>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', margin: '1.5rem 0' }} />

          {/* EU dispute resolution */}
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#00E5FF', marginBottom: '0.75rem' }}>
              EU-Streitschlichtung
            </h2>
            <p style={{ color: '#D1D5DB', fontSize: '0.9rem', lineHeight: 1.7 }}>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
              <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" style={{ color: '#00E5FF', textDecoration: 'none' }}>
                https://ec.europa.eu/consumers/odr/
              </a>.{' '}
              Unsere E-Mail-Adresse finden Sie oben im Impressum.
            </p>
          </section>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', margin: '1.5rem 0' }} />

          {/* Consumer dispute */}
          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#00E5FF', marginBottom: '0.75rem' }}>
              Verbraucherstreitbeilegung / Universalschlichtungsstelle
            </h2>
            <p style={{ color: '#D1D5DB', fontSize: '0.9rem', lineHeight: 1.7 }}>
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '0.75rem' }}>
          © 2025 DiciCoin — MILENIUM HOLDING &amp; CONSULTING (UG) · Mühlendamm 84a · 22087 Hamburg
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: '#00E5FF', fontSize: '0.8rem', textDecoration: 'none' }}>Inicio</Link>
          <Link href="/imprint" style={{ color: '#9CA3AF', fontSize: '0.8rem', textDecoration: 'none' }}>Imprint</Link>
          <Link href="/privacy" style={{ color: '#9CA3AF', fontSize: '0.8rem', textDecoration: 'none' }}>Privacy</Link>
        </div>
      </footer>
    </div>
  );
}
