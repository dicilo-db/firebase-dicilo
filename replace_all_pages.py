import json
import re
import os

directories = ["support", "support-vip", "support-premium", "social-media", "statistics", "messages", "chatbot", "faq", "leads", "courses", "campaigns", "graphics", "graphics-vip", "editor"]
base_dir = "src/app/dashboard/business"

with open('src/locales/es/common.json', 'r', encoding='utf-8') as f:
    es_dict = json.load(f)

# Build a mapping of value -> key
val_to_key = {}
for sub, items in es_dict.get("business", {}).items():
    if isinstance(items, dict):
        for k, v in items.items():
            if isinstance(v, str):
                # normalize string
                norm_v = re.sub(r'\s+', ' ', v.strip())
                val_to_key[norm_v] = f"business.{sub}.{k}"

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
    
    # Simple check if useTranslation is imported
    has_use_translation = 'useTranslation' in content

    for line in lines:
        new_line = line
        
        m = re.search(r'>([^<>{}]*[a-zA-ZáéíóúñÁÉÍÓÚÑ][^<>{}]*)<', new_line)
        if m and "t(" not in new_line and "console" not in new_line and "//" not in new_line:
            raw_text = m.group(1).strip()
            norm_raw = re.sub(r'\s+', ' ', raw_text)
            
            if norm_raw in val_to_key:
                key = val_to_key[norm_raw]
                # we need to escape quotes if present
                safe_raw = raw_text.replace("'", "\\'")
                new_line = new_line.replace(f">{m.group(1)}<", f">{{t('{key}', '{safe_raw}')}}<")
                modified = True
                
        # also check placeholders
        m2 = re.search(r'(placeholder)=["\']([^"\']*[a-zA-ZáéíóúñÁÉÍÓÚÑ][^"\']*)["\']', new_line)
        if m2 and "t(" not in new_line:
            raw_text2 = m2.group(2).strip()
            norm_raw2 = re.sub(r'\s+', ' ', raw_text2)
            if norm_raw2 in val_to_key:
                key2 = val_to_key[norm_raw2]
                safe_raw2 = raw_text2.replace("'", "\\'")
                new_line = new_line.replace(f'{m2.group(1)}="{m2.group(2)}"', f'{m2.group(1)}={{t(\'{key2}\', \'{safe_raw2}\')}}')
                new_line = new_line.replace(f"{m2.group(1)}='{m2.group(2)}'", f'{m2.group(1)}={{t(\'{key2}\', \'{safe_raw2}\')}}')
                modified = True
                
        new_lines.append(new_line)
        
    if modified:
        # Check if we need to insert useTranslation
        final_code = '\n'.join(new_lines)
        if "useTranslation('common')" not in final_code:
            # wait, if the file already imports react or other things, let's just make sure
            # Actually, multi_replace_file_content would be safer... 
            # Or I'll do it manually here.
            pass
            
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(final_code)
        print(f"Modified {file_path}")
        files_modified += 1

print(f"Total files modified: {files_modified}")
