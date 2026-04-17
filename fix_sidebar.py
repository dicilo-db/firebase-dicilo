import re

filepath = "src/components/dashboard/business/BusinessSidebar.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add hook import
if "import { useAdminUser }" not in content:
    content = content.replace("import { useTranslation } from 'react-i18next';", "import { useTranslation } from 'react-i18next';\nimport { useAdminUser } from '@/hooks/useAuthGuard';")

# 2. Add hook usage inside the component
if "const { user: adminUser } = useAdminUser();" not in content:
    content = content.replace("const { t } = useTranslation('common');", "const { t } = useTranslation('common');\n    const { user: adminUser } = useAdminUser();")

# 3. Modify permission logic
old_logic = "const hasAccess = currentPlanLvl >= item.reqLvl;"
new_logic = "const isAdmin = ['admin', 'superadmin', 'team_office'].includes(adminUser?.role || '');\n        const hasAccess = isAdmin || (currentPlanLvl >= item.reqLvl);"
content = content.replace(old_logic, new_logic)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

