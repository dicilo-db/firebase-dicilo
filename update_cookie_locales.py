import json
import os

locales_dir = "src/locales"
langs = ["es", "en", "de"]

translations = {
    "es": {
        "title": "Configuración de Cookies",
        "desc": "Elija qué cookies desea permitir. Las cookies necesarias siempre están activas, ya que son esenciales para el funcionamiento del sitio web.",
        "necessary": "Necesarias",
        "necessary_desc": "Requeridas para seguridad, navegación y funciones básicas.",
        "analytics": "Análisis",
        "analytics_desc": "Nos ayuda a entender cómo interactúan los visitantes con el sitio web.",
        "preferences": "Preferencias",
        "preferences_desc": "Guarda sus preferencias de idioma o interfaz.",
        "marketing": "Marketing",
        "marketing_desc": "Utilizadas para campañas, medición y remarketing.",
        "only_necessary": "Solo necesarias",
        "save": "Guardar configuración",
        "floating_btn": "Ajustes de Cookies"
    },
    "en": {
        "title": "Cookie Settings",
        "desc": "Choose which cookies you want to allow. Necessary cookies are always active, as they are required for the website to function properly.",
        "necessary": "Necessary",
        "necessary_desc": "Required for security, navigation, and basic functions.",
        "analytics": "Analytics",
        "analytics_desc": "Helps us understand how visitors interact with the website.",
        "preferences": "Preferences",
        "preferences_desc": "Saves your language or interface preferences.",
        "marketing": "Marketing",
        "marketing_desc": "Used for campaigns, measurement, and remarketing.",
        "only_necessary": "Only necessary",
        "save": "Save settings",
        "floating_btn": "Cookie Settings"
    },
    "de": {
        "title": "Cookie-Einstellungen",
        "desc": "Wählen Sie aus, welche Cookies Sie zulassen möchten. Notwendige Cookies sind immer aktiv, da sie für den Betrieb der Website erforderlich sind.",
        "necessary": "Notwendig",
        "necessary_desc": "Erforderlich für Sicherheit, Navigation und Grundfunktionen.",
        "analytics": "Analyse",
        "analytics_desc": "Hilft uns zu verstehen, wie Besucher die Website nutzen.",
        "preferences": "Präferenzen",
        "preferences_desc": "Speichert Sprach- oder Oberflächeneinstellungen.",
        "marketing": "Marketing",
        "marketing_desc": "Für Kampagnen, Messung und Remarketing.",
        "only_necessary": "Nur notwendige",
        "save": "Einstellungen speichern",
        "floating_btn": "Cookie-Einstellungen"
    }
}

for lang in langs:
    filepath = os.path.join(locales_dir, lang, "common.json")
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        data["cookies"] = translations[lang]
        
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

