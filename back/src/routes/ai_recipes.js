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
        const apiKey = process.env.GEMINI_API_KEY || "AIzaSyAU4T5KvvhpHNwmkrfWCK3pVTU2lxgfUAY";

        if (!ingredients || ingredients.length === 0) return res.status(400).json({ error: "Faltan ingredientes" });
        if (!apiKey) return res.status(500).json({ error: "Falta API KEY" });

        console.log("🔍 Buscando ideas para:", ingredients);

        const systemPrompt = `
            Eres un Chef experto en "Cocina de Aprovechamiento".
            Tienes EXCLUSIVAMENTE estos ingredientes en la nevera: ${ingredients.join(', ')}.
            (Asume que también tienes básicos: sal, aceite, agua, pimienta).

            TU MISIÓN:
            Sugiere 3 nombres de recetas que se puedan cocinar PRINCIPALMENTE con esos ingredientes.
            NO sugieras platos que requieran ingredientes principales que no están en la lista.
            
            Responde SOLO JSON:
            { "suggestions": [{ "title": "Nombre del Plato", "description": "Descripción corta de 10 palabras" }, ...] }
        `;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(systemPrompt);
        const content = JSON.parse(result.response.text());
        res.json(content);

    } catch (error) {
        console.error("❌ Error en suggest:", error);
        res.status(500).json({ error: "Error al sugerir recetas" });
    }
});

// ==========================================
// PASO 2: COCINAR / GENERAR (La Receta)
// ==========================================
router.post('/generate', async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { selected_title, available_ingredients, family_id } = req.body;

        if (!selected_title) return res.status(400).json({ error: "Falta título" });

        console.log("🍳 Usuario eligió:", selected_title);

        // --- A. VERIFICAR SI YA EXISTE EN BD ---
        const [existing] = await connection.query('SELECT * FROM recipes WHERE title = ? LIMIT 1', [selected_title]);

        if (existing.length > 0) {
            console.log("⚡ ¡Receta encontrada en caché (BD)!");
            // Recuperamos ingredientes de la BD
            const [dbIngredients] = await connection.query(`
                SELECT i.name, ri.quantity, i.unit 
                FROM ingredients i JOIN recipe_ingredients ri ON i.ingredient_id = ri.ingredient_id
                WHERE ri.recipe_id = ?`, [existing[0].recipe_id]);

            // Si la receta ya estaba en DB, igual la vinculamos a la familia actual si no lo estaba
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
        }

        // --- B. NO EXISTE -> GENERAR CON IA ---
        console.log("🤖 Receta nueva. Generando con IA...");
        const apiKey = process.env.GEMINI_API_KEY || "AIzaSyAU4T5KvvhpHNwmkrfWCK3pVTU2lxgfUAY";

        const systemPrompt = `
            Genera la receta completa para: "${selected_title}".
            
            REGLA DE ORO (TESIS):
            El usuario tiene estos ingredientes en su inventario con las cantidades indicadas entre paréntesis:
            [ ${available_ingredients.join(', ')} ]
            También tiene básicos de despensa (sal, aceite, especias).
            
            REGLA CRÍTICA DE CANTIDADES:
            NUNCA uses más cantidad de un ingrediente de la que el usuario tiene disponible.
            Por ejemplo, si tiene "Pan de Molde (3 unidad)", la receta NO puede pedir 4 unidades.
            Ajusta las porciones de la receta para que se adapten a lo que hay disponible.
            
            Si el título requiere algo que no está, IMPROVISA usando un sustituto del inventario 
            o cambia ligeramente la técnica, pero MANTÉN el título y usa lo que hay.

            Responde SOLO JSON:
            {
                "recipe": { 
                    "title": "${selected_title}", 
                    "description": "...", 
                    "instructions": "Paso 1... Paso 2...", 
                    "difficulty": "easy", 
                    "preparation_time": 30, 
                    "servings": 2, 
                    "calories_per_serving": 400 
                },
                "ingredients": [{ "name": "...", "quantity": 1, "unit": "g", "category": "vegetal", "average_expiry_days": 7 }]
            }
            IMPORTANTE: El campo "difficulty" SOLO puede ser "easy", "regular" o "hard". No uses otro valor.
            IMPORTANTE: El campo "unit" de cada ingrediente SOLO puede ser uno de estos valores exactos: "g", "kg", "ml", "l", "cup", "cucharada grande", "cucharada pequeña", "unidad". No uses ningún otro valor.
            IMPORTANTE: El campo "category" de cada ingrediente SOLO puede ser uno de estos valores exactos: "vegetal", "fruta", "proteína", "lácteo", "grano", "condimento", "grasa", "bebida", "otro". No uses ningún otro valor.
            IMPORTANTE: El campo "average_expiry_days" es un número entero que representa los días aproximados que tarda el ingrediente en vencerse. Por ejemplo: pollo=5, arroz=365, leche=7, sal=730, frutas frescas=5, enlatados=730.
        `;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(systemPrompt);
        const aiData = JSON.parse(result.response.text());

        // --- NORMALIZAR UNIDADES (seguridad extra) ---
        const validUnits = ['g', 'kg', 'ml', 'l', 'cup', 'cucharada grande', 'cucharada pequeña', 'unidad'];
        const unitMap = {
            'gramos': 'g', 'gramo': 'g', 'gr': 'g',
            'kilogramos': 'kg', 'kilogramo': 'kg', 'kilo': 'kg', 'kilos': 'kg',
            'mililitros': 'ml', 'mililitro': 'ml',
            'litros': 'l', 'litro': 'l',
            'taza': 'cup', 'tazas': 'cup', 'cups': 'cup',
            'cucharadas': 'cucharada grande', 'cucharada': 'cucharada grande', 'cda': 'cucharada grande', 'tbsp': 'cucharada grande',
            'cucharadita': 'cucharada pequeña', 'cucharaditas': 'cucharada pequeña', 'cdta': 'cucharada pequeña', 'tsp': 'cucharada pequeña',
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

        // --- C. GUARDAR EN BD ---
        await connection.beginTransaction();

        // Sanitizar difficulty: solo aceptar valores válidos del ENUM
        const validDifficulties = ['easy', 'regular', 'hard'];
        const rawDiff = (aiData.recipe.difficulty || 'regular').toLowerCase();
        const difficulty = validDifficulties.includes(rawDiff) ? rawDiff : 'regular';

        // --- B.5 OBTENER IMAGEN CON SERPAPI (Google Images) ---
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

        // 1. Guardar Receta
        const validFamilyId = family_id || 1;
        const [resReceta] = await connection.query(
            `INSERT INTO recipes (title, description, instructions, difficulty, preparation_time, servings, calories_per_serving, created_by, family_id, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
            [aiData.recipe.title, aiData.recipe.description, aiData.recipe.instructions, difficulty, aiData.recipe.preparation_time, aiData.recipe.servings, aiData.recipe.calories_per_serving, validFamilyId, imageUrl]
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

                // Relacionar receta con ingrediente
                await connection.query(
                    'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES (?, ?, ?)',
                    [recipeId, ingId, ing.quantity]
                );
            }
        }

        await connection.commit();
        console.log("✅ Receta guardada correctamente.");

        res.json({
            source: "ai_generated",
            recipe: { ...aiData.recipe, recipe_id: recipeId, image_url: imageUrl },
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