import json

def update_file(filename, data_to_merge):
    with open(filename, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for k, v in data_to_merge.items():
        parts = k.split('.') # e.g. chatbot.title -> ['chatbot', 'title']
        mod = parts[0]
        sub = parts[1]
        
        if mod not in data["business"]:
            data["business"][mod] = {}
        data["business"][mod][sub] = v
        
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

en_add = {
"market.planReq": "The Market Intelligence module requires a Retailer or Premium plan.",
"market.growing": "In constant global growth",
"market.corporatePartners": "Active corporate partners",
"market.connectedCountries": "Connected countries on the platform",
"market.searchVolume": "Estimated search volume and local community clicks.",
"market.tip1": "Your sector ({businessCategory}) has 40% more retention if you rotate offers biweekly.",
"market.tip2": "We found that profiles with images uploaded this month have 2.5x more visit time.",
"market.tip3": "Keyword Generator to appear first in zonal searches.",
"market.downloadPdf": "Download PDF Report",
"market.uploadCoupons": "Upload 2 new coupons",
"market.updatePhotos": "Update your photos"
}

de_add = {
"market.planReq": "Das Marktintelligenz-Modul erfordert einen Einzelhändler- oder Premium-Plan.",
"market.growing": "Stetiges globales Wachstum",
"market.corporatePartners": "Aktive Unternehmenspartner",
"market.connectedCountries": "Vernetzte Länder auf der Plattform",
"market.searchVolume": "Geschätztes Suchvolumen und Klicks der lokalen Community.",
"market.tip1": "Ihre Branche ({businessCategory}) verzeichnet 40% mehr Bindung, wenn Sie Angebote 14-tägig wechseln.",
"market.tip2": "Profile mit in diesem Monat hochgeladenen Bildern haben eine 2,5x längere Besuchszeit.",
"market.tip3": "Keyword-Generator, um bei zonalen Suchen als Erster zu erscheinen.",
"market.downloadPdf": "PDF-Bericht herunterladen",
"market.uploadCoupons": "Laden Sie 2 neue Gutscheine hoch",
"market.updatePhotos": "Aktualisieren Sie Ihre Fotos"
}

es_add = {
"market.planReq": "El módulo de Inteligencia de Mercado requiere plan Retailer o Premium.",
"market.growing": "En constante crecimiento global",
"market.corporatePartners": "Socios corporativos activos",
"market.connectedCountries": "Países conectados en la plataforma",
"market.searchVolume": "Volumen de búsquedas estimadas y clics de la comunidad local.",
"market.tip1": "Tu sector ({businessCategory}) tiene un 40% más de retención si rotas las ofertas quincenalmente.",
"market.tip2": "Descubrimos que las fichas con imágenes subidas este mes tienen un 2.5x más tiempo de visita.",
"market.tip3": "Generador de Keywords para aparecer primero en las búsquedas zonales.",
"market.downloadPdf": "Descargar Reporte PDF",
"market.uploadCoupons": "Sube 2 nuevos cupones",
"market.updatePhotos": "Actualiza tus fotos"
}

update_file('src/locales/de/common.json', de_add)
update_file('src/locales/en/common.json', en_add)
update_file('src/locales/es/common.json', es_add)

