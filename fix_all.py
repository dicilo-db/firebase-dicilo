import json

def update_file(filename, data_to_merge):
    with open(filename, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for k, v in data_to_merge.items():
        parts = k.split('.')
        mod = parts[0]
        sub = parts[1]
        
        if mod not in data["business"]:
            data["business"][mod] = {}
        data["business"][mod][sub] = v
        
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

es_add = {
"courses.title": "Academia de I.A. (Cursos)",
"courses.desc": "Accede a tus 4 cursos anuales para dominar las herramientas de Inteligencia Artificial como comerciante.",
"courses.copyTitle": "Copywriting con IA para Tiendas (Próximamente)",
"courses.copyDesc": "Aprende a redactar descripciones magnéticas de tus productos y aumentar ventas.",
"courses.modulesLabel": "4 Módulos",
"courses.imagesTitle": "Imágenes con GenAI (Bloqueado)",
"courses.imagesDesc": "Descubre cómo retocar fotografías de catálogo automáticamente.",
"courses.juneLabel": "Disponible en Junio",
"courses.expertTitle": "Conviértete en un Minorista Experto",
"courses.expertDesc": "Los certificados y las grabaciones se activarán una vez hayamos implementado el sistema de aprendizaje en el dashboard de Minorista.",

"graphics.title": "Herramientas Gráficas",
"graphics.desc": "Diseña banners, edita fotos de productos y crea anuncios directamente en Dicilo usando nuestras herramientas en la nube.",
"graphics.editorLabel": "Editor de Retoque",
"graphics.editorDesc": "Corrección de luz, contraste y recortes para imágenes de catálogo directamente sin Photoshop.",
"graphics.templatesTitle": "Templates Mágicos",
"graphics.templatesDesc": "Plantillas de \"Oferta\" y \"En Rebaja\" que se aplican automáticamente sobre tus portadas de producto.",
"graphics.canvaTitle": "Canva Integrado en Camino",
"graphics.canvaDesc": "Estamos integrando el SDK visual para que puedas arrastrar y soltar elementos de diseño.",
"graphics.devLabel": "En Desarrollo",

"leads.title": "Captación de Leads",
"leads.desc": "Diseña e incrusta un Formulario de Registro General para capturar los datos de clientes potenciales interesados en tus productos o servicios.",
"leads.crmTitle": "CRM de Contactos",
"leads.crmDesc": "Administra centralizadamente a todos los usuarios que dejen sus consultas, descarguén cupones o llenen tu formulario principal.",
"leads.exportTitle": "Exportador Datos",
"leads.exportDesc": "Descarga tu base de prospectos en Excel/CSV para utilizarla en plataformas externas de automatización.",
"leads.builderTitle": "Constructor de Formularios Inactivo",
"leads.builderDesc": "El sistema dinámico para captar datos específicos (como preferencias y presupuestos de tus prospectos) entrará pronto en producción.",

"supportPremium.title": "Soporte Técnico Premium",
"supportPremium.desc": "Canal de atención preferente por email exclusivo para negocios minoristas. Disponible de Lunes a Viernes.",
"supportPremium.vipTitle": "Tienes Prioridad VIP",
"supportPremium.vipDesc": "Tus consultas omiten la cola general de Dicilo.",
"supportPremium.ticketsTitle": "Módulo de Tickets Interno",
"supportPremium.ticketsDesc": "Pronto podrás abrir tickets de soporte directamente desde aquí sin tener que ir a tu correo personal.",

"supportVip.title": "Soporte Individual (No I.A.)",
"supportVip.desc": "Despídete de los robots. Nuestros agentes humanos de nivel superior responderán todas tus inquietudes garantizando la mejor experiencia Premium.",
"supportVip.agentTitle": "Agente Asignado",
"supportVip.agentDesc": "Tu cuenta Dicilo será administrada por un Ejecutivo de Cuenta dedicado que conocerá tu negocio y trayectoria corporativa a detalle.",
"supportVip.guaranteeTitle": "Garantía de Resolución",
"supportVip.guaranteeDesc": "Cualquier problema técnico crítico es escalado a nivel de ingeniería de inmediato en lugar del soporte tradicional.",

"support.title": "Soporte",
"support.b2b": "Técnico B2B",
"support.desc": "Acude al equipo técnico humano para asistencia sobre la plataforma, pagos o facturación.",
"support.helpTitle": "Centro de Ayuda",
"support.helpDesc": "Para brindarte un mejor servicio, agrupamos toda la asistencia mediante un portal de Tickets Inteligentes donde puedes adjuntar comprobantes o capturas.",
"support.newTicketBtn": "Crear Ticket Nuevo",
"support.monitorTicketsBtn": "Ver Monitoreo de Tickets Abiertos"
}

de_add = {
"courses.title": "KI-Akademie (Kurse)",
"courses.desc": "Greifen Sie auf Ihre 4 jährlichen Kurse zu, um KI-Tools als Händler zu beherrschen.",
"courses.copyTitle": "KI-Copywriting für Geschäfte (Demnächst)",
"courses.copyDesc": "Lernen Sie, anziehende Produktbeschreibungen zu verfassen und den Umsatz zu steigern.",
"courses.modulesLabel": "4 Module",
"courses.imagesTitle": "Bilder mit GenAI (Gesperrt)",
"courses.imagesDesc": "Entdecken Sie, wie Sie Katalogfotos automatisch retuschieren.",
"courses.juneLabel": "Verfügbar im Juni",
"courses.expertTitle": "Werden Sie ein Einzelhandelsexperte",
"courses.expertDesc": "Zertifikate und Aufzeichnungen werden freigeschaltet, sobald wir das Lernsystem im Einzelhändler-Dashboard implementiert haben.",

"graphics.title": "Grafik-Tools",
"graphics.desc": "Entwerfen Sie Banner, bearbeiten Sie Produktfotos und erstellen Sie Anzeigen direkt in Dicilo mit unseren Cloud-Tools.",
"graphics.editorLabel": "Retusche-Editor",
"graphics.editorDesc": "Lichtkorrektur, Kontrast und Zuschnitt für Katalogbilder direkt ohne Photoshop.",
"graphics.templatesTitle": "Magische Vorlagen",
"graphics.templatesDesc": "\"Angebot\"- und \"Im Sale\"-Vorlagen, die automatisch auf Ihre Produktcover angewendet werden.",
"graphics.canvaTitle": "Canva Integration Unterwegs",
"graphics.canvaDesc": "Wir integrieren das visuelle SDK, damit Sie Designelemente per Drag-and-Drop verschieben können.",
"graphics.devLabel": "In Entwicklung",

"leads.title": "Lead-Erfassung",
"leads.desc": "Entwerfen und binden Sie ein allgemeines Registrierungsformular ein, um Daten potenzieller Kunden zu erfassen.",
"leads.crmTitle": "Kontakt-CRM",
"leads.crmDesc": "Verwalten Sie zentral alle Nutzer, die Anfragen stellen, Gutscheine herunterladen oder Ihr Formular ausfüllen.",
"leads.exportTitle": "Datenexporteur",
"leads.exportDesc": "Laden Sie Ihre Interessentenbasis in Excel/CSV herunter, um sie auf externen Automatisierungsplattformen zu verwenden.",
"leads.builderTitle": "Formularersteller Inaktiv",
"leads.builderDesc": "Das dynamische System zur Erfassung spezifischer Daten wird bald in Produktion gehen.",

"supportPremium.title": "Plan: Premium",
"supportPremium.desc": "Bevorzugter E-Mail-Support-Kanal exklusiv für Einzelhandelsunternehmen. Verfügbar von Montag bis Freitag.",
"supportPremium.vipTitle": "Sie haben VIP-Priorität",
"supportPremium.vipDesc": "Ihre Anfragen umgehen die allgemeine Dicilo-Warteschlange.",
"supportPremium.ticketsTitle": "Internes Ticketmodul",
"supportPremium.ticketsDesc": "Bald können Sie Support-Tickets direkt hier öffnen, ohne zu Ihrer persönlichen E-Mail gehen zu müssen.",

"supportVip.title": "Individueller Support (Keine KI)",
"supportVip.desc": "Verabschieden Sie sich von Robotern. Unsere menschlichen Agenten beantworten alle Ihre Anliegen für das beste Premium-Erlebnis.",
"supportVip.agentTitle": "Zugewiesener Agent",
"supportVip.agentDesc": "Ihr Konto wird von einem dedizierten Account Executive verwaltet, der Ihr Geschäft im Detail kennt.",
"supportVip.guaranteeTitle": "Lösungsgarantie",
"supportVip.guaranteeDesc": "Jedes kritische technische Problem wird sofort an die Technik eskaliert.",

"support.title": "Support",
"support.b2b": "B2B Technik",
"support.desc": "Wenden Sie sich an das menschliche Technikteam für Unterstützung bei der Plattform, Zahlungen oder Abrechnung.",
"support.helpTitle": "Hilfezentrum",
"support.helpDesc": "Wir bündeln den gesamten Support über ein Smart Ticket Portal, in dem Sie Belege anhängen können.",
"support.newTicketBtn": "Neues Ticket erstellen",
"support.monitorTicketsBtn": "Offene Tickets anzeigen"
}

en_add = {
"courses.title": "AI Academy (Courses)",
"courses.desc": "Access your 4 annual courses to master AI tools as a merchant.",
"courses.copyTitle": "AI Copywriting for Stores (Coming Soon)",
"courses.copyDesc": "Learn to write magnetic product descriptions and increase sales.",
"courses.modulesLabel": "4 Modules",
"courses.imagesTitle": "Images with GenAI (Locked)",
"courses.imagesDesc": "Discover how to automatically retouch catalog photos.",
"courses.juneLabel": "Available in June",
"courses.expertTitle": "Become a Retail Expert",
"courses.expertDesc": "Certificates and recordings will be unlocked once we implement the learning system.",

"graphics.title": "Graphics Tools",
"graphics.desc": "Design banners, edit product photos and create ads directly in Dicilo.",
"graphics.editorLabel": "Retouch Editor",
"graphics.editorDesc": "Light correction, contrast and cropping for catalog images without Photoshop.",
"graphics.templatesTitle": "Magic Templates",
"graphics.templatesDesc": "Offer templates that automatically apply to your product covers.",
"graphics.canvaTitle": "Canva Integration Coming",
"graphics.canvaDesc": "We are integrating the visual SDK so you can drag and drop design elements.",
"graphics.devLabel": "In Development",

"leads.title": "Lead Capture",
"leads.desc": "Design and embed a General Registration Form to capture potential customer data.",
"leads.crmTitle": "Contacts CRM",
"leads.crmDesc": "Centrally manage all users who leave inquiries, download coupons or fill out your form.",
"leads.exportTitle": "Data Exporter",
"leads.exportDesc": "Download your prospect base in Excel/CSV to use in external platforms.",
"leads.builderTitle": "Form Builder Inactive",
"leads.builderDesc": "The dynamic system to capture specific data will enter production soon.",

"supportPremium.title": "Premium Support",
"supportPremium.desc": "Preferred email support channel exclusive to retail businesses. Available Mon-Fri.",
"supportPremium.vipTitle": "You have VIP Priority",
"supportPremium.vipDesc": "Your inquiries skip the general Dicilo queue.",
"supportPremium.ticketsTitle": "Internal Ticket Module",
"supportPremium.ticketsDesc": "Soon you will be able to open support tickets directly from here.",

"supportVip.title": "Individual Support (No AI)",
"supportVip.desc": "Say goodbye to robots. Our top-level human agents will answer all your concerns.",
"supportVip.agentTitle": "Assigned Agent",
"supportVip.agentDesc": "Your Dicilo account will be managed by a dedicated Account Executive.",
"supportVip.guaranteeTitle": "Resolution Guarantee",
"supportVip.guaranteeDesc": "Any critical technical problem is escalated to engineering immediately.",

"support.title": "Support",
"support.b2b": "B2B Tech",
"support.desc": "Contact the human tech team for assistance.",
"support.helpTitle": "Help Center",
"support.helpDesc": "We group all assistance through a Smart Tickets portal.",
"support.newTicketBtn": "Create New Ticket",
"support.monitorTicketsBtn": "View Open Tickets"
}

update_file('src/locales/es/common.json', es_add)
update_file('src/locales/de/common.json', de_add)
update_file('src/locales/en/common.json', en_add)

