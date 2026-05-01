const formPerfil = document.getElementById('form-perfil');
const msgPerfil = document.getElementById('msg-perfil');

async function cargarDatosPerfil() {
    try {
        const datos = await API.get('/usuarios/perfil/me');
        document.getElementById('perfil-nombre').textContent = `${datos.nombre} ${datos.apellidos}`;
        document.getElementById('perfil-rol').textContent = datos.rol === 1 ? 'Administrador' : 'Vendedor';
        
        // Cargar el username en el input para que pueda editarlo
        document.getElementById('perfil-username-input').value = datos.username;
        document.getElementById('perfil-correo').value = datos.correo || '';
        document.getElementById('perfil-telefono').value = datos.telefono || '';
    } catch (e) { console.error(e); }
}

formPerfil.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        username: document.getElementById('perfil-username-input').value.trim(),
        correo: document.getElementById('perfil-correo').value.trim(),
        telefono: document.getElementById('perfil-telefono').value.trim(),
        password_actual: document.getElementById('perfil-pass-actual').value,
        password_nueva: document.getElementById('perfil-pass-nueva').value
    };

    try {
        const res = await API.put('/usuarios/perfil/me', payload);
        mostrarMensaje(`✅ ${res.mensaje}`, true);
        
        // Limpiar campos de clave
        document.getElementById('perfil-pass-actual').value = '';
        document.getElementById('perfil-pass-nueva').value = '';
        
        // Recargamos datos para confirmar cambios
        cargarDatosPerfil(); 
    } catch (err) {
        mostrarMensaje(`❌ ${err.message}`, false); // Aquí saltará el "Usuario ya en uso" si MySQL detecta el duplicado[cite: 30]
    }
});

function mostrarMensaje(texto, esExito) {
    msgPerfil.innerHTML = texto;
    msgPerfil.style.backgroundColor = esExito ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
    msgPerfil.style.color = esExito ? 'var(--exito)' : 'var(--error)';
    msgPerfil.style.border = `1px solid ${esExito ? 'var(--exito)' : 'var(--error)'}`;
    msgPerfil.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', cargarDatosPerfil);