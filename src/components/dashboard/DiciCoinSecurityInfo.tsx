import React from 'react';
import { useTranslation } from 'react-i18next';

export const DiciCoinSecurityInfo = () => {
    const { i18n } = useTranslation();
    const lang = i18n.language.split('-')[0]; // 'es', 'en', 'de'

    if (lang === 'en') {
        return (
            <div className="space-y-4 text-justify">
                <p>DICICOINs can only be acquired through Authorized Sales Agents duly accredited by Dicilo.</p>
                <p>In order to protect the community and guarantee the authenticity of each coin, purchases made from unauthorized or fake agents are not recognized.</p>
                <p>Each DICICOIN is delivered with a Sealed License, a Unique Serial Number, and is registered in the name of the beneficiary, who receives a digital property title within the Dicilo ecosystem.</p>
                <p>DICICOINs are transferable between users; however, they can only be redeemed or enabled for future conversion processes by the holder officially registered in the authorized buyers list.</p>
            </div>
        );
    }

    if (lang === 'de') {
        return (
            <div className="space-y-4 text-justify">
                <p>DICICOINs können nur über von Dicilo ordnungsgemäß akkreditierte autorisierte Verkaufsagenten erworben werden.</p>
                <p>Zum Schutz der Gemeinschaft und zur Gewährleistung der Echtheit jeder Münze werden Käufe bei nicht autorisierten oder falschen Agenten nicht anerkannt.</p>
                <p>Jede DICICOIN wird mit einer versiegelten Lizenz und einer eindeutigen Seriennummer geliefert und auf den Namen des Begünstigten registriert, der einen digitalen Eigentumstitel innerhalb des Dicilo-Ökosystems erhält.</p>
                <p>DICICOINs sind zwischen Benutzern übertragbar, können jedoch nur von dem offiziell in der Liste der autorisierten Käufer registrierten Inhaber für zukünftige Umwandlungsprozesse eingelöst oder freigeschaltet werden.</p>
            </div>
        );
    }

    // Default to ES
    return (
        <div className="space-y-4 text-justify">
            <p>Las DICICOIN solo pueden ser adquiridas a través de Agentes Autorizados de Venta debidamente acreditados por Dicilo.</p>
            <p>Con el fin de proteger a la comunidad y garantizar la autenticidad de cada moneda, no se reconoce la compra realizada a agentes no autorizados o falsos.</p>
            <p>Cada DICICOIN se entrega con una Licencia Sellada, un Número de Serie Único y queda registrada a nombre del beneficiario, quien recibe un título de propiedad digital dentro del ecosistema Dicilo.</p>
            <p>Las DICICOIN son transferibles entre usuarios, sin embargo, solo podrán ser canjeadas o habilitadas para procesos futuros de conversión por el titular oficialmente registrado en la lista de compradores autorizados.</p>
        </div>
    );
};
