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
"chatbot.planReq": "El módulo Asistente I.A. requiere plan Premium o un add-on específico.",
"chatbot.avatarUrl": "URL del Avatar (Opcional)",
"chatbot.alimenta": "Alimenta a tu I.A. con menús, catálogos o preguntas frecuentes en PDF.",
"editor.noProfile": "No se pudo localizar el perfil comercial activo. Por favor, contacta con soporte si el problema persiste."
}

de_add = {
"chatbot.planReq": "Das Modul KI-Assistent erfordert einen Premium-Plan oder ein spezifisches Add-on.",
"chatbot.avatarUrl": "Avatar-URL (Optional)",
"chatbot.alimenta": "Füttern Sie Ihre KI mit Menüs, Katalogen oder FAQs im PDF-Format.",
"editor.noProfile": "Aktives Geschäftsprofil konnte nicht gefunden werden. Bitte kontaktieren Sie den Support, wenn das Problem weiterhin besteht."
}

en_add = {
"chatbot.planReq": "The AI Assistant module requires a Premium plan or specific add-on.",
"chatbot.avatarUrl": "Avatar URL (Optional)",
"chatbot.alimenta": "Feed your AI with menus, catalogs, or FAQs in PDF.",
"editor.noProfile": "Active business profile could not be located. Please contact support if the problem persists."
}

update_file('src/locales/es/common.json', es_add)
update_file('src/locales/de/common.json', de_add)
update_file('src/locales/en/common.json', en_add)

