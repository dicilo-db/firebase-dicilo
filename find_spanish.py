import os
import re

directories = os.listdir("src/app/dashboard/business")
base_dir = "src/app/dashboard/business"

for d in directories:
    dir_path = os.path.join(base_dir, d)
    if not os.path.isdir(dir_path):
        continue
    file_path = os.path.join(dir_path, "page.tsx")
    if not os.path.exists(file_path):
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find text that is directly inside JSX tags without being inside {}
    # Example: >Algún texto español< 
    # Or text inside quotes like placeholder="Texto" or title="Texto"
    # We will simple regex search for words with Spanish characters that are not inside {t(
    
    matches = re.finditer(r'>([^<>{}]*[áéíóúñÁÉÍÓÚÑ][^<>{}]*)<', content)
    found = False
    for m in matches:
        text = m.group(1).strip()
        if len(text) > 2 and 't(' not in text:
            if not found:
                print(f"--- {d}/page.tsx ---")
                found = True
            print(f"  {text}")

