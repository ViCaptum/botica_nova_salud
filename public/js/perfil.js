const formPerfil = document.getElementById('form-perfil');
const msgPerfil = document.getElementById('msg-perfil');

async function cargarDatosPerfil() {
    try {
        const datos = await API.get('/usuarios/perfil/me')
        
        if (datos) {
            document.getElementById('perfil-nombre').textContent = `${datos.nombre} ${datos.apellidos}`;
            document.getElementById('perfil-rol').textContent = (datos.id_rol === 1) ? 'Administrador' : 'Vendedor';
            document.getElementById('perfil-username-input').value = datos.username || '';
            document.getElementById('perfil-correo').value = datos.correo || '';
            document.getElementById('perfil-telefono').value = datos.telefono || '';
        }
    } catch (e) { 
        console.error("Error al cargar perfil:", e); 
    }
}

formPerfil.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const payload = {
        username: document.getElementById('perfil-username-input').value.trim(),
        telefono: document.getElementById('perfil-telefono').value.trim(),
        password_actual: document.getElementById('perfil-pass-actual').value,
        password_nueva: document.getElementById('perfil-pass-nueva').value
    };

    try {
        const res = await API.put('/usuarios/perfil/me', payload);
        
        if (res.token) {
            localStorage.setItem('token_botica', res.token);
            const payloadBase64 = res.token.split('.')[1];
            const decoded = JSON.parse(atob(payloadBase64));
            localStorage.setItem('usuario_botica', JSON.stringify({
                id: decoded.id,
                nombre: decoded.nombre,
                rol: decoded.rol
            }));

            await new Promise(resolve => setTimeout(resolve, 300));
        }

        mostrarMensaje(`✅ ${res.mensaje}`, true);
        await cargarDatosPerfil();

    } catch (err) {
        mostrarMensaje(`❌ ${err.message}`, false);
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