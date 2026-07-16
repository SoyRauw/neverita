import { db } from './src/db.js';

// Heurística venezolana/latinoamericana: desayuno y cena tienen keywords específicos.
// TODO LO DEMÁS es almuerzo por defecto (incluyendo sopas, caldos, sancochos, caraotas, etc.)
function inferMealType(title) {
    const t = title.toLowerCase();

    // Solo se clasifica como DESAYUNO si tiene palabras muy específicas de desayuno
    const desayunoKeywords = [
        'desayuno', 'arepa', 'avena', 'pancake', 'panqueca',
        'scrambled', 'cereal', 'granola', 'waffle',
        'smoothie', 'batido', 'muesli',
        'omelet', 'omelette',
        'café con leche', 'cachapa', 'bollito', 'pastelito',
        'tostada', // solo "tostada" (no "tostadas nocturnas" que es raro)
    ];

    // Solo se clasifica como CENA si es explícitamente ligero/nocturno
    // En Venezuela: sandwich/wrap/quesadilla/pizza son más de cena
    // Caldos, sopas, sancochos son ALMUERZO, NO cena
    const cenaKeywords = [
        'cena',
        'sandwich', 'sándwich',
        'wrap',
        'quesadilla',
        'tacos',
        'burritos',
        'pizza',
    ];

    for (const kw of desayunoKeywords) {
        if (t.includes(kw)) return 'desayuno';
    }
    for (const kw of cenaKeywords) {
        if (t.includes(kw)) return 'cena';
    }

    // Por defecto: almuerzo
    // (incluye sopas, caldos, sancochos, caraotas, arroz, pasta, ensaladas, etc.)
    return 'almuerzo';
}

async function reclassifyAll() {
    try {
        console.log('🔄 Reclasificando TODAS las recetas con la heurística corregida...');

        const [recipes] = await db.query('SELECT recipe_id, title FROM recipes');
        console.log(`   → ${recipes.length} recetas encontradas.\n`);

        let updated = 0;
        for (const recipe of recipes) {
            const mealType = inferMealType(recipe.title);
            await db.query(
                'UPDATE recipes SET recommended_meal = ? WHERE recipe_id = ?',
                [mealType, recipe.recipe_id]
            );
            console.log(`   ✔ [${recipe.recipe_id}] "${recipe.title}" → ${mealType}`);
            updated++;
        }

        console.log(`\n✅ ${updated} recetas reclasificadas.`);
        console.log('🎉 Reclasificación completada!');
    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        process.exit(0);
    }
}

reclassifyAll();
