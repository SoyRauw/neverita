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
        const { selected_title, available_ingredients } = req.body;

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
            Usa SOLO los ingredientes del inventario: [ ${available_ingredients.join(', ')} ]
            y básicos de despensa (sal, aceite, especias).
            
            Si el título requiere algo que no está, IMPROVISA usando un sustituto del inventario 
            o cambia ligeramente la técnica, pero MANTÉN el título y usa lo que hay.

            Responde SOLO JSON:
            {
                "recipe": { 
                    "title": "${selected_title}", 
                    "description": "...", 
                    "instructions": "Paso 1... Paso 2...", 
                    "difficulty": "media", 
                    "preparation_time": 30, 
                    "servings": 2, 
                    "calories_per_serving": 400 
                },
                "ingredients": [{ "name": "...", "quantity": 1, "unit": "...", "category": "..." }]
            }
        `;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(systemPrompt);
        const aiData = JSON.parse(result.response.text());

        // --- C. GUARDAR EN BD ---
        await connection.beginTransaction();

        // 1. Guardar Receta
        const [resReceta] = await connection.query(
            `INSERT INTO recipes (title, description, instructions, difficulty, preparation_time, servings, calories_per_serving, created_by, family_id, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, 'placeholder')`,
            [aiData.recipe.title, aiData.recipe.description, aiData.recipe.instructions, aiData.recipe.difficulty, aiData.recipe.preparation_time, aiData.recipe.servings, aiData.recipe.calories_per_serving]
        );
        const recipeId = resReceta.insertId;

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
                        'INSERT INTO ingredients (name, unit) VALUES (?, ?)',
                        [formattedName, ing.unit || 'u']
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
            recipe: aiData.recipe,
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