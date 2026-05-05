const formPerfil = document.getElementById('form-perfil');

async function cargarDatosPerfil() {
    try {
        const datos = await API.get('/usuarios/perfil/me');
        
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
            // Actualizamos el token y la sesión local
            localStorage.setItem('token_botica', res.token);
            const payloadBase64 = res.token.split('.')[1];
            const decoded = JSON.parse(atob(payloadBase64));
            
            localStorage.setItem('usuario_botica', JSON.stringify({
                id: decoded.id,
                nombre: decoded.nombre,
                rol: decoded.rol,
                username: decoded.username
            }));

            // Esperamos un momento para que los cambios se reflejen
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Si el menú lateral está renderizado, actualizamos el nombre visualmente
            const sidebarName = document.querySelector('.group\\/user p.text-sm.font-bold');
            const sidebarInitial = document.querySelector('.group\\/user div.w-6');
            if(sidebarName) sidebarName.textContent = decoded.nombre;
            if(sidebarInitial) sidebarInitial.textContent = decoded.nombre.charAt(0);
        }

        mostrarToast(res.mensaje, 'success');
        
        // Limpiamos los campos de contraseñas por seguridad
        document.getElementById('perfil-pass-actual').value = '';
        document.getElementById('perfil-pass-nueva').value = '';
        
        await cargarDatosPerfil();

    } catch (err) {
        mostrarToast(err.message, 'error');
    }
});

// Sistema de Notificaciones Flotantes (Toasts)
function mostrarToast(mensaje, tipo = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    // Determinamos colores e icono según si fue éxito o error
    const bgColors = tipo === 'success' ? 'bg-emerald-600' : 'bg-red-600';
    const icon = tipo === 'success' ? '✓' : '!';

    toast.className = `${bgColors} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300 pointer-events-auto`;
    toast.innerHTML = `
        <div class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center font-bold text-sm">${icon}</div>
        <div class="font-medium">${mensaje}</div>
    `;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('animate-out', 'fade-out', 'slide-out-to-right');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

document.addEventListener('DOMContentLoaded', cargarDatosPerfil);