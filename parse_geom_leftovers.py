import re

with open("src/app/dashboard/business/geomarketing/page.tsx", 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if re.search(r'[a-zA-ZáéíóúñÁÉÍÓÚÑ]', line) and "t(" not in line and "=>" not in line and "<" in line and ">" in line:
        if "Radar Apagado" in line or "RadioGroupItem" in line or "Ej:" in line or "Km" in line or "km" in line or "dicilo" in line.lower() or "Dicilo" in line:
           print(f"L{i+1}: {line.strip()}")

