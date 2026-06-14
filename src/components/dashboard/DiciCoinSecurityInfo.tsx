import React from 'react';
import { useTranslation } from 'react-i18next';

export const DiciCoinSecurityInfo = () => {
    const { t } = useTranslation('common');

    return (
        <div className="space-y-4 text-justify">
            <p>{t('dashboard.dicicoin.security.p1')}</p>
            <p>{t('dashboard.dicicoin.security.p2')}</p>
            <p>{t('dashboard.dicicoin.security.p3')}</p>
            <p>{t('dashboard.dicicoin.security.p4')}</p>
            <p>{t('dashboard.dicicoin.security.p5')}</p>
        </div>
    );
};
