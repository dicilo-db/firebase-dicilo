import re
import os

directories = ["support", "support-vip", "support-premium", "courses", "graphics", "leads", "chatbot", "campaigns", "statistics", "messages", "graphics-vip", "editor", "faq"]
base_dir = "src/app/dashboard/business"

for d in directories:
    file_path = f"{base_dir}/{d}/page.tsx"
    if not os.path.exists(file_path):
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    modified = False
    
    if "useTranslation" not in content and "t(" in content:
        # We need to inject import
        content = content.replace("import React", "import React from 'react';\nimport { useTranslation } from 'react-i18next';\n//")
        # And inject hook inside component
        # Find default export function
        m = re.search(r'export default function\s+[a-zA-Z0-9_]+\s*\([^)]*\)\s*\{', content)
        if m:
            func_decl = m.group(0)
            content = content.replace(func_decl, func_decl + "\n    const { t } = useTranslation('common');")
            modified = True
            
    if modified:
        # clean up any messy imports caused by fast replacement
        content = content.replace("import React from 'react';\nimport { useTranslation } from 'react-i18next';\n// from 'react';", "import React from 'react';\nimport { useTranslation } from 'react-i18next';")
        content = content.replace("import React from 'react';\nimport { useTranslation } from 'react-i18next';\n//, {", "import React, {")
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Hook fixed in {file_path}")

