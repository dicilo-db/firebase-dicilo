import React from 'react';
import { useTranslation } from 'react-i18next';

export const DiciCoinInfo = () => {
    const { t } = useTranslation('common');

    return (
        <section id="dicicoin-info-section" className="space-y-6 text-justify">
            <h2 className="text-2xl font-bold text-slate-900 border-b pb-2">{t('dashboard.dicicoin.info.title')}</h2>
            
            <p className="leading-relaxed">
                {t('dashboard.dicicoin.info.intro1')}
            </p>
            <p className="leading-relaxed">
                {t('dashboard.dicicoin.info.intro2')}
            </p>

            <h3 className="text-lg font-bold text-slate-800 mt-6">{t('dashboard.dicicoin.info.mintingTitle')}</h3>
            <p className="leading-relaxed">
                {t('dashboard.dicicoin.info.mintingLimit')}
            </p>
            <p className="text-center py-3 bg-amber-50 rounded-lg border border-amber-200">
                <strong className="text-amber-800 text-xl">{t('dashboard.dicicoin.info.mintingWorldwide')}</strong>
            </p>
            <p className="leading-relaxed">
                {t('dashboard.dicicoin.info.mintingNoMore')}
            </p>
            <p className="leading-relaxed">
                {t('dashboard.dicicoin.info.mintingDistribution')}
            </p>
            <ul className="list-disc list-inside pl-4 space-y-1">
                <li>{t('dashboard.dicicoin.info.continents.america')}</li>
                <li>{t('dashboard.dicicoin.info.continents.europe')}</li>
                <li>{t('dashboard.dicicoin.info.continents.asia')}</li>
                <li>{t('dashboard.dicicoin.info.continents.africa')}</li>
                <li>{t('dashboard.dicicoin.info.continents.oceania')}</li>
            </ul>
            <p className="leading-relaxed">
                {t('dashboard.dicicoin.info.mintingNoAdvantage')}
            </p>
            <p className="leading-relaxed">
                {t('dashboard.dicicoin.info.mintingReduces')}
            </p>

            <h3 className="text-lg font-bold text-slate-800 mt-6">{t('dashboard.dicicoin.info.securityTitle')}</h3>
            <p className="leading-relaxed">
                {t('dashboard.dicicoin.info.securityIntro')}
            </p>
            <ul className="list-disc list-inside pl-4 space-y-1">
                <li>{t('dashboard.dicicoin.info.securityFeatures.serial')}</li>
                <li>{t('dashboard.dicicoin.info.securityFeatures.certificate')}</li>
                <li>{t('dashboard.dicicoin.info.securityFeatures.registry')}</li>
                <li>{t('dashboard.dicicoin.info.securityFeatures.signature')}</li>
                <li>{t('dashboard.dicicoin.info.securityFeatures.verification')}</li>
                <li>{t('dashboard.dicicoin.info.securityFeatures.elements')}</li>
            </ul>
            <p className="leading-relaxed">
                {t('dashboard.dicicoin.info.securityOutro')}
            </p>

            <h3 className="text-lg font-bold text-slate-800 mt-6">{t('dashboard.dicicoin.info.valueTitle')}</h3>
            <p className="leading-relaxed">
                {t('dashboard.dicicoin.info.valueCurrent')}
            </p>
            <p className="leading-relaxed">
                {t('dashboard.dicicoin.info.valueFuture')}
            </p>
            <p className="leading-relaxed">
                {t('dashboard.dicicoin.info.valueExclusivity')}
            </p>

            <h3 className="text-lg font-bold text-slate-800 mt-6">{t('dashboard.dicicoin.info.participationTitle')}</h3>
            <p className="leading-relaxed">
                {t('dashboard.dicicoin.info.participationIntro')}
            </p>
            <p className="leading-relaxed">
                {t('dashboard.dicicoin.info.participationFuture')}
            </p>
            <p className="leading-relaxed">
                {t('dashboard.dicicoin.info.participationOutro')}
            </p>

            <h3 className="text-lg font-bold text-slate-800 mt-6">{t('dashboard.dicicoin.info.moreTitle')}</h3>
            <p className="leading-relaxed">
                {t('dashboard.dicicoin.info.moreIntro')}
            </p>
            <p className="leading-relaxed italic pl-4 border-l-4 border-amber-500 text-slate-700">
                {t('dashboard.dicicoin.info.moreHighlights.p1')}<br />
                {t('dashboard.dicicoin.info.moreHighlights.p2')}<br />
                {t('dashboard.dicicoin.info.moreHighlights.p3')}<br />
                {t('dashboard.dicicoin.info.moreHighlights.p4')}
            </p>
            <p className="leading-relaxed font-bold text-center text-slate-800 pt-2">
                {t('dashboard.dicicoin.info.moreLimit')}
            </p>
            <p className="leading-relaxed">
                {t('dashboard.dicicoin.info.moreOutro')}
            </p>
        </section>
    );
};
