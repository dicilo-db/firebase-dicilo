import json
import re
import os

directories = ["support", "support-vip", "support-premium", "social-media", "statistics", "messages", "chatbot", "faq", "leads", "courses", "campaigns", "graphics", "graphics-vip", "editor"]
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

files_modified = 0

for d in directories:
    file_path = f"{base_dir}/{d}/page.tsx"
    if not os.path.exists(file_path):
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    new_lines = []
    modified = False

    for line in lines:
        new_line = line
        
        # very simple replacement strategy: if it has raw text, we replace it.
        # But we must be careful not to break HTML syntax.
        m = re.search(r'>([^<>{}]*[áéíóúñÁÉÍÓÚÑ][^<>{}]*)<', new_line)
        if m and "t(" not in new_line and "console" not in new_line and "//" not in new_line:
            raw_text = m.group(1).strip()
            key = find_key_for_value(raw_text)
            
            if not key:
                # auto-generate a key
                safe_name = re.sub(r'[^a-zA-Z0-9]', '', raw_text.title().replace(' ', ''))[:15]
                # we'll skip generating and adding for now, let's just SEE what is MISSING
                print(f"[{d}] MISSING IN DICT: {raw_text}")
            else:
                new_line = new_line.replace(f">{m.group(1)}<", f">{{t('{key}', '{raw_text}')}}<")
                modified = True
                
        # also check placeholders
        m2 = re.search(r'(placeholder)=["\']([^"\']*[áéíóúñÁÉÍÓÚÑ][^"\']*)["\']', new_line)
        if m2 and "t(" not in new_line:
            raw_text2 = m2.group(2).strip()
            key2 = find_key_for_value(raw_text2)
            if not key2:
                print(f"[{d}] MISSING IN DICT: {raw_text2}")
            else:
                new_line = new_line.replace(f'{m2.group(1)}="{m2.group(2)}"', f'{m2.group(1)}={{t(\'{key2}\', \'{raw_text2}\')}}')
                new_line = new_line.replace(f"{m2.group(1)}='{m2.group(2)}'", f'{m2.group(1)}={{t(\'{key2}\', \'{raw_text2}\')}}')
                modified = True
                
        new_lines.append(new_line)
        
    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(new_lines))
        print(f"Modified {file_path}")
        files_modified += 1

print(f"Total files modified: {files_modified}")
