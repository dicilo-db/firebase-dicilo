import re

with open("src/app/dashboard/business/geomarketing/page.tsx", 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if re.search(r'[áéíóúñÁÉÍÓÚÑ]', line) and "t(" not in line:
        print(f"L{i+1}: {line.strip()}")

