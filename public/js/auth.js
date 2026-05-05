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
                msgError.classList.remove('hidden');
                return;
            }

            localStorage.setItem('token_botica', data.token);
            
            const payloadBase64 = data.token.split('.')[1];
            const payloadDecodificado = JSON.parse(atob(payloadBase64));
            
            localStorage.setItem('usuario_botica', JSON.stringify({
                id: payloadDecodificado.id,
                nombre: payloadDecodificado.nombre,
                rol: payloadDecodificado.rol,
                username: payloadDecodificado.username
            }));

            window.location.href = 'dashboard.html';
        } catch (error) {
            msgError.textContent = "Error de conexión.";
            msgError.classList.remove('hidden');
        }
    });
}

if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
    const usuarioStr = localStorage.getItem('usuario_botica');
    const usuario = usuarioStr ? JSON.parse(usuarioStr) : { nombre: 'Desconocido', rol: 2 };
    const nombreRol = usuario.rol === 1 ? 'ADMIN' : 'VENDEDOR';
    
    const sidebarHTML = `
        <button id="mobile-menu-btn" class="fixed top-4 left-4 z-50 p-2 bg-emerald-600 text-white rounded-lg lg:hidden shadow-lg">
            <span class="text-xl">☰</span>
        </button>

        <aside id="sidebar-menu" 
            class="fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-200 shadow-xl lg:shadow-none transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden group 
                   w-[260px] -translate-x-full lg:translate-x-0 lg:w-[72px] lg:hover:w-[260px]">
            
            <div class="flex flex-col h-full">
                <!-- Logo Area -->
                <div class="p-5 border-b border-slate-100 flex items-center gap-5 bg-slate-50/50 overflow-hidden min-h-[73px]">
                    <img src="img/menu.png" alt="menu" class="w-7 h-7 min-w-[28px] object-contain">
                    <h1 class="text-xl font-bold text-emerald-600 tracking-tight whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">Nova Salud</h1>
                </div>

                <nav class="flex-grow p-3 overflow-y-auto overflow-x-hidden">
                    <ul class="space-y-1">
                        <li><a href="dashboard.html" class="flex items-center gap-5 px-3 py-3 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all group/item font-medium whitespace-nowrap">
                            <img src="img/pagina-de-inicio.png" alt="inicio" class="w-6 h-6 min-w-[24px] opacity-70 group-hover/item:opacity-100"> 
                            <span class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">Inicio</span></a></li>
                        
                        <li><a href="ventas.html" class="flex items-center gap-5 px-3 py-3 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all group/item font-medium whitespace-nowrap">
                            <img src="img/cajero-automatico.png" alt="ventas" class="w-6 h-6 min-w-[24px] opacity-70 group-hover/item:opacity-100"> 
                            <span class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">Caja (Ventas)</span></a></li>
                        
                        <li><a href="inventario.html" class="flex items-center gap-5 px-3 py-3 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all group/item font-medium whitespace-nowrap">
                            <img src="img/inventario.png" alt="inventario" class="w-6 h-6 min-w-[24px] opacity-70 group-hover/item:opacity-100"> 
                            <span class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">Inventario</span></a></li>
                        
                        ${usuario.rol === 1 ? `
                            <div class="pt-4 pb-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Admin</div>
                            <li><a href="empleados.html" class="flex items-center gap-5 px-3 py-3 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all group/item font-medium whitespace-nowrap">
                                <img src="img/jefe-de-equipo.png" alt="empleados" class="w-6 h-6 min-w-[24px] opacity-70 group-hover/item:opacity-100"> 
                                <span class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">Empleados</span></a></li>
                            <li><a href="mantenimiento.html" class="flex items-center gap-5 px-3 py-3 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all group/item font-medium whitespace-nowrap">
                                <img src="img/catalogar.png" alt="catalogo" class="w-6 h-6 min-w-[24px] opacity-70 group-hover/item:opacity-100"> 
                                <span class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">Catálogo</span></a></li>
                            <li><a href="historial-ventas.html" class="flex items-center gap-5 px-3 py-3 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all group/item font-medium whitespace-nowrap">
                                <img src="img/historial-de-transacciones.png" alt="Historial" class="w-6 h-6 min-w-[24px] opacity-70 group-hover/item:opacity-100"> 
                                <span class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">Historial</span></a></li>
                        ` : ''}
                    </ul>
                </nav>

                <div class="p-3 border-t border-slate-100 bg-slate-50/50">
                    <a href="perfil.html" class="flex items-center gap-5 p-3 rounded-xl hover:bg-white transition-colors group/user overflow-hidden">
                        <div class="w-6 min-w-[24px] h-6 bg-emerald-100 rounded-full flex items-center justify-center text-[10px] font-bold text-emerald-700">
                            ${usuario.nombre.charAt(0)}
                        </div>
                        <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                            <p class="text-sm font-bold text-slate-700">${usuario.nombre}</p>
                            <p class="text-[10px] font-black text-emerald-500 uppercase">${nombreRol}</p>
                        </div>
                    </a>
                    <button id="btn-logout" class="w-full mt-2 flex items-center gap-5 px-3 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-semibold text-sm whitespace-nowrap">
                        <img src="img/cerrar-sesion.png" alt="cerrar" class="w-5 h-5 min-w-[20px] opacity-80"> 
                        <span class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">Cerrar Sesión</span>
                    </button>
                </div>
            </div>
        </aside>
    `;

    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);

    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.classList.add('transition-all', 'duration-300', 'lg:ml-[72px]');
        
        const sidebar = document.getElementById('sidebar-menu');
        sidebar.addEventListener('mouseenter', () => {
            if (window.innerWidth >= 1024) mainContent.style.marginLeft = '260px';
        });
        sidebar.addEventListener('mouseleave', () => {
            if (window.innerWidth >= 1024) mainContent.style.marginLeft = '72px';
        });
    }

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