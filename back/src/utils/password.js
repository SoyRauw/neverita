import bcrypt from 'bcryptjs';

const ROUNDS = 10;

// ¿La cadena guardada ya es un hash bcrypt? (empieza por $2a$/$2b$/$2y$)
export const looksHashed = (value) =>
    typeof value === 'string' && /^\$2[aby]\$/.test(value);

// Hashea una contraseña en claro
export const hashPassword = (plain) => bcrypt.hash(String(plain), ROUNDS);

/**
 * Verifica una contraseña contra lo guardado.
 * Compatibiliza cuentas antiguas guardadas en texto plano:
 * si lo guardado no es un hash, compara directamente (para migrar al iniciar sesión).
 */
export const verifyPassword = async (plain, stored) => {
    if (stored == null) return false;
    if (looksHashed(stored)) return bcrypt.compare(String(plain), stored);
    return String(plain) === String(stored); // cuenta antigua en texto plano
};

/**
 * Reglas mínimas de contraseña (mismas que el frontend):
 * 8+ caracteres, al menos una letra y un número.
 * Devuelve un array de problemas (vacío = válida).
 */
export const passwordIssues = (pw) => {
    const value = String(pw || '');
    const issues = [];
    if (value.length < 8) issues.push('mínimo 8 caracteres');
    if (!/[a-zA-Z]/.test(value)) issues.push('al menos una letra');
    if (!/[0-9]/.test(value)) issues.push('al menos un número');
    return issues;
};
