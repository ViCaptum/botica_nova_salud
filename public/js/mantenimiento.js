// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    cargarCategorias();
    cargarLaboratorios();
});

async function cargarCategorias() {
    try {
        const data = await API.get('/categorias'); //[cite: 29]
        const tbody = document.getElementById('tabla-categorias-mante'); //[cite: 29]
        tbody.innerHTML = data.map(c => `
            <tr>
                <td>${c.nombre_categoria}</td>
                <td style="text-align: center;">
                    <button onclick="eliminarItem('categorias', ${c.id_categoria})" 
                            style="background: transparent; color: var(--error); border: 1px solid var(--error); padding: 5px 8px; font-size: 0.8em;">
                        <img src="img/papelera-de-reciclaje.png" alt="editar" class="btn-icon">
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error(e); }
}

async function cargarLaboratorios() {
    try {
        const data = await API.get('/laboratorios'); //[cite: 29]
        const tbody = document.getElementById('tabla-laboratorios-mante'); //[cite: 29]
        tbody.innerHTML = data.map(l => `
            <tr>
                <td>${l.nombre_laboratorio}</td>
                <td style="text-align: center;">
                    <button onclick="eliminarItem('laboratorios', ${l.id_laboratorio})" 
                            style="background: transparent; color: var(--error); border: 1px solid var(--error); padding: 5px 8px; font-size: 0.8em;">
                        <img src="img/papelera-de-reciclaje.png" alt="editar" class="btn-icon">
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error(e); }
}

// Nueva función genérica para eliminar
window.eliminarItem = async function(tipo, id) {
    if (!confirm(`¿Estás seguro de eliminar este registro de ${tipo}?`)) return;
    
    try {
        await API.delete(`/${tipo}/${id}`);
        alert("Eliminado correctamente");
        tipo === 'categorias' ? cargarCategorias() : cargarLaboratorios(); //[cite: 29]
    } catch (err) {
        alert(err.message);
    }
};

// Eventos de guardado
document.getElementById('form-nueva-categoria').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('cat-nombre').value;
    try {
        await API.post('/categorias', { nombre_categoria: nombre });
        alert("Categoría agregada");
        e.target.reset();
        cargarCategorias();
    } catch (err) { alert(err.message); }
});

document.getElementById('form-nuevo-laboratorio').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('lab-nombre').value;
    try {
        await API.post('/laboratorios', { nombre_laboratorio: nombre });
        alert("Laboratorio agregado");
        e.target.reset();
        cargarLaboratorios();
    } catch (err) { alert(err.message); }
});