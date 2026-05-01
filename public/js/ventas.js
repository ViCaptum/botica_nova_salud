// ==========================================
// ESTADO GLOBAL DE LA VENTA
// ==========================================
let carrito = []; 
let totalVenta = 0.00;

// ==========================================
// LÓGICA DEL CLIENTE (Buscar y Registrar)
// ==========================================
const btnBuscarCliente = document.getElementById('btn-buscar-cliente');
const inputDni = document.getElementById('input-dni');
const lblNombreCliente = document.getElementById('lbl-nombre-cliente');
const hiddenClienteId = document.getElementById('cliente-id-seleccionado');
const seccionNuevoCliente = document.getElementById('seccion-nuevo-cliente');

btnBuscarCliente.addEventListener('click', async () => {
    const dni = inputDni.value.trim();
    if (dni.length === 0) return;

    try {
        const cliente = await API.get(`/clientes/buscar/${dni}`);
        
        // Si lo encuentra
        lblNombreCliente.textContent = `${cliente.nombres} ${cliente.apellidos}`;
        lblNombreCliente.style.color = "var(--color-primario)";
        hiddenClienteId.value = cliente.id_cliente; 
        seccionNuevoCliente.style.display = 'none'; 
        
    } catch (error) {
        // CORRECCIÓN AQUÍ: Capturamos cualquier error (incluyendo el 404 de tu API)
        lblNombreCliente.textContent = "DNI no registrado";
        lblNombreCliente.style.color = "var(--texto-secundario)";
        hiddenClienteId.value = "";
        
        // Mostramos la ventana flotante (mini-formulario)
        seccionNuevoCliente.style.display = 'block';
    }
});

// Ocultar formulario de cliente nuevo si se cancela
document.getElementById('btn-cancelar-cliente').addEventListener('click', () => {
    document.getElementById('seccion-nuevo-cliente').style.display = 'none';
    document.getElementById('input-dni').value = '';
    document.getElementById('lbl-nombre-cliente').textContent = "Público General";
    document.getElementById('lbl-nombre-cliente').style.color = "var(--color-primario)";
});

// Guardar cliente rápido
document.getElementById('btn-guardar-cliente-rapido').addEventListener('click', async () => {
    const dni = inputDni.value.trim();
    const nombres = document.getElementById('nuevo-cli-nombres').value.trim();
    const apellidos = document.getElementById('nuevo-cli-apellidos').value.trim();

    if (!nombres || !apellidos) {
        alert("Nombres y apellidos son obligatorios para crear el cliente rápido.");
        return;
    }

    try {
        const nuevoCliente = { dni, nombres, apellidos, telefono: null, correo: null };
        const response = await API.post('/clientes', nuevoCliente);

        alert("¡Cliente registrado exitosamente! Ya está seleccionado para la venta.");
        lblNombreCliente.textContent = `${nombres} ${apellidos}`;
        lblNombreCliente.style.color = "var(--color-primario)";
        hiddenClienteId.value = response.id_cliente; 
        seccionNuevoCliente.style.display = 'none'; 

    } catch (error) {
        alert(`No se pudo registrar: ${error.message}`);
    }
});

// ==========================================
// BUSCADOR DE PRODUCTOS PARA EL CARRITO
// ==========================================
const inputBuscarProd = document.getElementById('input-buscar-prod-venta');
const btnBuscarProd = document.getElementById('btn-buscar-prod-venta');
const selectResultados = document.getElementById('select-resultados-prod');
const inputCantidad = document.getElementById('input-cantidad-venta');
const btnAgregarCarrito = document.getElementById('btn-agregar-carrito');
const tbodyCarrito = document.getElementById('tabla-carrito-body');
const lblTotalVenta = document.getElementById('lbl-total-venta');
const btnProcesarVenta = document.getElementById('btn-procesar-venta');

btnBuscarProd.addEventListener('click', async () => {
    const termino = inputBuscarProd.value.trim();
    if (termino.length === 0) {
        alert("Ingresa un nombre o código para buscar.");
        return;
    }

    try {
        const productos = await API.get(`/inventario?buscar=${encodeURIComponent(termino)}`);
        
        selectResultados.innerHTML = ''; 
        
        if (productos.length === 0) {
            selectResultados.style.display = 'none';
            alert("No se encontró ningún medicamento con ese nombre o código.");
            return;
        }

        productos.forEach(prod => {
            const option = document.createElement('option');
            // Almacenamos toda la data del producto en el valor del select
            option.value = JSON.stringify(prod); 
            option.textContent = `${prod.nombre_producto} - S/ ${prod.precio_venta} (Stock: ${prod.stock_actual})`;
            
            if (prod.stock_actual <= 0) {
                option.disabled = true;
                option.textContent += " [AGOTADO]";
            }
            selectResultados.appendChild(option);
        });

        // Hacemos visible el select de resultados
        selectResultados.style.display = 'inline-block'; 
        selectResultados.style.width = '100%';
        selectResultados.style.marginTop = '10px';

    } catch (error) {
        alert("Error al buscar el producto.");
    }
});

// ==========================================
// AGREGAR AL CARRITO
// ==========================================
btnAgregarCarrito.addEventListener('click', () => {
    if (selectResultados.style.display === 'none' || !selectResultados.value) {
        alert("Primero debes buscar y seleccionar un producto de la lista.");
        return;
    }

    const cantidadRequerida = parseInt(inputCantidad.value);
    if (isNaN(cantidadRequerida) || cantidadRequerida <= 0) {
        alert("La cantidad debe ser 1 o mayor.");
        return;
    }

    // Parseamos el JSON oculto en el value del select
    const productoSeleccionado = JSON.parse(selectResultados.value);

    // Revisamos si ya metimos este producto al carrito antes en esta misma venta
    const productoExistente = carrito.find(item => item.id_producto === productoSeleccionado.id_producto);
    const cantidadYaEnCarrito = productoExistente ? productoExistente.cantidad : 0;

    // Validación crítica: ¡No vender más de lo que hay en almacén!
    if ((cantidadYaEnCarrito + cantidadRequerida) > productoSeleccionado.stock_actual) {
        alert(`¡Alerta de Stock! Solo quedan ${productoSeleccionado.stock_actual} unidades disponibles de ${productoSeleccionado.nombre_producto}.`);
        return;
    }

    // Agregamos o actualizamos
    if (productoExistente) {
        productoExistente.cantidad += cantidadRequerida;
        productoExistente.subtotal = productoExistente.cantidad * productoExistente.precio_unitario;
    } else {
        carrito.push({
            id_producto: productoSeleccionado.id_producto,
            nombre: productoSeleccionado.nombre_producto,
            precio_unitario: productoSeleccionado.precio_venta,
            cantidad: cantidadRequerida,
            subtotal: cantidadRequerida * productoSeleccionado.precio_venta
        });
    }

    renderizarCarrito();
    
    // Limpiamos la búsqueda para agilizar el trabajo del cajero
    inputBuscarProd.value = '';
    selectResultados.style.display = 'none';
    inputCantidad.value = 1;
    inputBuscarProd.focus(); // Devolvemos el cursor al buscador
});

// ==========================================
// DIBUJAR LA TABLA Y CALCULAR EL TOTAL
// ==========================================
function renderizarCarrito() {
    tbodyCarrito.innerHTML = '';
    totalVenta = 0;

    if (carrito.length === 0) {
        btnProcesarVenta.disabled = true;
        lblTotalVenta.textContent = "0.00";
        return;
    }

    carrito.forEach((item, index) => {
        totalVenta += parseFloat(item.subtotal);
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${item.nombre}</td>
            <td>S/ ${parseFloat(item.precio_unitario).toFixed(2)}</td>
            <td style="text-align: center; font-weight: bold;">${item.cantidad}</td>
            <td style="color: var(--color-primario); font-weight: bold;">S/ ${parseFloat(item.subtotal).toFixed(2)}</td>
            <td style="text-align: center;">
                <button onclick="quitarDelCarrito(${index})" style="background-color: var(--bg-fondo); border: 1px solid var(--error); color: var(--error); padding: 5px 10px; border-radius: 4px; transition: all 0.2s;" onmouseover="this.style.backgroundColor='var(--error)'; this.style.color='white'" onmouseout="this.style.backgroundColor='var(--bg-fondo)'; this.style.color='var(--error)'">
                    X
                </button>
            </td>
        `;
        tbodyCarrito.appendChild(tr);
    });

    lblTotalVenta.textContent = totalVenta.toFixed(2);
    btnProcesarVenta.disabled = false;
}

window.quitarDelCarrito = function(index) {
    carrito.splice(index, 1);
    renderizarCarrito();
};

// ==========================================
// CONFIRMAR Y PROCESAR LA VENTA
// ==========================================
btnProcesarVenta.addEventListener('click', async () => {
    if (carrito.length === 0) return;

    if (!confirm(`¿Confirmar venta por un total de S/ ${totalVenta.toFixed(2)}?`)) {
        return;
    }

    // Armamos el payload que tu API /routes/ventas.js está esperando
    const payloadVenta = {
        id_cliente: hiddenClienteId.value || null, 
        total_venta: totalVenta,
        detalles: carrito
    };

    try {
        const resultado = await API.post('/ventas', payloadVenta);
        
        alert(`✅ Venta procesada exitosamente.\nID de Transacción: #${resultado.id_venta}`);
        
        // Vaciamos la memoria para el siguiente cliente
        carrito = [];
        inputDni.value = '';
        lblNombreCliente.textContent = "Público General";
        lblNombreCliente.style.color = "var(--color-primario)";
        hiddenClienteId.value = '';
        renderizarCarrito();

    } catch (error) {
        alert(`❌ Error al procesar la venta: ${error.message}`);
    }
});