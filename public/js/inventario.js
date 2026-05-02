// Referencias al DOM
const tbodyProductos = document.getElementById('tabla-productos-body');
const selectTipo = document.getElementById('select-tipo');
const inputBuscarInv = document.getElementById('input-buscar');

// Referencias del Modal ADMIN
const btnNuevo = document.getElementById('btn-nuevo-producto');
const modalProducto = document.getElementById('modal-producto');
const formProducto = document.getElementById('form-producto');
const tituloFormulario = document.getElementById('titulo-formulario');

// Obtenemos el usuario de la sesión
const usuario = JSON.parse(localStorage.getItem('usuario_botica') || '{}');
const esAdmin = usuario.rol === 1;

if (esAdmin && btnNuevo) {
    btnNuevo.style.display = 'inline-block';
}

// ==========================================
// 1. CARGA DE DATOS Y RENDERIZADO
// ==========================================
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
        console.error("Error al cargar inventario:", error);
    }
}

function renderizarTablaInventario(productos) {
    tbodyProductos.innerHTML = '';
    
    if (productos.length === 0) {
        tbodyProductos.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No se encontraron productos.</td></tr>';
        return;
    }

    productos.forEach(prod => {
        const tr = document.createElement('tr');
        
        let botonesAccion = '';
        if (esAdmin) {
            const prodData = encodeURIComponent(JSON.stringify(prod));
            botonesAccion = `
                <div style="display: flex; gap: 5px;">
                    <button onclick="editarProducto('${prodData}')" style="background-color: var(--color-primario); color: black; padding: 6px 12px; font-size: 0.85em; border-radius: 6px;">
                    <img src="img/editar.png" alt="editar" class="btn-icon"> Editar
                    </button>
                    <button onclick="eliminarProducto(${prod.id_producto})" style="background-color: transparent; border: 1px solid var(--error); color: var(--error); padding: 6px 12px; font-size: 0.85em; border-radius: 6px;">
                    <img src="img/papelera-de-reciclaje.png" alt="buscar" class="btn-icon">
                    </button>
                </div>
            `;
        } else {
            botonesAccion = '<span style="color: var(--texto-secundario); font-size: 0.8em;">Solo lectura</span>';
        }

        tr.innerHTML = `
            <td style="font-family: monospace; color: var(--texto-secundario);">${prod.codigo_barras || '-'}</td>
            <td style="font-weight: 500;">${prod.nombre_producto}</td>
            <td>${prod.nombre_categoria || prod.categoria || '-'}</td>
            <td>${prod.nombre_laboratorio || prod.laboratorio || '-'}</td>
            <td>${prod.es_generico ? 'Genérico' : 'Marca'}</td>
            <td style="font-weight: bold; color: var(--color-primario);">S/ ${parseFloat(prod.precio_venta).toFixed(2)}</td>
            <td style="${prod.stock_actual <= (prod.stock_minimo || 5) ? 'color: var(--error); font-weight: bold;' : ''}">${prod.stock_actual}</td>
            <td>${botonesAccion}</td>
        `;
        tbodyProductos.appendChild(tr);
    });
}

// ==========================================
// 2. BÚSQUEDA REACTIVA (Sin presionar botones)
// ==========================================
selectTipo.addEventListener('change', cargarInventarioCompleto);

// Busca al escribir en el input (Debounce simple recomendado para producción)
inputBuscarInv.addEventListener('input', cargarInventarioCompleto);

// ==========================================
// 3. LÓGICA DE ADMINISTRADOR (Modales)
// ==========================================
function abrirModal() {
    modalProducto.style.display = 'flex'; // Usamos flex para que el centrado CSS funcione
}

function cerrarModal() {
    modalProducto.style.display = 'none';
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

window.editarProducto = function(productoEncoded) {
    const prod = JSON.parse(decodeURIComponent(productoEncoded));
    
    tituloFormulario.textContent = `Editar: ${prod.nombre_producto}`;
    document.getElementById('prod-id').value = prod.id_producto;
    
    document.getElementById('prod-categoria').value = prod.id_categoria || '';
    document.getElementById('prod-laboratorio').value = prod.id_laboratorio || '';
    document.getElementById('prod-codigo').value = prod.codigo_barras || '';
    document.getElementById('prod-nombre').value = prod.nombre_producto;
    document.getElementById('prod-generico').value = prod.es_generico;
    document.getElementById('prod-precio').value = prod.precio_venta;
    document.getElementById('prod-stock').value = prod.stock_actual;
    document.getElementById('prod-minimo').value = prod.stock_minimo || 5;

    abrirModal();
};

formProducto.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idProducto = document.getElementById('prod-id').value;
    
    const payload = {
        id_categoria: document.getElementById('prod-categoria').value || null,
        id_laboratorio: document.getElementById('prod-laboratorio').value || null,
        codigo_barras: document.getElementById('prod-codigo').value,
        nombre_producto: document.getElementById('prod-nombre').value,
        es_generico: document.getElementById('prod-generico').value,
        precio_venta: document.getElementById('prod-precio').value,
        stock_actual: document.getElementById('prod-stock').value,
        stock_minimo: document.getElementById('prod-minimo').value
    };

    try {
        if (idProducto) {
            await API.put(`/inventario/${idProducto}`, payload);
            alert("Producto actualizado correctamente.");
        } else {
            await API.post('/inventario', payload);
            alert("Producto guardado exitosamente.");
        }
        
        cerrarModal();
        cargarInventarioCompleto(); 
    } catch (error) {
        alert("Error al guardar: " + error.message);
    }
});

window.eliminarProducto = async function(id) {
    if(confirm("¿Estás seguro de eliminar este producto del inventario? Esta acción no se puede deshacer.")) {
        try {
            await API.delete(`/inventario/${id}`);
            cargarInventarioCompleto();
        } catch (error) {
            alert("No se puede eliminar: " + error.message);
        }
    }
};

// ==========================================
// 4. INICIALIZACIÓN Y CATÁLOGOS
// ==========================================
async function cargarCatalogosFormulario() {
    try {
        const [categorias, laboratorios] = await Promise.all([
            API.get('/categorias'),
            API.get('/laboratorios')
        ]);

        const selectCat = document.getElementById('prod-categoria');
        const selectLab = document.getElementById('prod-laboratorio');

        selectCat.innerHTML = '<option value="">Seleccione una categoría</option>';
        categorias.forEach(cat => { selectCat.innerHTML += `<option value="${cat.id_categoria}">${cat.nombre_categoria}</option>`; });

        selectLab.innerHTML = '<option value="">Seleccione un laboratorio</option>';
        laboratorios.forEach(lab => { selectLab.innerHTML += `<option value="${lab.id_laboratorio}">${lab.nombre_laboratorio}</option>`; });

    } catch (error) {
        console.error("Error cargando catálogos para el formulario:", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    cargarInventarioCompleto();
    cargarCatalogosFormulario();
});