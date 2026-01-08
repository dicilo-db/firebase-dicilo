import React from 'react';
import { useTranslation } from 'react-i18next';

export const DiciCoinInfo = () => {
    const { i18n } = useTranslation();
    const lang = i18n.language.split('-')[0]; // 'es', 'en', 'de'

    if (lang === 'en') {
        return (
            <section id="dicicoin-info-en" className="space-y-4 text-justify">
                <h2 className="text-xl font-bold">What is DICICOIN?</h2>
                <p>
                    <strong>DICICOIN</strong> is a physical, limited, and collectible commemorative coin created as the founding symbol of the <strong>Dicilo</strong> ecosystem.
                    It stands for early participation, vision, and belonging to an international platform that connects people, businesses, and real opportunities.
                </p>

                <p>
                    Each DICICOIN connects the physical world with the digital growth of Dicilo. It is neither a cryptocurrency nor a classic financial product, but a <strong>symbolic and strategic tangible asset</strong> in a limited edition.
                </p>

                <h3 className="text-lg font-semibold mt-4">Why own a DICICOIN?</h3>
                <p>
                    Owning a DICICOIN means being there from the very beginning. It is a conscious decision to support a vision before it becomes the standard.
                </p>

                <ul className="list-none space-y-2 pl-4">
                    <li>✔ Early access to a growing ecosystem</li>
                    <li>✔ Limited and individually numbered physical collector's coin</li>
                    <li>✔ Preferential access to defined future opportunities within the Dicilo ecosystem</li>
                    <li>✔ Symbolic belonging with a strategic perspective</li>
                </ul>

                <h3 className="text-lg font-semibold mt-4">Value and structural perspective</h3>
                <p>
                    The current reference value of a DICICOIN is <strong>€35</strong>.
                    As part of Dicilo's long-term development, an internal reference value of up to <strong>€25</strong> will be considered for each DICICOIN once the defined corporate, legal, and structural milestones have been reached.
                </p>

                <p>
                    At that stage, DICICOIN may—in compliance with the respective applicable legal frameworks—enable preferential participation in defined conversion or exchange processes, for example, in connection with a future capital market structure.
                    This does not represent a guarantee of return or value, but a structured access opportunity for early supporters.
                </p>

                <h3 className="text-lg font-semibold mt-4">Purchase limit</h3>
                <p>
                    To ensure a fair, transparent, and responsible distribution, acquisition is limited to a maximum of <strong>2,000 DICICOINs</strong> per person.
                </p>

                <p className="italic font-medium mt-4 border-l-4 border-amber-500 pl-4">
                    DICICOIN is not just a coin.<br />
                    It is a decision.<br />
                    It is trust.<br />
                    It is part of something being created today to make an impact tomorrow.
                </p>
            </section>
        );
    }

    if (lang === 'de') {
        return (
            <section id="dicicoin-info-de" className="space-y-4 text-justify">
                <h2 className="text-xl font-bold">Was ist DICICOIN?</h2>
                <p>
                    <strong>DICICOIN</strong> ist eine physische, limitierte und sammelbare Gedenkmünze, die als Gründungssymbol des <strong>Dicilo</strong>-Ökosystems geschaffen wurde.
                    Sie steht für frühe Beteiligung, Vision und Zugehörigkeit zu einer internationalen Plattform, die Menschen, Unternehmen und reale Chancen miteinander verbindet.
                </p>

                <p>
                    Jede DICICOIN verbindet die physische Welt mit dem digitalen Wachstum von Dicilo. Sie ist weder eine Kryptowährung noch ein klassisches Finanzprodukt,
                    sondern ein <strong>symbolischer und strategischer Sachwert</strong> in limitierter Auflage.
                </p>

                <h3 className="text-lg font-semibold mt-4">Warum eine DICICOIN besitzen?</h3>
                <p>
                    Eine DICICOIN zu besitzen bedeutet, von Anfang an dabei zu sein. Es ist eine bewusste Entscheidung, eine Vision zu unterstützen, bevor sie zum Standard wird.
                </p>

                <ul className="list-none space-y-2 pl-4">
                    <li>✔ Früher Zugang zu einem wachsenden Ökosystem</li>
                    <li>✔ Limitierte und individuell nummerierte physische Sammlermünze</li>
                    <li>✔ Bevorzugter Zugang zu definierten zukünftigen Möglichkeiten innerhalb des Dicilo-Ökosystems</li>
                    <li>✔ Symbolische Zugehörigkeit mit strategischer Perspektive</li>
                </ul>

                <h3 className="text-lg font-semibold mt-4">Wert und strukturelle Perspektive</h3>
                <p>
                    Der aktuelle Referenzwert einer DICICOIN beträgt <strong>35 €</strong>.
                    Im Rahmen der langfristigen Entwicklung von Dicilo wird für jede DICICOIN ein interner Referenzwert von bis zu <strong>25 €</strong> berücksichtigt, sobald die definierten unternehmerischen, rechtlichen und strukturellen Meilensteine erreicht sind.
                </p>

                <p>
                    Zu diesem Zeitpunkt kann DICICOIN – unter Einhaltung der jeweils geltenden rechtlichen Rahmenbedingungen – eine bevorzugte Teilnahme an definierten Umwandlungs- oder Tauschprozessen ermöglichen, beispielsweise im Zusammenhang mit einer zukünftigen Kapitalmarktstruktur.
                    Dies stellt keine Rendite- oder Wertgarantie dar, sondern eine strukturierte Zugangsmöglichkeit für frühe Unterstützer.
                </p>

                <h3 className="text-lg font-semibold mt-4">Kaufbegrenzung</h3>
                <p>
                    Um eine faire, transparente und verantwortungsvolle Verteilung zu gewährleisten, ist der Erwerb auf maximal <strong>2.000 DICICOIN</strong> pro Person begrenzt.
                </p>

                <p className="italic font-medium mt-4 border-l-4 border-amber-500 pl-4">
                    DICICOIN ist nicht nur eine Münze.<br />
                    Sie ist eine Entscheidung.<br />
                    Sie ist Vertrauen.<br />
                    Sie ist Teil von etwas, das heute entsteht, um morgen Wirkung zu entfalten.
                </p>
            </section>
        );
    }

    // Default to ES
    return (
        <section id="dicicoin-info-es" className="space-y-4 text-justify">
            <h2 className="text-xl font-bold">¿Qué es DICICOIN?</h2>
            <p>
                <strong>DICICOIN</strong> es una moneda conmemorativa física, limitada y coleccionable, creada como símbolo fundacional del ecosistema <strong>Dicilo</strong>.
                Representa la participación temprana, la visión y la pertenencia a una plataforma internacional que conecta personas, empresas y oportunidades reales.
            </p>

            <p>
                Cada DICICOIN conecta el mundo físico con el crecimiento digital de Dicilo. No es una criptomoneda ni un producto financiero clásico, sino un <strong>activo tangible simbólico y estratégico</strong> de edición limitada.
            </p>

            <h3 className="text-lg font-semibold mt-4">¿Por qué adquirir una DICICOIN?</h3>
            <p>
                Poseer una DICICOIN significa estar ahí desde el principio. Es una decisión consciente de apoyar una visión antes de que se convierta en el estándar.
            </p>

            <ul className="list-none space-y-2 pl-4">
                <li>✔ Acceso temprano a un ecosistema en crecimiento</li>
                <li>✔ Moneda de colección física limitada y numerada individualmente</li>
                <li>✔ Acceso preferente a futuras oportunidades definidas dentro del ecosistema Dicilo</li>
                <li>✔ Pertenencia simbólica con perspectiva estratégica</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">Valor y perspectiva estructural</h3>
            <p>
                El valor de referencia actual de una DICICOIN es de <strong>35 €</strong>.
                En el marco del desarrollo a largo plazo de Dicilo, se considerará un valor de referencia interno de hasta <strong>25 €</strong> por cada DICICOIN, una vez alcanzados los hitos empresariales, legales y estructurales definidos.
            </p>

            <p>
                En ese momento, DICICOIN podrá permitir —cumpliendo con el marco legal vigente— una participación preferente en procesos definidos de conversión o intercambio, por ejemplo, en relación con una futura estructura de mercado de capitales.
                Esto no representa una garantía de rendimiento o valor, sino una oportunidad de acceso estructurado para los primeros partidarios.
            </p>

            <h3 className="text-lg font-semibold mt-4">Límite por usuario</h3>
            <p>
                Para garantizar una distribución justa, transparente y responsable, la adquisición está limitada a un máximo de <strong>2.000 DICICOIN</strong> por persona.
            </p>

            <p className="italic font-medium mt-4 border-l-4 border-amber-500 pl-4">
                DICICOIN no es solo una moneda.<br />
                Es una decisión.<br />
                Es confianza.<br />
                Es parte de algo que se crea hoy para tener impacto mañana.
            </p>
        </section>
    );
};
