import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Ensure the OPENAI_API_KEY is available in the environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    const { messages, userName } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.warn('OPENAI_API_KEY no está configurada.');
      return NextResponse.json({ reply: 'El tutor AI se encuentra en mantenimiento (Falta API Key). Por favor, avisa a tu administrador.' });
    }

    // System prompt para definir el comportamiento del tutor
    const systemPrompt = `Eres el "Tutor AI de Dicilo", un asistente educativo y de ventas exclusivo para los freelancers de la plataforma Dicilo.net.
Tu misión es ayudar a ${userName || 'el freelancer'} a entender la plataforma, mejorar sus habilidades de ventas, y responder preguntas sobre la documentación y los videos de la Academia.

REGLAS DE ORO:
1. Sé siempre amable, motivador y sumamente profesional.
2. Da respuestas concisas y directas. Usa viñetas y formato Markdown (negritas) para hacer la lectura fácil.
3. Si te preguntan algo que no sabes o que no tiene relación con ventas, marketing, o la plataforma de Dicilo, responde cortésmente que tu conocimiento se limita a la Academia Dicilo.
4. Anima siempre al freelancer a usar los recursos de la academia y a cerrar más ventas.
5. Nunca prometas cosas en nombre de Dicilo (ej: pagos, bonos) si no estás seguro. Dirígelos a soporte si es necesario.`;

    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content
      }))
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Usamos el modelo rápido y eficiente
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const reply = completion.choices[0]?.message?.content || 'No pude generar una respuesta, inténtalo de nuevo.';

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Error in AI Tutor Route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
