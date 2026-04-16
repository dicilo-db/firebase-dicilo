import json

def update_file(filename, data_to_merge):
    with open(filename, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    for k, v in data_to_merge.items():
        parts = k.split('.')
        m = parts[0]
        s = parts[1]
        if m not in data["business"]: data["business"][m] = {}
        data["business"][m][s] = v
        
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

es_add = {
"editor.noProfile": "No se pudo localizar el perfil comercial activo. Por favor, contacta con soporte si el problema persiste.",
"editor.pageTitle": "Gestor de Contenidos & Herramientas Avanzadas",
"editor.pageDesc": "Desde aquí puedes administrar los textos, banners, sistema de cupones integrados y las invitaciones a nuevos clientes (Tu Panel Clásico)."
}

de_add = {
"editor.noProfile": "Aktives Geschäftsprofil konnte nicht gefunden werden. Bitte kontaktieren Sie den Support, wenn das Problem weiterhin besteht.",
"editor.pageTitle": "Inhaltsmanager & Erweiterte Werkzeuge",
"editor.pageDesc": "Von hier aus können Sie Texte, Banner, integrierte Gutscheinsysteme und Einladungen an neue Kunden verwalten (Ihr Klassisches Panel)."
}

en_add = {
"editor.noProfile": "Active business profile could not be located. Please contact support if the problem persists.",
"editor.pageTitle": "Content Manager & Advanced Tools",
"editor.pageDesc": "From here you can manage texts, banners, integrated coupon systems and invitations to new customers (Your Classic Panel)."
}

update_file('src/locales/es/common.json', es_add)
update_file('src/locales/de/common.json', de_add)
update_file('src/locales/en/common.json', en_add)

