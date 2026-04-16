import json

def update_file(filename, data_to_merge):
    with open(filename, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for k, v in data_to_merge.items():
        parts = k.split('.') # e.g. geo.title -> ['geo', 'title']
        mod = parts[0]
        sub = parts[1]
        
        if mod not in data["business"]:
            data["business"][mod] = {}
        data["business"][mod][sub] = v
        
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

en_add = {
"geo.radarOn": "Radar On",
"geo.radarOff": "Radar Off",
"geo.planReq": "The Geomarketing radar requires a Retailer or Premium plan.",
"geo.radiusLabel": "Reach Radius (Kilometers)",
"geo.radiusInfo": "A radius of {{km}}km covers approximately {{area}} km² around you.",
"geo.visibilityRange": "Promotion Reach (Visibility)",
"geo.local": "Local (50 km)",
"geo.regional": "Regional / State",
"geo.national": "National (Country-wide)",
"geo.continental": "Continental",
"geo.international": "International (Global)",
"geo.visibilityInfo": "Define how far you want your offer to reach in the main catalog.",
"geo.zipLabel": "Priority Zip Codes",
"geo.zipPlaceholder": "Ex: 28014, 28015",
"geo.zipInfo": "The system will focus 70% of ad impressions on users residing in these zip codes.",
"geo.pushLabel": "Flash Message",
"geo.pushPlaceholder": "The message a person will receive when passing nearby.",
"geo.pushInfo": "Make sure to include a quick hook. Make it irresistible.",
"geo.saveBtn": "Save Perimeter",
"geo.simIntro1": "With your current configuration of ",
"geo.simIntro2": " km, this is the automatic forecast based on Dicilo's history in the last 72 hours:",
"geo.neighbors": "Neighbors in the area",
"geo.walkers": "Walkers (Mobile)",
"geo.privacyTitle": "Privacy Assured:",
"geo.privacyText": "Dicilo never shares the exact location of users with businesses. The spatial matching occurs internally and 100% anonymized.",
"geo.toastConnError": "Connection error",
"geo.toastSaved": "Spatial Configuration Saved",
"geo.toastUpdError": "Update error"
}

de_add = {
"geo.radarOn": "Radar Ein",
"geo.radarOff": "Radar Aus",
"geo.planReq": "Das Geomarketing-Radar erfordert einen Einzelhändler- oder Premium-Plan.",
"geo.radiusLabel": "Reichweitenradius (Kilometer)",
"geo.radiusInfo": "Ein Radius von {{km}}km deckt etwa {{area}} km² in Ihrer Umgebung ab.",
"geo.visibilityRange": "Aktionsreichweite (Sichtbarkeit)",
"geo.local": "Lokal (50 km)",
"geo.regional": "Regional / Bundesland",
"geo.national": "National (Deutschlandweit)",
"geo.continental": "Kontinental",
"geo.international": "International (Global)",
"geo.visibilityInfo": "Legen Sie fest, wie weit Ihr Angebot im Hauptkatalog reichen soll.",
"geo.zipLabel": "Bevorzugte Postleitzahlen",
"geo.zipPlaceholder": "Bsp: 10115, 10117",
"geo.zipInfo": "Das System wird 70% der Anzeigen an Nutzer in diesen Postleitzahlengebieten ausrichten.",
"geo.pushLabel": "Flash-Nachricht",
"geo.pushPlaceholder": "Nachricht, die Personen in der Nähe erhalten.",
"geo.pushInfo": "Fügen Sie einen schnellen Aufhänger hinzu. Machen Sie es unwiderstehlich.",
"geo.saveBtn": "Perimeter Speichern",
"geo.simIntro1": "Mit Ihrer aktuellen Konfiguration von ",
"geo.simIntro2": " km ist dies die automatische Prognose basierend auf Dicilos Historie der letzten 72 Stunden:",
"geo.neighbors": "Nachbarn im Umkreis",
"geo.walkers": "Fußgänger (Mobil)",
"geo.privacyTitle": "Datenschutz Garantiert:",
"geo.privacyText": "Dicilo teilt niemals die genauen Standorte von Nutzern mit Unternehmen. Das Spatial Matching erfolgt intern und 100% anonym.",
"geo.toastConnError": "Verbindungsfehler",
"geo.toastSaved": "Geodaten gespeichert",
"geo.toastUpdError": "Aktualisierungsfehler"
}

es_add = {
"geo.radarOn": "Radar Activado",
"geo.radarOff": "Radar Apagado",
"geo.planReq": "El radar de Geomarketing requiere plan Retailer o Premium.",
"geo.radiusLabel": "Radio de Alcance (Kilómetros)",
"geo.radiusInfo": "Un radio de {{km}}km abarca aproximadamente {{area}} km² a tu alrededor.",
"geo.visibilityRange": "Alcance de Promoción (Visibilidad)",
"geo.local": "Local (50 km)",
"geo.regional": "Regional / Estatal",
"geo.national": "Nacional (Todo el país)",
"geo.continental": "Continental",
"geo.international": "Internacional (Global)",
"geo.visibilityInfo": "Define hasta dónde quieres que llegue tu oferta en el catálogo principal.",
"geo.zipLabel": "Códigos Postales Prioritarios",
"geo.zipPlaceholder": "Ej: 28014, 28015",
"geo.zipInfo": "El sistema enfocará el 70% de las impresiones publicitarias a los usuarios que residen en estos códigos.",
"geo.pushLabel": "Mensaje Flash",
"geo.pushPlaceholder": "El mensaje que recibirá la persona al pasar cerca.",
"geo.pushInfo": "Asegúrate de incluir un \"Ganchop\" rápido. Hazlo irresistible.",
"geo.saveBtn": "Guardar Perímetro",
"geo.simIntro1": "Con tu configuración actual de ",
"geo.simIntro2": " km, este es el pronóstico automático basado en el histórico de Dicilo en las últimas 72 horas:",
"geo.neighbors": "Vecinos en la zona",
"geo.walkers": "Caminantes (Móvil)",
"geo.privacyTitle": "Privacidad Asegurada:",
"geo.privacyText": "Dicilo nunca comparte la ubicación exacta de los usuarios con los negocios. El cruce espacial ocurre internamente y de forma 100% anonimizada.",
"geo.toastConnError": "Error de conexión",
"geo.toastSaved": "Configuración Espacial Guardada",
"geo.toastUpdError": "Error al actualizar"
}

update_file('src/locales/de/common.json', de_add)
update_file('src/locales/en/common.json', en_add)
update_file('src/locales/es/common.json', es_add)

