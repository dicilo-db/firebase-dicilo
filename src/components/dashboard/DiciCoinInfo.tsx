import React from 'react';
import { useTranslation } from 'react-i18next';

export const DiciCoinInfo = () => {
    const { i18n } = useTranslation();
    const lang = i18n.language.split('-')[0]; // 'es', 'en', 'de'

    if (lang === 'en') {
        return (
            <section id="dicicoin-info-en" className="space-y-6 text-justify">
                <h2 className="text-2xl font-bold text-slate-900 border-b pb-2">Value, Scarcity, and Future Vision</h2>
                
                <p className="leading-relaxed">
                    <strong>DICICOIN</strong> has been conceived as a physical commemorative, limited, and collectible coin that represents early participation within the international <strong>Dicilo</strong> ecosystem.
                </p>
                <p className="leading-relaxed">
                    Each DICICOIN symbolizes vision, commitment, and belonging to a global community working to connect people, businesses, and opportunities through technology, trust, and collaboration.
                </p>

                <h3 className="text-lg font-bold text-slate-800 mt-6">A Limited Worldwide Minting</h3>
                <p className="leading-relaxed">
                    The total minting of DICICOIN is permanently limited to:
                </p>
                <p className="text-center py-3 bg-amber-50 rounded-lg border border-amber-200">
                    <strong className="text-amber-800 text-xl">10,000,000 coins worldwide.</strong>
                </p>
                <p className="leading-relaxed">
                    No additional DICICOINs will be minted once this quantity is reached.
                </p>
                <p className="leading-relaxed">
                    To ensure a balanced distribution among regions, the minting has been divided equally among the five participating continents:
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                    <li><strong>America:</strong> 2,000,000 DICICOIN</li>
                    <li><strong>Europe:</strong> 2,000,000 DICICOIN</li>
                    <li><strong>Asia:</strong> 2,000,000 DICICOIN</li>
                    <li><strong>Africa:</strong> 2,000,000 DICICOIN</li>
                    <li><strong>Oceania:</strong> 2,000,000 DICICOIN</li>
                </ul>
                <p className="leading-relaxed">
                    This structure ensures that no continent has an advantage over another in terms of initial availability.
                </p>
                <p className="leading-relaxed">
                    Each coin issued reduces the amount available within its corresponding continent, progressively strengthening the exclusivity of the remaining issues.
                </p>

                <h3 className="text-lg font-bold text-slate-800 mt-6">Authenticity and Protection</h3>
                <p className="leading-relaxed">
                    Each DICICOIN incorporates multiple authentication and security mechanisms:
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>Unique and unrepeatable serial number.</li>
                    <li>Certificate of ownership.</li>
                    <li>Official owner registry.</li>
                    <li>Digital authentication signature.</li>
                    <li>Physical and digital verification systems.</li>
                    <li>Exclusive identification elements linked to each issue.</li>
                </ul>
                <p className="leading-relaxed">
                    No two DICICOINs are identical. Each coin possesses its own identity within the Dicilo ecosystem.
                </p>

                <h3 className="text-lg font-bold text-slate-800 mt-6">Reference Value</h3>
                <p className="leading-relaxed">
                    The current emission value of a DICICOIN is <strong>€5,000</strong>.
                </p>
                <p className="leading-relaxed">
                    As availability decreases and the Dicilo ecosystem continues to grow, future available issues may be offered at higher values determined by the company, in accordance with the project&apos;s evolution, existing demand, and the remaining availability within each continent.
                </p>
                <p className="leading-relaxed">
                    The acquisition of a DICICOIN represents access to a limited edition that cannot be expanded once the allocated stock is exhausted.
                </p>

                <h3 className="text-lg font-bold text-slate-800 mt-6">Early Participation</h3>
                <p className="leading-relaxed">
                    DICICOINs have been created to recognize those who decide to be part of the project from its early stages.
                </p>
                <p className="leading-relaxed">
                    In the future, and always subject to compliance with applicable corporate, legal, and regulatory requirements, the company may enable specific processes for participation, conversion, or exchange for registered DICICOIN holders.
                </p>
                <p className="leading-relaxed">
                    Any future mechanism will be officially communicated and will be subject to the conditions in force at the time of its implementation.
                </p>

                <h3 className="text-lg font-bold text-slate-800 mt-6">More than a Coin</h3>
                <p className="leading-relaxed">
                    DICICOIN does not only represent a physical collector&apos;s piece.
                </p>
                <p className="leading-relaxed italic pl-4 border-l-4 border-amber-500 text-slate-700">
                    It represents the decision to participate from the beginning.<br />
                    It represents trust in a global vision.<br />
                    It represents the opportunity to be part of a limited international community.<br />
                    It represents a piece of Dicilo&apos;s founding history.
                </p>
                <p className="leading-relaxed font-bold text-center text-slate-800 pt-2">
                    Only 10,000,000 will ever exist. Not one more. Not one less.
                </p>
                <p className="leading-relaxed">
                    And each one will have a story, an owner, and a place within the growth of the Dicilo ecosystem.
                </p>
            </section>
        );
    }

    if (lang === 'de') {
        return (
            <section id="dicicoin-info-de" className="space-y-6 text-justify">
                <h2 className="text-2xl font-bold text-slate-900 border-b pb-2">Wert, Knappheit und Zukunftsvision</h2>
                
                <p className="leading-relaxed">
                    <strong>DICICOIN</strong> wurde als physische, limitierte Gedenk- und Sammlermünze konzipiert, die die frühe Beteiligung am internationalen <strong>Dicilo</strong>-Ökosystem repräsentiert.
                </p>
                <p className="leading-relaxed">
                    Jede DICICOIN symbolisiert Vision, Engagement und Zugehörigkeit zu einer globalen Gemeinschaft, die daran arbeitet, Menschen, Unternehmen und Chancen durch Technologie, Vertrauen und Zusammenarbeit zu verbinden.
                </p>

                <h3 className="text-lg font-bold text-slate-800 mt-6">Eine weltweit begrenzte Auflage</h3>
                <p className="leading-relaxed">
                    Die Gesamtauflage von DICICOIN ist dauerhaft begrenzt auf:
                </p>
                <p className="text-center py-3 bg-amber-50 rounded-lg border border-amber-200">
                    <strong className="text-amber-800 text-xl">10.000.000 Münzen weltweit.</strong>
                </p>
                <p className="leading-relaxed">
                    Nach Erreichen dieser Menge werden keine weiteren DICICOINs mehr geprägt.
                </p>
                <p className="leading-relaxed">
                    Um eine ausgewogene Verteilung zwischen den Regionen zu gewährleisten, wurde die Auflage gleichmäßig auf die fünf teilnehmenden Kontinente aufgeteilt:
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                    <li><strong>Amerika:</strong> 2.000.000 DICICOIN</li>
                    <li><strong>Europa:</strong> 2.000.000 DICICOIN</li>
                    <li><strong>Asien:</strong> 2.000.000 DICICOIN</li>
                    <li><strong>Afrika:</strong> 2.000.000 DICICOIN</li>
                    <li><strong>Ozeanien:</strong> 2.000.000 DICICOIN</li>
                </ul>
                <p className="leading-relaxed">
                    Diese Struktur stellt sicher, dass kein Kontinent hinsichtlich der anfänglichen Verfügbarkeit Vorteile gegenüber einem anderen hat.
                </p>
                <p className="leading-relaxed">
                    Jede ausgegebene Münze verringert die in ihrem jeweiligen Kontinent verfügbare Menge und stärkt so schrittweise die Exklusivität der verbleibenden Ausgaben.
                </p>

                <h3 className="text-lg font-bold text-slate-800 mt-6">Authentizität und Schutz</h3>
                <p className="leading-relaxed">
                    Jede DICICOIN enthält mehrere Authentifizierungs- und Sicherheitsmechanismen:
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>Einzigartige und unwiderrufliche Seriennummer.</li>
                    <li>Eigentumszertifikat.</li>
                    <li>Offizielles Eigentümerregister.</li>
                    <li>Digitale Authentifizierungssignatur.</li>
                    <li>Physische und digitale Verifizierungssysteme.</li>
                    <li>Exklusive Identifikationselemente, die an jede Ausgabe gebunden sind.</li>
                </ul>
                <p className="leading-relaxed">
                    Es gibt keine zwei identischen DICICOINs. Jede Münze besitzt eine eigene Identität innerhalb des Dicilo-Ökosystems.
                </p>

                <h3 className="text-lg font-bold text-slate-800 mt-6">Referenzwert</h3>
                <p className="leading-relaxed">
                    Der aktuelle Ausgabewert einer DICICOIN beträgt <strong>5.000 €</strong>.
                </p>
                <p className="leading-relaxed">
                    Da die Verfügbarkeit abnimmt und das Dicilo-Ökosystem weiter wächst, können zukünftige Ausgaben zu höheren Werten angeboten werden, die von der Gesellschaft festgelegt werden – entsprechend der Entwicklung des Projekts, der bestehenden Nachfrage und der verbleibenden Verfügbarkeit auf dem jeweiligen Kontinent.
                </p>
                <p className="leading-relaxed">
                    Der Erwerb einer DICICOIN stellt den Zugang zu einer limitierten Auflage dar, die nach Erschöpfung des zugewiesenen Bestands nicht mehr erweitert werden kann.
                </p>

                <h3 className="text-lg font-bold text-slate-800 mt-6">Frühe Beteiligung</h3>
                <p className="leading-relaxed">
                    Die DICICOINs wurden geschaffen, um diejenigen anzuerkennen, die sich entscheiden, von der Anfangsphase an Teil des Projekts zu sein.
                </p>
                <p className="leading-relaxed">
                    In der Zukunft und stets unter Einhaltung der geltenden gesellschaftsrechtlichen, gesetzlichen und regulatorischen Anforderungen kann das Unternehmen registrierten DICICOIN-Inhabern spezifische Prozesse zur Beteiligung, Umwandlung oder zum Umtausch ermöglichen.
                </p>
                <p className="leading-relaxed">
                    Jeder zukünftige Mechanismus wird offiziell kommuniziert und unterliegt den zum Zeitpunkt der Implementierung geltenden Bedingungen.
                </p>

                <h3 className="text-lg font-bold text-slate-800 mt-6">Mehr als eine Münze</h3>
                <p className="leading-relaxed">
                    DICICOIN repräsentiert nicht nur ein physisches Sammlerstück.
                </p>
                <p className="leading-relaxed italic pl-4 border-l-4 border-amber-500 text-slate-700">
                    Sie steht für die Entscheidung, von Anfang an dabei zu sein.<br />
                    Sie steht für das Vertrauen in eine globale Vision.<br />
                    Sie steht für die Möglichkeit, Teil einer begrenzten internationalen Gemeinschaft zu sein.<br />
                    Sie steht für ein Stück der Gründungsgeschichte von Dicilo.
                </p>
                <p className="leading-relaxed font-bold text-center text-slate-800 pt-2">
                    Es wird nur 10.000.000 geben. Keine einzige mehr. Keine einzige weniger.
                </p>
                <p className="leading-relaxed">
                    Und jede einzelne wird eine Geschichte, einen Eigentümer und einen Platz im Wachstum des Dicilo-Ökosystems haben.
                </p>
            </section>
        );
    }

    // Default to ES
    return (
        <section id="dicicoin-info-es" className="space-y-6 text-justify">
            <h2 className="text-2xl font-bold text-slate-900 border-b pb-2">Valor, Escasez y Visión de Futuro</h2>
            
            <p className="leading-relaxed">
                <strong>DICICOIN</strong> ha sido concebida como una moneda física conmemorativa, limitada y coleccionable que representa la participación temprana dentro del ecosistema internacional <strong>Dicilo</strong>.
            </p>
            <p className="leading-relaxed">
                Cada DICICOIN simboliza visión, compromiso y pertenencia a una comunidad global que trabaja para conectar personas, empresas y oportunidades a través de la tecnología, la confianza y la colaboración.
            </p>

            <h3 className="text-lg font-bold text-slate-800 mt-6">Una Emisión Mundial Limitada</h3>
            <p className="leading-relaxed">
                La emisión total de DICICOIN está limitada de forma permanente a:
            </p>
            <p className="text-center py-3 bg-amber-50 rounded-lg border border-amber-200">
                <strong className="text-amber-800 text-xl">10.000.000 de monedas en todo el mundo.</strong>
            </p>
            <p className="leading-relaxed">
                No se emitirán DICICOIN adicionales una vez alcanzada esta cantidad.
            </p>
            <p className="leading-relaxed">
                Para garantizar una distribución equilibrada entre regiones, la emisión ha sido dividida de manera equitativa entre los cinco continentes participantes:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-1">
                <li><strong>América:</strong> 2.000.000 DICICOIN</li>
                <li><strong>Europa:</strong> 2.000.000 DICICOIN</li>
                <li><strong>Asia:</strong> 2.000.000 DICICOIN</li>
                <li><strong>África:</strong> 2.000.000 DICICOIN</li>
                <li><strong>Oceanía:</strong> 2.000.000 DICICOIN</li>
            </ul>
            <p className="leading-relaxed">
                Esta estructura garantiza que ningún continente tenga ventajas sobre otro en términos de disponibilidad inicial.
            </p>
            <p className="leading-relaxed">
                Cada moneda emitida reduce la cantidad disponible dentro de su continente correspondiente, fortaleciendo progresivamente la exclusividad de las emisiones restantes.
            </p>

            <h3 className="text-lg font-bold text-slate-800 mt-6">Autenticidad y Protección</h3>
            <p className="leading-relaxed">
                Cada DICICOIN incorpora múltiples mecanismos de autenticación y seguridad:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-1">
                <li>Número de serie único e irrepetible.</li>
                <li>Certificado de titularidad.</li>
                <li>Registro oficial del propietario.</li>
                <li>Firma digital de autenticación.</li>
                <li>Sistemas de verificación física y digital.</li>
                <li>Elementos exclusivos de identificación vinculados a cada emisión.</li>
            </ul>
            <p className="leading-relaxed">
                No existen dos DICICOIN idénticas. Cada moneda posee una identidad propia dentro del ecosistema Dicilo.
            </p>

            <h3 className="text-lg font-bold text-slate-800 mt-6">Valor de Referencia</h3>
            <p className="leading-relaxed">
                El valor actual de emisión de una DICICOIN es de <strong>5.000 €</strong>.
            </p>
            <p className="leading-relaxed">
                A medida que la disponibilidad disminuya y el ecosistema Dicilo continúe creciendo, futuras emisiones disponibles podrán ofrecerse a valores superiores determinados por la compañía, de acuerdo con la evolución del proyecto, la demanda existente y la disponibilidad restante dentro de cada continente.
            </p>
            <p className="leading-relaxed">
                La adquisición de una DICICOIN representa el acceso a una edición limitada que no podrá ampliarse una vez agotadas las existencias asignadas.
            </p>

            <h3 className="text-lg font-bold text-slate-800 mt-6">Participación Temprana</h3>
            <p className="leading-relaxed">
                Las DICICOIN han sido creadas para reconocer a quienes deciden formar parte del proyecto desde sus etapas iniciales.
            </p>
            <p className="leading-relaxed">
                En el futuro, y siempre bajo el cumplimiento de los requisitos corporativos, legales y regulatorios aplicables, la compañía podrá habilitar procesos específicos de participación, conversión o intercambio para los titulares registrados de DICICOIN.
            </p>
            <p className="leading-relaxed">
                Cualquier mecanismo futuro será comunicado oficialmente y estará sujeto a las condiciones vigentes en el momento de su implementación.
            </p>

            <h3 className="text-lg font-bold text-slate-800 mt-6">Más que una Moneda</h3>
            <p className="leading-relaxed">
                DICICOIN no representa únicamente una pieza física de colección.
            </p>
            <p className="leading-relaxed italic pl-4 border-l-4 border-amber-500 text-slate-700">
                Representa la decisión de participar desde el principio.<br />
                Representa la confianza en una visión global.<br />
                Representa la oportunidad de formar parte de una comunidad internacional limitada.<br />
                Representa una pieza de la historia fundacional de Dicilo.
            </p>
            <p className="leading-relaxed font-bold text-center text-slate-800 pt-2">
                Solo existirán 10.000.000. Ni una más. Ni una menos.
            </p>
            <p className="leading-relaxed">
                Y cada una tendrá una historia, un propietario y un lugar dentro del crecimiento del ecosistema Dicilo.
            </p>
        </section>
    );
};
