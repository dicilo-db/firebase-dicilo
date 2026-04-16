with open("src/app/dashboard/business/chatbot/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    "I.A. Activada": "{t('business.chatbot.iaOn', 'I.A. Activada')}",
    "I.A. Pausada": "{t('business.chatbot.iaOff', 'I.A. Pausada')}",
    "Nombre del Asistente": "{t('business.chatbot.botName', 'Nombre del Asistente')}",
    "Ej. Juan de Pizzería Napoli": "Ej. Juan de Pizzería Napoli", # I will use replace() inside python
    "Mensaje de Bienvenida": "{t('business.chatbot.greeting', 'Mensaje de Bienvenida')}",
    "¡Hola! Soy Juan, ¿tienes hambre?": "¡Hola! Soy Juan, ¿tienes hambre?",
    "Este mensaje aparecerá cuando o cliente abra el chat.": "{t('business.chatbot.msgHint', 'Este mensaje aparecerá cuando o cliente abra el chat.')}",
    "https://tulogo.com/robot.png": "https://tulogo.com/robot.png",
    "Puedes colocar una imagen que actuará como rostro de tu I.A.": "{t('business.chatbot.imgHint', 'Puedes colocar una imagen que actuará como rostro de tu I.A.')}",
    "Instruye detalladamente a la I.A. sobre qué tono usar y qué información priorizar.": "{t('business.chatbot.promptHint', 'Instruye detalladamente a la I.A. sobre qué tono usar y qué información priorizar.')}",
    "Guardar Cambios": "{t('business.chatbot.save', 'Guardar Cambios')}",
    "Arrastra o haz clic aquí (Máximo 10MB)": "{t('business.chatbot.dragDrop', 'Arrastra o haz clic aquí (Máximo 10MB)')}",
    "Documentos Entrenados": "{t('business.chatbot.trainedDocs', 'Documentos Entrenados')}",
    "No hay documentos subidos todavía.": "{t('business.chatbot.noDocs', 'No hay documentos subidos todavía.')}",
}

content = content.replace("config.isActive ? 'I.A. Activada' : 'I.A. Pausada'", "config.isActive ? t('business.chatbot.iaOn', 'I.A. Activada') : t('business.chatbot.iaOff', 'I.A. Pausada')")

content = content.replace("<p className=\"text-xs text-slate-500\">Este mensaje aparecerá cuando o cliente abra el chat.</p>", "<p className=\"text-xs text-slate-500\">{t('business.chatbot.msgHint', 'Este mensaje aparecerá cuando el cliente abra el chat.')}</p>")
content = content.replace("<p className=\"text-xs text-slate-500\">Puedes colocar una imagen que actuará como rostro de tu I.A.</p>", "<p className=\"text-xs text-slate-500\">{t('business.chatbot.imgHint', 'Puedes colocar una imagen que actuará como rostro de tu I.A.')}</p>")
content = content.replace("<p className=\"text-xs text-slate-500\">Instruye detalladamente a la I.A. sobre qué tono usar y qué información priorizar.</p>", "<p className=\"text-xs text-slate-500\">{t('business.chatbot.promptHint', 'Instruye detalladamente a la I.A. sobre qué tono usar y qué información priorizar.')}</p>")

content = content.replace("Guardar Cambios", "{t('business.chatbot.save', 'Guardar Cambios')}")
content = content.replace("Arrastra o haz clic aquí (Máximo 10MB)", "{t('business.chatbot.dragDrop', 'Arrastra o haz clic aquí (Máximo 10MB)')}")
content = content.replace("Documentos Entrenados", "{t('business.chatbot.trainedDocs', 'Documentos Entrenados')}")
content = content.replace("No hay documentos subidos todavía.", "{t('business.chatbot.noDocs', 'No hay documentos subidos todavía.')}")

content = content.replace('placeholder="Ej. Juan de Pizzería Napoli"', 'placeholder={t(\'business.chatbot.phName\', \'Ej. Juan de Pizzería Napoli\')}')
content = content.replace('placeholder="¡Hola! Soy Juan, ¿tienes hambre?"', 'placeholder={t(\'business.chatbot.phGreeting\', \'¡Hola! Soy Juan, ¿tienes hambre?\')}')
content = content.replace('placeholder="https://tulogo.com/robot.png"', 'placeholder={t(\'business.chatbot.phUrl\', \'https://tulogo.com/robot.png\')}')
content = content.replace('placeholder="Eres un agente de ventas amable. Tu objetivo es recomendar nuestras pizzas y proporcionar horarios..."', 'placeholder={t(\'business.chatbot.phPrompt\', \'Eres un agente de ventas amable. Tu objetivo es recomendar nuestras pizzas y proporcionar horarios...\')}')

with open("src/app/dashboard/business/chatbot/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)


# Update JSON dicts
import json
def update_file(filename, data_to_merge):
    with open(filename, 'r', encoding='utf-8') as f:
        data = json.load(f)
    for k, v in data_to_merge.items():
        parts = k.split('.')
        m = parts[0]
        s = parts[1]
        if m not in data["business"]: data["business"][m] = {}
        data["business"][m][s] = v
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

de_add = {
"chatbot.iaOn": "KI Aktiviert",
"chatbot.iaOff": "KI Pausiert",
"chatbot.msgHint": "Diese Nachricht wird angezeigt, wenn der Kunde den Chat öffnet.",
"chatbot.imgHint": "Sie können ein Bild platzieren, das als Gesicht Ihrer KI fungiert.",
"chatbot.promptHint": "Weisen Sie die KI detailliert an, welchen Ton sie verwenden und welche Informationen sie priorisieren soll.",
"chatbot.save": "Änderungen Speichern",
"chatbot.dragDrop": "Ziehen oder klicken Sie hier (Maximal 10MB)",
"chatbot.trainedDocs": "Trainierte Dokumente",
"chatbot.noDocs": "Noch keine Dokumente hochgeladen.",
"chatbot.phName": "Bsp. Johann von der Pizzeria Napoli",
"chatbot.phGreeting": "Hallo! Ich bin Johann. Hast du Hunger?",
"chatbot.phUrl": "https://deinlogo.com/robot.png",
"chatbot.phPrompt": "Du bist ein freundlicher Verkäufer. Dein Ziel ist es, unsere Pizzen zu empfehlen und Öffnungszeiten zu nennen..."
}

update_file('src/locales/de/common.json', de_add)

