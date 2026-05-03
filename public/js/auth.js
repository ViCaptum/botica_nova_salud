// 1. EL GUARDIA DE SEGURIDAD GLOBAL
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

// 2. LÓGICA DEL LOGIN
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
// 3. INYECTAR SIDEBAR DINÁMICAMENTE
// ==========================================
if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
    
    const usuarioStr = localStorage.getItem('usuario_botica');
    const usuario = usuarioStr ? JSON.parse(usuarioStr) : { nombre: 'Desconocido', rol: 2 };
    const nombreRol = usuario.rol === 1 ? 'ADMIN' : 'VENDEDOR';
    
    const sidebarHTML = `
        <button id="mobile-menu-btn" class="mobile-menu-btn">☰</button>

        <aside class="sidebar" id="sidebar-menu">
            <div class="logo-area" style="margin-bottom: 30px; display: flex; align-items: center; padding: 0 18px;">
                <span style="font-size: 1.5em; color: var(--color-primario); min-width: 30px; cursor: pointer;"><img src="img/menu.png" alt="empleadps" class="icons-md"></span>
                <h1 class="user-details" style="font-size: 1.2em; margin-left: 20px; color: white;">Nova Salud</h1>
            </div>

            <nav class="sidebar-nav" style="flex-grow: 1;">
                <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 5px;">
                    <li><a href="dashboard.html" class="nav-item"><img src="img/pagina-de-inicio.png" alt="inicio" class="icons-md"> <span>Inicio</span></a></li>
                    <li><a href="ventas.html" class="nav-item"><img src="img/cajero-automatico.png" alt="ventas" class="icons-md"> <span>Caja (Ventas)</span></a></li>
                    <li><a href="inventario.html" class="nav-item"><img src="img/inventario.png" alt="inventario" class="icons-md"> <span>Inventario</span></a></li>
                    ${usuario.rol === 1 ? `
                        <li><a href="empleados.html" class="nav-item"><img src="img/jefe-de-equipo.png" alt="empleadps" class="icons-md"> <span>Empleados</span></a></li>
                        <li><a href="mantenimiento.html" class="nav-item"><img src="img/catalogar.png" alt="catalgo" class="icons-md"> <span>catalogo</span></a></li>
                        <li><a href="historial-ventas.html" class="nav-item"><img src="img/historial-de-transacciones.png" alt="Historial" class="icons-md"> <span>Historial</span></a></li>
                    ` : ''}
                    <li><a href="perfil.html" class="nav-item"><img src="img/perfil-del-usuario.png" alt="perfil" class="icons-md"> <span>Mi Perfil</span></a></li>
                </ul>
            </nav>

            <div class="sidebar-footer" style="border-top: 1px solid var(--borde); padding-top: 15px; margin-top: auto;">
                <!-- Ajuste: Hacer clic en el usuario lleva al perfil -->
                <a href="perfil.html" class="user-details" style="margin-bottom: 10px; text-align: center; font-size: 0.85em; display: block; text-decoration: none; color: inherit;">
                    <p><strong>${usuario.nombre}</strong></p>
                    <p style="color: var(--color-primario); font-size: 0.8em; font-weight: bold;">${nombreRol}</p>
                </a>
                <button id="btn-logout" class="logout-item" title="Cerrar Sesión">
                    <img src="img/cerrar-sesion.png" alt="cerrar" class="btn-icon"> <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    `;

    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);

    // --- Lógica del Menú Móvil ---
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar-menu');

    if (mobileMenuBtn && sidebar) {
        // Al hacer hover en el botón flotante, aparece el menú
        mobileMenuBtn.addEventListener('mouseenter', () => {
            sidebar.classList.add('activa');
        });
        
        // Alternativa táctil (clic)
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('activa');
        });

        // Al salir el mouse de toda la barra lateral, se esconde sola
        sidebar.addEventListener('mouseleave', () => {
            if(window.innerWidth <= 800) {
                sidebar.classList.remove('activa');
            }
        });
    }

    // --- Lógica de Logout ---
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