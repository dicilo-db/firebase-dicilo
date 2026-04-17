with open("src/app/dashboard/business/layout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace extraction of role
old_access_call = "const { plan, email, isLoading } = useBusinessAccess();"
new_access_call = "const { plan, email, isLoading, role } = useBusinessAccess();"
content = content.replace(old_access_call, new_access_call)

# Replace kickout logic
old_effect = """    React.useEffect(() => {
        if (!isLoading && plan === 'none') {
            router.push('/dashboard'); // Kick out normal users automatically
        }
    }, [isLoading, plan, router]);"""

new_effect = """    React.useEffect(() => {
        const isAdmin = ['admin', 'superadmin', 'team_office'].includes(role || '');
        if (!isLoading && plan === 'none' && !isAdmin) {
            router.push('/dashboard'); // Kick out normal users automatically
        }
    }, [isLoading, plan, role, router]);"""
content = content.replace(old_effect, new_effect)

# Replace skeleton logic
old_skeleton = """    if (isLoading || plan === 'none') {"""
new_skeleton = """    const isAdmin = ['admin', 'superadmin', 'team_office'].includes(role || '');
    if (isLoading || (plan === 'none' && !isAdmin)) {"""
content = content.replace(old_skeleton, new_skeleton)

with open("src/app/dashboard/business/layout.tsx", "w", encoding="utf-8") as f:
    f.write(content)

