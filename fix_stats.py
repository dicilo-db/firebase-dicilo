import json

def update_file(filename, data_to_merge):
    with open(filename, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if "statistics" not in data["business"]:
        data["business"]["statistics"] = {}
        
    for k, v in data_to_merge.items():
        data["business"]["statistics"][k] = v
        
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

es_add = {
"planReq": "El módulo de Estadísticas Avanzadas requiere un plan Retailer o Premium. Sube de plan para analizar el rendimiento de tu audiencia en detalle.",
"title": "Estadísticas",
"desc": "Mide el impacto de tu negocio y revisa las métricas de clics, vistas de anuncios y demografía local."
}

de_add = {
"planReq": "Das Modul für erweiterte Statistiken erfordert einen Retailer- oder Premium-Plan. Upgraden Sie, um die Leistung Ihres Publikums im Detail zu analysieren.",
"title": "Statistiken",
"desc": "Messen Sie die Auswirkungen Ihres Unternehmens und überprüfen Sie Klickmetriken, Anzeigenaufrufe und lokale demografische Daten."
}

en_add = {
"planReq": "The Advanced Statistics module requires a Retailer or Premium plan. Upgrade to analyze your audience's performance in detail.",
"title": "Statistics",
"desc": "Measure the impact of your business and review click metrics, ad views, and local demographics."
}

update_file('src/locales/es/common.json', es_add)
update_file('src/locales/de/common.json', de_add)
update_file('src/locales/en/common.json', en_add)

