document.addEventListener('DOMContentLoaded', cargarEstadisticasDashboard);

async function cargarEstadisticasDashboard() {
    try {
        const data = await API.get('/dashboard/stats');
        
        const totalProductos = data.kpis.productos || 0;
        const totalVentas = data.kpis.ventas || 0;
        const totalUsuarios = data.kpis.usuarios || 0;

        document.getElementById('kpi-productos').textContent = totalProductos;
        document.getElementById('kpi-ventas').textContent = `S/ ${parseFloat(totalVentas).toFixed(2)}`;
        document.getElementById('kpi-usuarios').textContent = totalUsuarios;

        renderizarAlertasStock(data.alertas || []);

        if (data.graficos.productos && data.graficos.productos.length > 0) {
            renderizarGraficoProductos(data.graficos.productos);
        } else {
            mostrarMensajeVacio('chart-productos', 'No hay datos de productos vendidos aún.');
        }

        if (data.graficos.vendedores && data.graficos.vendedores.length > 0) {
            renderizarGraficoVendedores(data.graficos.vendedores);
        } else {
            mostrarMensajeVacio('chart-vendedores', 'No hay registros de ventas por vendedor.');
        }

    } catch (error) {
        console.error("Error al cargar el dashboard:", error);
    }
}

function renderizarAlertasStock(alertas) {
    const contenedor = document.getElementById('lista-alertas-dashboard');
    contenedor.innerHTML = '';

    if (alertas.length === 0) {
        contenedor.innerHTML = '<p class="text-slate-400 italic text-sm text-center mt-10">Todo el stock está en niveles óptimos.</p>';
        return;
    }

    alertas.forEach(alerta => {
        const div = document.createElement('div');
        div.className = 'bg-slate-50 border border-slate-100 p-3 rounded-xl flex justify-between items-center';
        div.innerHTML = `
            <div>
                <p class="text-xs font-bold text-slate-700 line-clamp-1">${alerta.nombre_producto}</p>
                <p class="text-[10px] text-slate-400 font-medium">Mínimo: ${alerta.stock_minimo}</p>
            </div>
            <div class="bg-red-100 text-red-600 font-black px-3 py-1 rounded-lg text-sm">
                ${alerta.stock_actual}
            </div>
        `;
        contenedor.appendChild(div);
    });
}

function renderizarGraficoProductos(datos) {
    const ctx = document.getElementById('chart-productos').getContext('2d');
    
    const labels = datos.map(d => d.nombre_producto);
    const valores = datos.map(d => d.total_vendido);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Unidades Vendidas',
                data: valores,
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                x: { grid: { display: false }, ticks: { font: { size: 10 } } }
            }
        }
    });
}

function renderizarGraficoVendedores(datos) {
    const ctx = document.getElementById('chart-vendedores').getContext('2d');
    
    const labels = datos.map(d => d.nombre);
    const valores = datos.map(d => d.total_recaudado);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ingresos Generados (S/)',
                data: valores,
                backgroundColor: 'rgba(59, 130, 246, 0.8)', // Azul
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                x: { grid: { display: false } }
            }
        }
    });
}

// Función auxiliar para mostrar un mensaje si no hay datos para el gráfico
function mostrarMensajeVacio(canvasId, mensaje) {
    const canvas = document.getElementById(canvasId);
    const contenedor = canvas.parentElement;
    canvas.style.display = 'none'; // Ocultamos el canvas
    
    const p = document.createElement('p');
    p.className = 'text-slate-400 italic text-sm text-center mt-10';
    p.textContent = mensaje;
    contenedor.appendChild(p);
}