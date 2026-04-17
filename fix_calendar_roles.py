import re

files_to_fix = [
    "src/app/dashboard/business/crm/calendar/page.tsx",
    "src/app/dashboard/business/crm/inbox/page.tsx"
]

for filepath in files_to_fix:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 1. Add the import
    if "import { useAdminUser } from " not in content:
        content = content.replace("import { useBusinessAccess }", "import { useBusinessAccess }\nimport { useAdminUser } from '@/hooks/useAuthGuard';")
    
    # 2. Add the hook
    if "const { user: adminUser } = useAdminUser();" not in content:
        content = content.replace("    const { role, plan, isLoading } = useBusinessAccess();", "    const { plan, isLoading } = useBusinessAccess();\n    const { user: adminUser } = useAdminUser();")
    
    # 3. Replace the check
    old_check = "if (!['admin', 'superadmin', 'team_office'].includes(role) && plan !== 'premium')"
    new_check = "if (!['admin', 'superadmin', 'team_office'].includes(adminUser?.role || '') && plan !== 'premium')"
    content = content.replace(old_check, new_check)
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

