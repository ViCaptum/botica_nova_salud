const API_URL = '/api';

async function hacerPeticion(endpoint, metodo = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json'
    };

    const token = localStorage.getItem('token_botica');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method: metodo,
        headers: headers
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);

        if ((response.status === 401 || response.status === 403) && !endpoint.includes('/login')) {
            // Solo expulsar si no estamos intentando actualizar el perfil
            if (!endpoint.includes('/perfil/me')) {
                alert('Tu sesión ha expirado o no tienes permisos.');
                localStorage.removeItem('token_botica');
                localStorage.removeItem('usuario_botica');
                window.location.href = 'index.html';
                throw new Error('No autorizado');
            }
        }
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error del servidor');
        }

        if (data.ok !== undefined) {
            return data.data;
        }

        return data;

    } catch (error) {
        console.error(`Error en API (${metodo} ${endpoint}):`, error);
        throw error;
    }
}

window.API = {
    get: (endpoint) => hacerPeticion(endpoint, 'GET'),
    post: (endpoint, body) => hacerPeticion(endpoint, 'POST', body),
    put: (endpoint, body) => hacerPeticion(endpoint, 'PUT', body),
    delete: (endpoint) => hacerPeticion(endpoint, 'DELETE')
};
