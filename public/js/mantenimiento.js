// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    cargarCategorias();
    cargarLaboratorios();
});

async function cargarCategorias() {
    try {
        const data = await API.get('/categorias');
        const tbody = document.getElementById('tabla-categorias-mante');
        tbody.innerHTML = data.map(c => `<tr><td>${c.nombre_categoria}</td></tr>`).join('');
    } catch (e) { console.error(e); }
}

async function cargarLaboratorios() {
    try {
        const data = await API.get('/laboratorios');
        const tbody = document.getElementById('tabla-laboratorios-mante');
        tbody.innerHTML = data.map(l => `<tr><td>${l.nombre_laboratorio}</td></tr>`).join('');
    } catch (e) { console.error(e); }
}

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