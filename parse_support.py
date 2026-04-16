import os
import re

directories = ["support", "support-vip", "support-premium", "social-media", "statistics", "messages", "chatbot", "faq", "leads", "courses", "campaigns", "graphics", "graphics-vip"]
base_dir = "src/app/dashboard/business"

for d in directories:
    file_path = f"{base_dir}/{d}/page.tsx"
    if not os.path.exists(file_path):
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    for i, line in enumerate(lines):
        if re.search(r'[áéíóúñÁÉÍÓÚÑ]', line) and "t(" not in line:
            print(f"{d} L{i+1}: {line.strip()}")
            
