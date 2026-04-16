import os
import re
import json

directories = ["support", "support-vip", "support-premium", "social-media", "statistics", "messages", "chatbot", "faq", "leads", "courses", "campaigns", "graphics", "graphics-vip", "editor"]
base_dir = "src/app/dashboard/business"

# Load the current en/common.json
with open('src/locales/en/common.json', 'r', encoding='utf-8') as f:
    en_data = json.load(f)

# Collect all string literals into a mapping
to_translate = []

for d in directories:
    file_path = f"{base_dir}/{d}/page.tsx"
    if not os.path.exists(file_path):
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    for i, line in enumerate(lines):
        # Extremely basic extraction
        if re.search(r'[áéíóúñÁÉÍÓÚÑ]', line) and "t(" not in line and "//" not in line and "console" not in line:
            # We want to grab the Spanish text inside tags.
            m = re.search(r'>([^<>{}]*[áéíóúñÁÉÍÓÚÑ][^<>{}]*)<', line)
            
            if m:
                text = m.group(1).strip()
                to_translate.append((file_path, i, text, d))
            
            # Or inside placeholders/attributes:
            m2 = re.search(r'(placeholder|title|alt)=["\']([^"\']*[áéíóúñÁÉÍÓÚÑ][^"\']*)["\']', line)
            if m2:
                text2 = m2.group(2).strip()
                to_translate.append((file_path, i, text2, d))


for item in to_translate:
    print(f"File: {item[0]} | text: {item[2]} | mod: {item[3]}")
    
