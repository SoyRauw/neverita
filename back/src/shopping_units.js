// Saneado de unidades/cantidades para la lista de compras generada por IA.
//
// La IA (Gemini) a veces ignora las reglas del prompt y devuelve cosas como
// "700 L" (cuando eran 700 ml), "200 kg" (eran 200 g) o "500 unidad" de tomate
// (eran ~4 tomates). El número suele estar bien, la UNIDAD está mal. Aquí forzamos
// SIEMPRE una de tres unidades — g / ml / unidad — con cantidades razonables,
// reusando una tabla de gramos-por-unidad (misma idea que src/plating.js del front).

// --- Gramos aproximados por 1 pieza de ingredientes que también se pesan. ---
const GRAMS_PER_UNIT = {
  // hierbas / aromáticas
  cilantro: 4, perejil: 4, 'cebollín': 8, cebollin: 8, albahaca: 3, hierbabuena: 3, menta: 3,
  'orégano': 2, oregano: 2, laurel: 0.5, tomillo: 2, romero: 2, ajo: 5,
  // tubérculos / raíces
  papa: 150, patata: 150, batata: 200, yuca: 250, 'ñame': 300, name: 300, ocumo: 250, apio: 40, remolacha: 120,
  // verduras
  cebolla: 110, tomate: 120, zanahoria: 60, 'pimentón': 120, pimenton: 120, pimiento: 120, 'ají': 15, aji: 15,
  'brócoli': 300, brocoli: 300, coliflor: 500, 'calabacín': 200, calabacin: 200, berenjena: 250, pepino: 200,
  auyama: 700, calabaza: 700, lechuga: 300, espinaca: 30, repollo: 800,
  // frutas / otros contables
  aguacate: 200, palta: 200, 'plátano': 180, platano: 180, banana: 120, guineo: 120,
  manzana: 180, naranja: 180, 'limón': 60, limon: 60, pera: 180, durazno: 150, mango: 200,
  kiwi: 75, fresa: 15, mazorca: 250, choclo: 250, huevo: 60, huevos: 60,
};

// Ingredientes que se COMPRAN por pieza en el mercado (fruta/verdura entera + huevos).
const BUY_AS_UNIT = new Set([
  'huevo', 'huevos', 'tomate', 'cebolla', 'manzana', 'limón', 'limon', 'naranja',
  'plátano', 'platano', 'banana', 'guineo', 'papa', 'patata', 'zanahoria', 'pimentón',
  'pimenton', 'pimiento', 'aguacate', 'palta', 'pepino', 'pera', 'durazno', 'mango',
  'kiwi', 'ajo', 'remolacha', 'berenjena', 'calabacín', 'calabacin', 'lechuga',
  'repollo', 'coliflor', 'brócoli', 'brocoli', 'mazorca', 'choclo', 'fresa', 'aguacates',
]);

// Palabras que indican un líquido -> ml.
const LIQUID_WORDS = new Set([
  'leche', 'aceite', 'jugo', 'zumo', 'agua', 'vinagre', 'salsa', 'caldo', 'crema',
  'yogur', 'yogurt', 'bebida', 'refresco', 'vino', 'cerveza', 'miel', 'sirope', 'nata',
]);

// Reglas de tope máximo (REGLA #0 del prompt, ahora forzadas en código).
// perPerson multiplica por el número de personas; perFamily es total.
const CAP_RULES = [
  { words: ['arroz', 'pasta', 'harina', 'avena', 'cereal', 'cereales', 'fideos', 'spaghetti', 'espagueti', 'lenteja', 'lentejas', 'frijol', 'frijoles', 'caraota', 'caraotas', 'garbanzo', 'garbanzos', 'quinoa', 'trigo'], perPerson: 500 },
  { words: ['pollo', 'res', 'carne', 'cerdo', 'pescado', 'pechuga', 'molida', 'lomo', 'costilla', 'pavo', 'ternera', 'chuleta', 'atún', 'atun'], perPerson: 1000 },
  { words: ['leche'], perPerson: 1000 },
  { words: ['aceite', 'mantequilla', 'margarina'], perFamily: 500 },
  { words: ['sal', 'azúcar', 'azucar', 'pimienta', 'comino', 'especia', 'especias', 'condimento', 'condimentos', 'canela'], perFamily: 100 },
  { words: ['queso', 'yogur', 'yogurt', 'mantequilla'], perPerson: 300 },
];

const HARD_MAX = 50000; // techo absoluto (50 kg / 50 L)

// Divide el nombre en palabras y añade sus formas SINGULARES candidatas para casar
// plurales del español: vocal+s ("tomates"->"tomate", "cebollas"->"cebolla") y
// consonante+es ("limones"->"limon"). Se añaden AMBOS candidatos (quitar "s" y "es")
// porque solo se usan para comprobar pertenencia a listas curadas, no para fusionar claves.
const stemsOf = (w) => {
  const out = [];
  if (w.length > 3 && w.endsWith('s')) out.push(w.slice(0, -1));  // tomates->tomate
  if (w.length > 4 && w.endsWith('es')) out.push(w.slice(0, -2)); // limones->limon
  return out;
};
const wordsOf = (name) => {
  const raw = String(name || '').toLowerCase().split(/[\s,()./-]+/).filter(Boolean);
  const out = [];
  for (const w of raw) { out.push(w); for (const s of stemsOf(w)) if (!out.includes(s)) out.push(s); }
  return out;
};

function gramsPerUnitFor(name) {
  const w = wordsOf(name);
  let best = null;
  for (const k of Object.keys(GRAMS_PER_UNIT)) {
    const parts = k.split(' ');
    if (parts.every((p) => w.includes(p)) && (!best || k.length > best.length)) best = k;
  }
  return best ? GRAMS_PER_UNIT[best] : null;
}

const hasAnyWord = (name, set) => wordsOf(name).some((w) => set.has(w));

// Tope máximo (en la unidad base g/ml) según categoría; genérico si no matchea.
function capFor(name, memberCount, target) {
  const n = Math.max(1, Number(memberCount) || 1);
  for (const rule of CAP_RULES) {
    if (rule.words.some((rw) => wordsOf(name).includes(rw))) {
      return rule.perFamily != null ? rule.perFamily : rule.perPerson * n;
    }
  }
  // Genéricos: verdura/fruta al peso o líquidos.
  if (target === 'ml') return Math.min(HARD_MAX, 2000 * n);
  return Math.min(HARD_MAX, 1000 * n); // g
}

/**
 * Sanea un ítem {name, quantity, unit, reason} de la lista de compras.
 * Devuelve el ítem con unidad forzada a g/ml/unidad y cantidad sensata, o null si no hay nombre.
 */
export function sanitizeShoppingItem(item, memberCount = 1) {
  const n = Math.max(1, Number(memberCount) || 1);
  const name = String(item?.name || '').trim();
  if (!name) return null;

  const unitIn = String(item?.unit || '').toLowerCase().trim();
  let rawQty = Number(item?.quantity);
  if (!Number.isFinite(rawQty) || rawQty <= 0) rawQty = null;

  // 1) Pasar la cantidad a magnitud base (g/ml), corrigiendo kg/L.
  const isKg = ['kg', 'kgs', 'kilo', 'kilos', 'kilogramo', 'kilogramos'].includes(unitIn);
  const isL = ['l', 'lt', 'litro', 'litros'].includes(unitIn);
  const isUnitLike = ['unidad', 'unidades', 'u', 'ud', 'uds', 'pieza', 'piezas', 'docena', 'docenas'].includes(unitIn);
  let base = rawQty; // magnitud "gramos/ml equivalente" (o conteo si venía en unidad)
  if (base != null && (isKg || isL)) {
    // Número chico (<10) => probablemente kg/L reales -> a g/ml. Grande => la IA ya
    // escribió la magnitud g/ml con la etiqueta grande (el bug observado).
    base = base < 10 ? base * 1000 : base;
  }
  if (base != null && (unitIn === 'docena' || unitIn === 'docenas')) base = base * 12;

  // 2) Clasificar unidad destino.
  const target = hasAnyWord(name, LIQUID_WORDS) ? 'ml'
    : hasAnyWord(name, BUY_AS_UNIT) ? 'unidad'
      : 'g';

  const reason = typeof item?.reason === 'string' ? item.reason : undefined;

  // 3) Normalizar cantidad según destino.
  if (target === 'unidad') {
    const gpu = gramsPerUnitFor(name) || 100;
    let count;
    // Si vino etiquetado como "unidad", es un conteo REAL (sin importar la magnitud);
    // el tope capUnits acota excesos. Si no, base son gramos -> convertir a piezas.
    if (isUnitLike && base != null) count = base;
    else if (base != null) count = base / gpu;
    else count = 2 * n; // sin dato -> default razonable
    count = Math.max(1, Math.round(count));
    // Tope: huevos 12/persona; resto ~ (500 g/persona) / gramos-por-pieza.
    const isEgg = wordsOf(name).some((w) => w === 'huevo' || w === 'huevos');
    const capUnits = isEgg ? 12 * n : Math.max(2, Math.round((500 * n) / gpu));
    count = Math.min(count, capUnits);
    return { name, quantity: count, unit: 'unidad', ...(reason ? { reason } : {}) };
  }

  // target g o ml
  let qty = base != null ? Math.round(base) : (target === 'ml' ? 500 * n : 200 * n);
  qty = Math.min(qty, capFor(name, n, target));
  qty = Math.max(1, qty);
  return { name, quantity: qty, unit: target, ...(reason ? { reason } : {}) };
}

/** Sanea toda la lista de items. */
export function sanitizeShoppingList(items, memberCount = 1) {
  if (!Array.isArray(items)) return [];
  return items.map((it) => sanitizeShoppingItem(it, memberCount)).filter(Boolean);
}
