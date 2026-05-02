// ==========================================
// 1. REFERENCIAS AL DOM
// ==========================================
const tbodyHistorial = document.getElementById('tabla-historial-body');
const inputVendedor = document.getElementById('input-buscar-vendedor');
const idVendedorSeleccionado = document.getElementById('vendedor-id-seleccionado');
const listaEmpleados = document.getElementById('lista-empleados');
const btnFiltrar = document.getElementById('btn-filtrar-ventas');

// Variables globales para la "caché" en memoria
let empleadosCache = [];

// ==========================================
// 2. CARGAR Y RENDERIZAR TABLA PRINCIPAL
// ==========================================
async function cargarHistorial(idEmpleado = '') {
    try {
        // Construimos la ruta. Si hay un ID de empleado, filtramos desde el backend
        let endpoint = '/ventas';
        if (idEmpleado) {
            endpoint += `?vendedor_id=${idEmpleado}`;
        }

        const ventas = await API.get(endpoint);
        renderizarHistorial(ventas);
    } catch (error) {
        console.error("Error al cargar el historial:", error);
        tbodyHistorial.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--error);">Error de conexión con el servidor.</td></tr>`;
    }
}

function renderizarHistorial(ventas) {
    tbodyHistorial.innerHTML = '';

    if (ventas.length === 0) {
        tbodyHistorial.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: var(--texto-secundario);">No se encontraron ventas registradas para esta búsqueda.</td></tr>';
        return;
    }

    ventas.forEach(venta => {
        const tr = document.createElement('tr');
        
        // Formateamos la fecha para que se vea legible en formato Perú (Día/Mes/Año Hora)
        const fechaNativa = new Date(venta.fecha_venta);
        const fechaFormateada = fechaNativa.toLocaleString('es-PE', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        tr.innerHTML = `
            <td style="font-family: monospace; font-weight: bold; color: var(--texto-secundario);">#${venta.id_venta}</td>
            <td>${fechaFormateada}</td>
            <td style="font-weight: 500;">${venta.nombre_vendedor || 'Desconocido'}</td>
            <td>${venta.dni_cliente || 'Público General'}</td>
            <td style="font-weight: bold; color: var(--color-primario);">S/ ${parseFloat(venta.total).toFixed(2)}</td>
            <td>
                <button onclick="verDetallesVenta(${venta.id_venta})" style="padding: 6px 12px; font-size: 0.85em; background-color: transparent; border: 1px solid var(--color-secundario); color: var(--color-secundario);">
                    <img src="img/expediente.png" alt="buscar" class="btn-icon">Detalles
                </button>
            </td>
        `;
        tbodyHistorial.appendChild(tr);
    });
}

// ==========================================
// 3. LÓGICA DE AUTOCOMPLETADO (EMPLEADOS)
// ==========================================

// Descargamos los empleados una sola vez al abrir la página
async function prepararAutocompletado() {
    try {
        empleadosCache = await API.get('/usuarios'); 
    } catch (error) {
        console.error("Error al cargar empleados para autocompletado:", error);
    }
}

// Escuchamos cada vez que el usuario escribe en la caja de texto
inputVendedor.addEventListener('input', (e) => {
    const textoBuscado = e.target.value.toLowerCase().trim();
    listaEmpleados.innerHTML = ''; // Limpiamos la lista desplegable

    // Si borra el texto, escondemos la lista y limpiamos el ID oculto
    if (!textoBuscado) {
        listaEmpleados.style.display = 'none';
        idVendedorSeleccionado.value = ''; 
        cargarHistorial(); // Opcional: Recargar todo el historial si borra el filtro
        return;
    }

    // Buscamos coincidencias en la memoria (por nombre)
    const filtrados = empleadosCache.filter(emp => 
        emp.nombre.toLowerCase().includes(textoBuscado) || 
        (emp.username && emp.username.toLowerCase().includes(textoBuscado))
    );

    // Si hay resultados, los mostramos
    if (filtrados.length > 0) {
        filtrados.forEach(emp => {
            const divOpcion = document.createElement('div');
            // Mostramos el nombre y el rol para ser más precisos
            const rolTxt = emp.rol === 1 ? 'Admin' : 'Vendedor';
            divOpcion.textContent = `${emp.nombre} (${rolTxt})`;
            
            // Al hacer clic en un nombre de la lista:
            divOpcion.addEventListener('click', () => {
                inputVendedor.value = emp.nombre;       // Ponemos el nombre en el input visible
                idVendedorSeleccionado.value = emp.id;  // Guardamos el ID real en el input oculto
                listaEmpleados.style.display = 'none';  // Escondemos la lista
            });
            
            listaEmpleados.appendChild(divOpcion);
        });
        listaEmpleados.style.display = 'block';
    } else {
        listaEmpleados.style.display = 'none';
    }
});

// Cerrar la lista de autocompletado si el usuario hace clic en otra parte de la pantalla
document.addEventListener('click', (e) => {
    if (!e.target.closest('.autocomplete-container')) {
        listaEmpleados.style.display = 'none';
    }
});

// ==========================================
// 4. EVENTOS PRINCIPALES
// ==========================================

// Botón de Filtrar
btnFiltrar.addEventListener('click', () => {
    const idEmpleado = idVendedorSeleccionado.value;
    cargarHistorial(idEmpleado);
});

// Placeholder para el botón de "👁️ Detalles"
window.verDetallesVenta = function(idVenta) {
    alert(`Aquí podrías abrir un modal para mostrar qué medicamentos específicos se vendieron en la boleta #${idVenta}.`);
};

// Arrancar funciones al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    cargarHistorial();
    prepararAutocompletado();
});