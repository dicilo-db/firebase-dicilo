'use client';

import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Download, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function WhatsAppGroupSection() {
    const { t } = useTranslation('common');
    const qrRef = useRef<HTMLDivElement>(null);
    const whatsappLink = "https://chat.whatsapp.com/EZQUaoR87e9AvAPdgz2uj4?mode=gi_t";

    const downloadQRCode = () => {
        const canvas = qrRef.current?.querySelector('canvas');
        if (canvas) {
            const pngUrl = canvas
                .toDataURL("image/png")
                .replace("image/png", "image/octet-stream");
            const downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = "whatsapp-group-qr.png";
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };

    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white mt-6">
            <CardHeader className="bg-emerald-50/50 border-b">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2 text-emerald-800">
                            <MessageCircle className="h-5 w-5 text-emerald-600" />
                            {t('dashboard.joinChatGroup', 'Unirse al Grupo de Chat')}
                        </CardTitle>
                        <CardDescription className="text-emerald-700/80">
                            {t('dashboard.chatGroup.connect', 'Conecta con nuestra comunidad global.')}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg">
                            <p className="text-sm text-amber-900 leading-relaxed font-medium">
                                {t('dashboard.chatGroup.welcomeRules', '"Por favor al entrar en el Chat preséntate con tu nombre y di, de qué país nos visitas. Esto es para que todos sepan de qué país nos están visitando."')}
                            </p>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                            <Button 
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => window.open(whatsappLink, '_blank')}
                            >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                {t('dashboard.joinWhatsapp', 'Unirse al Grupo de WhatsApp')}
                            </Button>
                            
                            <Button 
                                variant="outline" 
                                className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                onClick={downloadQRCode}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                {t('dashboard.downloadQr', 'Descargar Código QR')}
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-dashed border-emerald-200">
                        <div ref={qrRef} className="bg-white p-4 rounded-lg shadow-sm border border-emerald-100">
                            <QRCodeCanvas
                                value={whatsappLink}
                                size={160}
                                level={"H"}
                                includeMargin={false}
                                imageSettings={{
                                    src: "/favicon.png",
                                    x: undefined,
                                    y: undefined,
                                    height: 30,
                                    width: 30,
                                    excavate: true,
                                }}
                            />
                        </div>
                        <p className="text-[10px] text-emerald-700/60 mt-4 text-center font-medium">
                            {t('dashboard.chatGroup.scanToJoin', 'Escanea para unirte directamente al grupo')}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
