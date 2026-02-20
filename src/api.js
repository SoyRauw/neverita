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

// Puedes ir agregando más servicios aquí conforme vayas conectando
// por ejemplo: ingredientsService, menuPlansService, etc.

export const authService = {
    /**
     * Inicia sesión con usuario y contraseña
     */
    login: (username, password) => fetchAPI('/users/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    }),

    /**
     * Registra un nuevo usuario
     */
    register: (userData) => fetchAPI('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
    }),
};

