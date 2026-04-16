import re

with open("src/app/dashboard/business/geomarketing/page.tsx", 'r', encoding='utf-8') as f:
    content = f.read()

matches = re.finditer(r'>([^<>{}]*[áéíóúñÁÉÍÓÚÑ][^<>{}]*)<', content)
for m in matches:
    text = m.group(1).strip()
    if len(text) > 2 and 't(' not in text:
        print(f"  {text}")

