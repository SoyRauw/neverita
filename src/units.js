// Formateo inteligente de cantidades + unidades para toda la app.
//  - Quita ceros de más: 250.00 -> 250, 1.50 -> 1.5
//  - Escala a la unidad grande cuando corresponde: 1000 g -> 1 kg, 1000 ml -> 1 L
//  - Valida que la cantidad sea sensata (no 1 millón de litros)

// Limpia un número: sin ceros de cola, máx 2 decimales.
const cleanNum = (n) => {
    const num = Number(n);
    if (!Number.isFinite(num)) return String(n ?? '').trim();
    return String(parseFloat(num.toFixed(2)));
};

const norm = (unit) => (unit || '').toLowerCase().trim();

/** Devuelve "250 g", "1.5 kg", "1 L", "2 unidades"… ya normalizado y bonito. */
export function formatQty(qty, unit) {
    const n = Number(qty);
    const u = norm(unit);
    if (!Number.isFinite(n)) return `${qty ?? ''} ${unit || ''}`.trim();

    // Gramos -> kg desde 1000
    if (['g', 'gr', 'gramo', 'gramos'].includes(u)) {
        return n >= 1000 ? `${cleanNum(n / 1000)} kg` : `${cleanNum(n)} g`;
    }
    // Mililitros -> L desde 1000
    if (['ml', 'mililitro', 'mililitros'].includes(u)) {
        return n >= 1000 ? `${cleanNum(n / 1000)} L` : `${cleanNum(n)} ml`;
    }
    // Ya grandes
    if (['kg', 'kilo', 'kilos', 'kilogramo', 'kilogramos'].includes(u)) return `${cleanNum(n)} kg`;
    if (['l', 'lt', 'litro', 'litros'].includes(u)) return `${cleanNum(n)} L`;

    // Contables / otras: solo limpiar el número.
    const label = (unit || '').trim();
    return label ? `${cleanNum(n)} ${label}` : cleanNum(n);
}

/** Tope sensato por unidad, para validar la entrada del usuario. */
export function maxReasonable(unit) {
    const u = norm(unit);
    if (['g', 'gr', 'gramo', 'gramos', 'ml', 'mililitro', 'mililitros'].includes(u)) return 50000; // 50 kg / 50 L
    if (['kg', 'kilo', 'kilos', 'kilogramo', 'kilogramos', 'l', 'lt', 'litro', 'litros'].includes(u)) return 50; // 50 kg / 50 L
    return 1000; // contables (unidad, paquete, etc.)
}

/** true si la cantidad es > 0 y no supera el tope sensato de su unidad. */
export function isReasonableQty(qty, unit) {
    const n = Number(qty);
    if (!Number.isFinite(n) || n <= 0) return false;
    return n <= maxReasonable(unit);
}
