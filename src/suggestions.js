// Sugerencias del planificador: avisos según la dieta / restricciones / objetivo
// de cada integrante, detectando ingredientes por palabras clave. Es heurístico
// (mejor tener un aviso que nada); no bloquea, solo recomienda.

import { restrictionLabel } from './profileOptions';

const MEAT = ['pollo', 'carne', 'res', 'cerdo', 'tocino', 'tocineta', 'jamón', 'jamon', 'chorizo', 'salchicha', 'pavo', 'cordero', 'ternera', 'bistec', 'lomo', 'panceta'];
const FISH = ['pescado', 'atún', 'atun', 'salmón', 'salmon', 'sardina', 'trucha', 'tilapia', 'merluza', 'bacalao'];
const SHELLFISH = ['marisco', 'mariscos', 'camarón', 'camaron', 'langostino', 'pulpo', 'calamar', 'ostra', 'mejillón', 'mejillon', 'almeja', 'cangrejo'];

const RESTRICTION_KEYWORDS = {
    gluten: ['harina', 'trigo', 'pan', 'pasta', 'fideo', 'galleta', 'cebada', 'centeno', 'avena', 'migas'],
    lactosa: ['leche', 'queso', 'crema', 'mantequilla', 'yogur', 'yogurt', 'nata', 'requesón', 'requeson'],
    frutos_secos: ['nuez', 'nueces', 'almendra', 'maní', 'mani', 'cacahuate', 'cacahuete', 'avellana', 'pistacho', 'anacardo'],
    mariscos: SHELLFISH,
    huevo: ['huevo', 'huevos', 'clara', 'yema', 'mayonesa'],
    cerdo: ['cerdo', 'tocino', 'tocineta', 'jamón', 'jamon', 'chorizo', 'panceta', 'manteca'],
    azucar: ['azúcar', 'azucar', 'miel', 'jarabe', 'sirope', 'panela', 'caramelo'],
};

const uniq = (arr) => [...new Set(arr)];

// Devuelve { warnings: string[], tips: string[] }
export function buildSuggestions(members, ingredients) {
    const text = (ingredients || []).join(' ').toLowerCase();
    const has = (arr) => arr.filter(k => text.includes(k));
    const warnings = [];

    (members || []).forEach(m => {
        const name = m?.name || 'Alguien';

        // Conflictos por tipo de dieta
        if (m?.diet_type === 'vegetariano') {
            const hit = uniq([...has(MEAT), ...has(FISH), ...has(SHELLFISH)]);
            if (hit.length) warnings.push(`${name} es vegetariano/a: la receta parece llevar ${hit.join(', ')}.`);
        } else if (m?.diet_type === 'vegano') {
            const hit = uniq([...has(MEAT), ...has(FISH), ...has(SHELLFISH), ...has(RESTRICTION_KEYWORDS.huevo), ...has(RESTRICTION_KEYWORDS.lactosa)]);
            if (hit.length) warnings.push(`${name} es vegano/a: la receta parece llevar ${hit.join(', ')}.`);
        } else if (m?.diet_type === 'pescetariano') {
            const hit = uniq(has(MEAT));
            if (hit.length) warnings.push(`${name} es pescetariano/a: la receta parece llevar ${hit.join(', ')}.`);
        }

        // Conflictos por restricciones/alergias
        (m?.dietary_restrictions || []).forEach(r => {
            const kws = RESTRICTION_KEYWORDS[r];
            if (!kws) return;
            const hit = uniq(has(kws));
            if (hit.length) warnings.push(`${name} evita ${String(restrictionLabel(r)).toLowerCase()}: contiene ${hit.join(', ')}.`);
        });
    });

    // Consejos según objetivos del grupo
    const tips = [];
    const goals = new Set((members || []).map(m => m?.goal).filter(Boolean));
    if (goals.has('ganar')) tips.push('Alguien busca ganar músculo: prioriza proteína y una porción generosa.');
    if (goals.has('bajar')) tips.push('Alguien busca bajar de peso: cuida las porciones y evita frituras y azúcares.');

    return { warnings: uniq(warnings), tips };
}
