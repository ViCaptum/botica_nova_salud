// ==========================================
// 1. EL GUARDIA DE SEGURIDAD GLOBAL[cite: 32]
// ==========================================
function protegerRutas() {
    const paginaActual = window.location.pathname;
    const token = localStorage.getItem('token_botica');

    if (paginaActual === '/' || paginaActual.includes('index.html')) {
        if (token) window.location.href = 'dashboard.html';
        return;
    }

    if (!token) window.location.href = 'index.html';
}
protegerRutas();

// 2. LÓGICA DEL LOGIN (Sin cambios para no romper el acceso)[cite: 32]
const formLogin = document.getElementById('form-login');
if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const msgError = document.getElementById('msg-error-login');

        try {
            const response = await fetch('/api/usuarios/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();

            if (!response.ok) {
                msgError.textContent = data.error;
                msgError.style.display = 'block';
                return;
            }

            localStorage.setItem('token_botica', data.token);
            const payloadBase64 = data.token.split('.')[1];
            const payloadDecodificado = JSON.parse(atob(payloadBase64));
            
            localStorage.setItem('usuario_botica', JSON.stringify({
                id: payloadDecodificado.id,
                nombre: payloadDecodificado.nombre,
                rol: payloadDecodificado.rol
            }));

            window.location.href = 'dashboard.html';
        } catch (error) {
            msgError.textContent = "Error de conexión con el servidor.";
            msgError.style.display = 'block';
        }
    });
}

// ==========================================
// 3. INYECTAR LA CABECERA CON EL LAYOUT CORREGIDO[cite: 32, 33]
// ==========================================
if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
    
    const usuarioStr = localStorage.getItem('usuario_botica');
    const usuario = usuarioStr ? JSON.parse(usuarioStr) : { nombre: 'Desconocido', rol: 2 };
    const nombreRol = usuario.rol === 1 ? 'ADMINISTRADOR' : 'VENDEDOR';
    
    const headerHTML = `
        <header style="flex-direction: column; align-items: flex-start; gap: 20px;">
            <!-- Fila Superior: Logo y Perfil -->
            <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                <div class="logo-area">
                    <h1 style="margin: 0; font-size: 2.5em;">
                        <span style="color: var(--color-primario);">Nova Salud</span>
                    </h1>
                </div>
                
                <div class="user-info-area" style="background-color: var(--bg-input); padding: 12px 20px; border-radius: 12px; border: 1px solid var(--borde); box-shadow: 0 4px 10px rgba(0,0,0,0.3); min-width: 200px; text-align: center;">
                    <p style="margin: 0 0 5px 0;">👤 <strong>${usuario.nombre}</strong></p>
                    <p style="font-size: 0.8em; color: var(--color-primario); font-weight: bold; margin-bottom: 10px;">${nombreRol}</p>
                    <button id="btn-logout" style="background-color: var(--error); color: white; padding: 8px 15px; border-radius: 6px; border: none; cursor: pointer; width: 100%; font-weight: bold; transition: opacity 0.2s;">Cerrar Sesión</button>
                </div>
            </div>

            <!-- Fila Inferior: Navegación corregida[cite: 32, 33] -->
            <nav style="width: 100%; border-top: 1px solid var(--borde); padding-top: 15px;">
                <ul style="list-style: none; display: flex; flex-wrap: wrap; gap: 10px; margin: 0; padding: 0;">
                    <li><a href="dashboard.html" class="nav-item">🏠 Inicio</a></li>
                    <li><a href="ventas.html" class="nav-item">🛒 Caja (Ventas)</a></li>
                    <li><a href="inventario.html" class="nav-item">📦 Inventario</a></li>
                    ${usuario.rol === 1 ? `
                        <li><a href="empleados.html" class="nav-item">👥 Empleados</a></li>
                        <li><a href="mantenimiento.html" class="nav-item">🛠️ Mantenimiento</a></li>
                        <li><a href="historial-ventas.html" class="nav-item">📊 Historial</a></li>
                    ` : ''}
                </ul>
            </nav>
        </header>
    `;

    document.body.insertAdjacentHTML('afterbegin', headerHTML);

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (confirm("¿Estás seguro que deseas cerrar sesión?")) {
                localStorage.removeItem('token_botica');
                localStorage.removeItem('usuario_botica');
                window.location.href = 'index.html';
            }
        });
    }
}