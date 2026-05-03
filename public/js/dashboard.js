const tbodyCatalogo = document.getElementById('tabla-catalogo-body');
const btnBuscar = document.getElementById('btn-buscar-catalogo');
const inputBuscar = document.getElementById('input-buscar-catalogo');

// Bandera para que la voz no suene 100 veces si recarga mucho
let alertaEmitida = false;

async function cargarCatalogo() {
    const termino = inputBuscar.value.trim();
    let endpoint = '/inventario';
    
    // Si hay búsqueda, añadimos la query string[cite: 26]
    if (termino) {
        endpoint += `?buscar=${encodeURIComponent(termino)}`;
    }

    try {
        const productos = await API.get(endpoint);
        renderizarCatalogo(productos);
        verificarStockCritico(productos);
    } catch (error) {
        console.error("Error al cargar el catálogo:", error);
    }
}

function renderizarCatalogo(productos) {
    tbodyCatalogo.innerHTML = ''; 
    
    if (productos.length === 0) {
        tbodyCatalogo.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--texto-secundario);">No se encontraron productos.</td></tr>';
        return;
    }

    productos.forEach(prod => {
        // Lógica visual: Si el stock actual es menor o igual al mínimo (o 5 por defecto)[cite: 26]
        const stockCritico = prod.stock_actual <= (prod.stock_minimo || 5);
        
        const tr = document.createElement('tr');
        
        // Pintamos la fila con un fondo rojo muy sutil si está en crítico
        if (stockCritico) {
            tr.style.backgroundColor = 'rgba(239, 68, 68, 0.05)'; 
        }

        // Dividimos la información en 5 columnas ahora
        tr.innerHTML = `
            <td style="color: var(--texto-secundario); font-family: monospace; letter-spacing: 1px;">
                ${prod.codigo_barras || 'N/A'}
            </td>
            <td style="font-weight: 500;">
                ${prod.nombre_producto}
            </td>
            <td>
                ${prod.es_generico ? 'Genérico' : 'De Marca'}
            </td>
            <td style="font-weight: 600; color: var(--color-primario);">
                S/ ${parseFloat(prod.precio_venta).toFixed(2)}
            </td>
            <td style="color: ${stockCritico ? 'var(--error)' : 'var(--exito)'}; font-weight: bold;">
                ${prod.stock_actual} ${stockCritico ? '⚠️' : ''}
            </td>
        `;
        tbodyCatalogo.appendChild(tr);
    });
}

// Para evitar mostrar múltiples alertas del mismo producto si el usuario recarga varias veces
let alertasMostradas = new Set();
// Verifica si algún producto está en stock crítico y muestra una alerta
function verificarStockCritico(productos) {
    const productosEnPeligro = productos.filter(
        p => p.stock_actual <= (p.stock_minimo || 5)
    );

    productosEnPeligro.forEach(p => {
        if (!alertasMostradas.has(p.id_producto)) {
            mostrarToast(`⚠️ ${p.nombre_producto} con stock bajo (${p.stock_actual})`);
            alertasMostradas.add(p.id_producto);
        }
    });
}

// Eventos[cite: 26]
btnBuscar.addEventListener('click', cargarCatalogo);
inputBuscar.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') cargarCatalogo();
});

// Cargar automáticamente al abrir el dashboard[cite: 26]
document.addEventListener('DOMContentLoaded', cargarCatalogo);