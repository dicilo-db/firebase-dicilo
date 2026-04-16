const fs = require('fs');

const path = 'src/app/dashboard/business/scanner/page.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('useTranslation')) {
    content = content.replace("import { useBusinessAccess } from '@/hooks/useBusinessAccess';", "import { useBusinessAccess } from '@/hooks/useBusinessAccess';\nimport { useTranslation } from 'react-i18next';");
    content = content.replace("export default function BusinessScannerPage() {", "export default function BusinessScannerPage() {\n    const { t } = useTranslation('common');");
    
    // replacements
    content = content.replace("Scanner de <span className=\"text-green-600\">Cobro QR</span>", "<span dangerouslySetInnerHTML={{ __html: t('business.scanner.title', 'Scanner de <span class=\"text-green-600\">Cobro QR</span>') }}></span>");
    content = content.replace("Caja registradora terminal para procesar cobros en Dicipoints.", "{t('business.scanner.desc', 'Caja registradora terminal para procesar cobros en Dicipoints.')}");
    
    content = content.replace("El módulo de Scanner y Cobro requiere plan Starter o superior.", "{t('business.scanner.planReq', 'El módulo de Scanner y Cobro requiere plan Starter o superior.')}");
    content = content.replace("> Terminal de Cobro", "> {t('business.scanner.terminal', 'Terminal de Cobro')}");
    content = content.replace(">Scanner B2B de Dicilo.net<", ">{t('business.scanner.subtitle', 'Scanner B2B de Dicilo.net')}<");
    
    // "Esperando Escaneo QR (o ID Manual)"
    content = content.replace(">Esperando Escaneo QR (o ID Manual)<", ">{t('business.scanner.waiting', 'Esperando Escaneo QR (o ID Manual)')}<");
    content = content.replace('placeholder="Ingresa el UID de prueba..."', 'placeholder={t("business.scanner.placeholder", "Ingresa el UID de prueba...")}');
    
    content = content.replace(">Usuario Verificado<", ">{t('business.scanner.userVerified', 'Usuario Verificado')}<");
    content = content.replace("Saldo Disp:", "{t('business.scanner.balance', 'Saldo Disp:')}");
    
    content = content.replace(">Monto a Cobrar (En Puntos)<", ">{t('business.scanner.amount', 'Monto a Cobrar (En Puntos)')}<");
    content = content.replace("Recibirás:", "{t('business.scanner.willReceive', 'Recibirás:')}");
    
    content = content.replace("? 'Procesando Transacción...' : 'Confirmar Cobro'", "? t('business.scanner.processing', 'Procesando Transacción...') : t('business.scanner.confirmBtn', 'Confirmar Cobro')");
    content = content.replace(">Cancelar<", ">{t('business.scanner.cancelBtn', 'Cancelar')}<");
    
    content = content.replace(">¡Cobro Aprobado!<", ">{t('business.scanner.approved', '¡Cobro Aprobado!')}<");
    content = content.replace(">Se depositaron los fondos en tu Dual-Wallet.<", ">{t('business.scanner.deposited', 'Se depositaron los fondos en tu Dual-Wallet.')}<");
    content = content.replace("Monto Cobrado:", "{t('business.scanner.amountCharged', 'Monto Cobrado:')}");
    content = content.replace("ID Operación:", "{t('business.scanner.trxId', 'ID Operación:')}");
    content = content.replace(">Nuevo Cliente<", ">{t('business.scanner.newClientBtn', 'Nuevo Cliente')}<");
    
    content = content.replace("Último Cobro Recibido", "{t('business.scanner.lastPayment', 'Último Cobro Recibido')}");
    content = content.replace(">Hace 2 horas • Cliente Anónimo<", ">{t('business.scanner.lastPaymentDesc', 'Hace 2 horas • Cliente Anónimo')}<");
    content = content.replace("Último Producto Vendido", "{t('business.scanner.lastProduct', 'Último Producto Vendido')}");
    content = content.replace(">Suscripción Manual / Genérico<", ">{t('business.scanner.lastProductTitle', 'Suscripción Manual / Genérico')}<");
    content = content.replace(">Pagado con DiciPoints • Modo Offline<", ">{t('business.scanner.lastProductDesc', 'Pagado con DiciPoints • Modo Offline')}<");
    
    // toasts
    content = content.replace('title: "Usuario no encontrado"', 'title: t("business.scanner.toastUserNotFound", "Usuario no encontrado")');
    content = content.replace('title: "Error al buscar usuario"', 'title: t("business.scanner.toastSearchError", "Error al buscar usuario")');
    content = content.replace('title: "Monto inválido"', 'title: t("business.scanner.toastInvalid", "Monto inválido")');
    content = content.replace('title: "Saldo insuficiente"', 'title: t("business.scanner.toastInsufficient", "Saldo insuficiente")');
    content = content.replace('title: "Transacción Exitosa"', 'title: t("business.scanner.toastSuccess", "Transacción Exitosa")');
    content = content.replace('title: "Error en la Transacción"', 'title: t("business.scanner.toastTrxError", "Error en la Transacción")');
    content = content.replace('title: "Error de Servidor"', 'title: t("business.scanner.toastServerError", "Error de Servidor")');
    
    fs.writeFileSync(path, content, 'utf8');
    console.log('Scanner i18n fixed');
}
