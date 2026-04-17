import re

# 1. Update Contacto Route
contacto_path = "src/app/contacto/page.tsx"
with open(contacto_path, "r", encoding="utf-8") as f:
    contacto = f.read()

contacto = contacto.replace(
    "import Link from 'next/link';",
    "import Link from 'next/link';\nimport NativeBookingDialog from '@/components/shared/NativeBookingDialog';"
)

old_btn_contact = """              {/* SUSTITUIR ESTE URL POR EL DE CALENDLY */}
              <a href="https://calendly.com/" target="_blank" rel="noopener noreferrer" className="w-full mt-4">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-lg py-6 shadow-lg shadow-emerald-600/20">
                  Ver Disposibilidad y Agendar
                </Button>
              </a>"""

new_btn_contact = """              <NativeBookingDialog trigger={
                <Button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-lg py-6 shadow-lg shadow-emerald-600/20">
                  Ver Disponibilidad y Agendar
                </Button>
              } />"""

contacto = contacto.replace(old_btn_contact, new_btn_contact)

with open(contacto_path, "w", encoding="utf-8") as f:
    f.write(contacto)

# 2. Update Business Dashboard 
dash_path = "src/app/dashboard/business/page.tsx"
with open(dash_path, "r", encoding="utf-8") as f:
    dash = f.read()

dash = dash.replace(
    "import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';",
    "import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';\nimport NativeBookingDialog from '@/components/shared/NativeBookingDialog';"
)

old_btn_dash = """                    <a href="https://calendly.com/" target="_blank" rel="noopener noreferrer" className="block outline-none">
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

new_btn_dash = """                    <NativeBookingDialog trigger={
                        <Card className="h-full bg-blue-50 border-blue-100 shadow-sm hover:bg-blue-100 transition-colors cursor-pointer hover:shadow-md outline-none">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-blue-700 uppercase tracking-wider">{t('business.dashboard.indivTitle', 'Soporte Individual')}</CardTitle>
                                <UserPlus className="w-4 h-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold text-blue-900 mt-1">{t('business.dashboard.indivStatus', 'Agendar Llamada')}</div>
                                <p className="text-xs text-blue-700 mt-1">{t('business.dashboard.indivDesc', 'Asesoría personalizada')}</p>
                            </CardContent>
                        </Card>
                    } />"""

dash = dash.replace(old_btn_dash, new_btn_dash)

with open(dash_path, "w", encoding="utf-8") as f:
    f.write(dash)

