import re
with open("src/app/dashboard/business/editor/page.tsx", 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if re.search(r'[áéíóúñÁÉÍÓÚÑ]', line) and "t(" not in line:
        print(f"L{i+1}: {line.strip()}")
