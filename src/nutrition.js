// Nutrición — necesidad calórica por persona (Mifflin-St Jeor) y factor de porción.
// Se usa en el Bloque 3 (porciones balanceadas al planificar) y servirá para
// los Bloques 4/5 (calorías y métricas por persona).

const ACTIVITY_FACTOR = { bajo: 1.375, medio: 1.55, alto: 1.725 };
const GOAL_FACTOR = { bajar: 0.85, mantener: 1.0, ganar: 1.1 };
const REFERENCE_TDEE = 2000; // kcal/día de un adulto de referencia → factor 1.0

// Edad a partir de la fecha de nacimiento (AAAA-MM-DD). Null si no es válida.
export function ageFromBirth(birth) {
    if (!birth) return null;
    const b = new Date(String(birth).split('T')[0] + 'T00:00:00');
    if (isNaN(b.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
    return age >= 0 && age < 130 ? age : null;
}

// Gasto energético diario estimado (TDEE) con Mifflin-St Jeor. Null si faltan datos.
export function estimateTDEE(member) {
    const w = Number(member?.weight_kg);
    const h = Number(member?.height_cm);
    const age = ageFromBirth(member?.birth_date);
    if (!w || !h || age == null || !Number.isFinite(w) || !Number.isFinite(h)) return null;
    let s;
    if (member.sex === 'm') s = 5;
    else if (member.sex === 'f') s = -161;
    else s = -78; // "otro"/desconocido → promedio de ambos
    const bmr = 10 * w + 6.25 * h - 5 * age + s;
    const act = ACTIVITY_FACTOR[member.activity_level] || ACTIVITY_FACTOR.medio;
    return bmr * act;
}

// Factor de porción relativo a un adulto de referencia (1.0), ajustado por objetivo.
// Sin datos suficientes → 1.0 (adulto promedio) para no romper el cálculo.
export function portionFactor(member) {
    const goalF = GOAL_FACTOR[member?.goal] || 1.0;
    const tdee = estimateTDEE(member);
    if (tdee == null) return goalF; // fallback: adulto promedio
    const f = (tdee / REFERENCE_TDEE) * goalF;
    return Math.min(2.2, Math.max(0.3, Math.round(f * 100) / 100)); // límites sanos
}

// Suma de factores de una lista de integrantes = "porciones adulto-equivalentes".
export function totalPortions(members) {
    const sum = (members || []).reduce((acc, m) => acc + portionFactor(m), 0);
    return Math.round(sum * 100) / 100;
}

// Porciones "humanas": 2.72 → "2-3" (pasa el .5), 2.10 → "2" (no llega al .5).
export function portionsLabel(v) {
    const n = Number(v) || 0;
    if (n <= 1) return '1';
    const f = Math.floor(n);
    return (n - f) >= 0.5 ? `${f}-${f + 1}` : `${f}`;
}

// Redondeo "de cocina": las cosas contables (huevos, panes, cucharadas…) a entero;
// gramos/ml a entero (con 1 decimal solo si es muy poco, tipo especias); kg/l a 1 decimal.
const _WEIGHT_VOL = ['g', 'gr', 'grs', 'gramo', 'gramos', 'ml', 'mililitro', 'mililitros', 'cc'];
export function roundQty(n, unit) {
    if (!Number.isFinite(n)) return n;
    const u = String(unit || '').toLowerCase().trim();
    if (u === 'kg' || u === 'kgs' || u === 'l' || u === 'lt' || u.startsWith('litro')) {
        return Math.round(n * 10) / 10; // kg/l → 1 decimal
    }
    if (_WEIGHT_VOL.includes(u)) {
        return n < 10 ? Math.round(n * 10) / 10 : Math.round(n); // g/ml → entero (o 1 decimal si es poquito)
    }
    // Contables (unidad, pan, huevo, cucharada, rebanada…) → entero, mínimo 1 si hay algo
    const r = Math.round(n);
    return (r < 1 && n > 0) ? 1 : r;
}
