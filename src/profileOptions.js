// Opciones de preferencias alimentarias (Bloque 2) — compartidas entre el
// onboarding (Auth) y la edición de perfil (FamilyManager). Los `value` deben
// coincidir con los que valida el backend en /users/:id/profile.

export const DIET_OPTS = [
    { value: 'omnivoro', label: 'Omnívoro' },
    { value: 'vegetariano', label: 'Vegetariano' },
    { value: 'vegano', label: 'Vegano' },
    { value: 'pescetariano', label: 'Pescetariano' },
    { value: 'keto', label: 'Keto' },
];

export const GOAL_OPTS = [
    { value: 'bajar', label: 'Bajar de peso' },
    { value: 'mantener', label: 'Mantenerme' },
    { value: 'ganar', label: 'Ganar músculo' },
];

export const RESTRICTION_OPTS = [
    { value: 'gluten', label: 'Sin gluten' },
    { value: 'lactosa', label: 'Sin lactosa' },
    { value: 'frutos_secos', label: 'Sin frutos secos' },
    { value: 'mariscos', label: 'Sin mariscos' },
    { value: 'huevo', label: 'Sin huevo' },
    { value: 'cerdo', label: 'Sin cerdo' },
    { value: 'azucar', label: 'Sin azúcar' },
    { value: 'halal', label: 'Halal' },
    { value: 'kosher', label: 'Kosher' },
];

export const dietLabel = (v) => DIET_OPTS.find(o => o.value === v)?.label || null;
export const goalLabel = (v) => GOAL_OPTS.find(o => o.value === v)?.label || null;
export const restrictionLabel = (v) => RESTRICTION_OPTS.find(o => o.value === v)?.label || v;
