const tbodyHistorial = document.getElementById('tabla-historial-body');
const inputVendedor = document.getElementById('input-buscar-vendedor');
const idVendedorSeleccionado = document.getElementById('vendedor-id-seleccionado');
const listaEmpleados = document.getElementById('lista-empleados');
const btnFiltrar = document.getElementById('btn-filtrar-ventas');

let ventasGlobal = [];
let empleadosCache = [];

async function cargarHistorial(idEmpleado = '') {
    try {
        let endpoint = '/ventas';
        if (idEmpleado) {
            endpoint += `?vendedor_id=${idEmpleado}`;
        }
        ventasGlobal = await API.get(endpoint);
        renderizarHistorial(ventasGlobal);
    } catch (error) {
        tbodyHistorial.innerHTML = `<tr><td colspan="6" class="py-10 text-center text-red-500 italic">Error cargando transacciones</td></tr>`;
    }
}

function renderizarHistorial(ventas) {
    tbodyHistorial.innerHTML = '';
    if (!ventas || ventas.length === 0) {
        tbodyHistorial.innerHTML = `<tr><td colspan="6" class="py-10 text-center text-slate-400 italic">Sin resultados</td></tr>`;
        return;
    }
    ventas.forEach(venta => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50/50 transition-colors border-b border-slate-100";
        const dt = new Date(venta.fecha_venta);
        const fechaOnly = dt.toLocaleDateString('es-PE');
        const horaOnly = dt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
        tr.innerHTML = `
            <td class="px-6 py-4 font-bold text-slate-700 text-center">#${venta.id_venta}</td>
            <td class="px-6 py-4 text-sm text-slate-600">
                <div class="font-medium">${fechaOnly}</div>
                <div class="text-xs text-slate-400">${horaOnly}</div>
            </td>
            <td class="px-6 py-4 font-medium text-slate-700">${venta.nombre_vendedor}</td>
            <td class="px-6 py-4 text-sm text-slate-500 text-center">${venta.dni_cliente || 'Sin DNI'}</td>
            <td class="px-6 py-4 font-bold text-emerald-600 text-center">S/ ${parseFloat(venta.total).toFixed(2)}</td>
            <td class="px-6 py-4 text-center">
                <button onclick="verDetalleVenta(${venta.id_venta})" class="px-4 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg hover:bg-emerald-600 hover:text-white transition-all text-xs font-bold">📄 Ver</button>
            </td>
        `;
        tbodyHistorial.appendChild(tr);
    });
}

window.verDetalleVenta = async function(idVenta) {
    try {
        const data = await API.get(`/ventas/${idVenta}`);
        const venta = data.venta;
        const detalle = data.detalle;
        const dt = new Date(venta.fecha_venta);
        const fechaFormateada = dt.toLocaleDateString('es-PE');
        const horaFormateada = dt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
        document.getElementById('info-venta').innerHTML = `
            <div><p class="text-slate-400 text-[10px] uppercase font-black">ID Venta</p><p class="font-bold">#${venta.id_venta}</p></div>
            <div><p class="text-slate-400 text-[10px] uppercase font-black">Fecha y Hora</p><p class="font-bold">${fechaFormateada}</p><p class="text-xs text-slate-500">${horaFormateada}</p></div>
            <div><p class="text-slate-400 text-[10px] uppercase font-black">Vendedor</p><p class="font-bold">${venta.vendedor}</p></div>
            <div><p class="text-slate-400 text-[10px] uppercase font-black">Cliente</p><p class="font-bold">${venta.cliente_nombre || 'Público General'}</p></div>
            <div class="col-span-2 md:col-span-1 text-right"><p class="text-slate-400 text-[10px] uppercase font-black">Total</p><p class="font-black text-emerald-600 text-lg">S/ ${parseFloat(venta.total_venta).toFixed(2)}</p></div>
        `;
        const tbody = document.getElementById('detalle-body');
        tbody.innerHTML = '';
        detalle.forEach(item => {
            tbody.innerHTML += `
                <tr class="hover:bg-slate-50 transition-colors text-sm">
                    <td class="px-4 py-3 font-medium">${item.nombre_producto}</td>
                    <td class="px-4 py-3 text-center">${item.cantidad}</td>
                    <td class="px-4 py-3 text-center">S/ ${parseFloat(item.precio_unitario).toFixed(2)}</td>
                    <td class="px-4 py-3 font-bold text-slate-700 text-right">S/ ${parseFloat(item.subtotal).toFixed(2)}</td>
                </tr>
            `;
        });
        document.getElementById('modal-detalle').classList.replace('hidden', 'flex');
    } catch (error) {
        alert("No se pudieron cargar los detalles.");
    }
};

window.cerrarModalDetalle = function() {
    document.getElementById('modal-detalle').classList.replace('flex', 'hidden');
};

async function prepararAutocompletado() {
    try {
        empleadosCache = await API.get('/usuarios');
    } catch (e) { console.error(e); }
}

inputVendedor.addEventListener('input', (e) => {
    const texto = e.target.value.toLowerCase().trim();
    if (!texto) {
        renderizarHistorial(ventasGlobal);
        idVendedorSeleccionado.value = '';
        listaEmpleados.classList.add('hidden');
        return;
    }
    const filtrados = ventasGlobal.filter(venta =>
        venta.nombre_vendedor.toLowerCase().includes(texto) ||
        venta.id_venta.toString().includes(texto) ||
        (venta.dni_cliente && venta.dni_cliente.includes(texto))
    );
    renderizarHistorial(filtrados);
    actualizarSugerenciasEmpleados(texto);
});

function actualizarSugerenciasEmpleados(texto) {
    listaEmpleados.innerHTML = '';
    const filtrados = empleadosCache.filter(emp =>
        emp.nombre.toLowerCase().includes(texto) ||
        emp.username?.toLowerCase().includes(texto)
    );
    if (filtrados.length > 0) {
        listaEmpleados.classList.remove('hidden');
        filtrados.forEach(emp => {
            const div = document.createElement('div');
            div.className = "px-4 py-3 hover:bg-emerald-50 cursor-pointer text-sm border-b border-slate-50 last:border-0 transition-colors";
            div.innerHTML = `<span class="font-bold text-slate-700">${emp.nombre}</span> <span class="text-slate-400 text-xs">(@${emp.username})</span>`;
            div.onclick = () => {
                inputVendedor.value = emp.nombre;
                idVendedorSeleccionado.value = emp.id;
                listaEmpleados.classList.add('hidden');
                cargarHistorial(emp.id);
            };
            listaEmpleados.appendChild(div);
        });
    } else {
        listaEmpleados.classList.add('hidden');
    }
}

btnFiltrar.addEventListener('click', () => {
    cargarHistorial(idVendedorSeleccionado.value);
});

document.addEventListener('DOMContentLoaded', () => {
    cargarHistorial();
    prepararAutocompletado();
});