import json
import os

locales_dir = "src/locales"
langs = ["es", "en", "de"]

translations = {
    "es": {
        "contact": {
            "title": "Central de Contacto Dicilo",
            "subtitle": "Acércate a nuestro Team Office. Estamos listos para ayudarte a potenciar tu negocio.",
            "book": {
                "title": "Agenda una Reunión",
                "desc": "¿Tienes dudas sobre cómo escalar tu negocio? Agenda una videollamada de 30 minutos con un asesor personalizado. Elige el horario que mejor se adapte a tu posibilidad.",
                "button": "Ver Disponibilidad y Agendar"
            },
            "office": {
                "title": "Nuestras Oficinas",
                "hq": "Sede Principal",
                "phone": "Atención Telefónica",
                "mon_fri": "Lunes a Viernes",
                "note": "* Las visitas presenciales requieren cita previa."
            }
        },
        "booking": {
            "title": "Agendar",
            "title2": "Reunión",
            "subtitle": "Asesoría personalizada con el Team Office de Dicilo.",
            "duration": "30 Minutos",
            "your_timezone": "Tú: Zona horaria",
            "timezone_expl": "Todas las horas abajo se muestran en tu hora local según tu dispositivo, para que no haya confusiones.",
            "selected": "Cita Seleccionada",
            "select_day": "Selecciona el Día",
            "select_day_desc": "Haz clic en un día disponible del calendario.",
            "choose_time": "Elige la Hora y Confirma",
            "available_for": "Horarios Disponibles para el ",
            "name": "Nombre Completo",
            "name_ph": "Ej. Carlos Martínez",
            "reason": "¿Sobre qué te gustaría hablar?",
            "reason_ph": "Para qué es la reunión...",
            "confirming": "Confirmando...",
            "confirm": "Confirmar Reserva",
            "success_title": "¡Cita Confirmada!",
            "success_msg1": "Tu reunión ha sido agendada con éxito para el",
            "success_msg2": "Nuevos detalles y el enlace a la llamada te llegarán muy pronto a tu WhatsApp.",
            "close": "Cerrar Ventana"
        }
    },
    "en": {
        "contact": {
            "title": "Dicilo Contact Center",
            "subtitle": "Reach out to our Team Office. We are ready to help you boost your business.",
            "book": {
                "title": "Book a Meeting",
                "desc": "Have questions about scaling your business? Schedule a 30-minute video call with a personalized advisor. Choose the time that best suits your schedule.",
                "button": "Check Availability and Book"
            },
            "office": {
                "title": "Our Offices",
                "hq": "Headquarters",
                "phone": "Phone Support",
                "mon_fri": "Monday to Friday",
                "note": "* In-person visits require a prior appointment."
            }
        },
        "booking": {
            "title": "Book a",
            "title2": "Meeting",
            "subtitle": "Personalized advice from the Dicilo Team Office.",
            "duration": "30 Minutes",
            "your_timezone": "You: Timezone",
            "timezone_expl": "All times below are shown in your local time according to your device, to avoid confusion.",
            "selected": "Selected Appointment",
            "select_day": "Select the Day",
            "select_day_desc": "Click on an available day in the calendar.",
            "choose_time": "Choose Time and Confirm",
            "available_for": "Available times for ",
            "name": "Full Name",
            "name_ph": "E.g. John Doe",
            "reason": "What would you like to talk about?",
            "reason_ph": "What is the meeting about...",
            "confirming": "Confirming...",
            "confirm": "Confirm Reservation",
            "success_title": "Appointment Confirmed!",
            "success_msg1": "Your meeting has been successfully scheduled for",
            "success_msg2": "New details and the call link will reach your WhatsApp very soon.",
            "close": "Close Window"
        }
    },
    "de": {
        "contact": {
            "title": "Dicilo Kontaktzentrum",
            "subtitle": "Wenden Sie sich an unser Team Office. Wir sind bereit, Ihnen zu helfen, Ihr Geschäft anzukurbeln.",
            "book": {
                "title": "Meeting buchen",
                "desc": "Haben Sie Fragen zur Skalierung Ihres Unternehmens? Vereinbaren Sie einen 30-minütigen Videoanruf mit einem persönlichen Berater. Wählen Sie die Zeit, die am besten zu Ihrem Zeitplan passt.",
                "button": "Verfügbarkeit prüfen und buchen"
            },
            "office": {
                "title": "Unsere Büros",
                "hq": "Hauptsitz",
                "phone": "Telefonischer Support",
                "mon_fri": "Montag bis Freitag",
                "note": "* Persönliche Besuche erfordern eine vorherige Terminvereinbarung."
            }
        },
        "booking": {
            "title": "Meeting",
            "title2": "buchen",
            "subtitle": "Persönliche Beratung durch das Dicilo Team Office.",
            "duration": "30 Minuten",
            "your_timezone": "Ihre Zeitzone",
            "timezone_expl": "Alle unten angegebenen Zeiten werden zur Vermeidung von Verwirrung in Ihrer Ortszeit gemäß Ihrem Gerät angezeigt.",
            "selected": "Ausgewählter Termin",
            "select_day": "Wählen Sie den Tag aus",
            "select_day_desc": "Klicken Sie im Kalender auf einen verfügbaren Tag.",
            "choose_time": "Zeit auswählen und bestätigen",
            "available_for": "Verfügbare Zeiten am ",
            "name": "Vollständiger Name",
            "name_ph": "Z.B. Max Mustermann",
            "reason": "Worüber möchten Sie sprechen?",
            "reason_ph": "Worum geht es bei dem Meeting...",
            "confirming": "Wird bestätigt...",
            "confirm": "Reservierung bestätigen",
            "success_title": "Termin bestätigt!",
            "success_msg1": "Ihr Meeting wurde erfolgreich geplant für",
            "success_msg2": "Neue Details und der Link zum Anruf erhalten Sie in Kürze per WhatsApp.",
            "close": "Fenster schließen"
        }
    }
}

for lang in langs:
    filepath = os.path.join(locales_dir, lang, "common.json")
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        # Merge our new translations
        data["contact"] = translations[lang]["contact"]
        data["booking"] = translations[lang]["booking"]
        
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

