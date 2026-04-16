import json
import re
import os

directories = ["messages", "editor", "faq", "campaigns", "social-media", "graphics-vip"]
base_dir = "src/app/dashboard/business"

with open('src/locales/es/common.json', 'r', encoding='utf-8') as f:
    es_dict = json.load(f)

# Helper to find a key in the ES dict by its exact value
def find_key_for_value(val):
    for sub, items in es_dict.get("business", {}).items():
        if isinstance(items, dict):
            for k, v in items.items():
                if isinstance(v, str) and v.strip() == val.strip():
                    return f"business.{sub}.{k}"
    return None

def update_dictionaries(new_es, new_de, new_en):
    es_file = 'src/locales/es/common.json'
    de_file = 'src/locales/de/common.json'
    en_file = 'src/locales/en/common.json'
    
    with open(es_file, 'r', encoding='utf-8') as f: es = json.load(f)
    with open(de_file, 'r', encoding='utf-8') as f: de = json.load(f)
    with open(en_file, 'r', encoding='utf-8') as f: en = json.load(f)
    
    for k, v in new_es.items():
        parts = k.split('.')
        m = parts[0]
        s = parts[1]
        if m not in es['business']: es['business'][m] = {}
        if m not in de['business']: de['business'][m] = {}
        if m not in en['business']: en['business'][m] = {}
        
        es['business'][m][s] = new_es[k]
        de['business'][m][s] = new_de[k]
        en['business'][m][s] = new_en[k]
        
    with open(es_file, 'w', encoding='utf-8') as f: json.dump(es, f, indent=2, ensure_ascii=False)
    with open(de_file, 'w', encoding='utf-8') as f: json.dump(de, f, indent=2, ensure_ascii=False)
    with open(en_file, 'w', encoding='utf-8') as f: json.dump(en, f, indent=2, ensure_ascii=False)

def inject_hook(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if "import { useTranslation }" not in content:
        content = content.replace("import", "import { useTranslation } from 'react-i18next';\nimport", 1)
        
    if "const { t } = useTranslation('common');" not in content:
        m = re.search(r'export default function\s+[a-zA-Z0-9_]+\s*\([^)]*\)\s*\{', content)
        if m:
            content = content.replace(m.group(0), m.group(0) + "\n    const { t } = useTranslation('common');")
            
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

# We have texts to extract, let's just make the manual dicts here
new_es = {
    "messages.planReq": "El módulo de Consultas requiere plan Starter o superior.",
    "messages.title": "Mensajes & Consultas",
    "messages.desc": "Centraliza la comunicación local y recibe los leads o consultas enviados desde tu Ficha Dicilo.",
    "messages.emptyBox": "Bandeja Vacía",
    "faq.title": "Preguntas Frecuentes",
    "faq.desc": "Aquí aparecen todas las preguntas que los usuarios han hecho a tu I.A. que el robot no ha sabido responder.",
    "faq.empty": "No hay preguntas registradas",
    "campaigns.planReq": "El módulo de Campañas requiere plan Starter o superior.",
    "campaigns.title": "Campañas Individuales",
    "campaigns.desc": "Solicita una de nuestras campañas integradas.",
    "campaigns.requestNew": "Solicitar Campaña Publicitaria",
    "campaigns.ph1": "Ej: Vender stock antiguo, más tráfico web...",
    "campaigns.ph2": "Vecindario o Demografía (Opcional)",
    "campaigns.ph3": "Ej: Mujeres de 25-45 años cerca de mi local",
    "socialMedia.title": "Social Media",
    "socialMedia.desc": "Conecta tus redes sociales y unifica tu presencia.",
    "socialMedia.editor": "Editor de Programación en Desarrollo",
    "editor.title": "Mi Ficha de Negocio",
    "editor.desc": "Edita la información pública de tu negocio.",
    "editor.editorDev": "Editor en Desarrollo",
    "graphicsVip.engine": "Cargando el Motor Biográfico de I.A..."
}

new_de = {
    "messages.planReq": "Das Modul für Anfragen erfordert einen Starter-Plan oder höher.",
    "messages.title": "Nachrichten & Anfragen",
    "messages.desc": "Zentralisieren Sie die lokale Kommunikation und erhalten Sie Leads aus Ihrem Dicilo-Profil.",
    "messages.emptyBox": "Leerer Posteingang",
    "faq.title": "Häufig Gestellte Fragen",
    "faq.desc": "Hier erscheinen alle Nutzerfragen an Ihre KI, die der Bot nicht beantworten konnte.",
    "faq.empty": "Keine Fragen registriert",
    "campaigns.planReq": "Das Kampagnenmodul erfordert einen Starter-Plan oder höher.",
    "campaigns.title": "Individuelle Kampagnen",
    "campaigns.desc": "Fordern Sie eine unserer integrierten Kampagnen an.",
    "campaigns.requestNew": "Werbekampagne anfordern",
    "campaigns.ph1": "Bsp.: Alten Bestand verkaufen, mehr Web-Traffic...",
    "campaigns.ph2": "Nachbarschaft oder Demografie (Optional)",
    "campaigns.ph3": "Bsp.: Frauen im Alter von 25-45 Jahren in meiner Nähe",
    "socialMedia.title": "Social Media",
    "socialMedia.desc": "Verbinden Sie Ihre sozialen Netzwerke.",
    "socialMedia.editor": "Programmier-Editor in Entwicklung",
    "editor.title": "Mein Geschäftsprofil",
    "editor.desc": "Bearbeiten Sie die öffentlichen Informationen Ihres Unternehmens.",
    "editor.editorDev": "Editor in Entwicklung",
    "graphicsVip.engine": "KI-Biografiemotor wird geladen..."
}

new_en = {
    "messages.planReq": "The Inquiries module requires a Starter plan or higher.",
    "messages.title": "Messages & Inquiries",
    "messages.desc": "Centralize local communication and receive leads from your Dicilo Profile.",
    "messages.emptyBox": "Empty Inbox",
    "faq.title": "Frequently Asked Questions",
    "faq.desc": "Here appear all user questions to your AI that the bot couldn't answer.",
    "faq.empty": "No registered questions",
    "campaigns.planReq": "The Campaigns module requires a Starter plan or higher.",
    "campaigns.title": "Individual Campaigns",
    "campaigns.desc": "Request one of our integrated campaigns.",
    "campaigns.requestNew": "Request Ad Campaign",
    "campaigns.ph1": "Ex: Sell old stock, more web traffic...",
    "campaigns.ph2": "Neighborhood or Demographics (Optional)",
    "campaigns.ph3": "Ex: Women 25-45 years old near my store",
    "socialMedia.title": "Social Media",
    "socialMedia.desc": "Connect your social networks.",
    "socialMedia.editor": "Programming Editor in Development",
    "editor.title": "My Business Profile",
    "editor.desc": "Edit your business's public information.",
    "editor.editorDev": "Editor in Development",
    "graphicsVip.engine": "Loading AI Biographical Engine..."
}

update_dictionaries(new_es, new_de, new_en)

for d in directories:
    file_path = f"{base_dir}/{d}/page.tsx"
    if not os.path.exists(file_path):
        continue
    
    inject_hook(file_path)
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    new_lines = []
    modified = False

    for line in lines:
        new_line = line
        
        m = re.search(r'>([^<>{}]*[a-zA-ZáéíóúñÁÉÍÓÚÑ][^<>{}]*)<', new_line)
        if m and "t(" not in new_line and "console" not in new_line and "//" not in new_line:
            raw_text = m.group(1).strip()
            # Simple match in new_es
            for k, v in new_es.items():
                if v == raw_text:
                    safe_raw = raw_text.replace("'", "\\'")
                    new_line = new_line.replace(f">{m.group(1)}<", f">{{t('business.{k}', '{safe_raw}')}}<")
                    modified = True
                    break
                
        # also check placeholders
        m2 = re.search(r'(placeholder)=["\']([^"\']*[a-zA-ZáéíóúñÁÉÍÓÚÑ][^"\']*)["\']', new_line)
        if m2 and "t(" not in new_line:
            raw_text2 = m2.group(2).strip()
            for k, v in new_es.items():
                if v == raw_text2:
                    safe_raw2 = raw_text2.replace("'", "\\'")
                    new_line = new_line.replace(f'{m2.group(1)}="{m2.group(2)}"', f'{m2.group(1)}={{t(\'business.{k}\', \'{safe_raw2}\')}}')
                    new_line = new_line.replace(f"{m2.group(1)}='{m2.group(2)}'", f'{m2.group(1)}={{t(\'business.{k}\', \'{safe_raw2}\')}}')
                    modified = True
                    break
                
        new_lines.append(new_line)
        
    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(new_lines))
        print(f"Modified {file_path}")

