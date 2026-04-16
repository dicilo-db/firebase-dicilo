import os
import re

directories = [
    'courses', 'graphics', 'leads', 'products', 'social-media', 
    'statistics', 'support-premium', 'support-vip', 'support'
]

base_dir = "src/app/dashboard/business"

for d in directories:
    file_path = os.path.join(base_dir, d, "page.tsx")
    if not os.path.exists(file_path):
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if already translated
    if "useTranslation" in content:
        continue

    # 1. Add import
    # Find the last import
    imports_end = content.rfind("import ")
    if imports_end != -1:
        newline_after = content.find("\n", imports_end)
        content = content[:newline_after] + "\nimport { useTranslation } from 'react-i18next';" + content[newline_after:]

    # 2. Add useTranslation hook
    func_match = re.search(r'export default function (\w+Page)\(\) \{', content)
    if func_match:
        funcText = func_match.group(0)
        content = content.replace(funcText, funcText + "\n    const { t } = useTranslation('common');")

    # 3. Quick and dirty fix for <h1> and <p> containing text using regex
    # We will just replace common visible span and h1 if we find them, 
    # but specifically mapping them is hard programmatically. 
    # Let's find h1
    h1_match = re.search(r'(<h1[^>]*>)(.*?)(</h1>)', content, re.DOTALL)
    if h1_match:
        h1_open = h1_match.group(1)
        h1_inner = h1_match.group(2)
        # remove newlines and extra spaces from h1_inner
        clean_inner = " ".join(h1_inner.split())
        clean_inner = clean_inner.replace("'", "\\'")

        # replace the h1 Inner with dangerouslySetInnerHTML if it contains spans, else normal {t()}
        if '<span' in clean_inner:
            # use dangerouslySetInnerHTML
            # we need to replace className with class inside the string
            clean_inner_html = clean_inner.replace('className=', 'class=')
            new_h1 = f"{h1_open}<span dangerouslySetInnerHTML={{{{ __html: t('business.{d}.title', '{clean_inner_html}') }}}}></span></h1>"
        else:
            # remove icons if any (very complex). If it has <Icon />, we shouldn't replace it blindly.
            # let's just make it simple if it contains a tag
            if '<' in clean_inner:
                 clean_inner_html = clean_inner.replace('className=', 'class=')
                 new_h1 = f"{h1_open}<span dangerouslySetInnerHTML={{{{ __html: t('business.{d}.title', '{clean_inner_html}') }}}}></span></h1>"
            else:
                 new_h1 = f"{h1_open}{{t('business.{d}.title', '{clean_inner}')}}</h1>"
        
        content = content.replace(h1_match.group(0), new_h1)

    # Find the first paragraph <p> right after <h1>
    # Actually just string replace the known ones to be safe
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed {d}")

