'use client';

import React from 'react';
import Link from 'next/link';
import { LogIn, Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <>
      <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 5%', backdropFilter: 'blur(20px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src="/dicicoin-logo.jpg" alt="DiciCoin" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--gold-primary)', objectFit: 'cover' }} />
          <span className="text-gold" style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.05em' }}>DICICOIN</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--blue-electric)', fontSize: '13px', fontWeight: 600 }}>
          <Shield size={16} />
          Privacy Policy
        </div>
        <Link href="/login" className="btn-gold" style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <LogIn size={14} /><span>Login</span>
        </Link>
      </header>

      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '60px 5% 100px' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="glass" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(0,229,255,0.25)', background: 'rgba(0,229,255,0.05)', marginBottom: '1.25rem' }}>
            <Shield size={13} style={{ color: 'var(--blue-electric)' }} />
            <span style={{ color: 'var(--blue-electric)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Datenschutzerklärung · Privacy Policy</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2, marginBottom: '0.75rem' }}>Política de Privacidad</h1>
          <p style={{ color: '#A0A0A8', fontSize: '1rem' }}>DiciCoin — MILENIUM HOLDING &amp; CONSULTING (UG)</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          {[{ l: 'Última actualización', v: '15. Sept. 2025' }, { l: 'Responsable', v: 'MILENIUM HOLDING (UG)' }, { l: 'Contacto', v: 'info@dicilo.net' }].map(b => (
            <div key={b.l} className="glass" style={{ borderRadius: '12px', padding: '1rem', textAlign: 'center', border: '1px solid var(--border-light)' }}>
              <p style={{ fontSize: '0.75rem', color: '#A0A0A8', marginBottom: '4px' }}>{b.l}</p>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--blue-electric)' }}>{b.v}</p>
            </div>
          ))}
        </div>

        <div className="glass" style={{ borderRadius: '20px', padding: 'clamp(1.5rem, 4vw, 2.5rem)', border: '1px solid var(--border-light)' }}>

          <S title="1. Información General">
            <P>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.</P>
            <H>Datenerfassung auf dieser Website</H>
            <P>Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.</P>
            <H>Wie erfassen wir Ihre Daten?</H>
            <P>Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen (z. B. Daten in einem Kontaktformular).</P>
            <P>Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z. B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs).</P>
            <H>Wofür nutzen wir Ihre Daten?</H>
            <P>Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.</P>
            <H>Welche Rechte haben Sie bezüglich Ihrer Daten?</H>
            <P>Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten sowie ein Recht auf Berichtigung oder Löschung dieser Daten. Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt haben, können Sie diese jederzeit für die Zukunft widerrufen.</P>
          </S>

          <D />

          <S title="2. Hosting">
            <P>Diese Website wird extern gehostet bei Google Ireland Limited (Firebase Hosting), Gordon House, Barrow Street, Dublin 4, Irland. Die personenbezogenen Daten, die auf dieser Website erfasst werden, werden auf den Servern des Hosters gespeichert.</P>
            <P>Das externe Hosting erfolgt zum Zwecke der Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO) und im Interesse einer sicheren, schnellen und effizienten Bereitstellung unseres Online-Angebots (Art. 6 Abs. 1 lit. f DSGVO). Wir haben einen Vertrag über Auftragsverarbeitung (AVV) mit dem Hoster abgeschlossen.</P>
          </S>

          <D />

          <S title="3. Allgemeine Hinweise und Pflichtinformationen">
            <H>Verantwortliche Stelle</H>
            <P>Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:</P>
            <div style={{ background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: '10px', padding: '1rem 1.25rem', margin: '0.75rem 0' }}>
              <p style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.8, margin: 0 }}>
                MILENIUM HOLDING &amp; CONSULTING (UG)<br />
                Mühlendamm 84a · 22087 Hamburg – Deutschland<br />
                Telefon: +49 178 8338 735<br />
                E-Mail: <a href="mailto:info@dicilo.net" style={{ color: 'var(--blue-electric)' }}>info@dicilo.net</a>
              </p>
            </div>
            <H>Speicherdauer</H>
            <P>Ihre personenbezogenen Daten bleiben bei uns gespeichert, bis der Zweck für die Datenverarbeitung entfällt oder Sie ein berechtigtes Löschersuchen geltend machen.</P>
            <H>Rechtsgrundlagen der Datenverarbeitung</H>
            <P>Sofern Sie eingewilligt haben, verarbeiten wir Ihre Daten auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO. Bei Vertragserfüllung gilt Art. 6 Abs. 1 lit. b DSGVO, bei rechtlichen Verpflichtungen Art. 6 Abs. 1 lit. c DSGVO.</P>
            <H>Datenweitergabe in Drittstaaten</H>
            <P>Wir verwenden Tools von Unternehmen mit Sitz in den USA. In diesen Ländern kann kein mit der EU vergleichbares Datenschutzniveau garantiert werden.</P>
            <H>Widerruf Ihrer Einwilligung</H>
            <P>Sie können eine erteilte Einwilligung jederzeit widerrufen. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt unberührt.</P>
            <H>Beschwerderecht</H>
            <P>Im Falle von Verstößen gegen die DSGVO steht Ihnen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.</P>
            <H>Recht auf Datenübertragbarkeit, Auskunft, Berichtigung und Löschung</H>
            <P>Sie haben das Recht, Daten in einem maschinenlesbaren Format zu erhalten sowie jederzeit unentgeltliche Auskunft über Ihre gespeicherten Daten zu verlangen. Auf Wunsch berichtigen oder löschen wir diese Daten.</P>
            <H>Recht auf Einschränkung der Verarbeitung</H>
            <P>Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen, wenn Sie die Richtigkeit bestreiten, die Verarbeitung unrechtmäßig ist, oder Sie einen Widerspruch eingelegt haben.</P>
            <H>SSL-/TLS-Verschlüsselung</H>
            <P>Diese Seite nutzt aus Sicherheitsgründen SSL-/TLS-Verschlüsselung. Sie erkennen eine verschlüsselte Verbindung am „https://" in der Adresszeile.</P>
          </S>

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
          <Link href="/imprint" style={{ color: '#A0A0A8', fontSize: '0.8rem' }}>Imprint</Link>
          <Link href="/privacy" style={{ color: 'var(--blue-electric)', fontSize: '0.8rem' }}>Privacy</Link>
        </div>
      </footer>
    </>
  );
}

function S({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '0.25rem' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--blue-electric)', marginBottom: '1rem', paddingTop: '0.25rem' }}>{title}</h2>
      {children}
    </section>
  );
}
function H({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF', marginTop: '1.25rem', marginBottom: '0.5rem' }}>{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p style={{ color: '#D1D5DB', fontSize: '0.9rem', lineHeight: 1.75, marginBottom: '0.75rem' }}>{children}</p>;
}
function D() {
  return <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '1.75rem 0' }} />;
}
