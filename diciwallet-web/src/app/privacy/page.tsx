'use client';

import React from 'react';
import Link from 'next/link';
import { LogIn, Globe, Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <>
      {/* Same sticky header as landing page */}
      <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 5%', backdropFilter: 'blur(20px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src="/dicicoin-logo.jpg" alt="DiciCoin Logo" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--gold-primary)', objectFit: 'cover' }} />
          <span className="text-gold" style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.05em' }}>DICICOIN</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>
          <Shield size={16} style={{ color: 'var(--blue-electric)' }} />
          Privacy Policy
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
            <Shield size={13} style={{ color: 'var(--blue-electric)' }} />
            <span style={{ color: 'var(--blue-electric)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Datenschutzerklärung · Privacy Policy</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.75rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '0.75rem' }}>
            Política de Privacidad
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            DiciCoin — Servicio de MILENIUM HOLDING &amp; CONSULTING (UG)
          </p>
        </div>

        {/* Info boxes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          {[
            { label: 'Última actualización', value: '15. Sept. 2025' },
            { label: 'Responsable', value: 'MILENIUM HOLDING (UG)' },
            { label: 'Contacto', value: 'info@dicilo.net' },
          ].map((b) => (
            <div key={b.label} className="glass" style={{ borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center', border: '1px solid var(--border-light)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{b.label}</p>
              <p className="text-blue" style={{ fontSize: '0.875rem', fontWeight: 700 }}>{b.value}</p>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: 'clamp(1.5rem, 4vw, 2.5rem)', border: '1px solid var(--border-light)', lineHeight: 1.75, color: 'var(--text-secondary)' }}>

          <LegalSection title="1. Allgemeine Hinweise / Información General">
            <p>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.</p>
            <LegalH3>Datenerfassung auf dieser Website</LegalH3>
            <p>Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.</p>
            <LegalH3>Wie erfassen wir Ihre Daten?</LegalH3>
            <p>Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z. B. um Daten handeln, die Sie in ein Kontaktformular eingeben.</p>
            <p style={{ marginTop: '0.5rem' }}>Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z. B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs).</p>
            <LegalH3>Wofür nutzen wir Ihre Daten?</LegalH3>
            <p>Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.</p>
            <LegalH3>Welche Rechte haben Sie bezüglich Ihrer Daten?</LegalH3>
            <p>Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen.</p>
            <p style={{ marginTop: '0.5rem' }}>Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt haben, können Sie diese Einwilligung jederzeit für die Zukunft widerrufen. Außerdem haben Sie das Recht, unter bestimmten Umständen die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.</p>
            <LegalH3>Analyse-Tools und Tools von Drittanbietern</LegalH3>
            <p>Beim Besuch dieser Website kann Ihr Surf-Verhalten statistisch ausgewertet werden. Detaillierte Informationen zu diesen Analyseprogrammen finden Sie in der folgenden Datenschutzerklärung.</p>
          </LegalSection>

          <LegalDivider />

          <LegalSection title="2. Hosting und Content Delivery Networks (CDN)">
            <p>Wir hosten die Inhalte unserer Website bei folgendem Anbieter:</p>
            <LegalH3>Externes Hosting</LegalH3>
            <p>Diese Website wird extern gehostet. Die personenbezogenen Daten, die auf dieser Website erfasst werden, werden auf den Servern des Hosters gespeichert. Hierbei kann es sich v. a. um IP-Adressen, Kontaktanfragen, Meta- und Kommunikationsdaten, Vertragsdaten, Kontaktdaten, Namen, Websitezugriffe und sonstige Daten, die über eine Website generiert werden, handeln. Das externe Hosting erfolgt zum Zwecke der Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO) und im Interesse einer sicheren, schnellen und effizienten Bereitstellung unseres Online-Angebots durch einen professionellen Anbieter (Art. 6 Abs. 1 lit. f DSGVO).</p>
            <p style={{ marginTop: '0.5rem' }}>Anbieter ist die Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland (Firebase Hosting).</p>
            <LegalH3>Auftragsverarbeitung</LegalH3>
            <p>Wir haben einen Vertrag über Auftragsverarbeitung (AVV) zur Nutzung des oben genannten Dienstes geschlossen, der gewährleistet, dass die personenbezogenen Daten unserer Websitebesucher nur nach unseren Weisungen und unter Einhaltung der DSGVO verarbeitet werden.</p>
          </LegalSection>

          <LegalDivider />

          <LegalSection title="3. Allgemeine Hinweise und Pflichtinformationen">
            <LegalH3>Datenschutz</LegalH3>
            <p>Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.</p>
            <LegalH3>Hinweis zur verantwortlichen Stelle</LegalH3>
            <p>Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:</p>
            <p style={{ marginTop: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>MILENIUM HOLDING &amp; CONSULTING (UG)<br />Mühlendamm 84a · 22087 Hamburg – Deutschland<br />Telefon: +49 178 8338 735 · E-Mail: info@dicilo.net</p>
            <LegalH3>Speicherdauer</LegalH3>
            <p>Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt wurde, verbleiben Ihre personenbezogenen Daten bei uns, bis der Zweck für die Datenverarbeitung entfällt.</p>
            <LegalH3>Rechtsgrundlagen der Datenverarbeitung</LegalH3>
            <p>Sofern Sie in die Datenverarbeitung eingewilligt haben, verarbeiten wir Ihre personenbezogenen Daten auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO bzw. Art. 9 Abs. 2 lit. a DSGVO. Im Falle einer ausdrücklichen Einwilligung in die Übertragung personenbezogener Daten in Drittstaaten erfolgt die Datenverarbeitung außerdem auf Grundlage von Art. 49 Abs. 1 lit. a DSGVO.</p>
            <LegalH3>Hinweis zur Datenweitergabe in Drittstaaten</LegalH3>
            <p>Wir verwenden unter anderem Tools von Unternehmen mit Sitz in den USA oder sonstigen datenschutzrechtlich nicht sicheren Drittstaaten. Wir weisen darauf hin, dass in diesen Ländern kein mit der EU vergleichbares Datenschutzniveau garantiert werden kann.</p>
            <LegalH3>Widerruf Ihrer Einwilligung</LegalH3>
            <p>Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.</p>
            <LegalH3>Widerspruchsrecht (Art. 21 DSGVO)</LegalH3>
            <p style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.03em' }}>WENN DIE DATENVERARBEITUNG AUF GRUNDLAGE VON ART. 6 ABS. 1 LIT. E ODER F DSGVO ERFOLGT, HABEN SIE JEDERZEIT DAS RECHT, AUS GRÜNDEN, DIE SICH AUS IHRER BESONDEREN SITUATION ERGEBEN, GEGEN DIE VERARBEITUNG IHRER PERSONENBEZOGENEN DATEN WIDERSPRUCH EINZULEGEN.</p>
            <LegalH3>Beschwerderecht bei der Aufsichtsbehörde</LegalH3>
            <p>Im Falle von Verstößen gegen die DSGVO steht den Betroffenen ein Beschwerderecht bei einer Aufsichtsbehörde, insbesondere in dem Mitgliedstaat ihres gewöhnlichen Aufenthalts, ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes zu.</p>
            <LegalH3>Recht auf Datenübertragbarkeit</LegalH3>
            <p>Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung eines Vertrags automatisiert verarbeiten, an sich oder an einen Dritten in einem gängigen, maschinenlesbaren Format aushändigen zu lassen.</p>
            <LegalH3>Auskunft, Berichtigung und Löschung</LegalH3>
            <p>Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung sowie ein Recht auf Berichtigung oder Löschung dieser Daten.</p>
            <LegalH3>Recht auf Einschränkung der Verarbeitung</LegalH3>
            <p>Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen in folgenden Fällen:</p>
            <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>Wenn Sie die Richtigkeit Ihrer bei uns gespeicherten personenbezogenen Daten bestreiten.</li>
              <li>Wenn die Verarbeitung Ihrer personenbezogenen Daten unrechtmäßig geschah/geschieht.</li>
              <li>Wenn wir Ihre personenbezogenen Daten nicht mehr benötigen, Sie sie jedoch zur Ausübung, Verteidigung oder Geltendmachung von Rechtsansprüchen benötigen.</li>
              <li>Wenn Sie einen Widerspruch nach Art. 21 Abs. 1 DSGVO eingelegt haben.</li>
            </ul>
            <LegalH3>SSL- bzw. TLS-Verschlüsselung</LegalH3>
            <p>Diese Seite nutzt aus Sicherheitsgründen eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von „http://" auf „https://" wechselt.</p>
            <LegalH3>Widerspruch gegen Werbe-E-Mails</LegalH3>
            <p>Der Nutzung von im Rahmen der Impressumspflicht veröffentlichten Kontaktdaten zur Übersendung von nicht ausdrücklich angeforderter Werbung wird hiermit widersprochen. Die Betreiber der Seiten behalten sich ausdrücklich rechtliche Schritte im Falle der unverlangten Zusendung von Werbeinformationen vor.</p>
          </LegalSection>
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
            <Link href="/imprint" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Imprint</Link>
            <Link href="/privacy" style={{ color: 'var(--blue-electric)', fontSize: '0.8rem' }}>Privacy</Link>
          </div>
        </div>
      </footer>
    </>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '0.5rem' }}>
      <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--blue-electric)', marginBottom: '1rem', paddingTop: '0.25rem' }}>{title}</h2>
      <div style={{ fontSize: '0.875rem' }}>{children}</div>
    </section>
  );
}

function LegalH3({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '1.25rem', marginBottom: '0.4rem' }}>{children}</h3>;
}

function LegalDivider() {
  return <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '1.75rem 0' }} />;
}
