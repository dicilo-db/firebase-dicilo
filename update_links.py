import os

# 1. Update Header.tsx
header_path = "src/components/header.tsx"
with open(header_path, "r", encoding="utf-8") as f:
    header_content = f.read()

nav_item = "  { href: '/contacto', labelKey: 'header.nav.contact', defaultText: 'Contacto' },"

# Insert into standardNavItems
if "href: '/contacto'" not in header_content:
    search_standard = "  { href: '/sobre-nosotros', labelKey: 'header.nav.about', defaultText: 'Sobre nosotros' }\n];"
    replace_standard = "  { href: '/sobre-nosotros', labelKey: 'header.nav.about', defaultText: 'Sobre nosotros' },\n" + nav_item + "\n];"
    header_content = header_content.replace(search_standard, replace_standard)
    
    # Insert into authNavItems
    search_auth = "  { href: '/sobre-nosotros', labelKey: 'header.nav.about', defaultText: 'Sobre nosotros' }\n];"
    if search_auth in header_content:
        header_content = header_content.replace(search_auth, "  { href: '/sobre-nosotros', labelKey: 'header.nav.about', defaultText: 'Sobre nosotros' },\n" + nav_item + "\n];")

with open(header_path, "w", encoding="utf-8") as f:
    f.write(header_content)


# 2. Update Business Dashboard
dash_path = "src/app/dashboard/business/page.tsx"
with open(dash_path, "r", encoding="utf-8") as f:
    dash_content = f.read()

old_card = """                    <Card className="bg-blue-50 border-blue-100 shadow-sm hover:bg-blue-100 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-blue-700 uppercase tracking-wider">{t('business.dashboard.indivTitle', 'Soporte Individual')}</CardTitle>
                            <UserPlus className="w-4 h-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold text-blue-900 mt-1">{t('business.dashboard.indivStatus', 'Agendar Llamada')}</div>
                            <p className="text-xs text-blue-700 mt-1">{t('business.dashboard.indivDesc', 'Asesoría personalizada')}</p>
                        </CardContent>
                    </Card>"""

new_card = """                    <a href="https://calendly.com/" target="_blank" rel="noopener noreferrer" className="block outline-none">
                        <Card className="h-full bg-blue-50 border-blue-100 shadow-sm hover:bg-blue-100 transition-colors cursor-pointer hover:shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-blue-700 uppercase tracking-wider">{t('business.dashboard.indivTitle', 'Soporte Individual')}</CardTitle>
                                <UserPlus className="w-4 h-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold text-blue-900 mt-1">{t('business.dashboard.indivStatus', 'Agendar Llamada')}</div>
                                <p className="text-xs text-blue-700 mt-1">{t('business.dashboard.indivDesc', 'Asesoría personalizada')}</p>
                            </CardContent>
                        </Card>
                    </a>"""

if "https://calendly.com/" not in dash_content:
    dash_content = dash_content.replace(old_card, new_card)

with open(dash_path, "w", encoding="utf-8") as f:
    f.write(dash_content)

