import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { EmailTemplate } from '@/actions/email-templates';

export async function GET() {
    try {
        const db = getAdminDb();
        const templatesCollection = db.collection('email_templates');

        const templates: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
            {
                name: "Comunidad (Pioneros)",
                category: "referrals",
                variables: ["Name", "RefCode", "Tu Nombre"],
                versions: {
                    es: {
                        subject: "{{Name}}, ayúdame con esto (nos conviene a todos) 🚀",
                        body: `Hola {{Name}}, ¿cómo va todo? 👋\n\nTe escribo porque quiero invitarte a ser parte de algo nuevo desde el minuto cero.\n\nHe empezado a usar Dicilo.net, una plataforma que acaba de nacer. La idea es brillante: crear una masa crítica de usuarios para que las empresas nos tomen en serio y nos den descuentos que no darían a clientes sueltos.\n\nEl plan es simple:\n\nSi entramos ahora y ayudamos a que la comunidad crezca, muy pronto las empresas empezarán a competir por nosotros. El objetivo es que consigamos ofertas exclusivas en cosas que de todas formas vamos a comprar (viajes, servicios, productos), pero mucho más baratas.\n\nRegístrate gratis con mi código. Seamos los primeros en posicionarnos.\n\n👉 [BOTÓN: Unirme a la Comunidad y Apoyar] (Código de pionero: {{RefCode}})\n\nEs gratis y no te compromete a nada. Simplemente, cuantos más seamos, mejor nos irá a todos. Échale un ojo.\n\nUn abrazo,\n\n{{Tu Nombre}}`
                    },
                    de: {
                        subject: "{{Name}}, lass uns das gemeinsam groß machen (Spar-Potential!) 🚀",
                        body: `Hi {{Name}}, alles fit? 👋\n\nIch schreibe dir, weil ich dich gerne von Anfang an bei einer neuen Sache dabei haben möchte.\n\nIch bin jetzt bei Dicilo.net, einer ganz neuen Plattform. Die Idee dahinter ist clever: Wir bilden eine starke Gemeinschaft von Nutzern, damit Unternehmen auf uns aufmerksam werden.\n\nDer Plan ist simpel:\n\nWenn wir jetzt beitreten und helfen, die Community aufzubauen, werden sich die Firmen bald um uns reißen. Das Ziel ist es, Rabatte für Dinge zu bekommen, die wir sowieso kaufen (Reisen, Dienstleistungen, Produkte) – aber zu Preisen, die man als Einzelner nie bekommt.\n\nMeld dich kostenlos mit meinem Code an. Lass uns zu den Ersten gehören.\n\n👉 [BUTTON: Der Community beitreten & Supporten] (Pionier-Code: {{RefCode}})\n\nEs kostet nichts und ist unverbindlich. Aber je mehr wir sind, desto mehr profitieren wir alle am Ende. Schau es dir mal an.\n\nBeste Grüße,\n\n{{Dein Name}}`
                    },
                    en: {
                        subject: "{{Name}}, help me with this (it benefits us all) 🚀",
                        body: `Hi {{Name}}, how is everything going? 👋\n\nI’m writing because I want to invite you to be part of something new from the ground floor.\n\nI’ve started using Dicilo.net, a brand-new platform. The idea is brilliant: create a critical mass of users so companies take us seriously and give us discounts they wouldn't give to individual customers.\n\nThe plan is simple: If we join now and help the community grow, companies will soon start competing for us. The goal is to get exclusive offers on things we are going to buy anyway (travel, services, products), but much cheaper.\n\nRegister for free with my code. Let’s be the first to position ourselves.\n\n👉 [BUTTON: Join the Community & Support] (Pioneer Code: {{RefCode}})\n\nIt’s free and there’s no commitment. Simply put, the more of us there are, the better it works for everyone. Check it out.\n\nBest,\n\n{{Tu Nombre}}`
                    }
                }
            },
            {
                name: "Empresas (B2B)",
                category: "referrals",
                variables: ["Name", "RefCode", "Tu Nombre"],
                versions: {
                    es: {
                        subject: "{{Name}}, propuesta de visibilidad global (Plan 2026) 🚀",
                        body: `Hola {{Name}}, ¡Comenzamos bien el año nuevo! 👋\n\nEste 2026 venimos con las pilas puestas para hacer crecer el negocio.\n\nTe escribo porque sé que siempre estás buscando formas inteligentes de captar nuevos clientes sin gastar una fortuna en publicidad.\n\nQuiero invitarte a sumar tu empresa a Dicilo.net.\n\nEs una plataforma nacida en Hamburgo, Alemania, que funciona como un puente directo entre empresas y consumidores. A diferencia de las redes sociales saturadas, aquí el público entra buscando qué comprar o contratar.\n\n¿Por qué te interesa entrar ahora?\n\n* Expansión Global: Están abriendo mercado y buscan empresas serias para posicionarlas como referentes.\n\n* Modelo "Xposting": Tu oferta llega cruzada a clientes que realmente buscan tu sector (sin el ruido de Facebook/Instagram).\n\n* Cero Riesgo: Puedes crear tu perfil de empresa y empezar a mostrar tus servicios.\n\nYo ya estoy dentro. Usa mi invitación para registrar tu negocio con estatus preferente y echa un vistazo al ecosistema.\n\n👉 [BOTÓN: Registrar mi Empresa y Ver Opciones]\n\n(Código de invitación empresarial: {{RefCode}})\n\nEl registro es gratuito y no pierdes nada por probar. Creo que es una herramienta que encaja muy bien con lo que haces.\n\nUn abrazo y mucho éxito este año,\n\n{{Tu Nombre}}`
                    },
                    de: {
                        subject: "{{Name}}, mehr Sichtbarkeit für dein Business (Start 2026) 🚀",
                        body: `Hallo {{Name}}, frohes neues Jahr! 🎆\n\nIch hoffe, du bist gut in 2026 gestartet und bereit für das nächste Level.\n\nIch schreibe dir, weil ich weiß, dass du immer nach effizienten Wegen suchst, neue Kunden zu gewinnen, ohne das Marketing-Budget zu sprengen.\n\nIch möchte dich einladen, dein Unternehmen bei Dicilo.net zu listen.\n\nDas ist eine Plattform aus Hamburg, die als direkte Brücke zwischen Unternehmen und Verbrauchern fungiert. Anders als in überfüllten sozialen Netzwerken suchen die Nutzer hier gezielt nach Angeboten und Dienstleistungen.\n\nWarum gerade jetzt einsteigen?\n\n* Globale Expansion: Sie öffnen neue Märkte und suchen seriöse Unternehmen als Partner der ersten Stunde.\n\n* "Xposting"-Prinzip: Dein Angebot wird gezielt dort angezeigt, wo Kunden wirklich suchen (kein Streuverlust).\n\n* Kein Risiko: Du kannst dein Firmenprofil erstellen und sofort Präsenz zeigen.\n\nIch bin bereits dabei. Nutze meine Einladung, um dein Business mit Vorzugsstatus zu registrieren.\n\n👉 [BUTTON: Unternehmen registrieren & Vorteile sichern]\n\n(Dein Business-Code: {{RefCode}})\n\nDie Anmeldung ist kostenlos. Schau es dir unverbindlich an – ich glaube, das passt sehr gut zu deinem Angebot.\n\nViel Erfolg für das neue Jahr!\n\nBeste Grüße,\n\n{{Dein Name}}`
                    },
                    en: {
                        subject: "{{Name}}, proposal for global visibility (2026 Plan) 🚀",
                        body: `Hi {{Name}}, Happy New Year! 👋 I hope you kicked off 2026 with full energy to grow your business.\n\nI’m writing to you because I know you’re always looking for smart ways to acquire new clients without spending a fortune on ads.\n\nI want to invite you to list your company on Dicilo.net.\n\nIt’s a platform born in Hamburg, Germany, acting as a direct bridge between businesses and consumers. Unlike saturated social media, the audience here is actually looking to buy or hire services.\n\nWhy join right now?\n\nGlobal Expansion: They are opening new markets and looking for serious companies to position as benchmarks.\n\n"Xposting" Model: Your offer reaches customers specifically looking for your sector (no noise).\n\nZero Risk: You can create your company profile and start showing your services immediately.\n\nI’m already in. Use my invitation to register your business with preferred status.\n\n👉 [BUTTON: Register my Company & See Options] (Business invitation code: {{RefCode}})\n\nRegistration is free, and you lose nothing by trying. I really think this tool fits well with what you do.\n\nBest of success for the year,\n\n{{Tu Nombre}}`
                    }
                }
            },
            {
                name: "Grupo / WhatsApp",
                category: "referrals",
                variables: ["RefCode"],
                versions: {
                    es: {
                        subject: "Propuesta para el grupo 🎁",
                        body: `Hola grupo, ¿cómo están? 👋\n\nMe paso por aquí porque les traigo una propuesta que nos beneficia a todos.\n\nMe acabo de inscribir gratis en Dicilo.net. Es una plataforma de recomendación de productos y servicios que está creciendo rapidísimo y pinta para ser una de las más grandes del planeta.\n\nLo genial es que todos podemos ganar dinero con ella simplemente recomendando lo que nos gusta.\n\n🎁 El registro es gratis, súper fácil y te regalan 5€ (en puntos) de bienvenida para gastar en las tiendas aliadas.\n\nAdemás... 👇 Como la plataforma es nueva, están buscando gente como nosotros para posicionarse. Si entramos ahora y hacemos "fuerza de grupo", podemos asegurar beneficios vitalicios antes de que se vuelva masiva y todo el mundo esté dentro.\n\nLes dejo mi enlace para que cobren los 5€ de entrada: 👉 [Enlace de Registro] (Código: {{RefCode}})\n\n¡Aprovechen que es el momento justo! 🚀`
                    },
                    de: {
                        subject: "Vorschlag für die Gruppe 🎁",
                        body: `Hallo in die Runde! 👋\n\nIch schreibe euch kurz, weil ich etwas gefunden habe, wovon wir alle profitieren können.\n\nIch habe mich gerade kostenlos bei Dicilo.net angemeldet. Das ist eine Empfehlungsplattform, die gerade extrem schnell wächst und auf dem Weg ist, eine der größten weltweit zu werden.\n\nDas Beste daran: Jeder von uns kann damit Geld verdienen, einfach durch Empfehlungen.\n\n🎁 Die Anmeldung ist kostenlos, super einfach und es gibt 5€ Startguthaben (in Punkten), die man direkt bei Partner-Shops einlösen kann.\n\nAußerdem... 👇 Da die Plattform noch neu ist, haben wir jetzt die Chance, von Anfang an dabei zu sein. Wenn wir uns jetzt als Gruppe anmelden, sichern wir uns Vorteile, bevor es jeder kennt und der Markt voll ist.\n\nHier ist mein Link, um die 5€ Willkommens-Bonus zu sichern: 👉 [Registrierungs-Link] (Code: {{RefCode}})\n\nLohnt sich wirklich, schaut es euch an! 🚀`
                    },
                    en: {
                        subject: "Proposal for the group 🎁",
                        body: `Hey everyone! 👋\n\nI’m sharing this because I found something that benefits all of us.\n\nI just signed up for free at Dicilo.net. It’s a product and service recommendation platform that is growing incredibly fast and promises to become one of the biggest on the planet.\n\nThe cool thing is that we can all earn money with it, just by recommending things.\n\n🎁 Registration is free, super easy, and they give you 5€ (in credits) just for joining, to spend at partner stores.\n\nPlus... 👇 Since the platform is new, this is the perfect time to get in. If we join now as a group and help build the momentum, we can lock in early-adopter benefits before it goes mainstream and everyone else joins.\n\nHere is my link so you can grab your free 5€ bonus: 👉 [Registration Link] (Code: {{RefCode}})\n\nLet's get in early on this! 🚀`
                    }
                }
            },
            {
                name: "Freelancer / Socio",
                category: "referrals",
                variables: ["Name", "RefCode", "Tu Nombre"],
                versions: {
                    es: {
                        subject: "{{Name}}, propuesta para trabajar juntos (Freelance desde casa) 📱",
                        body: `Hola {{Name}}, ¿cómo vas? 👋\n\nTe escribo directo al grano porque sé que eres una persona emprendedora y esta oportunidad te va a interesar.\n\nEstoy colaborando con Dicilo.net y me he dado cuenta de que hay una forma muy real de generar ingresos extra sin horarios fijos. Quiero invitarte a ser Freelancer / Representante de la marca.\n\nTienes dos formas de ganar dinero (en efectivo, no solo puntos) usando solo tu móvil:\n\nMarketing Social: Te pagan por cada campaña que compartes en tus redes. Simple: difundes, cobras.\n\nRepresentante Comercial (La más rentable): Si conectas a empresas que quieran publicitarse en Dicilo, te quedas con el 20% de la venta neta.\n\nPiénsalo: trabajar desde la comodidad de tu casa o desde el móvil en tus ratos libres.\n\nCada centavo cuenta, y tener un flujo de ingresos adicional hoy en día es la estrategia más inteligente. En lugar de solo "estar" en redes sociales, haz que te paguen por ello.\n\nRegístrate con mi enlace, activa tu perfil y empecemos a facturar.\n\n👉 [BOTÓN: Convertirme en Freelancer Dicilo] (Código de socio: {{RefCode}})\n\nSi tienes dudas de cómo vender a empresas, avísame. Yo te explico cómo lo hago.\n\nUn abrazo,\n\n{{Tu Nombre}}`
                    },
                    de: {
                        subject: "{{Name}}, Nebenverdienst mit dem Handy? (20% Provision!) 📱",
                        body: `Hi {{Name}}, alles gut bei dir? 👋\n\nIch schreibe dir direkt, weil ich weiß, dass du unternehmerisch denkst und diese Chance für dich spannend sein könnte.\n\nIch arbeite gerade mit Dicilo.net zusammen und habe einen Weg gefunden, flexibel Geld zu verdienen. Ich möchte dich einladen, als Freelancer / Repräsentant einzusteigen.\n\nDu hast zwei Möglichkeiten, mit deinem Smartphone Geld (Cash, nicht nur Punkte) zu verdienen:\n\nSocial Marketing: Du wirst für jede Kampagne bezahlt, die du in deinen Netzwerken teilst. Teilen, kassieren.\n\nHandelsvertreter (Sehr lukrativ): Wenn du Unternehmen findest, die auf Dicilo werben möchten, behältst du 20% des Nettoverkaufs als Provision.\n\nÜberleg mal: Arbeiten bequem von zu Hause oder von unterwegs.\n\nJeder Cent zählt, und eine zusätzliche Einnahmequelle ist heutzutage einfach smart. Anstatt nur Zeit in sozialen Netzwerken zu verbringen, lass dich dafür bezahlen.\n\nMeld dich über meinen Link an, aktiviere dein Profil und lass uns starten.\n\n👉 [BUTTON: Dicilo-Freelancer werden] (Partner-Code: {{RefCode}})\n\nWenn du Fragen hast, wie man Firmen anspricht, sag Bescheid. Ich zeig dir, wie ich das mache.\n\nBeste Grüße,\n\n{{Dein Name}}`
                    },
                    en: {
                        subject: "{{Name}}, turn your phone into a money maker (Freelance Gig) 📱",
                        body: `Hi {{Name}}, how are things? 👋\n\nI’m writing to you directly because I know you have an entrepreneurial mindset and this opportunity is right up your alley.\n\nI’m collaborating with Dicilo.net and found a real way to generate extra income without fixed hours. I want to invite you to become a Freelancer / Brand Representative.\n\nThere are two ways to earn cash (not just points) using just your mobile:\n\nSocial Marketing: You get paid for every campaign you share on your networks. Post, earn.\n\nSales Representative (High Profit): If you connect companies that want to advertise on Dicilo, you keep 20% of the net sale as commission.\n\nThink about it: working from the comfort of your home or from your mobile in your spare time.\n\nEvery cent counts, and having an additional income stream these days is the smartest strategy. Instead of just "scrolling" on social media, get paid for it.\n\nRegister with my link, activate your profile, and let's start earning.\n\n👉 [BUTTON: Become a Dicilo Freelancer] (Partner Code: {{RefCode}})\n\nIf you have questions about how to approach companies, let me know. I'll show you how I do it.\n\nBest,\n\n{{Tu Nombre}}`
                    }
                }
            },
            // LEGACY TEMPLATES RESTORED
            {
                name: "Ahorro (General)",
                category: "referrals",
                variables: ["Nombre", "RefCode", "Tu Nombre"],
                versions: {
                    es: {
                        subject: "{{Nombre}}, te guardé esta invitación (Ahorro + $$) 🚀",
                        body: "Hola {{Nombre}}, ¿cómo va todo? 👋\n\nMe acordé de ti porque sé que tienes buen ojo para las oportunidades y no te gusta tirar el dinero.\n\nTe invito a entrar en Dicilo.net. Es una plataforma alemana (de Hamburgo, gente seria) que está cambiando las reglas: no solo ahorras comprando, sino que ganas dinero real por recomendar y conectar empresas.\n\nTe paso mi pase VIP gratis para que entres ya.\n\nTienen un sistema de puntos (DiciPoints) que vale la pena mirar. Entra, regístrate y echa un ojo. 👀\n\n👉 [BOTÓN: Ver Dicilo y Aceptar Invitación] (Se activará con mi código: {{RefCode}})\n\nPD: Si te registras, escríbeme por WhatsApp. Ya descubrí un par de trucos para sumar puntos más rápido y quiero contártelos para que arranques con ventaja. 😉\n\nUn abrazo,\n\n{{Tu Nombre}}"
                    },
                    en: {
                        subject: "{{Name}}, I saved this invitation for you (Savings + $$) 🚀",
                        body: "Hi {{Name}}, how is everything going? 👋\n\nI thought of you because I know you have an eye for opportunities and don't like throwing money away.\n\nI invite you to join Dicilo.net. It's a German platform (from Hamburg, serious people) that is changing the rules: not only do you save by buying, but you earn real money by recommending and connecting businesses.\n\nHere is my free VIP pass for you to enter now.\n\nThey have a points system (DiciPoints) that is worth looking at. Come in, register and take a look. 👀\n\n👉 [BUTTON: View Dicilo and Accept Invitation] (It will activate with my code: {{RefCode}})\n\nPS: If you register, text me on WhatsApp. I already discovered a couple of tricks to earn points faster and I want to tell you so you start with an advantage. 😉\n\nBig hug,\n\n{{Your Name}}"
                    },
                    de: {
                        subject: "{{Name}}, ich habe diese Einladung für dich aufgehoben (Sparen + $$) 🚀",
                        body: "Hallo {{Name}}, wie läuft's? 👋\n\nIch musste an dich denken, weil ich weiß, dass du ein Auge für Chancen hast und kein Geld verschwenden magst.\n\nIch lade dich ein, Dicilo.net beizutreten. Es ist eine deutsche Plattform (aus Hamburg, seriöse Leute), die die Regeln ändert: Du sparst nicht nur beim Einkaufen, sondern verdienst echtes Geld durch Empfehlen und Vernetzen von Unternehmen.\n\nHier ist mein kostenloser VIP-Pass für dich, damit du sofort starten kannst.\n\nSie haben ein Punktesystem (DiciPoints), das einen Blick wert ist. Komm rein, registriere dich und schau es dir an. 👀\n\n👉 [BUTTON: Dicilo ansehen und Einladung annehmen] (Wird aktiviert mit meinem Code: {{RefCode}})\n\nPS: Wenn du dich registriert hast, schreib mir auf WhatsApp. Ich habe schon ein paar Tricks entdeckt, um schneller Punkte zu sammeln, und möchte sie dir verraten, damit du mit einem Vorteil startest. 😉\n\nViele Grüße,\n\n{{Dein Name}}"
                    }
                }
            },
            {
                name: "Trabajo (Negocios)",
                category: "referrals",
                variables: ["Nombre"],
                versions: {
                    es: {
                        subject: "Genera ingresos extra recomendando empresas",
                        body: "Hola [Nombre]! 👋\n\n¿Buscas trabajar desde casa, o te interesaría generar extras desde tu PC o móvil?\n\nEn Dicilo puedes hacerlo realidad gracias a la facilidad del trabajo online; te explico.\n\nRecomienda empresas y gana Dicipoints que luego puedes cambiar por descuentos en nuestras empresas aliadas, o recomienda las empresas donde sueles comprar y gana comisiones por la compra de publicidad que ellos hagan gracias a tu recomendación.\n\nDicilo es la plataforma de marketing digital de MHC Alemania. Regístrate aquí gratis para que empecemos juntos.\n\nDicilo es una red confiable creada en Hamburgo, Alemania, por un grupo de empresarios jóvenes para apoyar a los pequeños y medianos comerciantes y que está creciendo bastante rápido a nivel nacional e internacional.\n\n[BOTÓN: Empezar a Ganar]\n\nSi no es de tu interés o tienes alguna duda, por favor házmelo saber. Gracias y espero nos hablemos pronto.\nSaludos\n[Tu Nombre]"
                    },
                    en: {
                        subject: "Generate extra income by recommending businesses",
                        body: "Hello [Nombre]! 👋\n\nAre you looking to work from home, or interested in generating extras from your PC or mobile?\n\nIn Dicilo you can make it happen thanks to the ease of online work; let me explain.\n\nRecommend businesses and earn Dicipoints that you can later exchange for discounts at our allied businesses, or recommend the businesses where you usually shop and earn commissions for the advertising purchases they make thanks to your recommendation.\n\nDicilo is the digital marketing platform of MHC Germany. Register here for free so we can start together.\n\nDicilo is a trusted network created in Hamburg, Germany, by a group of young entrepreneurs to support small and medium-sized merchants and is growing quite fast nationally and internationally.\n\n[BUTTON: Start Earning]\n\nIf this is not of interest to you or you have any doubts, please let me know. Thanks and hope to speak soon.\nRegards,\n[Tu Nombre]"
                    },
                    de: {
                        subject: "Generiere Zusatzeinkommen durch Unternehmens-Empfehlungen",
                        body: "Hallo [Nombre]! 👋\n\nSuchst du Arbeit von zu Hause oder möchtest du dir etwas dazuverdienen, bequem von PC oder Handy aus?\n\nBei Dicilo kannst du das dank der einfachen Online-Arbeit verwirklichen; lass es mich erklären.\n\nEmpfiehl Unternehmen und verdiene DicioPoints, die du später gegen Rabatte bei unseren Partnerunternehmen eintauschen kannst, oder empfiehl die Geschäfte, in denen du normalerweise einkaufst, und verdiene Provisionen für deren Werbekäufe dank deiner Empfehlung.\n\nDicilo ist die digitale Marketingplattform der MHC Deutschland. Registriere dich hier kostenlos, damit wir gemeinsam starten können.\n\nDicilo ist ein vertrauenswürdiges Netzwerk, das in Hamburg von einer Gruppe junger Unternehmer gegründet wurde, um kleine und mittlere Händler zu unterstützen, und wächst national sowie international sehr schnell.\n\n[BUTTON: Jetzt Geld verdienen]\n\nFalls kein Interesse besteht oder du Fragen hast, lass es mich bitte wissen. Danke und ich hoffe, wir hören bald voneinander.\nGrüße,\n[Tu Nombre]"
                    }
                }
            },
            {
                name: "Cripto (DiciPoints)",
                category: "referrals",
                variables: ["Nombre", "RefCode", "Tu Nombre"],
                versions: {
                    es: {
                        subject: "{{Nombre}}, te guardé esta invitación (Ahorro + €€) 🚀",
                        body: "Hola {{Nombre}}, ¿todo bien? 👋\n\nMe acordé de ti porque sé que tienes buen ojo para las oportunidades y no te gusta tirar el dinero.\n\nTe invito a Dicilo.net. Es una plataforma de aquí de Alemania (de Hamburgo, gente seria) que está cambiando las reglas: No solo ahorras al comprar, sino que ganas dinero real (DiciPoints) recomendando empresas.\n\nAquí tienes mi pase VIP gratis para ti.\n\nEl sistema de puntos vale mucho la pena. Regístrate y échale un vistazo. 👀\n\n👉 [BOTÓN: Ver Dicilo y Aceptar Invitación] (Tu bono se activa con mi código: {{RefCode}})\n\nP.D.: Cuando te registres, escríbeme por WhatsApp. Ya averigüé cómo sumar puntos más rápido y te cuento el truco encantado. 😉\n\nSaludos,\n\n{{Tu Nombre}}"
                    },
                    en: {
                        subject: "{{Name}}, I saved this invitation for you (Savings + €€) 🚀",
                        body: "Hi {{Name}}, everything good? 👋\n\nI thought of you because I know you have an eye for good opportunities and hate wasting money.\n\nI invite you to Dicilo.net. It is a platform from here in Germany (from Hamburg, serious stuff) that is changing the rules: You not only save when shopping but earn real money (DiciPoints) by recommending businesses.\n\nHere is my free VIP pass for you.\n\nThe point system is really worth it. Sign up and take a look. 👀\n\n👉 [BUTTON: View Dicilo & Accept Invitation] (Your bonus is activated with my code: {{RefCode}})\n\nPS: Once you are registered, drop me a message on WhatsApp. I found out how to collect points faster and would love to tell you the trick. 😉\n\nBest regards,\n\n{{Your Name}}"
                    },
                    de: {
                        subject: "{{Name}}, ich habe diese Einladung für dich reserviert (Sparen + €€) 🚀",
                        body: "Hallo {{Name}}, alles klar bei dir? 👋\n\nIch musste an dich denken, weil ich weiß, dass du ein Händchen für gute Gelegenheiten hast und ungern Geld verschwendest.\n\nIch lade dich zu Dicilo.net ein. Das ist eine Plattform hier aus Deutschland (aus Hamburg, seriöse Sache), die die Regeln ändert: Du sparst nicht nur beim Einkaufen, sondern verdienst echtes Geld (DiciPoints), indem du Unternehmen empfiehlst.\n\nHier ist mein kostenloser VIP-Pass für dich.\n\nDas Punktesystem lohnt sich wirklich. Melde dich an und schau es dir an. 👀\n\n👉 [BUTTON: Dicilo ansehen & Einladung annehmen] (Dein Bonus wird mit meinem Code aktiviert: {{RefCode}})\n\nP.S.: Wenn du angemeldet bist, schreib mir kurz bei WhatsApp. Ich habe schon herausgefunden, wie man die Punkte schneller sammelt, und verrate dir den Trick gerne. 😉\n\nViele Grüße,\n\n{{Dein Name}}"
                    }
                }
            }
        ];

        const batch = db.batch();

        // Strategy: We will query for existing templates by Name to avoid duplicates, 
        // or just add them. For simplicity in this one-off, we will add them. 
        // If duplicates concern allows, we could check. 
        // But user wants THESE templates. 
        // Let's check if they exist by name first.

        for (const tpl of templates) {
            const snapshot = await templatesCollection.where('name', '==', tpl.name).where('category', '==', 'referrals').get();
            if (snapshot.empty) {
                const docRef = templatesCollection.doc();
                batch.set(docRef, {
                    ...tpl,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            } else {
                // Update existing
                snapshot.forEach(doc => {
                    batch.update(doc.ref, {
                        ...tpl,
                        updatedAt: new Date().toISOString()
                    });
                });
            }
        }

        await batch.commit();

        return NextResponse.json({ success: true, message: "Templates seeded/updated successfully." });
    } catch (error: any) {
        console.error("Seeding error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
