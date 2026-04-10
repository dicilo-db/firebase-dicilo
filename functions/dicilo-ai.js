const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Si admin ya está inicializado en otro lugar, esto podría causar error si se corre en el mismo proceso.
// Verificamos si ya hay apps inicializadas.
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();

// ===========================================
// HELPERS
// ===========================================

/**
 * Normaliza un texto para mejorar la coincidencia:
 * - Convierte a minúsculas
 * - Elimina acentos/diacríticos
 * - Elimina espacios extra
 */
function normalizarTexto(texto) {
    if (!texto) return '';
    return texto
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .trim();
}

/**
 * Calcula una similitud básica entre dos textos.
 * (Métrica simple de palabras compartidas para demostración).
 * @param {string} query - Consulta del usuario
 * @param {string} target - Texto objetivo (pregunta FAQ)
 * @returns {number} Score de 0 a 1
 */
function calcularSimilitudBasica(query, target) {
    const qNorm = normalizarTexto(query);
    const tNorm = normalizarTexto(target);

    if (!qNorm || !tNorm) return 0;

    const wordsQ = qNorm.split(/\s+/);
    const wordsT = tNorm.split(/\s+/);

    let matchCount = 0;
    wordsQ.forEach(w => {
        if (wordsT.includes(w)) matchCount++;
    });

    // Score basado en cuántas palabras de la query están en el target
    const score = matchCount / Math.max(wordsQ.length, wordsT.length);
    return score;
}

/**
 * Construye el objeto de respuesta resumido para una empresa
 */
function buildEmpresaResponse(docEmpresa) {
    const data = docEmpresa.data();
    const isLanding = data.tipo_registro === 'landing';
    const hasReviews = data.tiene_resenas === true;
    const reviewCount = data.total_resenas || 0;
    const rating = data.rating_promedio || 0;

    let recomendacion = "Empresa registrada en DICILO con información básica. No se dispone de reseñas internas para emitir una recomendación.";

    // REGLA DE RECOMENDACIÓN
    const esRecomendable = isLanding && hasReviews && reviewCount > 0;

    if (esRecomendable) {
        recomendacion = `Empresa con landing page en DICILO y reseñas internas disponibles. rating_promedio: ${rating}, total_resenas: ${reviewCount}.`;
    }

    return {
        id: docEmpresa.id,
        nombre_empresa: data.nombre_empresa || 'Sin nombre',
        categoria: data.categoria || 'Varios',
        ciudad: data.ciudad || '',
        pais: data.pais || '',
        tipo_registro: data.tipo_registro || 'basico',
        landing_page_url: data.landing_page_url || null,
        tiene_resenas: hasReviews,
        rating_promedio: rating,
        total_resenas: reviewCount,
        resumen_recomendacion: recomendacion,
        _esRecomendable: esRecomendable // Flag interno
    };
}

// ===========================================
// FUNCIÓN 1: BUSCAR EMPRESAS
// ===========================================
/**
 * Busca empresas aplicando filtros estrictos.
 * Entrada: { ciudad, pais, categoria, subcategorias, idioma, rango_precios, tags, limite }
 */
exports.searchEmpresas = functions.https.onCall(async (data, context) => {
    try {
        const {
            ciudad,
            pais,
            categoria,
            subcategorias,
            idioma,
            rango_precios,
            tags,
            limite = 10
        } = data;

        let query = db.collection('empresas').where('estado', '==', 'Activa');

        if (ciudad) query = query.where('ciudad', '==', ciudad);
        if (pais) query = query.where('pais', '==', pais);
        if (categoria) query = query.where('categoria', '==', categoria);
        if (rango_precios) query = query.where('rango_precios', '==', rango_precios);

        // Limitación de Firestore: solo un operador 'array-contains' o 'array-contains-any' por query.
        // Priorizamos idioma si viene, sino tags, sino subcategorias.
        // Si se necesitan múltiples filtros de array, se debe filtrar en memoria.
        let memoryFilter = {};

        if (idioma) {
            query = query.where('idiomas_atencion', 'array-contains', idioma);
        } else if (tags && tags.length > 0) {
            query = query.where('tags', 'array-contains-any', tags);
        } else if (subcategorias && subcategorias.length > 0) {
            // Nota: array-contains-any funciona con lista de valores potenciales
            query = query.where('subcategorias', 'array-contains-any', subcategorias);
        }

        // Ejecutamos query básica
        const snapshot = await query.limit(limite + 5).get(); // Pedimos un poco más para filtrar en memoria

        let resultados = snapshot.docs.map(doc => buildEmpresaResponse(doc));

        // Filtrado en memoria para condiciones que Firestore no pudo manejar combinadas
        // (Por ejemplo si pedimos idioma Y tags, Firestore solo filtró por idioma)
        if (idioma && tags && tags.length > 0) {
            // Ya filtramos por idioma en query, filtramos tags en memoria
            resultados = resultados.filter(e => {
                // Recuperamos doc completo para chequear arrays originales si no están en la respuesta simplificada
                const raw = snapshot.docs.find(d => d.id === e.id).data();
                return tags.some(t => raw.tags && raw.tags.includes(t));
            });
        }

        // Aplicar límite final
        resultados = resultados.slice(0, limite);

        return {
            success: true,
            empresas: resultados,
            meta: {
                total: resultados.length,
                filtros_aplicados: { ciudad, pais, categoria, idioma }
            }
        };

    } catch (error) {
        console.error("Error en searchEmpresas:", error);
        return { success: false, error: error.message };
    }
});


// ===========================================
// FUNCIÓN 2: FAQ MATCH
// ===========================================
/**
 * Busca la FAQ más similar semánticamente (por ahora keyword básico).
 * Entrada: { query: string }
 */
exports.matchFaq = functions.https.onCall(async (data, context) => {
    try {
        const { query: userQuery } = data;
        if (!userQuery) return { success: false, message: "Query vacía" };

        // LEER TODAS LAS FAQ (Ojo: optimizar en producción, cachear o usar motor de búsqueda)
        const faqSnapshot = await db.collection('faq_dicilo').get();
        if (faqSnapshot.empty) {
            return { success: false, message: "No hay base de conocimiento FAQ" };
        }

        let bestMatch = null;
        let maxScore = -1;

        faqSnapshot.forEach(doc => {
            const faq = doc.data();
            const score = calcularSimilitudBasica(userQuery, faq.pregunta);

            if (score > maxScore) {
                maxScore = score;
                bestMatch = { id: doc.id, ...faq, _score: score };
            }
        });

        // Umbral mínimo de similitud (ej. 0.1 para keywords)
        // En producción con embeddings, este umbral sería diferente.
        const UMBRAL_MINIMO = 0.1;

        if (bestMatch && maxScore >= UMBRAL_MINIMO) {
            return {
                success: true,
                found: true,
                faq: {
                    id: bestMatch.id,
                    pregunta: bestMatch.pregunta,
                    respuesta: bestMatch.respuesta,
                    categoria: bestMatch.categoria
                },
                score: maxScore
            };
        } else {
            return {
                success: true,
                found: false,
                message: "No se encontró FAQ con suficiente similitud"
            };
        }

    } catch (error) {
        console.error("Error en matchFaq:", error);
        return { success: false, error: error.message };
    }
});


// ===========================================
// FUNCIÓN 3: RECOMENDAR EMPRESAS
// ===========================================
/**
 * Orquesta la búsqueda y separa en "Recomendables" vs "Básicas".
 * Entrada: Mismos filtros que searchEmpresas.
 */
exports.recommendEmpresas = functions.https.onCall(async (data, context) => {
    try {
        // Reutilizamos la lógica de búsqueda. 
        // En un entorno modular, llamaríamos a la función interna, pero aquí duplicamos la query o llamamos a self si fuera HTTP
        // Para simplicidad, invocamos la misma lógica de query aquí.

        // 1. Ejecutar búsqueda (copia de lógica searchEmpresas para tener acceso a los mismos datos)
        // (Idealmente refactorizar la lógica de query a una función JS pura compartida `findEmpresasInternal`)

        const {
            ciudad,
            pais,
            categoria,
            subcategorias,
            idioma,
            rango_precios,
            tags,
            limite = 20 // Límite más alto para tener opciones
        } = data;

        let query = db.collection('empresas').where('estado', '==', 'Activa');

        if (ciudad) query = query.where('ciudad', '==', ciudad);
        if (pais) query = query.where('pais', '==', pais);
        if (categoria) query = query.where('categoria', '==', categoria);
        if (rango_precios) query = query.where('rango_precios', '==', rango_precios);

        if (idioma) {
            query = query.where('idiomas_atencion', 'array-contains', idioma);
        } else if (tags && tags.length > 0) {
            query = query.where('tags', 'array-contains-any', tags);
        }

        const snapshot = await query.limit(limite).get();
        let todas = snapshot.docs.map(doc => buildEmpresaResponse(doc));

        // Filtros memoria adicionales si hicieran falta

        // 2. Clasificar los resultados
        const recomendables = todas.filter(e => e._esRecomendable);
        const basicas = todas.filter(e => !e._esRecomendable);

        // Limpiar flag interno antes de enviar
        recomendables.forEach(e => delete e._esRecomendable);
        basicas.forEach(e => delete e._esRecomendable);

        return {
            success: true,
            recomendables: recomendables,
            basicas: basicas,
            meta: {
                total_recomendables: recomendables.length,
                total_basicas: basicas.length
            }
        };

    } catch (error) {
        console.error("Error en recommendEmpresas:", error);
        return { success: false, error: error.message };
    }
});
