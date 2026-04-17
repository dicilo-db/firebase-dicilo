import re

filepath = "src/components/shared/NativeBookingDialog.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Add translation hook to Dialog
if "import { useTranslation }" not in content:
    content = content.replace("import { es } from 'date-fns/locale';", "import { es } from 'date-fns/locale';\nimport { useTranslation } from 'react-i18next';")

if "const { t } = useTranslation('common');" not in content:
    content = content.replace("export default function NativeBookingDialog({ trigger }: NativeBookingDialogProps) {", "export default function NativeBookingDialog({ trigger }: NativeBookingDialogProps) {\n    const { t } = useTranslation('common');")

# Fix missing text: "Aca se muestra su hora..."
old_tz = """                                    <span>
                                        Tú: Zona horaria<br/>
                                        <span className="text-xs text-slate-400 font-normal">{userTz}</span>
                                    </span>"""

new_tz = """                                    <span className="flex-1">
                                        {t('booking.your_timezone', 'Tú: Zona horaria')} ({userTz})<br/>
                                        <span className="text-[10px] text-slate-400 font-normal leading-tight block mt-1">
                                            {t('booking.timezone_expl', 'Todas las horas abajo se muestran en tu hora local según tu dispositivo, para que no haya confusiones.')}
                                        </span>
                                    </span>"""

content = content.replace(old_tz, new_tz)

replacements = {
    "Agendar<br/>Reunión": "{t('booking.title', 'Agendar')} <br/> {t('booking.title2', 'Reunión')}",
    "Asesoría personalizada con el Team Office de Dicilo.": "{t('booking.subtitle', 'Asesoría personalizada con el Team Office de Dicilo.')}",
    "30 Minutos": "{t('booking.duration', '30 Minutos')}",
    "Cita Seleccionada": "{t('booking.selected', 'Cita Seleccionada')}",
    "Selecciona el Día": "{t('booking.select_day', 'Selecciona el Día')}",
    "Haz clic en un día disponible del calendario.": "{t('booking.select_day_desc', 'Haz clic en un día disponible del calendario.')}",
    "Elige la Hora y Confirma": "{t('booking.choose_time', 'Elige la Hora y Confirma')}",
    "Horarios Disponibles para el ": "{t('booking.available_for', 'Horarios Disponibles para el ')} ",
    "Nombre Completo": "{t('booking.name', 'Nombre Completo')}",
    "Ej. Carlos Martínez": "{t('booking.name_ph', 'Ej. Carlos Martínez')}",
    "¿Sobre qué te gustaría hablar?": "{t('booking.reason', '¿Sobre qué te gustaría hablar?')}",
    "Para qué es la reunión...": "{t('booking.reason_ph', 'Para qué es la reunión...')}",
    "Confirmando...": "{t('booking.confirming', 'Confirmando...')}",
    "Confirmar Reserva": "{t('booking.confirm', 'Confirmar Reserva')}",
    "¡Cita Confirmada!": "{t('booking.success_title', '¡Cita Confirmada!')}",
    "Tu reunión ha sido agendada con éxito para el": "{t('booking.success_msg1', 'Tu reunión ha sido agendada con éxito para el')}",
    "Nuevos detalles y el enlace a la llamada te llegarán muy pronto a tu WhatsApp.": "{t('booking.success_msg2', 'Nuevos detalles y el enlace a la llamada te llegarán muy pronto a tu WhatsApp.')}",
    "Cerrar Ventana": "{t('booking.close', 'Cerrar Ventana')}"
}

for k, v in replacements.items():
    content = content.replace(k, v)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

