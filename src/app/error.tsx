'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const TRANSLATIONS: Record<string, { title: string; message: string; retry: string; }> = {
  es: {
    title: "¡Algo salió mal!",
    message: "Hola estimado usuario, queremos pedirte una gran disculpa por el error que estás presentando. Te recordamos que dicilo es una plataforma que aún está en fases de prueba ya que abrimos nuestras puertas este 15.01.2026 y en este tipo de plataformas las actualizaciones son constantes, por lo que ahora mismo en este instante estamos reparando una vulnerabilidad que encontramos y que al repararla mejorará considerablemente la seguridad de tus datos y tu experiencia de uso en dicilo.\n\nAgradecemos tu valiosa colaboración y te pedimos regreses un poco más tarde, nuestros técnicos ya trabajan en una solución para que puedas volver a disfrutar de dicilo.net.",
    retry: "Reintentar"
  },
  en: {
    title: "Something went wrong!",
    message: "Hello dear user, we would like to sincerely apologize for the error you are experiencing. We remind you that dicilo is a platform that is still in its testing phase since we opened our doors on 15.01.2026, and in these types of platforms updates are constant. Right now, at this very moment, we are repairing a vulnerability we found, and fixing it will significantly improve the security of your data and your user experience on dicilo.\n\nWe appreciate your valuable collaboration and ask you to return a little later. Our technicians are already working on a solution so you can enjoy dicilo.net again.",
    retry: "Try again"
  },
  de: {
    title: "Etwas ist schief gelaufen!",
    message: "Hallo lieber Nutzer, wir möchten uns aufrichtig für den aufgetretenen Fehler entschuldigen. Wir möchten Sie daran erinnern, dass dicilo eine Plattform ist, die sich noch in der Testphase befindet, da wir unsere Türen am 15.01.2026 geöffnet haben und bei dieser Art von Plattformen Updates an der Tagesordnung sind. Genau in diesem Moment beheben wir eine Schwachstelle, die wir gefunden haben, und die Behebung wird die Sicherheit Ihrer Daten und Ihre Erfahrung auf dicilo erheblich verbessern.\n\nWir schätzen Ihre wertvolle Mitarbeit und bitten Sie, etwas später wiederzukommen. Unsere Techniker arbeiten bereits an einer Lösung, damit Sie dicilo.net wieder genießen können.",
    retry: "Erneut versuchen"
  },
  // Future languages structure (12 languages)
  fr: { title: "Quelque chose s'est mal passé!", message: "...", retry: "Réessayer" },
  it: { title: "Qualcosa è andato storto!", message: "...", retry: "Riprova" },
  pt: { title: "Algo deu errado!", message: "...", retry: "Tentar novamente" },
  zh: { title: "出错了！", message: "...", retry: "重试" },
  ar: { title: "حدث خطأ ما!", message: "...", retry: "حاول مرة أخرى" },
  hi: { title: "कुछ गलत हो गया!", message: "...", retry: "पुनः प्रयास करें" },
  ru: { title: "Что-то пошло не так!", message: "...", retry: "Повторить попытку" },
  ja: { title: "問題が発生しました！", message: "...", retry: "再試行" },
  ko: { title: "문제가 발생했습니다!", message: "...", retry: "다시 시도" }
};

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const [lang, setLang] = useState('de');

    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Dashboard Error:', error);
        
        // Detect preferred language
        if (typeof window !== 'undefined') {
            const isChunkLoadError = error?.name === 'ChunkLoadError' || error?.message?.includes('Loading chunk');
            if (isChunkLoadError) {
                window.location.reload();
            }
            
            const savedLang = localStorage.getItem('i18nextLng')?.split('-')[0];
            const browserLang = navigator.language.split('-')[0];
            const prefLang = savedLang || browserLang;

            if (TRANSLATIONS[prefLang]) {
                setLang(prefLang);
            } else {
                setLang('en');
            }
        }
    }, [error]);

    const t = TRANSLATIONS[lang];

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
            <h2 className="text-2xl font-bold">{t.title}</h2>
            <div className="text-muted-foreground whitespace-pre-wrap max-w-2xl text-center mb-4">
                {t.message}
            </div>
            {process.env.NODE_ENV === 'development' && (
                <pre className="mt-4 max-w-lg overflow-auto rounded bg-slate-100 p-4 text-left text-xs text-red-600">
                    {error.message}
                </pre>
            )}
            <Button onClick={() => reset()}>{t.retry}</Button>
        </div>
    );
}
