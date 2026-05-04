// ==========================================
// REFERENCIAS DOM
// ==========================================
const tbodyHistorial = document.getElementById('tabla-historial-body');
const inputVendedor = document.getElementById('input-buscar-vendedor');
const idVendedorSeleccionado = document.getElementById('vendedor-id-seleccionado');
const listaEmpleados = document.getElementById('lista-empleados');
const btnFiltrar = document.getElementById('btn-filtrar-ventas');

let empleadosCache = [];

// ==========================================
// CARGAR HISTORIAL
// ==========================================
async function cargarHistorial(idEmpleado = '') {
    try {
        let endpoint = '/ventas';
        if (idEmpleado) {
            endpoint += `?vendedor_id=${idEmpleado}`;
        }

        const ventas = await API.get(endpoint);
        renderizarHistorial(ventas);

    } catch (error) {
        tbodyHistorial.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;color:red;">
                    Error cargando historial
                </td>
            </tr>`;
    }
}

// ==========================================
// RENDER TABLA
// ==========================================
function renderizarHistorial(ventas) {
    tbodyHistorial.innerHTML = '';

    if (ventas.length === 0) {
        tbodyHistorial.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;">
                    Sin resultados
                </td>
            </tr>`;
        return;
    }

    ventas.forEach(venta => {
        const tr = document.createElement('tr');

        const fecha = new Date(venta.fecha_venta).toLocaleString('es-PE');

        tr.innerHTML = `
            <td>#${venta.id_venta}</td>
            <td>${fecha}</td>
            <td>${venta.nombre_vendedor}</td>
            <td>${venta.dni_cliente || 'Público General'}</td>
            <td>S/ ${parseFloat(venta.total).toFixed(2)}</td>
            <td>
                <button onclick="verDetalleVenta(${venta.id_venta})">
                    📄 Ver
                </button>
            </td>
        `;

        tbodyHistorial.appendChild(tr);
    });
}

// ==========================================
// DETALLE DE VENTA (🔥 LO IMPORTANTE)
// ==========================================
window.verDetalleVenta = async function(idVenta) {
    try {
        const data = await API.get(`/ventas/${idVenta}`);

        const venta = data.venta;
        const detalle = data.detalle;

        // Info
        document.getElementById('info-venta').innerHTML = `
            <p><strong>ID:</strong> ${venta.id_venta}</p>
            <p><strong>Fecha:</strong> ${venta.fecha}</p>
            <p><strong>Vendedor:</strong> ${venta.usuario_nombre}</p>
            <p><strong>Cliente:</strong> ${venta.cliente_nombre || 'Público General'}</p>
            <p><strong>Total:</strong> S/ ${parseFloat(venta.total_venta).toFixed(2)}</p>
        `;

        // Tabla detalle
        const tbody = document.getElementById('detalle-body');
        tbody.innerHTML = '';

        detalle.forEach(item => {
            tbody.innerHTML += `
                <tr>
                    <td>${item.nombre_producto}</td>
                    <td>${item.cantidad}</td>
                    <td>S/ ${item.precio_unitario}</td>
                    <td>S/ ${item.subtotal}</td>
                </tr>
            `;
        });

        document.getElementById('modal-detalle').style.display = 'flex';

    } catch (error) {
        alert("Error: " + error.message);
    }
};

// ==========================================
// CERRAR MODAL
// ==========================================
window.cerrarModalDetalle = function() {
    document.getElementById('modal-detalle').style.display = 'none';
};

// ==========================================
// AUTOCOMPLETADO
// ==========================================
async function prepararAutocompletado() {
    empleadosCache = await API.get('/usuarios');
}

inputVendedor.addEventListener('input', (e) => {
    const texto = e.target.value.toLowerCase();
    listaEmpleados.innerHTML = '';

    if (!texto) return;

    const filtrados = empleadosCache.filter(emp =>
        emp.nombre.toLowerCase().includes(texto)
    );

    filtrados.forEach(emp => {
        const div = document.createElement('div');
        div.textContent = emp.nombre;

        div.onclick = () => {
            inputVendedor.value = emp.nombre;
            idVendedorSeleccionado.value = emp.id;
            listaEmpleados.style.display = 'none';
        };

        listaEmpleados.appendChild(div);
    });

    listaEmpleados.style.display = 'block';
});

// ==========================================
// FILTRAR
// ==========================================
btnFiltrar.addEventListener('click', () => {
    cargarHistorial(idVendedorSeleccionado.value);
});

// ==========================================
// INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    cargarHistorial();
    prepararAutocompletado();
});
