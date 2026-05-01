// ==========================================
// MOTOR CENTRAL DE PETICIONES (API FETCH)
// ==========================================

const API_URL = '/api'; // La raíz de nuestro backend

// Función maestra para hacer peticiones
async function hacerPeticion(endpoint, metodo = 'GET', body = null) {
    // 1. Preparamos los headers básicos
    const headers = {
        'Content-Type': 'application/json'
    };

    // 2. Inyectamos el Token de Seguridad si existe
    const token = localStorage.getItem('token_botica');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // 3. Configuramos la petición
    const config = {
        method: metodo,
        headers: headers
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        // 4. Disparamos la petición al servidor
        const response = await fetch(`${API_URL}${endpoint}`, config);
        const data = await response.json();

        // 5. Interceptamos errores críticos de seguridad (Token vencido o sin permisos)
        if (response.status === 401 || response.status === 403) {
            alert('Tu sesión ha expirado o no tienes los permisos necesarios.');
            localStorage.removeItem('token_botica');
            localStorage.removeItem('usuario_botica');
            window.location.href = 'index.html';
            throw new Error('No autorizado');
        }

        // 6. Manejamos errores normales de la API (ej. DNI duplicado, sin stock)
        if (!response.ok) {
            throw new Error(data.error || 'Error desconocido en el servidor');
        }

        return data; // Si todo salió bien, devolvemos los datos limpios

    } catch (error) {
        console.error(`Error en API (${metodo} ${endpoint}):`, error);
        throw error; // Relanzamos el error para que el JS de la vista lo maneje (mostrar una alerta, etc.)
    }
}

// 7. Exponemos un objeto global "API" para usarlo fácilmente en otros archivos
window.API = {
    get: (endpoint) => hacerPeticion(endpoint, 'GET'),
    post: (endpoint, body) => hacerPeticion(endpoint, 'POST', body),
    put: (endpoint, body) => hacerPeticion(endpoint, 'PUT', body),
    delete: (endpoint) => hacerPeticion(endpoint, 'DELETE')
};