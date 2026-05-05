let inventarioGlobal = []; 
let carrito = [];          
let totalVenta = 0.00;     

const gridProductos = document.getElementById('grid-productos-venta');
const inputBuscarProd = document.getElementById('input-buscar-prod-venta');
const contenedorCarrito = document.getElementById('contenedor-items-carrito');
const lblTotalVenta = document.getElementById('lbl-total-venta');
const btnProcesarVenta = document.getElementById('btn-procesar-venta');

const btnBuscarCliente = document.getElementById('btn-buscar-cliente');
const inputDni = document.getElementById('input-dni');
const lblNombreCliente = document.getElementById('lbl-nombre-cliente');
const hiddenClienteId = document.getElementById('cliente-id-seleccionado');
const btnQuitarCliente = document.getElementById('btn-quitar-cliente');
const modalCliente = document.getElementById('modal-nuevo-cliente');
const formCliente = document.getElementById('form-nuevo-cliente');

const modalConfirmar = document.getElementById('modal-confirmar-venta');
const montoConfirmar = document.getElementById('monto-confirmar');
const btnConfirmarFinal = document.getElementById('btn-confirmar-final');

function mostrarNotificacion(mensaje) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = "bg-slate-800 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300 pointer-events-auto border border-slate-700";
    toast.innerHTML = `
        <div class="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center font-bold italic">!</div>
        <div class="text-sm font-medium">${mensaje}</div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('animate-out', 'fade-out', 'slide-out-to-right');
        setTimeout(() => toast.remove(), 500);
    }, 5000);
}

btnBuscarCliente.addEventListener('click', async () => {
    const dni = inputDni.value.trim();
    if (dni.length < 8) return alert("Ingrese un DNI de 8 dígitos.");
    try {
        const cliente = await API.get(`/clientes/buscar/${dni}`);
        lblNombreCliente.textContent = `${cliente.nombres} ${cliente.apellidos}`;
        hiddenClienteId.value = cliente.id_cliente; 
        btnQuitarCliente.classList.replace('hidden', 'flex');
    } catch (error) {
        abrirModalCliente(dni);
    }
});

formCliente.addEventListener('submit', async (e) => {
    e.preventDefault();
    const dni = document.getElementById('nuevo-cli-dni').value;
    const nombres = document.getElementById('nuevo-cli-nombres').value.trim();
    const apellidos = document.getElementById('nuevo-cli-apellidos').value.trim();
    const correo = document.getElementById('nuevo-cli-correo').value.trim();
    try {
        const payload = { dni, nombres, apellidos, correo, telefono: null };
        const response = await API.post('/clientes', payload);
        lblNombreCliente.textContent = `${nombres} ${apellidos}`;
        hiddenClienteId.value = response.id_cliente; 
        btnQuitarCliente.classList.replace('hidden', 'flex');
        cerrarModalCliente();
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
});

function abrirModalCliente(dni) {
    document.getElementById('nuevo-cli-dni').value = dni;
    modalCliente.classList.replace('hidden', 'flex');
}

window.cerrarModalCliente = function() {
    modalCliente.classList.replace('flex', 'hidden');
    formCliente.reset();
};

function resetearCliente() {
    inputDni.value = '';
    lblNombreCliente.textContent = "Público General";
    hiddenClienteId.value = '';
    btnQuitarCliente.classList.replace('flex', 'hidden');
}

btnQuitarCliente.addEventListener('click', resetearCliente);

async function cargarCatalogoParaVenta() {
    try {
        inventarioGlobal = await API.get('/inventario');
        renderizarGridProductos(inventarioGlobal);
    } catch (error) { console.error(error); }
}

function renderizarGridProductos(productos) {
    gridProductos.innerHTML = '';
    productos.forEach(prod => {
        const div = document.createElement('div');
        div.className = 'w-full bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group flex flex-col justify-between';
        const sinStock = prod.stock_actual <= 0;
        div.innerHTML = `
            <div>
                <div class="mb-3">
                    <h4 class="font-bold text-slate-800 text-base leading-tight line-clamp-2">${prod.nombre_producto}</h4>
                    <p class="text-xs font-mono text-slate-400 uppercase tracking-tighter mt-1">${prod.codigo_barras || 'Sin Código'}</p>
                </div>
                <div class="flex items-end justify-between gap-2 mt-4">
                    <div>
                        <p class="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1">Precio</p>
                        <p class="font-black text-emerald-600 text-xl leading-none">S/ ${parseFloat(prod.precio_venta).toFixed(2)}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-[11px] uppercase font-bold ${sinStock ? 'text-red-400' : 'text-slate-400'} mb-1">Stock</p>
                        <p class="text-base font-bold leading-none ${sinStock ? 'text-red-500' : 'text-slate-600'}">${prod.stock_actual}</p>
                    </div>
                </div>
            </div>
            <button onclick="agregarAlCarrito(${prod.id_producto})" ${sinStock ? 'disabled' : ''} 
                class="w-full mt-4 py-2.5 rounded-lg font-bold text-sm uppercase tracking-wide transition-all flex items-center justify-center gap-1.5 
                ${sinStock ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-500 text-white shadow-md shadow-emerald-200 hover:bg-emerald-600 hover:-translate-y-0.5 active:translate-y-0'}">
                ${sinStock ? 'Agotado' : '+ Agregar'}
            </button>
        `;
        gridProductos.appendChild(div);
    });
}

inputBuscarProd.addEventListener('input', (e) => {
    const texto = e.target.value.toLowerCase().trim();
    const filtrados = inventarioGlobal.filter(p => 
        p.nombre_producto.toLowerCase().includes(texto) || (p.codigo_barras && p.codigo_barras.includes(texto))
    );
    renderizarGridProductos(filtrados);
});

window.agregarAlCarrito = function(idProducto) {
    const prodDB = inventarioGlobal.find(p => p.id_producto === idProducto);
    const item = carrito.find(i => i.id_producto === idProducto);
    if (item) {
        if (item.cantidad < prodDB.stock_actual) {
            item.cantidad++;
            item.subtotal = item.cantidad * item.precio_unitario;
        } else mostrarNotificacion("Stock insuficiente");
    } else {
        carrito.push({
            id_producto: prodDB.id_producto,
            nombre: prodDB.nombre_producto,
            precio_unitario: parseFloat(prodDB.precio_venta),
            cantidad: 1,
            subtotal: parseFloat(prodDB.precio_venta)
        });
    }
    renderizarCarritoUI();
};

function renderizarCarritoUI() {
    contenedorCarrito.innerHTML = '';
    totalVenta = 0;
    if (carrito.length === 0) {
        contenedorCarrito.innerHTML = `<div class="flex flex-col items-center justify-center h-full opacity-20 italic text-sm text-slate-400">El carrito está vacío</div>`;
        btnProcesarVenta.disabled = true;
        lblTotalVenta.textContent = '0.00';
        return;
    }
    carrito.forEach((item, index) => {
        totalVenta += item.subtotal;
        const div = document.createElement('div');
        div.className = 'bg-slate-50/50 p-4 rounded-2xl border border-slate-100 animate-in slide-in-from-right-4 duration-200';
        div.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <span class="text-xs font-bold text-slate-700 line-clamp-1 flex-grow pr-2">${item.nombre}</span>
                <button onclick="quitarDelCarrito(${index})" class="text-slate-300 hover:text-red-500 transition-colors text-lg font-bold">&times;</button>
            </div>
            <div class="flex justify-between items-center">
                <div class="flex items-center bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
                    <button onclick="cambiarCantidad(${index}, -1)" class="w-7 h-7 flex items-center justify-center hover:bg-slate-50 text-slate-400 rounded-lg transition-colors font-bold">-</button>
                    <span class="w-8 text-center font-bold text-xs text-slate-700">${item.cantidad}</span>
                    <button onclick="cambiarCantidad(${index}, 1)" class="w-7 h-7 flex items-center justify-center hover:bg-slate-50 text-slate-400 rounded-lg transition-colors font-bold">+</button>
                </div>
                <div class="text-right">
                    <p class="text-[9px] text-slate-400 font-bold uppercase tracking-tighter text-center">Subtotal</p>
                    <span class="font-black text-emerald-600 text-sm italic">S/ ${item.subtotal.toFixed(2)}</span>
                </div>
            </div>
        `;
        contenedorCarrito.appendChild(div);
    });
    lblTotalVenta.textContent = totalVenta.toFixed(2);
    btnProcesarVenta.disabled = false;
}

window.cambiarCantidad = function(index, delta) {
    const item = carrito[index];
    const prodDB = inventarioGlobal.find(p => p.id_producto === item.id_producto);
    const nuevaCantidad = item.cantidad + delta;
    if (nuevaCantidad > 0 && nuevaCantidad <= prodDB.stock_actual) {
        item.cantidad = nuevaCantidad;
        item.subtotal = item.cantidad * item.precio_unitario;
    } else if (nuevaCantidad > prodDB.stock_actual) mostrarNotificacion("Límite de stock alcanzado");
    renderizarCarritoUI();
};

window.quitarDelCarrito = function(index) {
    carrito.splice(index, 1);
    renderizarCarritoUI();
};

btnProcesarVenta.addEventListener('click', () => {
    if (carrito.length === 0) return;
    montoConfirmar.textContent = `S/ ${totalVenta.toFixed(2)}`;
    modalConfirmar.classList.replace('hidden', 'flex');
});

window.cerrarModalConfirmar = function() {
    modalConfirmar.classList.replace('flex', 'hidden');
};

btnConfirmarFinal.addEventListener('click', async () => {
    cerrarModalConfirmar();
    const payload = {
        id_cliente: hiddenClienteId.value || null, 
        total_venta: totalVenta,
        detalles: carrito.map(i => ({
            id_producto: i.id_producto,
            cantidad: i.cantidad,
            precio_unitario: i.precio_unitario,
            subtotal: i.subtotal
        }))
    };
    try {
        const res = await API.post('/ventas', payload);
        mostrarNotificacion(`Venta #${res.id_venta} procesada con éxito.`);
        carrito = [];
        resetearCliente(); 
        await cargarCatalogoParaVenta(); 
        renderizarCarritoUI();
    } catch (error) { 
        mostrarNotificacion(`Error: ${error.message}`);
    }
});

document.addEventListener('DOMContentLoaded', cargarCatalogoParaVenta);