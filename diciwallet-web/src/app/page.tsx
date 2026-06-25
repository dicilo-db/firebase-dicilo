'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Coins, 
  Award, 
  Shield, 
  Globe, 
  BookOpen, 
  ArrowRight, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  LogIn,
  Layers,
  HelpCircle,
  FileText
} from 'lucide-react';

const localTranslations = {
  ES: {
    nav_home: "Inicio",
    nav_what_is: "Qué es DiciCoin",
    nav_benefits: "Beneficios",
    nav_faq: "FAQ",
    nav_login: "Iniciar sesión",
    nav_dashboard: "Mi Wallet",
    
    hero_badge: "Ecosistema Circular Cerrado",
    hero_title: "DiciCoin: el símbolo de acceso al ecosistema Dicilo",
    hero_subtitle: "Una moneda física, conmemorativa y coleccionable que representa pertenencia, participación temprana y acceso a beneficios internos dentro de Dicilo.",
    hero_btn_learn: "Conocer DiciCoin",
    hero_btn_login: "Iniciar Sesión",
    
    card_physical_title: "Moneda Física Coleccionable",
    card_physical_desc: "Pieza real acuñada de colección limitada a nivel mundial por continente.",
    card_access_title: "Acceso al Ecosistema",
    card_access_desc: "Tu llave física y digital preferencial para interactuar y operar en Dicilo.net.",
    card_benefits_title: "Beneficios Internos",
    card_benefits_desc: "Campañas exclusivas, comisiones preferentes y descuentos del club Dicilo.",
    card_community_title: "Comunidad Global",
    card_community_desc: "Conecta con miles de fundadores, profesionales y empresas en todo el mundo.",
    card_education_title: "Centro de Aprendizaje",
    card_education_desc: "Educación y recursos para entender el valor del ecosistema económico circular.",

    what_is_title: "¿Qué es DiciCoin?",
    what_is_p1: "DiciCoin ha sido concebida como una moneda conmemorativa física de edición limitada, que sirve como un símbolo exclusivo de membresía para los fundadores y colaboradores tempranos del proyecto Dicilo.",
    what_is_p2: "Es crucial entender que DiciCoin no es una criptomoneda pública de intercambio especulativo. No cotiza en mercados secundarios externos y no está destinada a la especulación.",
    what_is_p3: "Su valor principal radica en la exclusividad física de la colección y su utilidad interna de acceso a los servicios, herramientas y beneficios especiales dentro de la red Dicilo.net.",
    
    what_is_not_title: "Lo que NO es DiciCoin",
    what_is_not_item1: "No es una criptomoneda ni una stablecoin de cotización pública.",
    what_is_not_item2: "No es un producto financiero, fondo de inversión ni valor mobiliario.",
    what_is_not_item3: "No garantiza retornos financieros, dividendos ni revalorizaciones de precio.",

    benefits_title: "Beneficios dentro del Ecosistema",
    benefits_item1_title: "Participación en Red",
    benefits_item1_desc: "Acceso prioritario a campañas comerciales internas de Dicilo y recompensas ampliadas.",
    benefits_item2_title: "Descuentos de Aliados",
    benefits_item2_desc: "Canjes preferenciales y promociones exclusivas con negocios afiliados.",
    benefits_item3_title: "Acuñación y Exclusividad",
    benefits_item3_desc: "Derecho a poseer una de las 10,000,000 de piezas físicas únicas emitidas globalmente.",

    dp_title: "Relación de DiciCoin y los DP (Dicipoints)",
    dp_desc1: "Los Dicipoints (DP) son la unidad de recompensa interna y de fidelización dentro de Dicilo.net. Se ganan participando en la comunidad, recomendando negocios o interactuando.",
    dp_desc2: "Los DP no son dinero de curso legal externo, pero poseen una equivalencia referencial dentro de la red (10 DP = 1 € de valor interno). Puedes utilizar tus DP acumulados para acceder a DiciCoins o respaldar tu participación.",

    faq_title: "Preguntas Frecuentes",
    faq_q1: "¿Qué es DiciCoin?",
    faq_a1: "Es una moneda física de edición limitada y coleccionable que actúa como llave de acceso y símbolo de membresía exclusiva en el ecosistema cerrado Dicilo.",
    faq_q2: "¿Qué no es DiciCoin?",
    faq_a2: "No es un instrumento de inversión, no es un producto financiero regulado y no garantiza ganancias económicas futuras ni dividendos de ningún tipo.",
    faq_q3: "¿Cómo puedo adquirir una?",
    faq_a3: "Puedes reservarla desde la plataforma con un pago inicial del 10% (500 €) o completar la adquisición de participaciones (fracciones) o de la moneda completa utilizando USDT o Revolut.",
    faq_q4: "¿Qué beneficios obtengo al poseerla?",
    faq_a4: "Acceso prioritario a herramientas de Dicilo.net, participación en Marketplace, descuentos en negocios asociados y emisión de un certificado digital único de propiedad.",
    faq_q5: "¿Es una criptomoneda?",
    faq_a5: "No. Aunque para la comodidad de la comunidad permitimos aportaciones automáticas de liquidación con USDT, DiciCoin en sí es una pieza coleccionable física con registro digital de propiedad interno, no un activo criptográfico de mercado público.",
    faq_q6: "¿Puedo venderla fuera de Dicilo?",
    faq_a6: "El registro oficial de propiedad y las licencias asociadas solo son reconocidos y auditados a través de la base de datos oficial y del Marketplace interno del ecosistema para seguridad de todos.",

    legal_title: "Aviso Legal Obligatorio",
    legal_text: "DiciCoin no constituye una criptomoneda de intercambio público, valor mobiliario, producto financiero, instrumento de inversión ni promesa de rendimiento o rentabilidad. Su adquisición representa la compra de un activo coleccionable físico de edición limitada con derechos simbólicos de acceso preferente dentro del ecosistema circular Dicilo.net. Toda transacción está sujeta a los términos y condiciones de la plataforma.",

    footer_rights: "Todos los derechos reservados. Dicilo Ecosistema Circular.",
    whatsapp_msg: "Hola, he visto DiciCoin y me gustaría tener mayor información. Por favor comuníquese conmigo a este número."
  },
  EN: {
    nav_home: "Home",
    nav_what_is: "What is DiciCoin",
    nav_benefits: "Benefits",
    nav_faq: "FAQ",
    nav_login: "Login",
    nav_dashboard: "My Wallet",
    
    hero_badge: "Closed Circular Ecosystem",
    hero_title: "DiciCoin: the access symbol to the Dicilo ecosystem",
    hero_subtitle: "A physical, commemorative and collectible coin representing membership, early participation and access to internal benefits within Dicilo.",
    hero_btn_learn: "Learn More",
    hero_btn_login: "Login",
    
    card_physical_title: "Collectible Physical Coin",
    card_physical_desc: "Real minted piece of limited worldwide collection by continent.",
    card_access_title: "Ecosystem Access",
    card_access_desc: "Your physical and digital key to interact and operate preferentially on Dicilo.net.",
    card_benefits_title: "Internal Benefits",
    card_benefits_desc: "Exclusive campaigns, preferential commissions and discounts from the Dicilo club.",
    card_community_title: "Global Community",
    card_community_desc: "Connect with thousands of founders, professionals and businesses around the world.",
    card_education_title: "Learning Center",
    card_education_desc: "Education and resources to understand the value of the circular economic ecosystem.",

    what_is_title: "What is DiciCoin?",
    what_is_p1: "DiciCoin is conceived as a physical commemorative coin of limited edition, serving as an exclusive symbol of membership for early founders and contributors of the Dicilo project.",
    what_is_p2: "It is crucial to understand that DiciCoin is not a public cryptocurrency of speculative exchange. It is not listed on external secondary markets and is not intended for speculation.",
    what_is_p3: "Its main value lies in the physical exclusivity of the collection and its internal utility of access to services, tools and special benefits within the Dicilo.net network.",
    
    what_is_not_title: "What DiciCoin is NOT",
    what_is_not_item1: "It is not a publicly listed cryptocurrency or stablecoin.",
    what_is_not_item2: "It is not a financial product, investment fund or security.",
    what_is_not_item3: "It does not guarantee financial returns, dividends or price appreciation.",

    benefits_title: "Benefits within the Ecosystem",
    benefits_item1_title: "Network Participation",
    benefits_item1_desc: "Priority access to internal Dicilo commercial campaigns and expanded rewards.",
    benefits_item2_title: "Partner Discounts",
    benefits_item2_desc: "Preferential redemptions and exclusive promotions with affiliated businesses.",
    benefits_item3_title: "Minting & Exclusivity",
    benefits_item3_desc: "Right to own one of the 10,000,000 unique physical pieces issued globally.",

    dp_title: "DiciCoin and DP (Dicipoints) Relation",
    dp_desc1: "Dicipoints (DP) are the internal reward and loyalty unit within Dicilo.net. They are earned by participating in the community, recommending businesses or interacting.",
    dp_desc2: "DPs are not external legal tender, but have a reference equivalence within the network (10 DP = 1 € internal value). You can use your accumulated DPs to acquire DiciCoins.",

    faq_title: "Frequently Asked Questions",
    faq_q1: "What is DiciCoin?",
    faq_a1: "It is a physical, limited-edition collectible coin that acts as an access key and exclusive membership symbol in the closed Dicilo ecosystem.",
    faq_q2: "What is DiciCoin not?",
    faq_a2: "It is not an investment instrument, not a regulated financial product, and does not guarantee future financial returns or dividends of any kind.",
    faq_q3: "How can I acquire one?",
    faq_a3: "You can reserve it from the platform with a 10% down payment (500 €) or complete the acquisition of fractions or the full coin using USDT or Revolut.",
    faq_q4: "What benefits do I get by owning it?",
    faq_a4: "Priority access to Dicilo.net tools, Marketplace participation, partner business discounts, and issuance of a unique digital certificate of ownership.",
    faq_q5: "Is it a cryptocurrency?",
    faq_a5: "No. Although for the community's convenience we allow automated settlement with USDT, DiciCoin itself is a physical collectible with an internal digital record, not a public cryptographic market asset.",
    faq_q6: "Can I sell it outside Dicilo?",
    faq_a6: "Official ownership records and associated licenses are only recognized and audited through our database and the internal Marketplace for safety.",

    legal_title: "Required Legal Disclaimer",
    legal_text: "DiciCoin does not constitute a publicly traded cryptocurrency, security, financial product, investment instrument, or promise of yield or profitability. Its acquisition represents the purchase of a limited edition physical collectible asset with symbolic preferential access rights within the closed circular ecosystem Dicilo.net. All transactions are subject to the platform's terms and conditions.",

    footer_rights: "All rights reserved. Dicilo Circular Ecosystem.",
    whatsapp_msg: "Hello, I have seen DiciCoin and I would like to get more information. Please contact me at this number."
  },
  DE: {
    nav_home: "Startseite",
    nav_what_is: "Was ist DiciCoin",
    nav_benefits: "Vorteile",
    nav_faq: "FAQ",
    nav_login: "Einloggen",
    nav_dashboard: "Meine Wallet",
    
    hero_badge: "Geschlossenes Kreislauf-Ökosystem",
    hero_title: "DiciCoin: das Zugangssymbol zum Dicilo-Ökosystem",
    hero_subtitle: "Eine physische, limitierte Gedenkmünze, die Mitgliedschaft, frühe Beteiligung und Zugang zu internen Vorteilen in Dicilo repräsentiert.",
    hero_btn_learn: "Mehr erfahren",
    hero_btn_login: "Einloggen",
    
    card_physical_title: "Physische Sammlermünze",
    card_physical_desc: "Echte geprägte Münze aus einer weltweit limitierten Kollektion nach Kontinent.",
    card_access_title: "Zugang zum Ökosystem",
    card_access_desc: "Ihr physischer und digitaler Schlüssel für bevorzugte Interaktionen auf Dicilo.net.",
    card_benefits_title: "Interne Vorteile",
    card_benefits_desc: "Exklusive Kampagnen, bevorzugte Provisionen und Rabatte im Dicilo-Club.",
    card_community_title: "Globale Gemeinschaft",
    card_community_desc: "Verbinden Sie sich mit Tausenden von Gründern, Fachleuten und Unternehmen weltweit.",
    card_education_title: "Lernzentrum",
    card_education_desc: "Bildung und Ressourcen, um den Wert des zirkulären Wirtschaftssystems zu verstehen.",

    what_is_title: "Was ist DiciCoin?",
    what_is_p1: "DiciCoin wurde als physische Gedenkmünze in limitierter Auflage konzipiert und dient als exklusives Mitgliedschaftssymbol für frühe Gründer und Unterstützer des Dicilo-Projekts.",
    what_is_p2: "Es ist wichtig zu verstehen, dass DiciCoin keine öffentliche Kryptowährung für spekulativen Handel ist. Sie ist nicht an externen Sekundärmärkten notiert und nicht für Spekulationen gedacht.",
    what_is_p3: "Ihr Hauptwert liegt in der physischen Exklusivität der Sammlung und ihrem internen Nutzen für den Zugang zu Diensten, Tools und besonderen Vorteilen im Dicilo.net-Netzwerk.",
    
    what_is_not_title: "Was DiciCoin NICHT ist",
    what_is_not_item1: "Sie ist keine öffentlich gelistete Kryptowährung oder Stablecoin.",
    what_is_not_item2: "Sie ist kein Finanzprodukt, Investmentfonds oder Wertpapier.",
    what_is_not_item3: "Sie garantiert keine finanziellen Erträge, Dividenden oder Wertsteigerungen.",

    benefits_title: "Vorteile im Ökosystem",
    benefits_item1_title: "Netzwerk-Teilnahme",
    benefits_item1_desc: "Bevorzugter Zugang zu internen Dicilo-Kampagnen und erweiterten Belohnungen.",
    benefits_item2_title: "Partner-Rabatte",
    benefits_item2_desc: "Bevorzugte Einlösungen und exklusive Aktionen bei Partnerunternehmen.",
    benefits_item3_title: "Prägung & Exklusivität",
    benefits_item3_desc: "Recht auf Besitz einer der 10,000,000 weltweit ausgegebenen physischen Münzen.",

    dp_title: "DiciCoin und DP (Dicipoints) Verhältnis",
    dp_desc1: "Dicipoints (DP) sind die interne Belohnungs- und Treueeinheit auf Dicilo.net. Sie werden durch Teilnahme an der Community, Empfehlungen oder Interaktion verdient.",
    dp_desc2: "DPs sind kein externes gesetzliches Zahlungsmittel, haben jedoch eine Referenzwert im Netzwerk (10 DP = 1 € interner Wert). Sie können Ihre gesammelten DPs verwenden, um DiciCoins zu erwerben.",

    faq_title: "Häufig gestellte Fragen",
    faq_q1: "Was ist DiciCoin?",
    faq_a1: "Es ist eine physische Sammlermünze in limitierter Auflage, die als Zugangsschlüssel und exklusives Mitgliedschaftssymbol im geschlossenen Dicilo-Ökosystem dient.",
    faq_q2: "Was ist DiciCoin nicht?",
    faq_a2: "Sie ist kein Anlageinstrument, kein reguliertes Finanzprodukt und garantiert keine zukünftigen finanziellen Erträge oder Dividenden jeglicher Art.",
    faq_q3: "Wie kann ich eine erwerben?",
    faq_a3: "Sie können sie über die Plattform mit einer Anzahlung von 10% (500 €) reservieren oder den Erwerb von Anteilen oder der gesamten Münze mit USDT oder Revolut abschließen.",
    faq_q4: "Welche Vorteile habe ich durch den Besitz?",
    faq_a4: "Bevorzugter Zugang zu Dicilo.net-Tools, Teilnahme am Marketplace, Rabatte bei Partnern und Ausstellung eines eindeutigen digitalen Eigentumszertifikats.",
    faq_q5: "Ist es eine Kryptowährung?",
    faq_a5: "Nein. Obwohl wir zur Bequemlichkeit der Community automatische Abrechnungen in USDT erlauben, is DiciCoin selbst ein physisches Sammlerstück mit internem digitalen Register, kein öffentlicher Krypto-Handelswert.",
    faq_q6: "Kann ich sie außerhalb von Dicilo verkaufen?",
    faq_a6: "Offizielle Eigentumsregister und zugehörige Lizenzen werden zur Sicherheit aller nur über unsere Datenbank und den internen Marketplace anerkannt.",

    legal_title: "Erforderlicher rechtlicher Haftungsausschluss",
    legal_text: "DiciCoin stellt keine öffentlich gehandelte Kryptowährung, kein Wertpapier, kein Finanzprodukt, kein Anlageinstrument oder eine Zusage von Ertrag oder Rentabilität dar. Ihr Erwerb repräsentiert den Kauf eines physischen Sammlerstücks in limitierter Auflage mit symbolischen bevorzugten Zugangsrechten im geschlossenen zirkulären Ökosystem Dicilo.net. Alle Transaktionen unterliegen den Bedingungen der Plattform.",

    footer_rights: "Alle Rechte vorbehalten. Dicilo Zirkuläres Ökosystem.",
    whatsapp_msg: "Hallo, ich habe DiciCoin gesehen und würde gerne mehr Informationen erhalten. Bitte kontaktieren Sie mich unter dieser Nummer."
  }
};

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Redirigir al dashboard si ya está autenticado
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const t = (key: keyof typeof localTranslations.ES): string => {
    const lang = (language === 'EN' || language === 'DE' || language === 'ES') ? language : 'ES';
    return localTranslations[lang][key] || localTranslations.ES[key] || '';
  };

  const handleScrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading || user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0B0B0C' }}>
        <div className="animate-spin-slow" style={{ width: '40px', height: '40px', border: '3px solid rgba(212, 175, 55, 0.1)', borderTopColor: '#D4AF37', borderRadius: '50%' }} />
      </div>
    );
  }

  const faqs = [
    { q: t('faq_q1'), a: t('faq_a1') },
    { q: t('faq_q2'), a: t('faq_a2') },
    { q: t('faq_q3'), a: t('faq_a3') },
    { q: t('faq_q4'), a: t('faq_a4') },
    { q: t('faq_q5'), a: t('faq_a5') },
    { q: t('faq_q6'), a: t('faq_a6') },
  ];

  return (
    <div style={{ backgroundColor: '#0B0B0C', color: '#FFFFFF', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden' }}>
      
      {/* Decorative Blur Backgrounds */}
      <div style={{ position: 'absolute', top: '5%', right: '-10%', width: '45vw', height: '45vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0, 229, 255, 0.08) 0%, transparent 70%)', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40%', left: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212, 175, 55, 0.06) 0%, transparent 70%)', filter: 'blur(120px)', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0, 229, 255, 0.05) 0%, transparent 70%)', filter: 'blur(90px)', zIndex: 0, pointerEvents: 'none' }} />

      {/* Header / Navbar */}
      <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 5%', backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/dicicoin-logo.jpg" alt="DiciCoin Logo" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--gold-primary)', objectFit: 'cover' }} />
          <span className="text-gold" style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.05em' }}>DICICOIN</span>
        </div>
        
        {/* Navigation Menu Links */}
        <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }} className="desktop-only-flex">
          <button onClick={() => handleScrollToSection('inicio')} style={{ background: 'none', border: 'none', color: '#FFFFFF', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>{t('nav_home')}</button>
          <button onClick={() => handleScrollToSection('que-es')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>{t('nav_what_is')}</button>
          <button onClick={() => handleScrollToSection('beneficios')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>{t('nav_benefits')}</button>
          <button onClick={() => handleScrollToSection('faq')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>{t('nav_faq')}</button>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Language Selector */}
          <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}>
            <Globe size={14} style={{ color: 'var(--text-secondary)' }} />
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
                      padding: '3px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>

          <Link href="/login" className="btn-gold" style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '4px', boxShadow: 'none' }}>
            <LogIn size={14} />
            <span>{t('nav_login')}</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flexGrow: 1, position: 'relative', zIndex: 1 }}>

        {/* Hero Section */}
        <section id="inicio" style={{ padding: '80px 5% 60px 5%', maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr', gap: '40px', alignItems: 'center' }} className="hero-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass" style={{ display: 'inline-flex', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(212, 175, 55, 0.2)', width: 'fit-content', background: 'rgba(212, 175, 55, 0.04)' }}>
              <span style={{ color: '#D4AF37', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('hero_badge')}</span>
            </div>
            <h1 style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1.15 }}>
              {t('hero_title')}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.6, maxWidth: '580px' }}>
              {t('hero_subtitle')}
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '12px' }}>
              <button onClick={() => handleScrollToSection('que-es')} className="btn-gold">
                <span>{t('hero_btn_learn')}</span>
                <ArrowRight size={16} />
              </button>
              <Link href="/login" className="btn-outline" style={{ borderColor: 'var(--border-gold-hover)', color: '#D4AF37' }}>
                {t('hero_btn_login')}
              </Link>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%', height: '80%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 60%)', filter: 'blur(30px)', zIndex: -1 }} />
            <img
              src="/dicicoin-physical.png"
              alt="DiciCoin Physical Collection"
              className="animate-glow"
              style={{ width: '100%', maxWidth: '380px', filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.8)) drop-shadow(0 0 40px rgba(212,175,55,0.3))' }}
            />
          </div>
        </section>

        {/* Quick Cards Grid */}
        <section style={{ padding: '60px 5%', backgroundColor: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            
            <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Coins className="h-6 w-6 text-amber-500" />
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{t('card_physical_title')}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t('card_physical_desc')}</p>
            </div>

            <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Layers className="h-6 w-6 text-blue-400" />
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{t('card_access_title')}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t('card_access_desc')}</p>
            </div>

            <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Award className="h-6 w-6 text-yellow-500" />
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{t('card_benefits_title')}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t('card_benefits_desc')}</p>
            </div>

            <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Globe className="h-6 w-6 text-teal-400" />
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{t('card_community_title')}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t('card_community_desc')}</p>
            </div>

            <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <BookOpen className="h-6 w-6 text-purple-400" />
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{t('card_education_title')}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t('card_education_desc')}</p>
            </div>

          </div>
        </section>

        {/* Section: What is DiciCoin */}
        <section id="que-es" style={{ padding: '80px 5%', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px' }} className="info-split-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 800 }} className="text-gold">{t('what_is_title')}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6 }}>{t('what_is_p1')}</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6 }}>{t('what_is_p2')}</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6 }}>{t('what_is_p3')}</p>
            </div>

            {/* What is NOT cards */}
            <div className="glass-gold" style={{ padding: '32px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(212, 175, 55, 0.01)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#D4AF37', borderBottom: '1px solid var(--border-gold)', paddingBottom: '10px' }}>
                {t('what_is_not_title')}
              </h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px', listStyleType: 'none' }}>
                <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <span style={{ color: '#EB5757', fontWeight: 'bold' }}>✕</span>
                  <span>{t('what_is_not_item1')}</span>
                </li>
                <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <span style={{ color: '#EB5757', fontWeight: 'bold' }}>✕</span>
                  <span>{t('what_is_not_item2')}</span>
                </li>
                <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <span style={{ color: '#EB5757', fontWeight: 'bold' }}>✕</span>
                  <span>{t('what_is_not_item3')}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section: Benefits and DiciCoin/DP */}
        <section id="beneficios" style={{ padding: '80px 5%', backgroundColor: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '50px' }}>
            
            {/* Ecosytem benefits */}
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 800, textAlign: 'center', marginBottom: '32px' }}>{t('benefits_title')}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                
                <div className="glass" style={{ padding: '28px', borderRadius: 'var(--radius-sm)' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#00E5FF', marginBottom: '8px' }}>{t('benefits_item1_title')}</h4>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t('benefits_item1_desc')}</p>
                </div>

                <div className="glass" style={{ padding: '28px', borderRadius: 'var(--radius-sm)' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#D4AF37', marginBottom: '8px' }}>{t('benefits_item2_title')}</h4>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t('benefits_item2_desc')}</p>
                </div>

                <div className="glass" style={{ padding: '28px', borderRadius: 'var(--radius-sm)' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#2ECC71', marginBottom: '8px' }}>{t('benefits_item3_title')}</h4>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t('benefits_item3_desc')}</p>
                </div>

              </div>
            </div>

            {/* DiciCoin vs DP info */}
            <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--border-gold)' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#D4AF37' }}>{t('dp_title')}</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{t('dp_desc1')}</p>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{t('dp_desc2')}</p>
            </div>

          </div>
        </section>

        {/* Section: FAQ */}
        <section id="faq" style={{ padding: '80px 5%', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, textAlign: 'center' }}>{t('faq_title')}</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index} 
                  className="glass" 
                  style={{ 
                    borderRadius: 'var(--radius-sm)', 
                    overflow: 'hidden', 
                    border: isOpen ? '1px solid var(--border-gold-hover)' : '1px solid var(--border-light)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <button 
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    style={{ 
                      width: '100%', 
                      padding: '20px 24px', 
                      background: 'none', 
                      border: 'none', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      color: isOpen ? '#D4AF37' : '#FFFFFF', 
                      fontSize: '15px', 
                      fontWeight: 700, 
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 24px 20px 24px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Legal Disclaimer Box */}
        <section style={{ padding: '40px 5% 80px 5%', maxWidth: '1000px', margin: '0 auto' }}>
          <div className="glass" style={{
            padding: '32px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(212, 175, 55, 0.02)',
            border: '1px solid rgba(212, 175, 55, 0.1)',
            display: 'flex',
            gap: '20px',
            alignItems: 'flex-start'
          }}>
            <AlertCircle size={24} style={{ color: '#D4AF37', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '15px', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('legal_title')}</span>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {t('legal_text')}
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="glass" style={{ borderTop: '1px solid var(--border-light)', padding: '48px 5% 32px 5%', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '40px' }} className="footer-cols">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/dicicoin-logo.jpg" alt="DiciCoin Logo" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--gold-primary)', objectFit: 'cover' }} />
              <span className="text-gold" style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.05em' }}>DICICOIN</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: 1.5 }}>
              {t('hero_subtitle')}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DiciCoin</span>
              <button onClick={() => handleScrollToSection('inicio')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', textAlign: 'left', padding: 0 }}>{t('nav_home')}</button>
              <button onClick={() => handleScrollToSection('que-es')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', textAlign: 'left', padding: 0 }}>{t('nav_what_is')}</button>
              <button onClick={() => handleScrollToSection('beneficios')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', textAlign: 'left', padding: 0 }}>{t('nav_benefits')}</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Soporte</span>
              <button onClick={() => handleScrollToSection('faq')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', textAlign: 'left', padding: 0 }}>{t('nav_faq')}</button>
              <a href={`https://wa.me/491788338735?text=${encodeURIComponent(t('whatsapp_msg'))}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>WhatsApp</a>
              <a href="https://t.me/Dicilo_der_Bot" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Telegram</a>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acceso</span>
              <Link href="/login" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{t('nav_login')}</Link>
              <Link href="/register" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Registro</Link>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <span>© {new Date().getFullYear()} Dicilo. {t('footer_rights')}</span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link href="/privacy" style={{ hover: { color: '#00E5FF' } }}>Privacidad</Link>
            <Link href="/imprint" style={{ hover: { color: '#00E5FF' } }}>Aviso Legal</Link>
          </div>
        </div>
      </footer>

      {/* Local Styles for Responsiveness */}
      <style jsx>{`
        .desktop-only-flex {
          display: flex;
        }
        @media (max-width: 768px) {
          .desktop-only-flex {
            display: none !important;
          }
          .hero-grid {
            grid-template-columns: 1fr !important;
            padding-top: 40px !important;
            text-align: center;
          }
          .hero-grid div {
            align-items: center;
          }
          .info-split-grid {
            grid-template-columns: 1fr !important;
          }
          .footer-cols {
            flex-direction: column;
            gap: 30px;
          }
        }
        @media (min-width: 769px) {
          .hero-grid {
            grid-template-columns: 1.2fr 0.8fr !important;
          }
          .info-split-grid {
            grid-template-columns: 1.2fr 0.8fr !important;
          }
        }
      `}</style>
    </div>
  );
}
