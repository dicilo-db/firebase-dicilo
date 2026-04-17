import re

filepath = "src/app/contacto/page.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Add 'use client' and translation import
if "'use client';" not in content:
    content = "'use client';\n" + content

if "import { useTranslation } from 'react-i18next';" not in content:
    content = content.replace("import React from 'react';", "import React from 'react';\nimport { useTranslation } from 'react-i18next';")

# Add the hook
hook_str = "  const { t } = useTranslation('common');\n"
if "const { t } = useTranslation('common');" not in content:
    content = content.replace("export default function ContactPage() {", "export default function ContactPage() {\n" + hook_str)

# Translations mappings
replacements = {
    "Central de Contacto Dicilo": "{t('contact.title', 'Central de Contacto Dicilo')}",
    "Acércate a nuestro Team Office. Estamos listos para ayudarte a potenciar tu negocio.": "{t('contact.subtitle', 'Acércate a nuestro Team Office. Estamos listos para ayudarte a potenciar tu negocio.')}",
    "Agenda una Reunión": "{t('contact.book.title', 'Agenda una Reunión')}",
    "¿Tienes dudas sobre cómo escalar tu negocio? Agenda una videollamada de 30 minutos con un asesor personalizado. \n                Elige el horario que mejor se adapte a tu posibilidad.": "{t('contact.book.desc', '¿Tienes dudas sobre cómo escalar tu negocio? Agenda una videollamada de 30 minutos con un asesor personalizado. Elige el horario que mejor se adapte a tu posibilidad.')}",
    "Ver Disponibilidad y Agendar": "{t('contact.book.button', 'Ver Disponibilidad y Agendar')}",
    "Nuestras Oficinas": "{t('contact.office.title', 'Nuestras Oficinas')}",
    "Sede Principal": "{t('contact.office.hq', 'Sede Principal')}",
    "Atención Telefónica": "{t('contact.office.phone', 'Atención Telefónica')}",
    "Lunes a Viernes": "{t('contact.office.mon_fri', 'Lunes a Viernes')}",
    "* Las visitas presenciales requieren cita previa.": "{t('contact.office.note', '* Las visitas presenciales requieren cita previa.')}"
}

for k, v in replacements.items():
    content = content.replace(k, v)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

