import json
import os

locales_dir = "src/locales"
langs = ["es", "en", "de"]

translations = {
    "es": {
        "title": "Tu Privacidad en Dicilo.net",
        "desc": "Utilizamos cookies para mejorar su experiencia en nuestra plataforma global, analizar el tráfico y personalizar el contenido de marketing según sus intereses.",
        "necessary": "Necesarias (Siempre activas)",
        "analytics": "Analíticas (Medición de efectividad)",
        "marketing": "Marketing (Recomendaciones personalizadas)",
        "reject": "Rechazar",
        "accept": "Aceptar Selección"
    },
    "en": {
        "title": "Your Privacy on Dicilo.net",
        "desc": "We use cookies to improve your experience on our global platform, analyze traffic, and personalize marketing content according to your interests.",
        "necessary": "Necessary (Always active)",
        "analytics": "Analytics (Effectiveness measurement)",
        "marketing": "Marketing (Personalized recommendations)",
        "reject": "Reject",
        "accept": "Accept Selection"
    },
    "de": {
        "title": "Ihre Privatsphäre auf Dicilo.net",
        "desc": "Wir verwenden Cookies, um Ihre Erfahrung auf unserer globalen Plattform zu verbessern, den Datenverkehr zu analysieren und Marketinginhalte an Ihre Interessen anzupassen.",
        "necessary": "Notwendig (Immer aktiv)",
        "analytics": "Analysen (Effektivitätsmessung)",
        "marketing": "Marketing (Personalisierte Empfehlungen)",
        "reject": "Ablehnen",
        "accept": "Auswahl akzeptieren"
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

