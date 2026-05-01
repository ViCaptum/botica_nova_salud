// Capturamos el formulario de la vista empleados.html
const formRegistro = document.getElementById('form-registro');

if (formRegistro) {
    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evitamos que la página recargue

        const msgError = document.getElementById('msg-error-registro');
        const msgExito = document.getElementById('msg-exito-registro');
        
        // Limpiamos mensajes previos
        msgError.style.display = 'none';
        msgExito.style.display = 'none';

        // Armamos el payload exacto que espera tu backend
        const payload = {
            nombre: document.getElementById('reg-nombre').value.trim(),
            apellidos: document.getElementById('reg-apellidos').value.trim(),
            correo: document.getElementById('reg-correo').value.trim(),
            telefono: document.getElementById('reg-telefono').value.trim(),
            id_rol: parseInt(document.getElementById('reg-rol').value),
            username: document.getElementById('reg-username').value.trim(),
            password: document.getElementById('reg-password').value
        };

        try {
            // Usamos nuestro motor central (api.js) para hacer el POST
            const resultado = await API.post('/usuarios/registro', payload);
            
            // Si todo sale bien
            msgExito.textContent = `¡Éxito! ${resultado.mensaje} (ID: ${resultado.id_usuario})`;
            msgExito.style.display = 'block';
            
            // Limpiamos el formulario para el siguiente registro
            formRegistro.reset();

        } catch (error) {
            // Si el backend lanza error (ej. Usuario duplicado)
            msgError.textContent = `Error: ${error.message}`;
            msgError.style.display = 'block';
        }
    });
}