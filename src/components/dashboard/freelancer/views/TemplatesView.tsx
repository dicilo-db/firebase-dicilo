'use client';
import { useTranslation } from 'react-i18next';

export function TemplatesView() {
    const { t } = useTranslation('common');
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold">{t('freelancer_menu.templates')}</h1>
        </div>
    );
}
