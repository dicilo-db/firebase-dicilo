import os
import re

directories = os.listdir("src/app/dashboard/business")
base_dir = "src/app/dashboard/business"

keys = {}

for d in directories:
    dir_path = os.path.join(base_dir, d)
    if not os.path.isdir(dir_path):
        continue
    file_path = os.path.join(dir_path, "page.tsx")
    if not os.path.exists(file_path):
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find t('key', 'Fallback')
    matches = re.finditer(r"t\(\s*['\"](business\.[a-zA-Z0-9_\.]+)['\"]\s*,\s*['\"](.*?)['\"]\s*\)", content)
    for m in matches:
        key = m.group(1)
        fallback = m.group(2)
        keys[key] = fallback

print("Found Keys:")
for k, v in keys.items():
    print(f"{k} = {v}")
    
