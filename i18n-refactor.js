const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'public', 'locales');
const languages = ['ar', 'de', 'en', 'es', 'fr', 'hi', 'it', 'lt', 'pl', 'pt', 'ru', 'zh'];

// 1. Dictionaries
const dictES = {
    chatbot: {
        title: "Asistente I.A.",
        desc: "Entrena a tu propio robot de atención al cliente para que responda dudas sobre tu negocio en tu Ficha Dicilo.",
        baseConfig: "Configuración Base",
        baseConfigDesc: "Define la personalidad de tu bot.",
        botName: "Nombre del Asistente",
        botNameObj: "Ej. Juan de Pizzería Napoli",
        greeting: "Mensaje de Bienvenida",
        greetingDesc: "Este mensaje aparecerá cuando el cliente abra el chat.",
        prompt: "Instrucciones Centrales (Prompt)",
        promptDesc: "Instruye detalladamente a la I.A. sobre qué tono usar y qué información priorizar.",
        saveArgs: "Guardar Cambios",
        filesBox: "Archivos de Conocimiento",
        filesDesc: "Alimenta a tu I.A. con menús, catálogos o preguntas frecuentes en PDF.",
        uploadDoc: "Cargar Archivo PDF"
    },
    campaigns: {
        title: "Campañas Personalizadas",
        desc: "Mide el rendimiento de tus estrategias de email marketing y captación orgánica administradas en Dicilo.",
        requestNew: "Solicitar Nueva Campaña",
        emptyTitle: "Sin Campañas Activas",
        budgetLabel: "Presupuesto",
        remainingLabel: "Restante"
    },
    market: {
        title: "Inteligencia de Mercado",
        desc: "Descubre insights demográficos, competitividad en red y toma decisiones basadas en la data de Dicilo.",
        potentialUsers: "Usuarios Potenciales",
        agencies: "Red de Comercios",
        countries: "Alcance Demográfico",
        trendTitle: "Tendencia de Categoría",
        aiTips: "Sugerencias I.A."
    },
    geo: {
        title: "Geomarketing Hyperlocal",
        desc: "Atrae clientes que caminan cerca de tu negocio. Define tu radio de acción y lanza notificaciones PUSH automáticas en sus móviles.",
        zoneParams: "Parámetros de Zona",
        radiusLabel: "Radio de Alcance (Kilómetros)",
        zipLabel: "Códigos Postales Prioritarios (Opcional)",
        pushLabel: "Mensaje Flash (Push Notification)",
        simulator: "Simulador de Impacto",
        privacy: "Privacidad Asegurada: Dicilo nunca comparte la ubicación exacta..."
    },
    products: {
        title: "Gestión de Productos y Servicios",
        desc: "Añade, edita y organiza los elementos que los usuarios verán en tu perfil de Dicilo.",
        addProduct: "Añadir Nuevo Producto",
        emptyCatalog: "Catálogo Vacío",
        productName: "Nombre del Producto/Servicio",
        price: "Precio (€)",
        save: "Guardar Producto"
    },
    messages: {
        title: "Bandeja de Consultas",
        desc: "Gestiona los mensajes y leads que los clientes envían desde tu Ficha Dicilo.",
        noMessages: "No hay consultas nuevas",
        openChat: "Abrir WhatsApp",
        markRead: "Marcar como leído",
        delete: "Eliminar"
    }
};

const dictEN = {
    chatbot: {
        title: "A.I. Assistant",
        desc: "Train your own customer service robot to answer questions about your business on your Dicilo Profile.",
        baseConfig: "Base Configuration",
        baseConfigDesc: "Define your bot's personality.",
        botName: "Assistant Name",
        botNameObj: "E.g. John from Napoli Pizzeria",
        greeting: "Welcome Message",
        greetingDesc: "This message will appear when the client opens the chat.",
        prompt: "Core Instructions (Prompt)",
        promptDesc: "Instruct the A.I. in detail on what tone to use and what info to prioritize.",
        saveArgs: "Save Changes",
        filesBox: "Knowledge Files",
        filesDesc: "Feed your A.I. with menus, catalogs, or FAQ PDFs.",
        uploadDoc: "Upload PDF File"
    },
    campaigns: {
        title: "Custom Campaigns",
        desc: "Measure the performance of your email marketing and organic acquisition strategies managed in Dicilo.",
        requestNew: "Request New Campaign",
        emptyTitle: "No Active Campaigns",
        budgetLabel: "Budget",
        remainingLabel: "Remaining"
    },
    market: {
        title: "Market Intelligence",
        desc: "Discover demographic insights, network competitiveness, and make data-driven decisions.",
        potentialUsers: "Potential Users",
        agencies: "Business Network",
        countries: "Demographic Reach",
        trendTitle: "Category Trend",
        aiTips: "A.I. Suggestions"
    },
    geo: {
        title: "Hyperlocal Geomarketing",
        desc: "Attract customers walking near your business. Define your action radius and launch automatic PUSH notifications.",
        zoneParams: "Zone Parameters",
        radiusLabel: "Reach Radius (Kilometers)",
        zipLabel: "Priority Postal Codes (Optional)",
        pushLabel: "Flash Message (Push Notification)",
        simulator: "Impact Simulator",
        privacy: "Privacy Assured: Dicilo never shares exact locations..."
    },
    products: {
        title: "Products and Services Management",
        desc: "Add, edit, and organize the items users will see on your Dicilo profile.",
        addProduct: "Add New Product",
        emptyCatalog: "Empty Catalog",
        productName: "Product/Service Name",
        price: "Price (€)",
        save: "Save Product"
    },
    messages: {
        title: "Inquiries Inbox",
        desc: "Manage the messages and leads clients send from your Dicilo Profile.",
        noMessages: "No new inquiries",
        openChat: "Open WhatsApp",
        markRead: "Mark as read",
        delete: "Delete"
    }
};

const dictDE = {
    chatbot: {
        title: "K.I. Assistent",
        desc: "Trainieren Sie Ihren eigenen Kundenservice-Roboter, um Fragen zu Ihrem Geschäft auf Ihrem Dicilo-Profil zu beantworten.",
        baseConfig: "Basiskonfiguration",
        baseConfigDesc: "Definieren Sie die Persönlichkeit Ihres Bots.",
        botName: "Assistentenname",
        botNameObj: "Z.B. Johann von der Pizzeria Napoli",
        greeting: "Willkommensnachricht",
        greetingDesc: "Diese Nachricht erscheint, wenn der Kunde den Chat öffnet.",
        prompt: "Hauptanweisungen (Prompt)",
        promptDesc: "Weisen Sie die K.I. detailliert an, welchen Ton sie verwenden und welche Infos sie priorisieren soll.",
        saveArgs: "Änderungen speichern",
        filesBox: "Wissensdateien",
        filesDesc: "Füttern Sie Ihre K.I. mit Speisekarten, Katalogen oder FAQ-PDFs.",
        uploadDoc: "PDF-Datei hochladen"
    },
    campaigns: {
        title: "Individuelle Kampagnen",
        desc: "Messen Sie die Leistung Ihrer E-Mail-Marketing- und organischen Akquisitionsstrategien in Dicilo.",
        requestNew: "Neue Kampagne anfordern",
        emptyTitle: "Keine aktiven Kampagnen",
        budgetLabel: "Budget",
        remainingLabel: "Verbleibend"
    },
    market: {
        title: "Marktintelligenz",
        desc: "Entdecken Sie demografische Einblicke, Netzwerkkonkurrenzfähigkeit und treffen Sie datenbasierte Entscheidungen.",
        potentialUsers: "Potenzielle Nutzer",
        agencies: "Unternehmensnetzwerk",
        countries: "Demografische Reichweite",
        trendTitle: "Kategorietrend",
        aiTips: "K.I. Vorschläge"
    },
    geo: {
        title: "Hyperlokales Geomarketing",
        desc: "Ziehen Sie Kunden an, die an Ihrem Geschäft vorbeigehen. Definieren Sie Ihren Aktionsradius und starten Sie automatische PUSH-Benachrichtigungen.",
        zoneParams: "Zonenparameter",
        radiusLabel: "Reichweitenradius (Kilometer)",
        zipLabel: "Priorisierte Postleitzahlen (Optional)",
        pushLabel: "Flash-Nachricht (Push-Benachrichtigung)",
        simulator: "Auswirkungssimulator",
        privacy: "Datenschutz gewährleistet: Dicilo teilt niemals genaue Standorte..."
    },
    products: {
        title: "Produkt- und Dienstleistungsverwaltung",
        desc: "Fügen Sie Artikel hinzu, bearbeiten und organisieren Sie diese für Ihr Dicilo-Profil.",
        addProduct: "Neues Produkt hinzufügen",
        emptyCatalog: "Leerer Katalog",
        productName: "Produkt-/Dienstleistungsname",
        price: "Preis (€)",
        save: "Produkt speichern"
    },
    messages: {
        title: "Anfrage-Posteingang",
        desc: "Verwalten Sie die Nachrichten und Leads, die Kunden über Ihr Dicilo-Profil senden.",
        noMessages: "Keine neuen Anfragen",
        openChat: "WhatsApp öffnen",
        markRead: "Als gelesen markieren",
        delete: "Löschen"
    }
};

// Replace maps
const replacements = [
    { file: 'src/app/dashboard/business/chatbot/page.tsx', 
      changes: [
          { from: "Asistente <span className=\"text-indigo-600\">I.A.</span>", to: "{t('business.chatbot.title', 'Asistente I.A.')}" },
          { from: "Entrena a tu propio robot de atención al cliente para que responda dudas sobre tu negocio en tu Ficha Dicilo.", to: "{t('business.chatbot.desc', 'Entrena a tu propio robot de atención al cliente para que responda dudas sobre tu negocio en tu Ficha Dicilo.')}" },
          { from: "Configuración Base", to: "{t('business.chatbot.baseConfig', 'Configuración Base')}" },
          { from: "Define la personalidad de tu bot.", to: "{t('business.chatbot.baseConfigDesc', 'Define la personalidad de tu bot.')}" },
          { from: "Nombre del Asistente", to: "{t('business.chatbot.botName', 'Nombre del Asistente')}" },
          { from: "Mensaje de Bienvenida", to: "{t('business.chatbot.greeting', 'Mensaje de Bienvenida')}" },
          { from: "Instrucciones Centrales (Prompt)", to: "{t('business.chatbot.prompt', 'Instrucciones Centrales (Prompt)')}" },
          { from: "Archivos de Conocimiento", to: "{t('business.chatbot.filesBox', 'Archivos de Conocimiento')}" },
          { from: "Cargar Archivo PDF", to: "{t('business.chatbot.uploadDoc', 'Cargar Archivo PDF')}" }
      ]
    },
    { file: 'src/app/dashboard/business/campaigns/page.tsx', 
      changes: [
          { from: "Campañas <span className=\"text-orange-600\">Personalizadas</span>", to: "{t('business.campaigns.title', 'Campañas Personalizadas')}" },
          { from: "Mide el rendimiento de tus estrategias de email marketing y captación orgánica administradas en Dicilo.", to: "{t('business.campaigns.desc', 'Mide el rendimiento de tus estrategias de email marketing y captación orgánica administradas en Dicilo.')}" },
          { from: "Solicitar Nueva Campaña", to: "{t('business.campaigns.requestNew', 'Solicitar Nueva Campaña')}" },
          { from: "Sin Campañas Activas", to: "{t('business.campaigns.emptyTitle', 'Sin Campañas Activas')}" }
      ]
    },
    { file: 'src/app/dashboard/business/market-intelligence/page.tsx', 
      changes: [
          { from: "Inteligencia de <span className=\"text-blue-600\">Mercado</span>", to: "{t('business.market.title', 'Inteligencia de Mercado')}" },
          { from: "Descubre insights demográficos, competitividad en red y toma decisiones basadas en la data de Dicilo.", to: "{t('business.market.desc', 'Descubre insights demográficos, competitividad en red y toma decisiones basadas en la data de Dicilo.')}" },
          { from: "Usuarios Potenciales", to: "{t('business.market.potentialUsers', 'Usuarios Potenciales')}" },
          { from: "Red de Comercios", to: "{t('business.market.agencies', 'Red de Comercios')}" },
          { from: "Alcance Demográfico", to: "{t('business.market.countries', 'Alcance Demográfico')}" },
          { from: "Tendencia de Categoría", to: "{t('business.market.trendTitle', 'Tendencia de Categoría')}" },
          { from: "Sugerencias I.A.", to: "{t('business.market.aiTips', 'Sugerencias I.A.')}" }
      ]
    },
    { file: 'src/app/dashboard/business/geomarketing/page.tsx', 
      changes: [
          { from: "Geomarketing <span className=\"text-emerald-600\">Hyperlocal</span>", to: "{t('business.geo.title', 'Geomarketing Hyperlocal')}" },
          { from: "Atrae clientes que caminan cerca de tu negocio. Define tu radio de acción y lanza notificaciones PUSH automáticas en sus móviles.", to: "{t('business.geo.desc', 'Atrae clientes que caminan cerca de tu negocio.')}" },
          { from: "Parámetros de Zona", to: "{t('business.geo.zoneParams', 'Parámetros de Zona')}" },
          { from: "Radio de Alcance (Kilómetros)", to: "{t('business.geo.radiusLabel', 'Radio de Alcance (Kilómetros)')}" },
          { from: "Códigos Postales Prioritarios (Opcional)", to: "{t('business.geo.zipLabel', 'Códigos Postales Prioritarios')}" },
          { from: "Mensaje Flash (Push Notification)", to: "{t('business.geo.pushLabel', 'Mensaje Flash')}" },
          { from: "Simulador de Impacto", to: "{t('business.geo.simulator', 'Simulador de Impacto')}" }
      ]
    },
    { file: 'src/components/dashboard/ClientProductManager.tsx', 
      changes: [
          { from: ">Gestión de Productos", to: ">{t('business.products.title', 'Gestión de Productos y Servicios')}" },
          { from: "Añade, edita y organiza los elementos que los usuarios verán en tu perfil", to: "{t('business.products.desc', 'Añade, edita y organiza los elementos que los usuarios verán en tu perfil de Dicilo.')}" },
          { from: "Añadir Nuevo Producto", to: "{t('business.products.addProduct', 'Añadir Nuevo Producto')}" },
          { from: "Catálogo Vacío", to: "{t('business.products.emptyCatalog', 'Catálogo Vacío')}" },
          { from: ">Nombre del Producto", to: ">{t('business.products.productName', 'Nombre del Producto/Servicio')}" },
          { from: "Precio (€)", to: "{t('business.products.price', 'Precio (€)')}" },
          { from: "Guardar Producto", to: "{t('business.products.save', 'Guardar Producto')}" }
      ]
    },
    { file: 'src/app/dashboard/business/messages/page.tsx', 
      changes: [
          { from: ">Bandeja de Consultas<", to: ">{t('business.messages.title', 'Bandeja de Consultas')}<" },
          { from: "Gestiona los mensajes y leads que los clientes envían desde tu Ficha Dicilo.", to: "{t('business.messages.desc', 'Gestiona los mensajes y leads que los clientes envían desde tu Ficha Dicilo.')}" },
          { from: "No hay consultas nuevas", to: "{t('business.messages.noMessages', 'No hay consultas nuevas')}" },
          { from: "Abrir WhatsApp", to: "{t('business.messages.openChat', 'Abrir WhatsApp')}" },
          { from: "Marcar como leído", to: "{t('business.messages.markRead', 'Marcar como leído')}" },
          { from: ">Eliminar<", to: ">{t('business.messages.delete', 'Eliminar')}<" }
      ]
    }
];

// Step 1: Write translation files
languages.forEach(lang => {
    // Determine which dict to use
    let dictObj = dictEN; // fallback
    if (lang === 'es') dictObj = dictES;
    if (lang === 'de') dictObj = dictDE;

    const file = path.join(localesDir, `${lang}.json`);
    let content = {};
    if (fs.existsSync(file)) {
        try {
            content = JSON.parse(fs.readFileSync(file, 'utf8'));
        } catch(e) {}
    }

    // Merge business translations under "business" key 
    // Usually i18next splits by namespace per file, but here Dicilo uses es.json for 'common', etc.
    content.business = dictObj;

    fs.writeFileSync(file, JSON.stringify(content, null, 2));
    
    // Also touch the directory/index if they use namespace files instead of single file
    const langDir = path.join(localesDir, lang);
    if (!fs.existsSync(langDir)) {
        fs.mkdirSync(langDir, { recursive: true });
    }
});

// Step 2: Replace strings in components
replacements.forEach(mod => {
    const fullPath = path.join(__dirname, mod.file);
    if (!fs.existsSync(fullPath)) return;
    
    let code = fs.readFileSync(fullPath, 'utf8');

    // Add import if missing
    if (!code.includes('useTranslation')) {
        code = code.replace(
            "import { useToast", 
            "import { useTranslation } from 'react-i18next';\nimport { useToast"
        );
        // Sometimes it might not have useToast right at the top, let's just forcefully add it after 'use client'
        if (!code.includes('useTranslation')) {
           code = code.replace("'use client';", "'use client';\nimport { useTranslation } from 'react-i18next';\n");
        }
    }

    // Inject hook
    const HookLine = "const { t } = useTranslation('common');";
    if (!code.includes("useTranslation('common')")) {
        // Find the component declaration
        code = code.replace(/export default function \w+\(\) \{/, match => `${match}\n    ${HookLine}`);
        // For ClientProductManager
        code = code.replace(/export function ClientProductManager\(\) \{/, match => `${match}\n    ${HookLine}`);
    }

    // Replace actual texts
    mod.changes.forEach(change => {
        code = code.split(change.from).join(change.to);
    });

    fs.writeFileSync(fullPath, code);
    console.log(`Updated ${mod.file}`);
});
