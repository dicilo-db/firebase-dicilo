import json

def update_file(filename, data_to_merge):
    with open(filename, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if "socialMedia" not in data["business"]:
        data["business"]["socialMedia"] = {}
        
    for k, v in data_to_merge.items():
        data["business"]["socialMedia"][k] = v
        
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

es_add = {
"title": "Presencia Automatizada",
"desc1": "Genera y programa automáticamente hasta ",
"descBold": "12 posts mensuales en 3 canales",
"desc2": ". Diseñado para maximizar la visibilidad de tu negocio con Inteligencia Artificial.",
"connectFB": "Conectar Facebook",
"connectIG": "Conectar Instagram",
"connectLI": "Conectar LinkedIn",
"soon": "Pronto podrás visualizar todo tu plan de medios en un calendario e instruir a la IA a escribir las novedades de tu tienda."
}

de_add = {
"title": "Automatisierte Präsenz",
"desc1": "Generieren und planen Sie automatisch bis zu ",
"descBold": "12 monatliche Posts auf 3 Kanälen",
"desc2": " Entworfen, um die Sichtbarkeit Ihres Unternehmens mit KI zu maximieren.",
"connectFB": "Facebook Verbinden",
"connectIG": "Instagram Verbinden",
"connectLI": "LinkedIn Verbinden",
"soon": "Bald können Sie Ihren Medienplan in einem Kalender visualisieren und die KI anweisen, Neuigkeiten aus Ihrem Shop zu schreiben."
}

en_add = {
"title": "Automated Presence",
"desc1": "Automatically generate and schedule up to ",
"descBold": "12 monthly posts on 3 channels",
"desc2": ". Designed to maximize your business visibility with AI.",
"connectFB": "Connect Facebook",
"connectIG": "Connect Instagram",
"connectLI": "Connect LinkedIn",
"soon": "Soon you'll be able to visualize your media plan on a calendar and instruct AI to write your store news."
}

update_file('src/locales/es/common.json', es_add)
update_file('src/locales/de/common.json', de_add)
update_file('src/locales/en/common.json', en_add)

