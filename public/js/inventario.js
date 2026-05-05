const tbodyProductos = document.getElementById('tabla-productos-body');
const selectTipo = document.getElementById('select-tipo');
const inputBuscarInv = document.getElementById('input-buscar');

const btnNuevo = document.getElementById('btn-nuevo-producto');
const modalProducto = document.getElementById('modal-producto');
const formProducto = document.getElementById('form-producto');
const tituloFormulario = document.getElementById('titulo-formulario');

const usuario = JSON.parse(localStorage.getItem('usuario_botica') || '{}');
const esAdmin = usuario.rol === 1;

const contenedorAlertas = document.getElementById('alertas-stock');

if (esAdmin && btnNuevo) {
    btnNuevo.classList.remove('hidden');
    btnNuevo.classList.add('flex');
}

async function cargarInventarioCompleto() {
    const buscar = inputBuscarInv.value.trim();
    const tipo = selectTipo.value;
    
    let endpoint = '/inventario?';
    if (buscar) endpoint += `buscar=${encodeURIComponent(buscar)}&`;
    if (tipo !== 'todos') endpoint += `tipo=${tipo}`;

    try {
        const productos = await API.get(endpoint);
        renderizarTablaInventario(productos);
    } catch (error) {
        console.error(error);
    }
}

function renderizarTablaInventario(productos) {
    tbodyProductos.innerHTML = '';
    
    if (!productos || productos.length === 0) {
        tbodyProductos.innerHTML = '<tr><td colspan="8" class="py-12 text-center text-slate-400 italic">No se encontraron productos en el catálogo.</td></tr>';
        return;
    }

    productos.forEach(prod => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50/50 transition-colors border-b border-slate-100";
        
        let botonesAccion = '';
        if (esAdmin) {
            const prodData = encodeURIComponent(JSON.stringify(prod));
            botonesAccion = `
                <div class="flex gap-2 justify-center">
                    <button onclick="editarProducto('${prodData}')" class="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm group">
                        <img src="img/editar.png" alt="editar" class="w-4 h-4 transition-all group-hover:brightness-0 group-hover:invert">
                    </button>
                    <button onclick="eliminarProducto(${prod.id_producto})" class="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm group">
                        <img src="img/papelera-de-reciclaje.png" alt="eliminar" class="w-4 h-4 transition-all group-hover:brightness-0 group-hover:invert">
                    </button>
                </div>
            `;
        } else {
            botonesAccion = '<span class="text-slate-400 text-[10px] font-bold uppercase tracking-tighter">Solo Lectura</span>';
        }

        const stockBajo = prod.stock_actual <= (prod.stock_minimo || 5);

        tr.innerHTML = `
            <td class="px-6 py-4 font-mono text-xs text-slate-400">${prod.codigo_barras || '-'}</td>
            <td class="px-6 py-4 font-semibold text-slate-700">${prod.nombre_producto}</td>
            <td class="px-6 py-4 text-center">
                <div class="text-sm font-medium text-slate-700">${prod.nombre_categoria || '-'}</div>
            </td>
            <td class="px-6 py-4 text-center text-xs text-slate-500 italic">${prod.nombre_laboratorio || '-'}</td>
            <td class="px-6 py-4 text-center">
                <span class="px-2 py-1 rounded-md text-[10px] font-black uppercase ${prod.es_generico ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}">
                    ${prod.es_generico ? 'Genérico' : 'Marca'}
                </span>
            </td>
            <td class="px-6 py-4 text-center font-bold text-emerald-600">S/ ${parseFloat(prod.precio_venta).toFixed(2)}</td>
            <td class="px-6 py-4 text-center">
                <span class="${stockBajo ? 'text-red-600 font-black animate-pulse' : 'text-slate-700 font-bold'}">
                    ${prod.stock_actual}
                </span>
            </td>
            <td class="px-6 py-4">${botonesAccion}</td>
        `;
        tbodyProductos.appendChild(tr);
    });
}

selectTipo.addEventListener('change', cargarInventarioCompleto);
inputBuscarInv.addEventListener('input', cargarInventarioCompleto);

function abrirModal() {
    modalProducto.classList.replace('hidden', 'flex');
}

function cerrarModal() {
    modalProducto.classList.replace('flex', 'hidden');
}

if (btnNuevo) {
    btnNuevo.addEventListener('click', () => {
        formProducto.reset();
        document.getElementById('prod-id').value = ''; 
        tituloFormulario.textContent = "Nuevo Producto";
        abrirModal();
    });
}

document.getElementById('btn-cancelar-producto').addEventListener('click', cerrarModal);
document.getElementById('btn-cerrar-modal').addEventListener('click', cerrarModal);

window.editarProducto = function(productoEncoded) {
    const prod = JSON.parse(decodeURIComponent(productoEncoded));
    
    tituloFormulario.textContent = `Editar: ${prod.nombre_producto}`;
    document.getElementById('prod-id').value = prod.id_producto;
    
    const catSelect = document.getElementById('prod-categoria');
    const labSelect = document.getElementById('prod-laboratorio');
    
    let catEncontrado = false;
    for (let opt of catSelect.options) {
        if (opt.text === prod.nombre_categoria) {
            catSelect.value = opt.value;
            catEncontrado = true;
            break;
        }
    }
    if (!catEncontrado) catSelect.value = "";

    let labEncontrado = false;
    for (let opt of labSelect.options) {
        if (opt.text === prod.nombre_laboratorio) {
            labSelect.value = opt.value;
            labEncontrado = true;
            break;
        }
    }
    if (!labEncontrado) labSelect.value = "";
    
    document.getElementById('prod-codigo').value = prod.codigo_barras || '';
    document.getElementById('prod-nombre').value = prod.nombre_producto || '';
    document.getElementById('prod-generico').value = prod.es_generico ? "1" : "0";
    
    if (prod.precio_venta !== null && prod.precio_venta !== undefined) {
        document.getElementById('prod-precio').value = parseFloat(prod.precio_venta).toFixed(2);
    } else {
        document.getElementById('prod-precio').value = '';
    }
    
    document.getElementById('prod-stock').value = prod.stock_actual !== undefined ? prod.stock_actual : 0;
    document.getElementById('prod-minimo').value = prod.stock_minimo !== undefined ? prod.stock_minimo : 5;

    abrirModal();
};

formProducto.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idProducto = document.getElementById('prod-id').value;
    
    const payload = {
        id_categoria: document.getElementById('prod-categoria').value || null,
        id_laboratorio: document.getElementById('prod-laboratorio').value || null,
        codigo_barras: document.getElementById('prod-codigo').value || null,
        nombre_producto: document.getElementById('prod-nombre').value,
        es_generico: parseInt(document.getElementById('prod-generico').value) || 0,
        precio_venta: parseFloat(document.getElementById('prod-precio').value) || 0,
        stock_actual: parseInt(document.getElementById('prod-stock').value) || 0,
        stock_minimo: parseInt(document.getElementById('prod-minimo').value) || 0
    };

    try {
        if (idProducto) {
            await API.put(`/inventario/${idProducto}`, payload);
        } else {
            await API.post('/inventario', payload);
        }
        
        cerrarModal();
        cargarInventarioCompleto(); 
        cargarAlertasStock();
    } catch (error) {
        alert(error.message);
    }
});

window.eliminarProducto = async function(id) {
    if(confirm("¿Estás seguro de eliminar este producto?")) {
        try {
            await API.delete(`/inventario/${id}`);
            cargarInventarioCompleto();
            cargarAlertasStock();
        } catch (error) {
            alert(error.message);
        }
    }
};

async function cargarCatalogosFormulario() {
    try {
        const [categorias, laboratorios] = await Promise.all([
            API.get('/categorias'),
            API.get('/laboratorios')
        ]);

        const selectCat = document.getElementById('prod-categoria');
        const selectLab = document.getElementById('prod-laboratorio');

        selectCat.innerHTML = '<option value="">Seleccione categoría</option>';
        categorias.forEach(cat => { 
            const opt = document.createElement('option');
            opt.value = String(cat.id_categoria);
            opt.textContent = cat.nombre_categoria;
            selectCat.appendChild(opt);
        });

        selectLab.innerHTML = '<option value="">Seleccione laboratorio</option>';
        laboratorios.forEach(lab => { 
            const opt = document.createElement('option');
            opt.value = String(lab.id_laboratorio);
            opt.textContent = lab.nombre_laboratorio;
            selectLab.appendChild(opt);
        });
    } catch (error) {
        console.error(error);
    }
}

async function cargarAlertasStock() {
    try {
        const alertas = await API.get('/inventario/alertas');
        contenedorAlertas.innerHTML = '';

        if (!alertas || alertas.length === 0) return;

        const div = document.createElement('div');
        div.className = "bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-4 shadow-sm";
        div.innerHTML = `
            <span class="text-xl">⚠️</span>
            <div>
                <strong class="text-amber-800 block text-sm font-bold">Stock Crítico:</strong>
                <p class="text-amber-600 text-xs">${alertas.map(p => p.nombre_producto).join(', ')}.</p>
            </div>
        `;
        contenedorAlertas.appendChild(div);

        alertas.forEach(p => mostrarToast(`Bajo stock: ${p.nombre_producto}`));
    } catch (error) {
        console.error(error);
    }
}

function mostrarToast(mensaje) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = "bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300";
    toast.innerHTML = `<span class="font-bold">!</span> <span>${mensaje}</span>`;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('animate-out', 'fade-out', 'slide-out-to-right');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

document.addEventListener('DOMContentLoaded', () => {
    cargarInventarioCompleto();
    cargarCatalogosFormulario();
    cargarAlertasStock();
});