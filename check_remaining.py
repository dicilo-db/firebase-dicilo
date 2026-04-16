import re
import os

base_dir = "src/app/dashboard/business"
directories = os.listdir(base_dir)

for d in directories:
    file_path = f"{base_dir}/{d}/page.tsx"
    if not os.path.exists(file_path):
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    for i, line in enumerate(lines):
        # Look for raw text between tags that has words and doesn't have t(
        if re.search(r'>([^<>{]*[a-zA-ZáéíóúñÁÉÍÓÚÑ][^<>{}]*)<', line) and "t(" not in line and "//" not in line and "className" not in line and "=>" not in line and "export" not in line:
            m = re.search(r'>([^<>{]*[a-zA-ZáéíóúñÁÉÍÓÚÑ][^<>{}]*)<', line)
            text = m.group(1).strip()
            if len(text) > 2 and not text.startswith('{' ) and not text.startswith('`'):
                print(f"[{d}] L{i+1}: {text}")

