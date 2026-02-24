const API_BASE_URL = 'http://localhost:3000';

/**
 * Función genérica para hacer peticiones al backend.
 * 
 * @param {string} endpoint - La ruta del backend (ej. '/families')
 * @param {object} options - Opciones para fetch (método, headers, body)
 * @returns {Promise<any>} - La respuesta parseada de JSON
 */
async function fetchAPI(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, config);
        if (!response.ok) {
            // Intentar extraer el mensaje de error del backend
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.error) {
                    errorMessage = errorData.error;
                }
            } catch (e) {
                // Ignorar si no se puede parsear a JSON
            }
            throw new Error(errorMessage);
        }

        // Si la respuesta es 204 No Content, no intentar parsear JSON
        if (response.status === 204) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error(`Error en la petición a ${endpoint}:`, error);
        throw error;
    }
}

// ============================================
// SERVICIOS ESPECÍFICOS DE LA API
// ============================================

export const familiesService = {
    /**
     * Obtiene todas las familias
     */
    getAll: () => fetchAPI('/families'),

    /**
     * Obtiene una familia por ID
     */
    getById: (id) => fetchAPI(`/families/${id}`),

    /**
     * Crea una nueva familia
     */
    create: (familyData) => fetchAPI('/families', {
        method: 'POST',
        body: JSON.stringify(familyData),
    }),

    /**
     * Actualiza una familia
     */
    update: (id, familyData) => fetchAPI(`/families/${id}`, {
        method: 'PUT',
        body: JSON.stringify(familyData),
    }),

    /**
     * Elimina una familia
     */
    delete: (id) => fetchAPI(`/families/${id}`, {
        method: 'DELETE',
    }),
};

export const authService = {
    login: (username, password) => fetchAPI('/users/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    }),
    register: (userData) => fetchAPI('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
    }),
};

export const ingredientsService = {
    getAll: () => fetchAPI('/ingredients'),
};

export const inventoryService = {
    getByFamily: (familyId) => fetchAPI(`/inventory?family_id=${familyId}`),
    getAll: () => fetchAPI('/inventory'),
    create: (data) => fetchAPI('/inventory', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    delete: (id) => fetchAPI(`/inventory/${id}`, { method: 'DELETE' }),
};

export const recipesService = {
    getAll: () => fetchAPI('/recipes'),
    create: (data) => fetchAPI('/recipes', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    delete: (id) => fetchAPI(`/recipes/${id}`, { method: 'DELETE' }),
};

export const menuPlansService = {
    /** Obtiene planes de menú filtrados por usuario */
    getByUser: (userId) => fetchAPI(`/menu-plans?created_by=${userId}`),
    /** Crea un nuevo plan de menú */
    create: (data) => fetchAPI('/menu-plans', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
};

export const dailyMealsService = {
    /** Obtiene todas las comidas de un plan (con datos de la receta) */
    getByPlan: (menuPlanId) => fetchAPI(`/daily-meals?menu_plan_id=${menuPlanId}`),
    /** Guarda una receta en un slot día/comida (upsert en el backend) */
    save: (data) => fetchAPI('/daily-meals', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    /** Elimina una comida del plan */
    delete: (dailyMealId) => fetchAPI(`/daily-meals/${dailyMealId}`, { method: 'DELETE' }),
};

