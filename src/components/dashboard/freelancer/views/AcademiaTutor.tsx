'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, Bot, User, Sparkles, MessageSquare, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function AcademiaTutor() {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '¡Hola! Soy tu tutor virtual de Dicilo. Estoy aquí para ayudarte a entender la plataforma, resolver dudas sobre captación de leads y darte consejos de ventas. ¿En qué puedo ayudarte hoy?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // In a real scenario, this connects to /api/tutor/chat
      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          userName: user?.displayName || 'Freelancer'
        })
      });

      if (!res.ok) throw new Error('Error al conectar con el tutor');

      const data = await res.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'Lo siento, tuve un problema al procesar tu respuesta.'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Hubo un error de conexión con mi servidor. Por favor, intenta de nuevo en unos momentos.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Panel Principal del Chat */}
      <Card className="lg:col-span-3 flex flex-col h-[600px] border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-3">
            <div className="bg-fuchsia-100 dark:bg-fuchsia-900/30 p-2 rounded-xl">
                <Bot className="w-5 h-5 text-fuchsia-600 dark:text-fuchsia-400" />
            </div>
            <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-none">Dicilo AI Tutor</h3>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> En línea
                </span>
            </div>
        </div>

        <CardContent className="flex-1 p-4 overflow-y-auto space-y-6 bg-slate-50/30 dark:bg-black/5">
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />
                </div>
              )}
              
              <div className={`px-4 py-3 rounded-2xl max-w-[80%] text-sm ${
                m.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-tl-none shadow-sm'
              }`}>
                {m.content}
              </div>

              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
               <div className="w-8 h-8 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400 animate-spin" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 rounded-tl-none shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2"
          >
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta aquí..."
              className="flex-1 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white focus:ring-2 focus:ring-fuchsia-500 rounded-xl px-4 py-3 text-sm transition-all outline-none"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl h-11 w-11 p-0 flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </Card>

      {/* Panel Lateral (Telegram) */}
      <div className="space-y-6">
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 overflow-hidden relative">
            <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none">
                <MessageSquare className="w-32 h-32 text-blue-600" />
            </div>
            <CardHeader>
                <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2 text-lg">
                    Lleva al Tutor contigo
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-blue-800/80 dark:text-blue-200/80 mb-6 leading-relaxed">
                    Conecta tu cuenta de Dicilo con Telegram para hacer preguntas al AI Tutor desde tu móvil en cualquier momento, incluso cuando estés en la calle.
                </p>
                <Button className="w-full bg-[#0088cc] hover:bg-[#0077b3] text-white gap-2 font-semibold shadow-md">
                    Conectar Telegram
                    <ExternalLink className="w-4 h-4" />
                </Button>
            </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
            <CardHeader>
                <CardTitle className="text-base text-slate-800 dark:text-slate-100">Sugerencias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <button onClick={() => setInput('¿Cuáles son los mejores horarios para llamar a un lead?')} className="w-full text-left p-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">
                    ¿Mejores horarios para llamar leads?
                </button>
                <button onClick={() => setInput('Explícame cómo funciona el panel de finanzas')} className="w-full text-left p-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">
                    ¿Cómo funciona el panel de finanzas?
                </button>
                <button onClick={() => setInput('¿Qué ventajas tiene el plan Premium para las empresas?')} className="w-full text-left p-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">
                    Ventajas del plan Premium
                </button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
