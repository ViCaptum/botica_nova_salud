const tbodyProductos = document.getElementById('tabla-productos-body');
const btnBuscarInv = document.getElementById('btn-buscar');
const selectTipo = document.getElementById('select-tipo');
const inputBuscarInv = document.getElementById('input-buscar');

// Elementos del formulario ADMIN
const btnNuevo = document.getElementById('btn-nuevo-producto');
const seccionFormulario = document.getElementById('seccion-formulario-producto');
const formProducto = document.getElementById('form-producto');
const tituloFormulario = document.getElementById('titulo-formulario');

// Obtenemos el usuario de la sesión actual
const usuario = JSON.parse(localStorage.getItem('usuario_botica') || '{}');
const esAdmin = usuario.rol === 1;

// Si es Admin, revelamos el botón de crear producto
if (esAdmin && btnNuevo) {
    btnNuevo.style.display = 'inline-block';
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
        console.error("Error al cargar inventario:", error);
    }
}

function renderizarTablaInventario(productos) {
    tbodyProductos.innerHTML = '';
    
    productos.forEach(prod => {
        const tr = document.createElement('tr');
        
        let botonesAccion = '';
        if (esAdmin) {
            // Pasamos todo el objeto producto convertido a texto para usarlo en la función de editar
            const prodData = encodeURIComponent(JSON.stringify(prod));
            
            botonesAccion = `
                <div style="display: flex; gap: 5px;">
                    <button onclick="editarProducto('${prodData}')" style="background-color: var(--color-primario); color: black; padding: 5px 10px; font-size: 0.9em;">✏️ Editar</button>
                    <button onclick="eliminarProducto(${prod.id_producto})" style="background-color: transparent; border: 1px solid var(--error); color: var(--error); padding: 5px 10px; font-size: 0.9em;">🗑️</button>
                </div>
            `;
        } else {
            botonesAccion = '<span style="color: var(--texto-secundario); font-size: 0.8em;">Solo lectura</span>';
        }

        tr.innerHTML = `
            <td>${prod.codigo_barras || '-'}</td>
            <td>${prod.nombre_producto}</td>
            <td>${prod.categoria || '-'}</td>
            <td>${prod.laboratorio || '-'}</td>
            <td>${prod.es_generico ? 'Genérico' : 'Marca'}</td>
            <td>S/ ${prod.precio_venta}</td>
            <td style="${prod.stock_actual <= (prod.stock_minimo || 5) ? 'color: var(--error); font-weight: bold;' : ''}">${prod.stock_actual}</td>
            <td>${botonesAccion}</td>
        `;
        tbodyProductos.appendChild(tr);
    });
}

// LÓGICA DE ADMINISTRADOR (Crear, Editar, Eliminar)
if (btnNuevo) {
    btnNuevo.addEventListener('click', () => {
        seccionFormulario.style.display = 'block';
        formProducto.reset();
        document.getElementById('prod-id').value = ''; // ID vacío = CREAR
        tituloFormulario.textContent = "Nuevo Producto";
        // Hacemos scroll suave hacia el formulario
        seccionFormulario.scrollIntoView({ behavior: 'smooth' });
    });
}

document.getElementById('btn-cancelar-producto').addEventListener('click', () => {
    seccionFormulario.style.display = 'none';
});

// Función para preparar el formulario en modo EDICIÓN
window.editarProducto = function(productoEncoded) {
    const prod = JSON.parse(decodeURIComponent(productoEncoded));
    
    seccionFormulario.style.display = 'block';
    tituloFormulario.textContent = `Editar: ${prod.nombre_producto}`;
    
    document.getElementById('prod-id').value = prod.id_producto;
    
    // IMPORTANTE: Asignar los IDs a los selectores
    document.getElementById('prod-categoria').value = prod.id_categoria || '';
    document.getElementById('prod-laboratorio').value = prod.id_laboratorio || '';
    
    document.getElementById('prod-codigo').value = prod.codigo_barras || '';
    document.getElementById('prod-nombre').value = prod.nombre_producto;
    document.getElementById('prod-generico').value = prod.es_generico;
    document.getElementById('prod-precio').value = prod.precio_venta;
    document.getElementById('prod-stock').value = prod.stock_actual;
    document.getElementById('prod-minimo').value = prod.stock_minimo || 5;

    seccionFormulario.scrollIntoView({ behavior: 'smooth' });
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
            // MODO EDICIÓN: Hacemos un PUT a la ruta específica
            await API.put(`/inventario/${idProducto}`, payload);
            alert("Producto actualizado correctamente.");
        } else {
            // MODO CREACIÓN: Hacemos un POST general
            await API.post('/inventario', payload);
            alert("Producto guardado exitosamente.");
        }
        
        seccionFormulario.style.display = 'none';
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

// Eventos de carga
btnBuscarInv.addEventListener('click', cargarInventarioCompleto);
inputBuscarInv.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') cargarInventarioCompleto();
});
document.addEventListener('DOMContentLoaded', cargarInventarioCompleto);

async function cargarCatalogosFormulario() {
    try {
        // Obtenemos los datos de las nuevas rutas que crearás en el backend
        const [categorias, laboratorios] = await Promise.all([
            API.get('/categorias'),
            API.get('/laboratorios')
        ]);

        const selectCat = document.getElementById('prod-categoria');
        const selectLab = document.getElementById('prod-laboratorio');

        // Llenamos Categorías
        selectCat.innerHTML = '<option value="">Seleccione una categoría</option>';
        categorias.forEach(cat => {
            selectCat.innerHTML += `<option value="${cat.id_categoria}">${cat.nombre_categoria}</option>`;
        });

        // Llenamos Laboratorios
        selectLab.innerHTML = '<option value="">Seleccione un laboratorio</option>';
        laboratorios.forEach(lab => {
            selectLab.innerHTML += `<option value="${lab.id_laboratorio}">${lab.nombre_laboratorio}</option>`;
        });

    } catch (error) {
        console.error("Error cargando catálogos para el formulario:", error);
    }
}

// Llamamos a esta función al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    cargarInventarioCompleto();
    cargarCatalogosFormulario(); // Nueva función
});