filepath = "src/app/dashboard/business/layout.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add hook import
if "import { useAdminUser } from " not in content:
    content = content.replace("import { useBusinessAccess } from '@/hooks/useBusinessAccess';", "import { useBusinessAccess } from '@/hooks/useBusinessAccess';\nimport { useAdminUser } from '@/hooks/useAuthGuard';")

# 2. Add hook usage
if "const { user: adminUser } = useAdminUser();" not in content:
    content = content.replace("const { plan, email, isLoading, role } = useBusinessAccess();", "const { plan, email, isLoading } = useBusinessAccess();\n    const { user: adminUser } = useAdminUser();")

# 3. Fix logic overrides
old_admin = "const isAdmin = ['admin', 'superadmin', 'team_office'].includes(role || '');"
new_admin = "const isAdmin = ['admin', 'superadmin', 'team_office'].includes(adminUser?.role || '');"
content = content.replace(old_admin, new_admin)

# 4. Remove role from dependency array
content = content.replace("[isLoading, plan, role, router]", "[isLoading, plan, adminUser?.role, router]")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

