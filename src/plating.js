// "Emplatado": muchos ingredientes se registran como "unidad" pero al servir se
// pesan (no sirves "14 cilantro" ni "5 papa", sino gramos). Aquí convertimos esas
// unidades a gramos aproximados. Los realmente contables al comer (huevo, pan,
// arepa, panqueca, fruta entera…) se dejan como unidades.

import { roundQty } from './nutrition';

// Gramos aproximados por 1 unidad de ingredientes que se pesan.
const GRAMS_PER_UNIT = {
    // hierbas / aromáticas
    'cilantro': 4, 'perejil': 4, 'cebollín': 8, 'cebollin': 8, 'cebolla larga': 15, 'cebolla en rama': 15,
    'albahaca': 3, 'hierbabuena': 3, 'menta': 3, 'orégano': 2, 'oregano': 2, 'laurel': 0.5, 'tomillo': 2, 'romero': 2, 'ajo': 5,
    // tubérculos / raíces
    'papa': 150, 'patata': 150, 'batata': 200, 'yuca': 250, 'ñame': 300, 'name': 300, 'ocumo': 250, 'apio': 40, 'remolacha': 120,
    // verduras
    'cebolla': 110, 'tomate': 120, 'zanahoria': 60, 'pimentón': 120, 'pimenton': 120, 'pimiento': 120, 'ají': 15, 'aji': 15,
    'brócoli': 300, 'brocoli': 300, 'coliflor': 500, 'calabacín': 200, 'calabacin': 200, 'berenjena': 250, 'pepino': 200,
    'auyama': 700, 'calabaza': 700, 'lechuga': 300, 'espinaca': 30, 'repollo': 800, 'aguacate': 200, 'palta': 200, 'plátano': 180, 'platano': 180,
};

const UNIT_LIKE = ['unidad', 'unidades', 'ud', 'uds', 'u'];

function gramsPerUnitFor(name) {
    // Coincidencia por PALABRA completa (no subcadena) para evitar falsos positivos
    // como papaya→papa, ajoporro→ajo o cebollín→cebolla.
    const words = String(name || '').toLowerCase().split(/[\s,()./-]+/).filter(Boolean);
    let best = null;
    for (const k of Object.keys(GRAMS_PER_UNIT)) {
        const parts = k.split(' ');
        const matches = parts.every(p => words.includes(p)); // todas las palabras de la clave presentes
        if (matches && (!best || k.length > best.length)) best = k;
    }
    return best ? GRAMS_PER_UNIT[best] : null;
}

// Cantidad "servida": si el ingrediente se pesa pero viene en unidades, pasa a gramos.
export function plateAmount(name, qty, unit) {
    const u = String(unit || '').toLowerCase().trim();
    if (UNIT_LIKE.includes(u)) {
        const g = gramsPerUnitFor(name);
        if (g) return { qty: Math.max(1, Math.round(qty * g)), unit: 'g' };
    }
    return { qty: roundQty(qty, unit), unit };
}
