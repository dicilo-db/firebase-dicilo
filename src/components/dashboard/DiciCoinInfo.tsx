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
                    <strong>DICICOIN</strong> is a physical, commemorative, and collectible coin created as the founding symbol of the <strong>Dicilo</strong> ecosystem.
                    It represents early participation, vision, and belonging to an international platform designed to connect people, businesses, and real opportunities.
                </p>

                <p>
                    Each DICICOIN bridges the physical world with Dicilo’s digital growth.
                    It is not a cryptocurrency nor a traditional financial product, but a <strong>symbolic and strategic physical asset</strong> issued in limited, serialized editions.
                </p>

                <h3 className="text-lg font-semibold mt-4">Why own a DICICOIN?</h3>
                <p>
                    Owning a DICICOIN means being there from the beginning.
                    It means making a conscious decision to support a vision before it becomes mainstream.
                </p>

                <ul className="list-none space-y-2 pl-4">
                    <li>✔ Early access to a growing ecosystem</li>
                    <li>✔ Limited and numbered physical collectible</li>
                    <li>✔ Direct connection to Dicilo’s future growth</li>
                    <li>✔ Symbolic ownership with strategic perspective</li>
                </ul>

                <h3 className="text-lg font-semibold mt-4">Value and assurance</h3>
                <p>
                    The current reference value of one DICICOIN is <strong>€30</strong>.
                    Each coin carries a <strong>guaranteed base value of €25</strong>, which will be considered when Dicilo reaches its defined corporate, legal, and structural milestones.
                </p>

                <p>
                    At that stage, and under the appropriate legal frameworks, DICICOIN may enable
                    <strong>conversion or exchange processes into company equity</strong>.
                    This does not represent a promise of financial return, but rather a <strong>preferential access opportunity</strong> for early supporters.
                </p>

                <h3 className="text-lg font-semibold mt-4">Purchase limit</h3>
                <p>
                    To ensure fair and responsible distribution, each user may acquire a maximum of
                    <strong>2,000 DICICOIN</strong>.
                </p>

                <p className="italic font-medium mt-4 border-l-4 border-amber-500 pl-4">
                    DICICOIN is not just a coin.<br />
                    It is a choice.<br />
                    It is commitment.<br />
                    It is being part of what is being built today to shape tomorrow.
                </p>
            </section>
        );
    }

    if (lang === 'de') {
        return (
            <section id="dicicoin-info-de" className="space-y-4 text-justify">
                <h2 className="text-xl font-bold">Was ist DICICOIN?</h2>
                <p>
                    <strong>DICICOIN</strong> ist eine physische, limitierte und sammelbare Gedenkmünze,
                    die als Gründungssymbol des <strong>Dicilo</strong>-Ökosystems geschaffen wurde.
                    Sie steht für frühe Beteiligung, Vision und Zugehörigkeit zu einer internationalen Plattform,
                    die Menschen, Unternehmen und reale Chancen miteinander verbindet.
                </p>

                <p>
                    Jede DICICOIN verbindet die physische Welt mit dem digitalen Wachstum von Dicilo.
                    Sie ist weder eine Kryptowährung noch ein klassisches Finanzprodukt,
                    sondern ein <strong>symbolischer und strategischer Sachwert</strong> in limitierter Auflage.
                </p>

                <h3 className="text-lg font-semibold mt-4">Warum eine DICICOIN besitzen?</h3>
                <p>
                    Eine DICICOIN zu besitzen bedeutet, von Anfang an dabei zu sein.
                    Es ist eine bewusste Entscheidung, eine Vision zu unterstützen,
                    bevor sie zum Standard wird.
                </p>

                <ul className="list-none space-y-2 pl-4">
                    <li>✔ Früher Zugang zu einem wachsenden Ökosystem</li>
                    <li>✔ Limitierte und nummerierte physische Sammlermünze</li>
                    <li>✔ Direkte Verbindung zum zukünftigen Wachstum von Dicilo</li>
                    <li>✔ Symbolische Zugehörigkeit mit strategischer Perspektive</li>
                </ul>

                <h3 className="text-lg font-semibold mt-4">Wert und Absicherung</h3>
                <p>
                    Der aktuelle Referenzwert einer DICICOIN beträgt <strong>30 €</strong>.
                    Jede Münze verfügt über einen <strong>garantierten Basiswert von 25 €</strong>,
                    der berücksichtigt wird, sobald Dicilo die definierten unternehmerischen,
                    rechtlichen und strukturellen Meilensteine erreicht.
                </p>

                <p>
                    Zu diesem Zeitpunkt können DICICOIN – unter Einhaltung der geltenden rechtlichen Rahmenbedingungen –
                    Prozesse zur <strong>Umwandlung oder zum Tausch in Unternehmensanteile</strong> ermöglichen.
                    Dies stellt keine Renditegarantie dar, sondern eine <strong>bevorzugte Zugangsmöglichkeit</strong> für frühe Unterstützer.
                </p>

                <h3 className="text-lg font-semibold mt-4">Kaufbegrenzung</h3>
                <p>
                    Um eine faire und verantwortungsvolle Verteilung zu gewährleisten,
                    kann jede Person maximal <strong>2.000 DICICOIN</strong> erwerben.
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
                <strong>DICICOIN</strong> es una moneda física, conmemorativa y coleccionable creada como el símbolo fundacional del ecosistema <strong>Dicilo</strong>.
                Representa pertenencia, visión y participación temprana en una plataforma internacional diseñada para conectar personas, empresas y oportunidades reales.
            </p>

            <p>
                Cada DICICOIN es una pieza tangible que une el mundo físico con el crecimiento digital de Dicilo.
                No es una criptomoneda ni un producto financiero tradicional, sino un <strong>activo simbólico y estratégico</strong> emitido en ediciones limitadas y numeradas.
            </p>

            <h3 className="text-lg font-semibold mt-4">¿Por qué adquirir una DICICOIN?</h3>
            <p>
                Poseer una DICICOIN significa formar parte del inicio. Significa haber tomado una decisión consciente:
                apoyar una visión antes de que se convierta en estándar.
            </p>

            <ul className="list-none space-y-2 pl-4">
                <li>✔ Acceso temprano a un ecosistema en expansión</li>
                <li>✔ Moneda física coleccionable, limitada y numerada</li>
                <li>✔ Vínculo directo con el crecimiento futuro de Dicilo</li>
                <li>✔ Participación simbólica con proyección estratégica</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">Valor y garantía de la DICICOIN</h3>
            <p>
                El valor de referencia actual de una DICICOIN es de <strong>30 €</strong>.
                No obstante, cada moneda cuenta con un <strong>valor base garantizado de 25 €</strong> que será considerado en el momento en que Dicilo alcance los hitos corporativos, legales y estructurales definidos.
            </p>

            <p>
                En ese momento, y bajo los marcos legales correspondientes, las DICICOIN podrán habilitar procesos de <strong>conversión o canje por participación accionaria</strong> dentro de la compañía.
                Esto no constituye una promesa de rentabilidad, sino una <strong>opción preferente</strong> para quienes creyeron desde el inicio.
            </p>

            <h3 className="text-lg font-semibold mt-4">Límite por usuario</h3>
            <p>
                Para garantizar una distribución justa y responsable, cada usuario puede adquirir un máximo de
                <strong>2.000 DICICOIN</strong>.
            </p>

            <p className="italic font-medium mt-4 border-l-4 border-amber-500 pl-4">
                DICICOIN no es solo una moneda.<br />
                Es una decisión.<br />
                Es presencia.<br />
                Es formar parte de algo que se está construyendo hoy para definir el mañana.
            </p>
        </section>
    );
};
