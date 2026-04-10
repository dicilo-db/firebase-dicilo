const fs = require('fs');

const updateJson = (path, updates) => {
  if (!fs.existsSync(path)) return;
  const data = JSON.parse(fs.readFileSync(path, 'utf8'));
  
  for (const [key, val] of Object.entries(updates)) {
      data[key] = val;
  }

  fs.writeFileSync(path, JSON.stringify(data, null, 2));
};

const enDashboard = {
  "miBox": "My Box",
  "miBoxTitle": "My Box (Inbox)",
  "miBoxDesc": "Receive personalized offers from your favorite allies and categories of interest in your city.",
  "miBoxEmptyTitle": "Your box is empty",
  "miBoxEmptyDesc": "You don't have new offers yet. Make sure to update your interests and follow your favorite local businesses to receive exclusive promotions here.",
  "companiesOfInterest": "Companies of Interest",
  "searchCompanies": "Search companies or categories...",
  "filterByInterest": "Filter by interest",
  "allMyInterests": "All my interests",
  "viewingActiveOffers": "Viewing Active Offers",
  "ticketsCoupons": "Ticket / Coupons",
  "uniqueIdLabel": "Your unique ID and referral code.",
  "active": "Active",
  "diciloId": "Dicilo ID",
  "fullName": "Full Name",
  "downloadQr": "Download QR",
  "share": "Share",
  "scanToRegister": "Scan to register with my referral link",
  "couponObtained": "Coupon Obtained!",
  "couponObtainedDesc": "Saved on your device and removed from the box.",
  "couponError": "Could not process coupon."
};

const deDashboard = {
  "miBox": "Meine Box",
  "miBoxTitle": "Meine Box (Posteingang)",
  "miBoxDesc": "Erhalten Sie personalisierte Angebote von Ihren bevorzugten Partnern und interessanten Kategorien in Ihrer Stadt.",
  "miBoxEmptyTitle": "Ihre Box ist leer",
  "miBoxEmptyDesc": "Sie haben noch keine neuen Angebote. Aktualisieren Sie Ihre Interessen und folgen Sie lokalen Unternehmen, um hier exklusive Aktionen zu erhalten.",
  "companiesOfInterest": "Meine interessanten Unternehmen",
  "searchCompanies": "Unternehmen oder Kategorien suchen...",
  "filterByInterest": "Nach Interesse filtern",
  "allMyInterests": "Alle meine Interessen",
  "viewingActiveOffers": "Aktive Angebote anzeigen",
  "ticketsCoupons": "Ticket / Gutscheine",
  "uniqueIdLabel": "Ihre eindeutige ID und Empfehlungscode.",
  "active": "Aktiv",
  "diciloId": "Dicilo-ID",
  "fullName": "Vollständiger Name",
  "downloadQr": "QR-Code herunterladen",
  "share": "Teilen",
  "scanToRegister": "Scannen Sie, um sich über meinen Empfehlungslink zu registrieren",
  "couponObtained": "Gutschein Erhalten!",
  "couponObtainedDesc": "Auf Ihrem Gerät gespeichert und aus der Box entfernt.",
  "couponError": "Gutschein konnte nicht verarbeitet werden."
};

const esDashboard = {
  "miBox": "Mi Box",
  "miBoxTitle": "Mi Box (Buzón)",
  "miBoxDesc": "Aquí recibes ofertas personalizadas de tus aliados favoritos y categorías de interés en tu ciudad.",
  "miBoxEmptyTitle": "Tu buzón está vacío",
  "miBoxEmptyDesc": "Aún no tienes nuevas ofertas. Asegúrate de actualizar tus intereses y seguir a tus negocios locales favoritos para recibir sus promociones exclusivas aquí.",
  "companiesOfInterest": "Empresas de mi Interés",
  "searchCompanies": "Buscar empresas o categorías...",
  "filterByInterest": "Filtrar por interés",
  "allMyInterests": "Todos mis intereses",
  "viewingActiveOffers": "Viendo Ofertas Activas",
  "ticketsCoupons": "Ticket / Cupones",
  "uniqueIdLabel": "Tu identificación única y código de recomendación.",
  "active": "Activo",
  "diciloId": "ID de Dicilo",
  "fullName": "Nombre Completo",
  "downloadQr": "Descargar QR",
  "share": "Compartir",
  "scanToRegister": "Escanea para registrarte con mi enlace de referencia",
  "couponObtained": "¡Cupón Obtenido!",
  "couponObtainedDesc": "Se ha guardado en tu dispositivo y removido del buzón.",
  "couponError": "No se pudo procesar el cupón."
};

const enCommon = {
  "validUntil": "Valid until:",
  "downloadPDF": "Download PDF",
  "downloadJPG": "Download JPG",
  "searching": "Searching..."
};
const deCommon = {
  "validUntil": "Gültig bis:",
  "downloadPDF": "PDF herunterladen",
  "downloadJPG": "JPG herunterladen",
  "searching": "Suchen..."
};
const esCommon = {
  "validUntil": "Válido hasta:",
  "downloadPDF": "Descargar PDF",
  "downloadJPG": "Descargar JPG",
  "searching": "Buscando..."
};

updateJson('src/locales/en/dashboard.json', enDashboard);
updateJson('src/locales/de/dashboard.json', deDashboard);
updateJson('src/locales/es/dashboard.json', esDashboard);

updateJson('src/locales/en/common.json', enCommon);
updateJson('src/locales/de/common.json', deCommon);
updateJson('src/locales/es/common.json', esCommon);

console.log("Translations patched successfully!");
