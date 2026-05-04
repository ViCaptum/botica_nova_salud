// Variables globales para la "caché" en memoria
let inventarioGlobal = []; // Caché de productos
let carrito = [];          // Items que el cliente quiere comprar
let totalVenta = 0.00;     // Dinero total

//Referencias a elementos del DOM
const gridProductos = document.getElementById('grid-productos-venta');
const inputBuscarProd = document.getElementById('input-buscar-prod-venta');
const contenedorCarrito = document.getElementById('contenedor-items-carrito');
const lblTotalVenta = document.getElementById('lbl-total-venta');
const btnProcesarVenta = document.getElementById('btn-procesar-venta');

// Referencias Cliente
const btnBuscarCliente = document.getElementById('btn-buscar-cliente');
const inputDni = document.getElementById('input-dni');
const lblNombreCliente = document.getElementById('lbl-nombre-cliente');
const hiddenClienteId = document.getElementById('cliente-id-seleccionado');
const seccionNuevoCliente = document.getElementById('seccion-nuevo-cliente');

// Botón para buscar cliente por DNI
btnBuscarCliente.addEventListener('click', async () => {
    const dni = inputDni.value.trim();
    if (dni.length === 0) return;

    try {
        // Llama a tu API de buscar cliente (GET /api/clientes/buscar/:dni)
        const cliente = await API.get(`/clientes/buscar/${dni}`);
        
        lblNombreCliente.textContent = `${cliente.nombres} ${cliente.apellidos}`;
        lblNombreCliente.style.color = "var(--color-primario)";
        hiddenClienteId.value = cliente.id_cliente; 
        seccionNuevoCliente.style.display = 'none'; 
        
    } catch (error) {
        // Si hay error 404, mostramos el mini-formulario
        lblNombreCliente.textContent = "DNI no registrado";
        lblNombreCliente.style.color = "var(--texto-secundario)";
        hiddenClienteId.value = "";
        seccionNuevoCliente.style.display = 'block';
    }
});

// Botón para cancelar el registro rápido
document.getElementById('btn-cancelar-cliente').addEventListener('click', () => {
    seccionNuevoCliente.style.display = 'none';
    inputDni.value = '';
    lblNombreCliente.textContent = "Público General";
    lblNombreCliente.style.color = "var(--color-primario)";
});

// Botón para guardar el nuevo cliente
document.getElementById('btn-guardar-cliente-rapido').addEventListener('click', async () => {
    const dni = inputDni.value.trim();
    const nombres = document.getElementById('nuevo-cli-nombres').value.trim();
    const apellidos = document.getElementById('nuevo-cli-apellidos').value.trim();

    if (!nombres || !apellidos) {
        alert("Nombres y apellidos son obligatorios.");
        return;
    }

    try {
        const nuevoCliente = { dni, nombres, apellidos, telefono: null, correo: null };
        const response = await API.post('/clientes', nuevoCliente);

        alert("¡Cliente registrado exitosamente!");
        lblNombreCliente.textContent = `${nombres} ${apellidos}`;
        lblNombreCliente.style.color = "var(--color-primario)";
        hiddenClienteId.value = response.id_cliente; 
        seccionNuevoCliente.style.display = 'none'; 

    } catch (error) {
        alert(`No se pudo registrar: ${error.message}`);
    }
});

// Carga el catálogo de productos al iniciar la página
async function cargarCatalogoParaVenta() {
    try {
        inventarioGlobal = await API.get('/inventario');
        renderizarGridProductos(inventarioGlobal);
    } catch (error) {
        console.error("Error al cargar inventario", error);
    }
}

// Función para renderizar los productos en la grilla
function renderizarGridProductos(productos) {
    gridProductos.innerHTML = '';
    
    productos.forEach(prod => {
        const div = document.createElement('div');
        div.className = 'product-card';
        
        const sinStock = prod.stock_actual <= 0;
        
        div.innerHTML = `
            <div>
                <h4>${prod.nombre_producto}</h4>
                <p style="font-size: 0.8em; color: var(--texto-secundario);">${prod.codigo_barras || 'N/A'}</p>
            </div>
            <div class="price">S/ ${parseFloat(prod.precio_venta).toFixed(2)}</div>
            <div class="stock" style="color: ${sinStock ? 'var(--error)' : 'var(--texto-secundario)'}">
                Stock: ${prod.stock_actual}
            </div>
            <button onclick="agregarAlCarrito(${prod.id_producto})" ${sinStock ? 'disabled' : ''} style="width: 100%; padding: 8px;">
                ${sinStock ? 'Agotado' : '<img src="img/anadir-a-la-cesta.png" alt="buscar" class="btn-icon"> Agregar'}
            </button>
        `;
        gridProductos.appendChild(div);
    });
}

// Filtro instantáneo al escribir
inputBuscarProd.addEventListener('input', (e) => {
    const texto = e.target.value.toLowerCase().trim();
    const filtrados = inventarioGlobal.filter(p => 
        p.nombre_producto.toLowerCase().includes(texto) || 
        (p.codigo_barras && p.codigo_barras.includes(texto))
    );
    renderizarGridProductos(filtrados);
});

// Logica para agregar al carrito (memoria) y luego renderizar el carrito en la UI
window.agregarAlCarrito = function(idProducto) {
    const productoDB = inventarioGlobal.find(p => p.id_producto === idProducto);
    const itemExistente = carrito.find(item => item.id_producto === idProducto);
    
    if (itemExistente) {
        if (itemExistente.cantidad < productoDB.stock_actual) {
            itemExistente.cantidad++;
            itemExistente.subtotal = itemExistente.cantidad * itemExistente.precio_unitario;
        } else {
            alert("No hay suficiente stock de este producto.");
        }
    } else {
        carrito.push({
            id_producto: productoDB.id_producto,
            nombre: productoDB.nombre_producto,
            precio_unitario: parseFloat(productoDB.precio_venta),
            cantidad: 1,
            subtotal: parseFloat(productoDB.precio_venta)
        });
    }
    renderizarCarritoUI();
};

// Función para renderizar el carrito en la UI
function renderizarCarritoUI() {
    contenedorCarrito.innerHTML = '';
    totalVenta = 0;

    if (carrito.length === 0) {
        contenedorCarrito.innerHTML = '<div class="cart-empty-msg">El carrito está vacío</div>';
        btnProcesarVenta.disabled = true;
        lblTotalVenta.textContent = '0.00';
        return;
    }

    carrito.forEach((item, index) => {
        totalVenta += item.subtotal;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-header">
                <span>${item.nombre}</span>
                <span>S/ ${item.subtotal.toFixed(2)}</span>
            </div>
            <div class="cart-item-controls">
                <div>
                    <span style="color: var(--texto-secundario); margin-right: 5px;">S/ ${item.precio_unitario.toFixed(2)} x </span>
                    <button onclick="cambiarCantidad(${index}, -1)" style="padding: 2px 8px; cursor: pointer;">-</button>
                    <span style="margin: 0 10px; font-weight: bold;">${item.cantidad}</span>
                    <button onclick="cambiarCantidad(${index}, 1)" style="padding: 2px 8px; cursor: pointer;">+</button>
                </div>
                <button class="btn-quitar" onclick="quitarDelCarrito(${index})"><img src="img/papelera-de-reciclaje.png" alt="buscar" class="btn-icon"></button>
            </div>
        `;
        contenedorCarrito.appendChild(div);
    });

    lblTotalVenta.textContent = totalVenta.toFixed(2);
    btnProcesarVenta.disabled = false;
}

// Funciones para cambiar cantidad y quitar del carrito
window.cambiarCantidad = function(index, delta) {
    const item = carrito[index];
    const productoDB = inventarioGlobal.find(p => p.id_producto === item.id_producto);
    
    const nuevaCantidad = item.cantidad + delta;
    
    if (nuevaCantidad > 0 && nuevaCantidad <= productoDB.stock_actual) {
        item.cantidad = nuevaCantidad;
        item.subtotal = item.cantidad * item.precio_unitario;
    } else if (nuevaCantidad > productoDB.stock_actual) {
        alert("Límite de stock alcanzado.");
    }
    renderizarCarritoUI();
};

window.quitarDelCarrito = function(index) {
    carrito.splice(index, 1);
    renderizarCarritoUI();
};

// Procesar la venta: Enviar datos al backend y manejar la respuesta
btnProcesarVenta.addEventListener('click', async () => {
    if (carrito.length === 0) return;

    if (!confirm(`¿Confirmar venta por un total de S/ ${totalVenta.toFixed(2)}?`)) {
        return;
    }

    // Armamos el payload EXACTO que espera tu backend (POST /api/ventas)[cite: 33]
    const payloadVenta = {
        id_cliente: hiddenClienteId.value || null, 
        total_venta: totalVenta,
        detalles: carrito.map(item => ({
            id_producto: item.id_producto,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            subtotal: item.subtotal
        }))
    };

    try {
        const resultado = await API.post('/ventas', payloadVenta);
        
        alert(`Venta procesada exitosamente.\nID de Transacción: #${resultado.id_venta}`);
        
        // Vaciamos la memoria para el siguiente cliente
        carrito = [];
        inputDni.value = '';
        lblNombreCliente.textContent = "Público General";
        lblNombreCliente.style.color = "var(--color-primario)";
        hiddenClienteId.value = '';
        
        // Recargamos inventario para actualizar stock visualmente
        await cargarCatalogoParaVenta(); 
        renderizarCarritoUI();

    } catch (error) {
        alert(`Error al procesar la venta: ${error.message}`);
    }
});

// Iniciamos la carga del catálogo al abrir la página
document.addEventListener('DOMContentLoaded', cargarCatalogoParaVenta);