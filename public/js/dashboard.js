const tbodyCatalogo = document.getElementById('tabla-catalogo-body');
const btnBuscar = document.getElementById('btn-buscar-catalogo');
const inputBuscar = document.getElementById('input-buscar-catalogo');

// Bandera para que la voz no suene 100 veces si recarga mucho
let alertaEmitida = false;

async function cargarCatalogo() {
    const termino = inputBuscar.value.trim();
    let endpoint = '/inventario';
    
    // Si hay búsqueda, añadimos la query string
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
    tbodyCatalogo.innerHTML = ''; // Limpiamos la tabla
    
    if (productos.length === 0) {
        tbodyCatalogo.innerHTML = '<tr><td colspan="4" style="text-align: center;">No se encontraron productos.</td></tr>';
        return;
    }

    productos.forEach(prod => {
        // Lógica visual: Si el stock actual es menor o igual al mínimo, alertamos
        // Si tu vista no devuelve stock_minimo, asumimos 5 como crítico general
        const stockCritico = prod.stock_actual <= (prod.stock_minimo || 5);
        
        const tr = document.createElement('tr');
        
        // Pintamos la fila de rojo suave si está en crítico
        if (stockCritico) {
            tr.style.backgroundColor = 'rgba(207, 102, 121, 0.15)'; 
        }

        tr.innerHTML = `
            <td>${prod.nombre_producto} <br><small style="color: var(--texto-secundario)">${prod.codigo_barras || 'Sin código'}</small></td>
            <td>${prod.es_generico ? 'Genérico' : 'De Marca'}</td>
            <td style="font-weight: bold; color: var(--color-primario);">S/ ${prod.precio_venta}</td>
            <td style="color: ${stockCritico ? 'var(--error)' : 'var(--exito)'}; font-weight: bold;">
                ${prod.stock_actual} ${stockCritico ? '⚠️' : ''}
            </td>
        `;
        tbodyCatalogo.appendChild(tr);
    });
}

function verificarStockCritico(productos) {
    // Filtramos cuántos productos están en peligro
    const productosEnPeligro = productos.filter(p => p.stock_actual <= (p.stock_minimo || 5));
    
    if (productosEnPeligro.length > 0 && !alertaEmitida) {
        // Generamos la voz sintética del navegador
        const mensaje = new SpeechSynthesisUtterance(`Atención. Hay ${productosEnPeligro.length} medicamentos con stock bajo en la botica.`);
        mensaje.lang = 'es-ES'; // Acento en español
        mensaje.rate = 1.0;     // Velocidad normal
        
        // Hacemos que la computadora hable
        window.speechSynthesis.speak(mensaje);
        
        alertaEmitida = true; // Marcamos para que no hable repetidamente en la misma sesión
    }
}

// Eventos
btnBuscar.addEventListener('click', cargarCatalogo);
inputBuscar.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') cargarCatalogo();
});

// Cargar automáticamente al abrir el dashboard
document.addEventListener('DOMContentLoaded', cargarCatalogo);