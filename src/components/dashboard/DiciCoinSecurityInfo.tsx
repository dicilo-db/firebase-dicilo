import React from 'react';
import { useTranslation } from 'react-i18next';

export const DiciCoinSecurityInfo = () => {
    const { i18n } = useTranslation();
    const lang = i18n.language.split('-')[0]; // 'es', 'en', 'de'

    if (lang === 'en') {
        return (
            <div className="space-y-4 text-justify">
                <p>DICICOINs can be acquired exclusively through sales points duly accredited and authorized by Dicilo.</p>
                <p>To protect the community, maintain transparency, and ensure the authenticity of every single coin, purchases via unauthorized or misleading providers will not be recognized.</p>
                <p>Each DICICOIN is issued with a sealed license, a unique serial number, and a personal registration. This registration establishes a digital, system-internal proof of assignment within the Dicilo ecosystem and does not constitute a transferable financial or property title in the legal sense.</p>
                <p>DICICOINs can be transferred between users. However, eligibility to participate in potential future conversion, unlocking, or access processes is reserved exclusively for the person who is listed at that time as the officially registered holder within the Dicilo system.</p>
                <p>Participation in such future processes takes place exclusively under consideration of the respective applicable legal, corporate, and structural frameworks.</p>
            </div>
        );
    }

    if (lang === 'de') {
        return (
            <div className="space-y-4 text-justify">
                <p>DICICOINs können ausschließlich über von Dicilo ordnungsgemäß akkreditierte und autorisierte Verkaufsstellen erworben werden.</p>
                <p>Zum Schutz der Gemeinschaft, zur Wahrung der Transparenz und zur Sicherstellung der Echtheit jeder einzelnen Münze werden Erwerbe über nicht autorisierte oder irreführende Anbieter nicht anerkannt.</p>
                <p>Jede DICICOIN wird mit einer versiegelten Lizenz, einer eindeutigen Seriennummer sowie einer personengebundenen Registrierung ausgegeben. Diese Registrierung begründet einen digitalen, systeminternen Zuordnungsnachweis innerhalb des Dicilo-Ökosystems und stellt keinen übertragbaren Finanz- oder Eigentumstitel im rechtlichen Sinne dar.</p>
                <p>DICICOINs können zwischen Nutzern übertragen werden. Für die Teilnahme an möglichen zukünftigen Umwandlungs-, Freischaltungs- oder Zugangsvorgängen ist jedoch ausschließlich die Person berechtigt, die zum jeweiligen Zeitpunkt als offiziell registrierter Inhaber innerhalb des Dicilo-Systems geführt wird.</p>
                <p>Die Teilnahme an solchen zukünftigen Prozessen erfolgt ausschließlich unter Berücksichtigung der jeweils geltenden rechtlichen, unternehmerischen und strukturellen Rahmenbedingungen.</p>
            </div>
        );
    }

    // Default to ES
    return (
        <div className="space-y-4 text-justify">
            <p>Las DICICOIN solo pueden adquirirse exclusivamente a través de puntos de venta debidamente acreditados y autorizados por Dicilo.</p>
            <p>Para proteger a la comunidad, mantener la transparencia y asegurar la autenticidad de cada moneda, no se reconocerán las adquisiciones realizadas a través de proveedores no autorizados o engañosos.</p>
            <p>Cada DICICOIN se emite con una licencia sellada, un número de serie único y un registro personal vinculado. Este registro constituye una prueba de asignación digital interna dentro del ecosistema Dicilo y no representa un título financiero o de propiedad transferible en el sentido legal.</p>
            <p>Las DICICOIN pueden transferirse entre usuarios. Sin embargo, para participar en posibles procesos futuros de conversión, desbloqueo o acceso, únicamente tendrá derecho la persona que figure en ese momento como titular oficialmente registrado dentro del sistema Dicilo.</p>
            <p>La participación en dichos procesos futuros se realizará exclusivamente teniendo en cuenta el marco legal, corporativo y estructural aplicable en cada momento.</p>
        </div>
    );
};
