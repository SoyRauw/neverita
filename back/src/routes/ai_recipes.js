import express from 'express';
import { db } from '../db.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const router = express.Router();

// ==========================================
// PASO 1: SUGERIR (El Menú)
// ==========================================
router.post('/suggest', async (req, res) => {
    try {
        const { ingredients } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!ingredients || ingredients.length === 0) return res.status(400).json({ error: "Faltan ingredientes" });
        if (!apiKey) return res.status(500).json({ error: "Falta API KEY" });

        console.log('🔍 Buscando ideas con:', ingredients);

        const systemPrompt = `
            Eres un Chef experto en "Cocina de Aprovechamiento".
            Tienes EXCLUSIVAMENTE estos ingredientes en la nevera: ${ingredients.join(', ')}.
            (El único básico que siempre está disponible es agua para cocción. Nada más.)

            REGLA PRINCIPAL: NUNCA rechaces ni devuelvas errores por "ingredientes insuficientes"
            ni por que falte alguna categoría (proteína, vegetal, carbohidrato, etc.).
            SIEMPRE debes proponer recetas usando lo que haya disponible, aunque sea simple
            (ej: solo arroz, solo huevos, solo pasta, solo vegetales). Improvisa lo mejor posible.

            Usa SOLO los ingredientes listados (más agua y, si hace falta, sal/condimentos básicos).
            NO inventes ingredientes que el usuario no tiene.

            Sugiere exactamente 3 recetas razonables con lo disponible:
            { "suggestions": [{ "title": "Nombre del Plato", "description": "Descripción corta de 10 palabras" }, ...] }

            Responde SOLO JSON, sin markdown ni explicaciones.
        `;


        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite",
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(systemPrompt);
        const content = JSON.parse(result.response.text());
        res.json(content);

    } catch (error) {
        console.error('❌ Error en suggest:', error);
        res.status(500).json({ error: "Error al sugerir recetas" });
    }
});

// ==========================================
// PASO 0.5: INFO DEL INGREDIENTE (días duración, categoría, unidad)
// ==========================================
router.post('/ingredient-info', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ error: 'Falta el nombre del ingrediente.' });

        const apiKey = process.env.GEMINI_API_KEY;

        const prompt = `
            Eres un experto en conservación de alimentos.
            Para el ingrediente "${name.trim()}", responde SOLO con este JSON (sin markdown, sin explicaciones):
            {
                "average_expiry_days": <número entero de días que dura típicamente en la nevera o despensa>,
                "category": "<una de: vegetal, fruta, proteína, lácteo, grano, condimento, grasa, bebida, otro>",
                "unit": "<una de: g, ml, cup, cucharada grande, cucharada pequeña, unidad>"
            }
            IMPORTANTE: Nunca uses "kg" ni "l", usa siempre su equivalente en "g" o "ml".
            Ejemplos: pollo=4, arroz=365, leche=7, mantequilla=30, sal=730, zanahoria=21, huevo=21.
        `;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite",
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(prompt);
        const data = JSON.parse(result.response.text());

        // Validar y sanear
        const validCategories = ['vegetal', 'fruta', 'proteína', 'lácteo', 'grano', 'condimento', 'grasa', 'bebida', 'otro'];
        const validUnits = ['g', 'ml', 'cup', 'cucharada grande', 'cucharada pequeña', 'unidad'];

        res.json({
            average_expiry_days: Math.max(1, Math.round(Number(data.average_expiry_days) || 7)),
            category: validCategories.includes(data.category) ? data.category : 'otro',
            unit: validUnits.includes(data.unit) ? data.unit : 'unidad',
        });

    } catch (error) {
        console.error('❌ Error en ingredient-info:', error);
        // Fallback silencioso para no bloquear al usuario
        res.json({ average_expiry_days: 7, category: 'otro', unit: 'unidad' });
    }
});


// ==========================================
// PASO 2: COCINAR / GENERAR (La Receta)
// ==========================================
router.post('/generate', async (req, res) => {
    const { selected_title, family_id } = req.body;
    // La receta SIEMPRE se genera para 1 persona. El escalado ocurre en el frontend al planificar.
    if (!selected_title) return res.status(400).json({ error: "Falta título" });
    const available_ingredients = Array.isArray(req.body.available_ingredients) ? req.body.available_ingredients : [];

    let connection;
    try {
        connection = await db.getConnection();

        console.log("🍳 Usuario eligió:", selected_title);

        // --- A. VERIFICAR SI YA EXISTE EN BD (solo si servings = 1) ---
        // Recetas antiguas generadas con porciones para varias personas se regeneran.
        const [existing] = await connection.query('SELECT * FROM recipes WHERE title = ? LIMIT 1', [selected_title]);

        if (existing.length > 0 && existing[0].servings === 1) {
            console.log('⚡ ¡Receta encontrada en caché (BD) con 1 porción! (Bypass temporal por corrección de prompt)');
            /*
            const [dbIngredients] = await connection.query(`
                SELECT i.name, ri.quantity, i.unit 
                FROM ingredients i JOIN recipe_ingredients ri ON i.ingredient_id = ri.ingredient_id
                WHERE ri.recipe_id = ?`, [existing[0].recipe_id]);

            if (family_id) {
                await connection.query(
                    'INSERT IGNORE INTO family_recipes (family_id, recipe_id) VALUES (?, ?)',
                    [family_id, existing[0].recipe_id]
                );
            }

            connection.release();
            return res.json({
                source: "database",
                recipe: existing[0],
                ingredients: dbIngredients
            });
            */
        }

        if (existing.length > 0 && existing[0].servings !== 1) {
            console.log('🔄 Receta en caché tiene', existing[0].servings, 'porciones → regenerando para 1 persona...');
        }

        // --- B. NO EXISTE -> GENERAR CON IA ---
        console.log("🤖 Receta nueva. Generando con IA...");
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta GEMINI_API_KEY en el servidor.' });

        const systemPrompt = `
            Genera la receta completa para: "${selected_title}".

            =============================================================
            REGLA #1 — PORCIONES PARA 1 PERSONA (MÁXIMOS ABSOLUTOS):
            La receta es para UNA sola persona. Estos son los límites máximos
            que NO PUEDES superar bajo ninguna circunstancia:

              • Carnes (pollo, cerdo, res, pescado): MÁXIMO 200 g o 1 unidad
              • Arroz, pasta, cereales (crudos): MÁXIMO 80 g
              • Legumbres crudas (caraotas, lentejas, arvejas): MÁXIMO 80 g
              • Huevos: MÁXIMO 2 unidades
              • Papa, yuca u otros almidones: MÁXIMO 150 g o 1-2 unidades
              • Verduras / vegetales: MÁXIMO 150 g o 1-2 unidades
              • Aceite, mantequilla, grasa: MÁXIMO 1 cucharada grande
              • Leche o líquidos de cocina: MÁXIMO 200 ml
              • Sal, pimienta, especias: MÁXIMO 1 cucharada pequeña
              • Agua para cocción: MÁXIMO 400 ml

            ESTA ES UNA APLICACIÓN ANTI-DESPERDICIO. Usa cantidades justas.
            Si el resultado de escalar x4 parece una comida familiar, reducíla.
            El campo "servings" del JSON DEBE ser 1.
            =============================================================

            REGLA #2 — USA SOLO LO QUE ESTÁ EN EL INVENTARIO Y MANTÉN LA UNIDAD:
            El usuario tiene estos ingredientes (las cantidades totales en su nevera y su UNIDAD DE MEDIDA están entre paréntesis):
            [ ${available_ingredients.join(', ')} ]
            ⚠️ CRÍTICO: NO puedes usar NINGÚN ingrediente que no esté en esa lista.
            NO asumas que el usuario tiene sal, aceite, especias, condimentos, pimienta ni ningún otro
            ingrediente que no aparezca EXPLÍCITAMENTE arriba.
            La ÚNICA excepción es el agua (para cocción), que siempre está disponible.
            Solo usa lo que está en la lista. Si un ingrediente no está, no lo uses.
            
            ⚠️ IMPORTANTE PARA EL SABOR: Si el usuario TIENE sal, aceite, especias o condimentos en su lista de inventario, ASEGÚRATE de incluirlos en la receta para darle buen sabor. ¡No hagas recetas desabridas si el usuario tiene con qué sazonar!

            ⚠️ CRÍTICO SOBRE UNIDADES DE MEDIDA Y CANTIDADES MÁXIMAS DISPONIBLES:
            DEBES mantener EXACTAMENTE la misma unidad de medida que se indica entre paréntesis para cada ingrediente.
            NUNCA EXCEDAS LA CANTIDAD DISPONIBLE. La cantidad en tu receta DEBE SER MENOR O IGUAL a la cantidad entre paréntesis.
            Si el inventario dice "Harina de trigo (1 g)", NO PUEDES usar 80 g. Tu máximo absoluto es 1 g. Si 1 g no sirve para la receta, usa un sustituto o improvisa, pero NUNCA inventes que el usuario tiene más de lo que indica su inventario.
            NUNCA uses "g" si el inventario dice "unidad", ni viceversa. Las cantidades deben reflejar la unidad elegida.
            
            Además, si el usuario tiene mucha cantidad (ej. 2000 g), NO USES TODA LA CANTIDAD.
            Ese es su INVENTARIO TOTAL. Tú solo debes tomar la porción necesaria para 1 SOLA PERSONA,
            siguiendo los límites de la REGLA #1, y asegurando SIEMPRE que la cantidad a usar <= cantidad en inventario.
            =============================================================

            REGLA #3 — SIEMPRE GENERA, NUNCA RECHACES:
            Genera SIEMPRE la receta solicitada usando los ingredientes disponibles
            (más agua y condimentos básicos si hace falta). NUNCA devuelvas rechazos ni errores
            por que falte una proteína, un vegetal, un carbohidrato o cualquier otra categoría.
            Aunque los ingredientes sean simples (solo arroz, solo huevos, solo pasta, etc.),
            improvisa la mejor receta posible y razonable con lo que hay. No inventes ingredientes
            que el usuario no tiene.
            Ejemplos válidos (aunque simples): Huevos solos = huevos revueltos; Arroz solo = arroz blanco salteado;
            Pasta sola = pasta al ajillo con lo disponible; Pan + jamón = sándwich.
            =============================================================

            *** EJEMPLO DE CÓMO HACERLO BIEN ***
            Si el inventario dice: "Arroz (2000 g), Chuleta de cerdo (1000 g), Huevo (12 unidad), Papa (5 unidad)"
            MAL (cantidades muy altas o cambiando la unidad a gramos cuando el usuario tiene unidades): Arroz (400 g), Chuleta (600 g), Huevo (4 unidad), Papa (300 g)
            BIEN (cantidades para 1 persona, y respetando las unidades exactas): Arroz (80 g), Chuleta (150 g), Huevo (1 unidad), Papa (1 unidad)
            =============================================================

            Responde SOLO JSON:
            {
                "recipe": { 
                    "title": "${selected_title}", 
                    "description": "...", 
                    "instructions": "1. Haz esto...\\n2. Luego esto...\\n3. Finalmente esto...", 
                    "difficulty": "easy", 
                    "preparation_time": 30, 
                    "servings": 1, 
                    "calories_per_serving": 400,
                    "recommended_meal": "almuerzo"
                },
                "ingredients": [
                    { 
                        "name": "Azúcar", 
                        "quantity": 15, 
                        "unit": "g", 
                        "category": "condimento", 
                        "average_expiry_days": 730,
                        "measure_qty": 1,
                        "measure_unit": "cucharada grande"
                    }
                ]
            }
            IMPORTANTE: "difficulty" único en: "easy", "regular", "hard".
            IMPORTANTE: "unit" único en: "g", "kg", "ml", "l", "unidad".
            IMPORTANTE: "category" único en: "vegetal", "fruta", "proteína", "lácteo", "grano", "condimento", "grasa", "bebida", "otro".
            IMPORTANTE: "average_expiry_days" entero positivo (pollo=5, arroz=365, leche=7, sal=730).
            IMPORTANTE: "recommended_meal" único en: "desayuno", "almuerzo", "cena", "cualquiera". Determina en qué momento del día se recomienda consumir esta receta.
            IMPORTANTE SOBRE UNIDADES CULINARIAS (measure_qty y measure_unit): 
            El usuario quiere que a la hora de cocinar se le indique la cantidad en medidas prácticas (cucharadas, tazas, pizca, etc.), pero que el descuento del inventario sea en gramos/ml.
            Si el ingrediente se mide mejor en cucharadas o tazas al cocinar (ej. sal, aceite, azúcar, arroz), incluye "measure_qty" (número) y "measure_unit" (texto como "cucharada pequeña", "taza", "pizca").
            La cantidad (quantity) y unidad (unit) principal DEBEN seguir siendo la base en "g", "ml" o "unidad" según el inventario.
            Ejemplo para sal: quantity: 10, unit: "g", measure_qty: 1, measure_unit: "cucharada pequeña".
            Si no aplica medida culinaria (ej. "1 unidad de Pollo"), omite measure_qty y measure_unit o déjalos nulos.
            
            IMPORTANTE: En "instructions", usa saltos de línea (\\n\\n) para separar los pasos visualmente. No escribas todo en un solo bloque de texto.
            IMPORTANTE SOBRE LAS INSTRUCCIONES: Los pasos de la receta (instructions) NO DEBEN incluir cantidades exactas (no digas "Corta 150g de papa" ni "Bate 2 huevos"). En su lugar, nombra los ingredientes de forma genérica (ej: "Corta la papa", "Bate los huevos"). Esto es VITAL porque las recetas son escalables y el texto con cantidades fijas confundirá al usuario cuando cocine para más personas.
        `;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite",
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(systemPrompt);
        const aiData = JSON.parse(result.response.text());

        // Nota: ya NO bloqueamos por "rechazo" de la IA. Siempre intentamos generar
        // la receta con lo disponible; el aviso de balance nutricional (no bloqueante)
        // se maneja en el frontend.

        // --- NORMALIZAR UNIDADES (seguridad extra) ---
        const validUnits = ['g', 'kg', 'ml', 'l', 'unidad'];
        const unitMap = {
            'gramos': 'g', 'gramo': 'g', 'gr': 'g',
            'kilogramos': 'kg', 'kilogramo': 'kg', 'kilo': 'kg', 'kilos': 'kg',
            'mililitros': 'ml', 'mililitro': 'ml',
            'litros': 'l', 'litro': 'l',
            'unidades': 'unidad', 'u': 'unidad', 'pieza': 'unidad', 'piezas': 'unidad', 'ud': 'unidad',
        };
        // --- NORMALIZAR CATEGORÍAS (seguridad extra) ---
        const validCategories = ['vegetal', 'fruta', 'proteína', 'lácteo', 'grano', 'condimento', 'grasa', 'bebida', 'otro'];
        const categoryMap = {
            'vegetales': 'vegetal', 'verdura': 'vegetal', 'verduras': 'vegetal', 'hortaliza': 'vegetal',
            'frutas': 'fruta',
            'proteina': 'proteína', 'proteínas': 'proteína', 'carne': 'proteína', 'carnes': 'proteína', 'pescado': 'proteína',
            'lacteo': 'lácteo', 'lácteos': 'lácteo', 'lacteos': 'lácteo', 'dairy': 'lácteo',
            'granos': 'grano', 'cereal': 'grano', 'cereales': 'grano', 'carbohidrato': 'grano',
            'condimentos': 'condimento', 'especia': 'condimento', 'especias': 'condimento', 'sazón': 'condimento', 'sazon': 'condimento',
            'grasas': 'grasa', 'aceite': 'grasa', 'aceites': 'grasa',
            'bebidas': 'bebida', 'líquido': 'bebida', 'liquido': 'bebida',
            'otros': 'otro',
        };

        if (aiData.ingredients) {
            for (const ing of aiData.ingredients) {
                // Normalizar unidad
                const rawUnit = (ing.unit || 'unidad').toLowerCase().trim();
                ing.unit = validUnits.includes(rawUnit) ? rawUnit : (unitMap[rawUnit] || 'unidad');

                // Normalizar categoría
                const rawCat = (ing.category || 'otro').toLowerCase().trim();
                ing.category = validCategories.includes(rawCat) ? rawCat : (categoryMap[rawCat] || 'otro');

                // Normalizar average_expiry_days (debe ser un entero positivo)
                ing.average_expiry_days = Math.max(1, Math.round(Number(ing.average_expiry_days) || 7));
            }
        }

        // Sanitizar difficulty: solo aceptar valores válidos del ENUM
        const validDifficulties = ['easy', 'regular', 'hard'];
        const rawDiff = (aiData.recipe.difficulty || 'regular').toLowerCase();
        const difficulty = validDifficulties.includes(rawDiff) ? rawDiff : 'regular';

        // --- B.5 OBTENER IMAGEN CON SERPAPI (Google Images) ---
        // Se hace ANTES de abrir la transacción para no retener una conexión del
        // pool durante una llamada HTTP externa (lenta).
        let imageUrl = 'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=400'; // Fallback por defecto

        const serpApiKey = process.env.SERPAPI_KEY;

        if (serpApiKey) {
            try {
                console.log(`📸 Buscando imagen en Google Images para: ${aiData.recipe.title}`);
                const query = encodeURIComponent(`${aiData.recipe.title} receta -tiktok -instagram -facebook`);
                const serpUrl = `https://serpapi.com/search.json?engine=google_images&q=${query}&num=1&api_key=${serpApiKey}`;

                const serpResponse = await fetch(serpUrl);
                const serpData = await serpResponse.json();

                if (serpData.images_results && serpData.images_results.length > 0) {
                    imageUrl = serpData.images_results[0].original;
                    console.log(`✅ Imagen encontrada: ${imageUrl}`);
                } else {
                    console.log('⚠️ No se encontraron imágenes, usando fallback.');
                }
            } catch (err) {
                console.error("❌ Error conectando con SerpAPI:", err.message);
            }
        } else {
            console.log('⚠️ Falta SERPAPI_KEY. Usando imagen genérica.');
        }

        // Sanitizar recommended_meal
        const validMeals = ['desayuno', 'almuerzo', 'cena', 'cualquiera'];
        const rawMeal = (aiData.recipe.recommended_meal || 'cualquiera').toLowerCase();
        const recommendedMeal = validMeals.includes(rawMeal) ? rawMeal : 'cualquiera';

        // --- C. GUARDAR EN BD (transacción) ---
        await connection.beginTransaction();

        // 1. Guardar Receta
        const validFamilyId = family_id || 1;
        const [resReceta] = await connection.query(
            `INSERT INTO recipes (title, description, instructions, difficulty, preparation_time, servings, calories_per_serving, recommended_meal, created_by, family_id, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
            [aiData.recipe.title, aiData.recipe.description, aiData.recipe.instructions, difficulty, aiData.recipe.preparation_time, aiData.recipe.servings, aiData.recipe.calories_per_serving, recommendedMeal, validFamilyId, imageUrl]
        );
        const recipeId = resReceta.insertId;
        
        // 1.b Guardar relación con familia
        await connection.query(
            'INSERT IGNORE INTO family_recipes (family_id, recipe_id) VALUES (?, ?)',
            [validFamilyId, recipeId]
        );

        // 2. Guardar Ingredientes (LÓGICA ANTI-DUPLICADOS MEJORADA)
        if (aiData.ingredients) {
            for (const ing of aiData.ingredients) {
                // Limpieza: quitamos espacios
                let rawName = ing.name.trim();

                // Búsqueda insensible a mayúsculas (Case Insensitive)
                const [existIng] = await connection.query(
                    'SELECT ingredient_id, name FROM ingredients WHERE LOWER(name) = LOWER(?) LIMIT 1',
                    [rawName]
                );

                let ingId;

                if (existIng.length > 0) {
                    // YA EXISTE: Usamos el ID original (ej: 97 para "Papas")
                    console.log(`✅ Reutilizando ingrediente: "${existIng[0].name}" (ID: ${existIng[0].ingredient_id})`);
                    ingId = existIng[0].ingredient_id;
                } else {
                    // NO EXISTE: Lo creamos capitalizado
                    const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
                    console.log(`✨ Creando nuevo ingrediente: "${formattedName}"`);

                    const [newIng] = await connection.query(
                        'INSERT INTO ingredients (name, unit, category, average_expiry_days) VALUES (?, ?, ?, ?)',
                        [formattedName, ing.unit || 'unidad', ing.category || 'otro', ing.average_expiry_days || 7]
                    );
                    ingId = newIng.insertId;
                }

                // Relacionar receta con ingrediente (cantidad saneada a número)
                const safeQty = Math.max(0, Math.round(Number(ing.quantity) || 0));
                await connection.query(
                    'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, measure_qty, measure_unit) VALUES (?, ?, ?, ?, ?)',
                    [recipeId, ingId, safeQty, ing.measure_qty || null, ing.measure_unit || null]
                );
            }
        }

        await connection.commit();
        console.log("✅ Receta guardada correctamente.");

        res.json({
            source: "ai_generated",
            recipe: { ...aiData.recipe, recipe_id: recipeId, image_url: imageUrl, recommended_meal: recommendedMeal },
            ingredients: aiData.ingredients
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error grave:", error);
        res.status(500).json({ error: "Error generando receta" });
    } finally {
        if (connection) connection.release();
    }
});

// ==========================================
// PASO 3: LISTA DE COMPRAS INTELIGENTE
// ==========================================
router.post('/shopping-list', async (req, res) => {
    try {
        const { family_id, member_count, current_inventory = [], weekly_plan_ingredients = [], current_shopping_list = [] } = req.body;
        if (!family_id) return res.status(400).json({ error: "Falta family_id" });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta GEMINI_API_KEY en el servidor.' });
        console.log("🛒 Generando lista de compras inteligente para familia", family_id);

        const n = member_count || 1;

        const systemPrompt = `
            Eres un asistente de compras inteligente enfocado en economía familiar y anti-desperdicio.
            Tu misión es generar una lista de compras RAZONABLE para una familia de ${n} ${n === 1 ? 'persona' : 'personas'} para UNA semana (7 días).

            ════════════════════════════════════════════════
            ⚠️ REGLA #0 — CANTIDADES MÁXIMAS ABSOLUTAS POR PERSONA POR SEMANA:
            NUNCA superes estos límites, independientemente del número de personas:
            • Arroz, pasta, harina, avena, cereales: MÁXIMO 500 g por persona
            • Carnes (pollo, res, cerdo): MÁXIMO 1000 g por persona
            • Huevos: MÁXIMO 12 unidades por persona
            • Leche: MÁXIMO 1000 ml por persona
            • Aceite, mantequilla: MÁXIMO 200 ml (o 200 g) total para toda la familia
            • Sal, azúcar, especias, condimentos: MÁXIMO 100 g total para toda la familia
            • Verduras y frutas (cada una): MÁXIMO 500 g por persona
            • Lácteos (queso, yogur): MÁXIMO 300 g por persona

            Para ${n} ${n === 1 ? 'persona' : 'personas'}, los valores de referencia son:
            • Arroz blanco: ${n * 400} g   • Pasta: ${n * 300} g   • Harina: ${n * 400} g
            • Avena: ${n * 200} g           • Pollo: ${n * 800} g   • Huevos: ${n * 6} unidades
            • Leche: ${n * 700} ml          • Aceite: ${Math.min(n * 100, 500)} ml

            Si el número de personas es grande (ej. 5), las cantidades siguen siendo razonables
            para una SEMANA, no para un mes. Un paquete de pasta es 400-500 g, no 5000 g.
            ════════════════════════════════════════════════

            REGLA #1 — NOMBRES ESPECÍFICOS Y SOLO ALIMENTOS:
            ❌ PROHIBIDO: nombres vagos ("Verduras variadas", "Condimentos") y productos de higiene/limpieza.
            ✅ OBLIGATORIO: nombres concretos ("Tomate", "Cebolla", "Pollo pechuga").
            ════════════════════════════════════════════════

            REGLA #2 — INVENTARIO ACTUAL DE LA FAMILIA:
            ${current_inventory.length > 0 ? JSON.stringify(current_inventory) : "Inventario vacío — recomienda los básicos necesarios."}
            Si ya tienen suficiente de algo para la semana (según los límites de la REGLA #0), NO lo agregues.
            ════════════════════════════════════════════════

            REGLA #3 — INGREDIENTES DEL MENÚ SEMANAL:
            ${weekly_plan_ingredients.length > 0 ? JSON.stringify(weekly_plan_ingredients) : "Sin plan semanal — recomienda una despensa completa básica."}
            ════════════════════════════════════════════════

            REGLA #4 — SIN DUPLICADOS CON LA LISTA ACTUAL:
            La familia YA tiene anotado esto en su lista de compras:
            ${current_shopping_list.length > 0 ? JSON.stringify(current_shopping_list) : "Lista vacía."}
            ⚠️ NO repitas ningún producto que ya esté en esa lista.
            ════════════════════════════════════════════════

            REGLA #5 — UNIDADES ESTRICTÍSIMAS (MUY IMPORTANTE):
            ❌ ABSOLUTAMENTE PROHIBIDO usar: "kg", "l", "litro", "kilo", "cartón", "paquete", "bolsa", "docena".
            ✅ ÚNICAMENTE puedes usar estas unidades:
               • "g"       → para todo lo que se pesa (carnes, granos, verduras, etc.)
               • "ml"      → para líquidos (leche, aceite, jugos)
               • "unidad"  → para piezas contables (huevos, naranjas, limones, etc.)

            Conversiones OBLIGATORIAS antes de responder:
            • 1 kg = 1000 g  (escribe 1000, NO 1 kg)
            • 1 litro = 1000 ml (escribe 1000, NO 1 l)
            • 1 docena de huevos = 12 unidades

            EJEMPLOS CORRECTOS:
            ✅ { "name": "Arroz blanco", "quantity": ${n * 400}, "unit": "g" }
            ✅ { "name": "Pollo pechuga", "quantity": ${n * 800}, "unit": "g" }
            ✅ { "name": "Leche entera", "quantity": ${n * 700}, "unit": "ml" }
            ✅ { "name": "Huevos", "quantity": ${n * 6}, "unit": "unidad" }
            ✅ { "name": "Aceite vegetal", "quantity": ${Math.min(n * 100, 500)}, "unit": "ml" }
            ✅ { "name": "Sal", "quantity": 80, "unit": "g" }

            EJEMPLOS INCORRECTOS (NUNCA hagas esto):
            ❌ { "quantity": 5, "unit": "kg" }
            ❌ { "quantity": 2, "unit": "l" }
            ❌ { "quantity": 2000, "unit": "g" }  ← para 1 persona es demasiado
            ════════════════════════════════════════════════

            Responde SOLO con JSON válido, sin texto adicional:
            {
                "items": [
                    { "name": "Tomate", "quantity": ${n * 400}, "unit": "g", "reason": "Verdura básica semanal" },
                    { "name": "Pollo pechuga", "quantity": ${n * 800}, "unit": "g", "reason": "Proteína principal" },
                    { "name": "Huevos", "quantity": ${n * 6}, "unit": "unidad", "reason": "Básico semanal" }
                ]
            }
        `;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite",
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(systemPrompt);
        const data = JSON.parse(result.response.text());
        res.json(data);

    } catch (error) {
        console.error('❌ Error generando lista de compras:', error);
        res.status(500).json({ error: "Error generando la lista inteligente." });
    }
});