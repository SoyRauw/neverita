// "Reserva" de inventario para el planificador.
//
// Cuando una comida está PLANIFICADA pero aún NO se ha cocinado, sus ingredientes
// quedan "reservados": no deben contar como disponibles al planificar otra receta.
// Así, si tienes 2 huevos y ya planificaste una receta que usa 2, la siguiente
// receta ve 0 huevos disponibles (y no te deja usarlos dos veces).
//
// Usa la misma fórmula de escalado que el descuento real (deductForCooked en App.jsx):
// cantidad_base × (totalPortions(eaters) / servings_base). Y reconcilia UNIDADES antes
// de restar (el inventario puede estar en 'unidad'/'kg'/'L' y la receta en g/ml).

import { totalPortions } from './nutrition';
import { gramsPerUnitFor } from './plating';

const lower = (s) => String(s || '').trim().toLowerCase();
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// Clave de nombre robusta: minúsculas, sin acentos y sin espacios extremos,
// para que "Limón" y "limon" (o " Tomate ") colisionen en el mismo ingrediente.
export const normName = (s) => lower(s).normalize('NFD').replace(/[̀-ͯ]/g, '');

// ── Conversión de unidades ──
const MASS = { g: 1, gr: 1, grs: 1, gramo: 1, gramos: 1, kg: 1000, kgs: 1000, kilo: 1000, kilos: 1000, kilogramo: 1000, kilogramos: 1000 };
const VOL = { ml: 1, mililitro: 1, mililitros: 1, cc: 1, l: 1000, lt: 1000, litro: 1000, litros: 1000 };
const COUNT = new Set(['unidad', 'unidades', 'u', 'ud', 'uds', 'pieza', 'piezas']);

const dimOf = (u) => (MASS[u] != null ? 'mass' : VOL[u] != null ? 'vol' : COUNT.has(u) ? 'count' : (u || 'count'));
const factorOf = (u) => MASS[u] || VOL[u] || 1;

/**
 * Convierte `qty` de `fromUnit` a `toUnit` para el ingrediente `name`.
 * Devuelve null si NO son convertibles (p.ej. count<->volumen, o masa<->volumen).
 */
export function convertQty(qty, fromUnit, toUnit, name) {
  const f = lower(fromUnit), t = lower(toUnit);
  const q = Number(qty) || 0;
  if (f === t) return q;
  const fd = dimOf(f), td = dimOf(t);
  if (fd === td) {
    if (fd === 'mass' || fd === 'vol') return q * factorOf(f) / factorOf(t);
    return q; // count<->count (unidad/pieza) — misma magnitud
  }
  // Dimensiones distintas: solo count<->masa vía gramos-por-pieza del ingrediente.
  const gpu = gramsPerUnitFor(name);
  if (gpu) {
    if (fd === 'count' && td === 'mass') return (q * gpu) / factorOf(t);
    if (fd === 'mass' && td === 'count') return (q * factorOf(f)) / gpu;
  }
  return null; // incompatible
}

/**
 * Parsea una línea de ingrediente mostrada, p.ej.:
 *   "Tomate (120 g)"                 -> { name:'tomate', qty:120, unit:'g' }
 *   "2 cucharadas de Aceite (30 ml)" -> { name:'aceite', qty:30, unit:'ml' }
 *   "Sal"                            -> { name:'sal', qty:null, unit:'' }
 * La cantidad real siempre está en el ÚLTIMO paréntesis.
 */
export function parseIngredientDisplay(line) {
  const s = String(line || '').trim();
  if (!s) return { name: '', qty: null, unit: '' };
  const m = s.match(/^(.*)\(([^)]*)\)\s*$/);
  let namePart = m ? m[1] : s;
  const inner = m ? m[2].trim() : '';
  // Quitar prefijo de medida "2 cucharadas de " (requiere número al inicio para no
  // romper nombres que llevan "de", como "Leche de almendras").
  namePart = namePart.replace(/^\s*[\d.,]+\s+\S+\s+de\s+/i, '').trim();
  const name = lower(namePart);

  let qty = null;
  let unit = '';
  if (inner) {
    const qm = inner.match(/^([\d.,]+)\s*(.*)$/);
    if (qm) {
      const parsed = parseFloat(qm[1].replace(',', '.'));
      qty = Number.isFinite(parsed) ? parsed : null;
      unit = lower(qm[2]);
    } else {
      unit = lower(inner);
    }
  }
  return { name, qty, unit };
}

/**
 * Multiplicador de una comida = totalPortions(comensales) / servings_base.
 * Espeja deductForCooked: si no hay eaters, cuenta a toda la familia.
 */
export function mealMultiplier(meal, familyMembers) {
  const base = Number(meal?.servings) || 2;
  const members = familyMembers || [];
  const eaterMembers = (Array.isArray(meal?.eaters) && meal.eaters.length)
    ? members.filter((m) => meal.eaters.includes(m.user_id))
    : members;
  const factor = eaterMembers.length ? totalPortions(eaterMembers) : base;
  return base > 0 ? factor / base : 1;
}

/**
 * Suma reservada por ingrediente (clave = normName), solo de comidas NO cocinadas.
 * Devuelve { clave: { qty, unit } } con qty acumulada en la unidad de la receta.
 * `meals` = array de comidas del plan (valores de plannerData).
 */
export function computeReserved(meals, familyMembers) {
  const reserved = {};
  for (const meal of meals || []) {
    if (!meal || meal.is_completed) continue;
    const ings = Array.isArray(meal.ingredients) ? meal.ingredients : [];
    if (!ings.length) continue;
    const mult = mealMultiplier(meal, familyMembers);
    for (const line of ings) {
      const { name, qty, unit } = parseIngredientDisplay(line);
      if (!name || qty == null || qty <= 0) continue;
      const key = normName(name);
      if (!reserved[key]) reserved[key] = { qty: 0, unit };
      let add = qty * mult;
      // Si esta línea trae otra unidad que la ya acumulada, convertir antes de sumar.
      if (unit && reserved[key].unit && lower(unit) !== lower(reserved[key].unit)) {
        const conv = convertQty(add, unit, reserved[key].unit, name);
        if (conv != null) add = conv;
      }
      reserved[key].qty += add;
      if (!reserved[key].unit && unit) reserved[key].unit = unit;
    }
  }
  for (const k of Object.keys(reserved)) reserved[k].qty = round2(reserved[k].qty);
  return reserved;
}

/**
 * Agrega el inventario (varias filas por ingrediente) y resta lo reservado,
 * reconciliando unidades. Devuelve { clave: {name, unit, total, reserved, available} }.
 * Si lo reservado no es convertible a la unidad del inventario, NO se resta (conservador),
 * para no forzar available=0 y bloquear el planificado por un desajuste de unidades.
 */
export function aggregateAvailable(items, reservedMap) {
  const byName = {};
  for (const it of items || []) {
    const key = normName(it.name);
    if (!key) continue;
    if (!byName[key]) byName[key] = { name: it.name, unit: it.unit, total: 0, reserved: 0, available: 0 };
    byName[key].total += Number(it.quantity) || 0;
    if (!byName[key].unit && it.unit) byName[key].unit = it.unit;
  }
  for (const key of Object.keys(byName)) {
    const r = reservedMap ? reservedMap[key] : null;
    let reservedInInv = 0;
    if (r && r.qty > 0) {
      const conv = convertQty(r.qty, r.unit, byName[key].unit, byName[key].name);
      reservedInInv = (conv == null) ? 0 : Math.max(0, conv);
    }
    byName[key].reserved = round2(reservedInInv);
    byName[key].total = round2(byName[key].total);
    byName[key].available = Math.max(0, round2(byName[key].total - reservedInInv));
  }
  return byName;
}

/**
 * Faltantes de UNA receta: [{ name, unit, need, available, missing }] con missing > 0.
 * `mult` escala la necesidad (por comensales). `consumedMap` acumula lo ya usado por
 * recetas previas del mismo lote (en la unidad del inventario de cada ingrediente).
 * Las cantidades se convierten a la unidad del inventario antes de comparar.
 */
export function computeShortfalls(recipeIngredients, mult, availableByName, consumedMap) {
  const out = [];
  for (const line of recipeIngredients || []) {
    const { name, qty, unit } = parseIngredientDisplay(line);
    if (!name || qty == null || qty <= 0) continue;
    const key = normName(name);
    const info = availableByName ? availableByName[key] : null;
    if (!info) continue; // no está en el inventario -> se compra igual, no es "faltante de lo que tengo"
    const needInInv = convertQty(qty * (Number(mult) || 1), unit, info.unit, info.name);
    if (needInInv == null) continue; // unidades incomparables -> no arriesgar un número incoherente
    const alreadyUsed = consumedMap && consumedMap[key] ? consumedMap[key] : 0;
    const available = Math.max(0, round2(info.available - alreadyUsed));
    const missing = round2(needInInv - available);
    if (consumedMap) consumedMap[key] = alreadyUsed + needInInv;
    if (missing > 0.01) {
      out.push({ name: info.name || name, unit: info.unit || unit, need: round2(needInInv), available, missing });
    }
  }
  return out;
}
