const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Admin SDK provided credentials are set in environment
// OR run this with `firebase functions:shell` or local emulator
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = getFirestore();

const TEMPLATES = [
    {
        id: 'referrals-general',
        category: 'referrals',
        name: 'Ahorro (General)',
        internalName: 'referrals_general',
        translations: {
            es: {
                subject: "{{Nombre del amigo}}, tengo una invitación personal para ti (Ahorro + Ingresos) 🚀",
                body: "Hola {{Nombre}}, ¡espero que estés genial! 👋<br><br>Te escribo precisamente a ti porque sé que eres una persona que valora las oportunidades inteligentes y el crecimiento.<br><br>Quiero invitarte personalmente a formar parte de Dicilo.net.<br><br>Quizás no lo has escuchado aún, pero imagina formar parte de un ecosistema digital respaldado por la solidez alemana (MHC Alemania) que está revolucionando la forma en que conectamos, compramos y generamos ingresos.<br><br>Dicilo no es solo una plataforma más; es una red de confianza creada en Hamburgo, Alemania, por un grupo de jóvenes empresarios visionarios. ¿Su misión? Empoderar al comercio real y permitirnos a nosotros, los usuarios, ganar dinero mientras apoyamos a la economía.<br><br>¿Por qué pensé en ti para esto? Porque en Dicilo tienes tres ventajas claras:<br><br>Ahorro inteligente: Accedes a ofertas exclusivas.<br><br>Ingresos reales: Puedes generar ganancias (DiciPoints y DiciCoins) recomendando o trabajando desde casa.<br><br>Seguridad: Es una comunidad seria que está creciendo muy rápido a nivel internacional.<br><br>Me encantaría que fuéramos parte de esto juntos desde el principio.<br><br>Regístrate gratis con mi pase de invitado aquí abajo y echa un vistazo a la plataforma. No tienes nada que perder y sí mucho mundo por descubrir.<br><br>👉 <a href=\"{{link}}\">Entrar a Dicilo y Empezar a Ganar</a> (Usa mi ID de invitado para acceso VIP: {{referrerCode}})<br><br>Si al entrar te surge la duda de \"¿cómo puedo sacar el máximo provecho de esto?\", escríbeme. Tengo un par de estrategias para rentabilizar la cuenta que me gustaría contarte.<br><br>Un abrazo y te veo dentro,<br><br>{{TuNombre}}"
            },
            en: {
                subject: "{{Friend's Name}}, I have a personal invitation for you (Savings + Income) 🚀",
                body: "Hello {{Nombre}}, hope you are doing great! 👋<br><br>I'm writing specifically to you because I know you value smart opportunities and growth.<br><br>I want to personally invite you to be part of Dicilo.net.<br><br>You might not have heard of it yet, but imagine being part of a digital ecosystem backed by German solidity (MHC Germany) that is revolutionizing how we connect, shop, and generate income.<br><br>Dicilo is not just another platform; it's a trusted network created in Hamburg, Germany, by a group of visionary young entrepreneurs. Their mission? To empower real commerce and allow us, the users, to earn money while supporting the economy.<br><br>Why did I think of you for this? Because in Dicilo you have three clear advantages:<br><br>Smart Savings: You access exclusive offers.<br><br>Real Income: You can generate earnings (DiciPoints and DiciCoins) by recommending or working from home.<br><br>Security: It is a serious community growing very fast internationally.<br><br>I would love for us to be part of this together from the start.<br><br>Sign up for free with my guest pass below and take a look at the platform. You have nothing to lose and a lot to discover.<br><br>👉 <a href=\"{{link}}\">Enter Dicilo and Start Earning</a> (Use my guest ID for VIP access: {{referrerCode}})<br><br>If you wonder \"how can I get the most out of this?\" upon entering, write to me. I have a couple of strategies to make the account profitable that I'd like to tell you about.<br><br>Best regards,<br><br>{{TuNombre}}"
            },
            de: {
                subject: "{{Name des Freundes}}, ich habe eine persönliche Einladung für dich (Sparen + Einkommen) 🚀",
                body: "Hallo {{Nombre}}, ich hoffe, es geht dir gut! 👋<br><br>Ich schreibe dir, weil ich weiß, dass du clevere Möglichkeiten und Wachstum schätzt.<br><br>Ich möchte dich persönlich einladen, Teil von Dicilo.net zu werden.<br><br>Vielleicht hast du noch nichts davon gehört, aber stell dir vor, Teil eines digitalen Ökosystems zu sein, das durch deutsche Solidität (MHC Deutschland) gestützt wird und die Art und Weise revolutioniert, wie wir uns vernetzen, einkaufen und Einkommen generieren.<br><br>Dicilo ist nicht nur eine weitere Plattform; es ist ein vertrauenswürdiges Netzwerk, das in Hamburg von einer Gruppe visionärer Jungunternehmer gegründet wurde. Ihre Mission? Den realen Handel stärken und uns Nutzern ermöglichen, Geld zu verdienen, während wir die Wirtschaft unterstützen.<br><br>Warum habe ich dabei an dich gedacht? Weil du bei Dicilo drei klare Vorteile hast:<br><br>Smartes Sparen: Zugang zu exklusiven Angeboten.<br><br>Reales Einkommen: Du kannst Einnahmen (DiciPoints und DiciCoins) durch Empfehlungen oder Arbeit von zu Hause aus generieren.<br><br>Sicherheit: Es ist eine seriöse Gemeinschaft, die international sehr schnell wächst.<br><br>Ich würde mich freuen, wenn wir von Anfang an gemeinsam dabei wären.<br><br>Registriere dich unten kostenlos mit meinem Gastpass und schau dir die Plattform an. Du hast nichts zu verlieren und viel zu entdecken.<br><br>👉 <a href=\"{{link}}\">Dicilo betreten und Geld verdienen</a> (Nutze meine Gast-ID für VIP-Zugang: {{referrerCode}})<br><br>Wenn du dich nach dem Eintritt fragst: \"Wie kann ich das Beste daraus machen?\", schreib mir. Ich habe ein paar Strategien, um das Konto rentabel zu machen, die ich dir gerne erzählen würde.<br><br>Viele Grüße,<br><br>{{TuNombre}}"
            }
        }
    },
    {
        id: 'referrals-business',
        category: 'referrals',
        name: 'Trabajo (Negocios)',
        internalName: 'referrals_business',
        translations: {
            es: {
                subject: "Genera ingresos extra recomendando empresas",
                body: "Hola {{Nombre}}! 👋<br><br>¿Buscas trabajar desde casa, o te interesaría generar extras desde tu PC o móvil?<br><br>En Dicilo puedes hacerlo realidad gracias a la facilidad del trabajo online; te explico.<br><br>Recomienda empresas y gana Dicipoints que luego puedes cambiar por descuentos en nuestras empresas aliadas, o recomienda las empresas donde sueles comprar y gana comisiones por la compra de publicidad que ellos hagan gracias a tu recomendación.<br><br>Dicilo es la plataforma de marketing digital de MHC Alemania. Regístrate aquí gratis para que empecemos juntos.<br><br>Dicilo es una red confiable creada en Hamburgo, Alemania, por un grupo de empresarios jóvenes para apoyar a los pequeños y medianos comerciantes y que está creciendo bastante rápido a nivel nacional e internacional.<br><br>👉 <a href=\"{{link}}\">Empezar a Ganar</a><br><br>Si no es de tu interés o tienes alguna duda, por favor házmelo saber. Gracias y espero nos hablemos pronto.<br><br>Saludos<br><br>{{TuNombre}}"
            },
            en: {
                subject: "Generate extra income by recommending businesses",
                body: "Hello {{Nombre}}! 👋<br><br>Are you looking to work from home, or interested in generating extras from your PC or mobile?<br><br>In Dicilo you can make it happen thanks to the ease of online work; let me explain.<br><br>Recommend businesses and earn Dicipoints that you can later exchange for discounts at our allied businesses, or recommend the businesses where you usually shop and earn commissions for the advertising purchases they make thanks to your recommendation.<br><br>Dicilo is the digital marketing platform of MHC Germany. Register here for free so we can start together.<br><br>Dicilo is a trusted network created in Hamburg, Germany, by a group of young entrepreneurs to support small and medium-sized merchants and is growing quite fast nationally and internationally.<br><br>👉 <a href=\"{{link}}\">Start Earning</a><br><br>If this is not of interest to you or you have any doubts, please let me know. Thanks and hope to speak soon.<br><br>Regards,<br><br>{{TuNombre}}"
            },
            de: {
                subject: "Generiere Zusatzeinkommen durch Unternehmens-Empfehlungen",
                body: "Hallo {{Nombre}}! 👋<br><br>Suchst du Arbeit von zu Hause oder möchtest du dir etwas dazuverdienen, bequem von PC oder Handy aus?<br><br>Bei Dicilo kannst du das dank der einfachen Online-Arbeit verwirklichen; lass es mich erklären.<br><br>Empfiehl Unternehmen und verdiene DicioPoints, die du später gegen Rabatte bei unseren Partnerunternehmen eintauschen kannst, oder empfiehl die Geschäfte, in denen du normalerweise einkaufst, und verdiene Provisionen für deren Werbekäufe dank deiner Empfehlung.<br><br>Dicilo ist die digitale Marketingplattform der MHC Deutschland. Registriere dich hier kostenlos, damit wir gemeinsam starten können.<br><br>Dicilo ist ein vertrauenswürdiges Netzwerk, das in Hamburg von einer Gruppe junger Unternehmer gegründet wurde, um kleine und mittlere Händler zu unterstützen, und wächst national sowie international sehr schnell.<br><br>👉 <a href=\"{{link}}\">Jetzt Geld verdienen</a><br><br>Falls kein Interesse besteht oder du Fragen hast, lass es mich bitte wissen. Danke und ich hoffe, wir hören bald voneinander.<br><br>Grüße,<br><br>{{TuNombre}}"
            }
        }
    },
    {
        id: 'referrals-crypto',
        category: 'referrals',
        name: 'Cripto (DiciPoints)',
        internalName: 'referrals_crypto',
        translations: {
            es: {
                subject: "50 DiciPoints te están esperando 🪙",
                body: "Hola {{Nombre}}, 👋<br><br>Te escribo porque sé que siempre estás buscando formas inteligentes de maximizar tus recursos y valoras estar un paso adelante.<br><br>He activado una invitación exclusiva para ti en Dicilo.net y quiero asegurarme de que la aproveches.<br><br>Imagina un ecosistema digital diferente: uno donde tu participación no genera solo \"likes\", sino valor tangible. Dicilo es una red descentralizada en plena expansión global que nos recompensa con DiciPoints y DiciCoins.<br><br>No son simples puntos; es una economía real respaldada por empresas, canjeable por productos, servicios e incluso viajes.<br><br>Quiero que entremos juntos en esto antes de que se vuelva masivo. Es el momento perfecto para posicionarse en esta economía colaborativa.<br><br>Tu acceso VIP ya tiene una recompensa de bienvenida esperando:<br><br>👉 <a href=\"{{link}}\">Reclamar mis 50 DiciPoints y Acceder</a> (Usa mi ID de invitado para asegurar el bono: {{referrerCode}})<br><br>Un consejo extra: Ya he descubierto cómo acelerar la acumulación de DiciPoins más rápido que el usuario promedio. Si te registras hoy, escríbeme y te cuento el truco. 😉<br><br>Un abrazo,<br><br>{{TuNombre}}"
            },
            en: {
                subject: "{{Nombre}}, I have reserved 50 DiciPoints for you 🪙",
                body: "Hello {{Nombre}}, 👋<br><br>I'm writing because I know you are always looking for smart ways to maximize your resources and value staying one step ahead.<br><br>I have activated an exclusive invitation for you at Dicilo.net and I want to make sure you take advantage of it.<br><br>Imagine a different digital ecosystem: one where your participation generates not just \"likes\", but tangible value. Dicilo is a decentralized network in full global expansion that rewards us with DiciPoints and DiciCoins.<br><br>They are not simple points; it is a real economy backed by businesses, redeemable for products, services, and even trips.<br><br>I want us to get into this together before it becomes massive. It is the perfect time to position oneself in this collaborative economy.<br><br>Your VIP access already has a welcome reward waiting:<br><br>👉 <a href=\"{{link}}\">Claim my 50 DiciPoints and Access</a> (Use my guest ID to secure the bonus: {{referrerCode}})<br><br>An extra tip: I have already discovered how to accelerate DiciPoints accumulation faster than the average user. If you register today, write to me and I'll tell you the trick. 😉<br><br>Best,<br><br>{{TuNombre}}"
            },
            de: {
                subject: "{{Nombre}}, ich habe 50 DiciPoints für dich reserviert 🪙",
                body: "Hallo {{Nombre}}, 👋<br><br>Ich schreibe dir, weil ich weiß, dass du immer nach smarten Wegen suchst, deine Ressourcen zu maximieren und es schätzt, einen Schritt voraus zu sein.<br><br>Ich habe eine exklusive Einladung für dich auf Dicilo.net aktiviert und möchte sicherstellen, dass du sie nutzt.<br><br>Stell dir ein anderes digitales Ökosystem vor: eines, in dem deine Teilnahme nicht nur \"Likes\", sondern greifbaren Wert generiert. Dicilo ist ein dezentrales Netzwerk in voller globaler Expansion, das uns mit DiciPoints und DiciCoins belohnt.<br><br>Es sind keine einfachen Punkte; es ist eine reale Wirtschaft, gestützt durch Unternehmen, einlösbar gegen Produkte, Dienstleistungen und sogar Reisen.<br><br>Ich möchte, dass wir gemeinsam einsteigen, bevor es massentauglich wird. Es ist der perfekte Zeitpunkt, um sich in dieser kollaborativen Wirtschaft zu positionieren.<br><br>Dein VIP-Zugang hält bereits eine Willkommensbelohnung bereit:<br><br>👉 <a href=\"{{link}}\">Meine 50 DiciPoints beanspruchen und zugreifen</a> (Nutze meine Gast-ID, um den Bonus zu sichern: {{referrerCode}})<br><br>Ein Extra-Tipp: Ich habe bereits herausgefunden, wie man die Ansammlung von DiciPoints schneller beschleunigt als der Durchschnittsnutzer. Wenn du dich heute registrierst, schreib mir und ich verrate dir den Trick. 😉<br><br>Alles Gute,<br><br>{{TuNombre}}"
            }
        }
    }
];

async function seedTemplates() {
    const batch = db.batch();
    const collectionRef = db.collection('email_templates');

    console.log(`Starting seed for ${TEMPLATES.length} templates...`);

    for (const tmpl of TEMPLATES) {
        // Construct the document to match the EmailTemplate schema
        // We will create one document per template, but the 'versions' might need to be structured if we support multiple languages in one doc.
        // The implementation plan says: versions: { [lang: string]: { subject, body } }

        // Wait, the implementation plan from task.md Step 2627:
        // interface EmailTemplate { versions: { [lang]: { subject, body } } }

        const docRef = collectionRef.doc(tmpl.id);
        const data = {
            name: tmpl.name,
            internalName: tmpl.internalName,
            category: tmpl.category,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            versions: {
                es: tmpl.translations.es,
                en: tmpl.translations.en,
                de: tmpl.translations.de
            },
            variables: ['Nombre', 'TuNombre', 'link', 'referrerCode'],
            imageUrl: '' // No header image by default
        };

        batch.set(docRef, data, { merge: true });
        console.log(`Prepared batch for: ${tmpl.internalName}`);
    }

    await batch.commit();
    console.log('✅ Successfully seeded email templates.');
}

// Check if running directly (node script)
if (require.main === module) {
    console.log('Starting seed process...');
    seedTemplates().catch(console.error);
}

module.exports = { seedTemplates };
