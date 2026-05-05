let itemAEliminar = null;

function mostrarNotificacion(mensaje) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = "bg-slate-800 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300 pointer-events-auto border border-slate-700";
    toast.innerHTML = `
        <div class="w-6 h-6 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center font-bold italic text-xs">!</div>
        <div class="text-xs font-medium">${mensaje}</div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('animate-out', 'fade-out', 'slide-out-to-right');
        setTimeout(() => toast.remove(), 500);
    }, 5000);
}

async function cargarCategorias() {
    try {
        const data = await API.get('/categorias');
        const tbody = document.getElementById('tabla-categorias-mante');
        tbody.innerHTML = data.map(c => `
            <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-6 py-3 font-semibold text-slate-700 text-sm">${c.nombre_categoria}</td>
                <td class="px-6 py-3 text-center">
                    <button onclick="prepararEliminacion('categorias', ${c.id_categoria})" 
                            class="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                        <img src="img/papelera-de-reciclaje.png" alt="eliminar" class="w-3.5 h-3.5 opacity-70">
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error(e); }
}

async function cargarLaboratorios() {
    try {
        const data = await API.get('/laboratorios');
        const tbody = document.getElementById('tabla-laboratorios-mante');
        tbody.innerHTML = data.map(l => `
            <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-6 py-3 font-semibold text-slate-700 text-sm">${l.nombre_laboratorio}</td>
                <td class="px-6 py-3 text-center">
                    <button onclick="prepararEliminacion('laboratorios', ${l.id_laboratorio})" 
                            class="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                        <img src="img/papelera-de-reciclaje.png" alt="eliminar" class="w-3.5 h-3.5 opacity-70">
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error(e); }
}

window.prepararEliminacion = function(tipo, id) {
    itemAEliminar = { tipo, id };
    document.getElementById('modal-confirmar-eliminar').classList.replace('hidden', 'flex');
};

window.cerrarModalEliminar = function() {
    document.getElementById('modal-confirmar-eliminar').classList.replace('flex', 'hidden');
    itemAEliminar = null;
};

document.getElementById('btn-confirmar-delete').addEventListener('click', async () => {
    if (!itemAEliminar) return;
    const { tipo, id } = itemAEliminar;
    try {
        await API.delete(`/${tipo}/${id}`);
        mostrarNotificacion(`Registro de ${tipo} eliminado.`);
        cerrarModalEliminar();
        tipo === 'categorias' ? cargarCategorias() : cargarLaboratorios();
    } catch (err) {
        mostrarNotificacion(`Error: ${err.message}`);
        cerrarModalEliminar();
    }
});

document.getElementById('form-nueva-categoria').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('cat-nombre').value.trim();
    try {
        await API.post('/categorias', { nombre_categoria: nombre });
        mostrarNotificacion("Categoría agregada exitosamente.");
        e.target.reset();
        cargarCategorias();
    } catch (err) { mostrarNotificacion(err.message); }
});

document.getElementById('form-nuevo-laboratorio').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('lab-nombre').value.trim();
    try {
        await API.post('/laboratorios', { nombre_laboratorio: nombre });
        mostrarNotificacion("Laboratorio agregado exitosamente.");
        e.target.reset();
        cargarLaboratorios();
    } catch (err) { mostrarNotificacion(err.message); }
});

document.addEventListener('DOMContentLoaded', () => {
    cargarCategorias();
    cargarLaboratorios();
});