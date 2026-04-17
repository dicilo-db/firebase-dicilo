import json
import os

locales_dir = "src/locales"
langs = ["es", "en", "de"]

translations = {
    "es": "Contacto",
    "en": "Contact",
    "de": "Kontakt"
}

for lang in langs:
    filepath = os.path.join(locales_dir, lang, "common.json")
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        # Ensure header.nav exists
        if "header" not in data: data["header"] = {}
        if "nav" not in data["header"]: data["header"]["nav"] = {}
        
        data["header"]["nav"]["contact"] = translations[lang]
        
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

