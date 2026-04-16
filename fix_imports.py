import os

directories = ["support", "support-vip", "support-premium", "courses", "graphics", "leads"]
base_dir = "src/app/dashboard/business"

for d in directories:
    file_path = f"{base_dir}/{d}/page.tsx"
    if not os.path.exists(file_path):
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if "import { useTranslation }" not in content:
        content = content.replace("'use client';", "'use client';\n\nimport { useTranslation } from 'react-i18next';")
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed import in {file_path}")

