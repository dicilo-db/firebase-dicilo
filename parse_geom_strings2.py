import re

directories = ["support", "support-vip", "support-premium", "courses", "graphics", "leads"]
base_dir = "src/app/dashboard/business"

for d in directories:
    with open(f"{base_dir}/{d}/page.tsx", 'r', encoding='utf-8') as f:
        lines = f.readlines()

    for i, line in enumerate(lines):
        if re.search(r'>([^<>{}]*[a-zA-ZáéíóúñÁÉÍÓÚÑ][^<>{}]*)<', line) and "t(" not in line and "//" not in line and "className" not in line and "export" not in line and "=>" not in line:
            m = re.search(r'>([^<>{}]*[a-zA-ZáéíóúñÁÉÍÓÚÑ][^<>{}]*)<', line)
            print(f"[{d}] L{i+1}: {m.group(1).strip()}")

