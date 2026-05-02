// ==========================================
// REFERENCIAS DOM
// ==========================================
const formRegistro = document.getElementById('form-registro');
const tbodyEmpleados = document.getElementById('tabla-empleados-body');
const inputBuscarEmp = document.getElementById('input-buscar-emp');

// Referencias del Modal de Edición
const modalEditar = document.getElementById('modal-editar-emp');
const formEditar = document.getElementById('form-editar-emp');

let empleadosGlobal = [];
const usuarioActual = JSON.parse(localStorage.getItem('usuario_botica') || '{}');

// ==========================================
// 1. CARGAR Y DIBUJAR DIRECTORIO
// ==========================================
async function cargarDirectorio() {
    try {
        empleadosGlobal = await API.get('/usuarios');
        renderizarTablaEmpleados(empleadosGlobal);
    } catch (error) {
        console.error("Error al cargar empleados:", error);
        tbodyEmpleados.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--error);">Error al cargar directorio</td></tr>`;
    }
}

function renderizarTablaEmpleados(lista) {
    tbodyEmpleados.innerHTML = '';

    if(lista.length === 0) {
        tbodyEmpleados.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--texto-secundario);">No hay empleados registrados</td></tr>`;
        return;
    }

    lista.forEach(emp => {
        const tr = document.createElement('tr');
        
        const badgeRol = emp.rol === 1 
            ? `<span style="background: rgba(139, 92, 246, 0.2); color: var(--color-secundario); padding: 4px 8px; border-radius: 4px; font-size: 0.85em; font-weight: bold;">Administrador</span>`
            : `<span style="background: rgba(148, 163, 184, 0.2); color: var(--texto-secundario); padding: 4px 8px; border-radius: 4px; font-size: 0.85em;">Vendedor</span>`;

        const correo = emp.correo || '<span style="color:var(--borde)">Sin correo</span>';
        const telefono = emp.telefono || '<span style="color:var(--borde)">Sin teléfono</span>';

        let botonesAdmin = '';
        if (usuarioActual.rol === 1) { 
            if (emp.id === usuarioActual.id) {
                botonesAdmin = `<span style="color: var(--texto-secundario); font-size: 0.8em;">(Tú)</span>`;
            } else {
                // Ahora tenemos Editar y Eliminar
                botonesAdmin = `
                    <div style="display: flex; gap: 5px; justify-content: center;">
                        <button onclick="abrirDetalles(${emp.id})" style="background-color: var(--color-primario); color: black; padding: 5px 10px; border-radius: 4px; font-size: 0.9em;" title="Ver Detalles / Editar">
                        <img src="img/editar.png" alt="editar" class="btn-icon">
                        </button>
                        <button onclick="eliminarEmpleado(${emp.id})" style="background-color: transparent; border: 1px solid var(--error); color: var(--error); padding: 5px 10px; border-radius: 4px; font-size: 0.9em;" title="Despedir / Eliminar">
                        <img src="img/papelera-de-reciclaje.png" alt="editar" class="btn-icon">
                        </button>
                    </div>
                `;
            }
        }

        tr.innerHTML = `
            <td style="font-weight: 500;">${emp.nombre} ${emp.apellidos}</td>
            <td>${badgeRol}</td>
            <td style="font-size: 0.9em;">
                <div>📧 ${correo}</div>
                <div style="margin-top: 4px;">📞 ${telefono}</div>
            </td>
            <td style="font-family: monospace; color: var(--texto-secundario);">${emp.username}</td>
            <td style="text-align: center;">${botonesAdmin}</td>
        `;
        tbodyEmpleados.appendChild(tr);
    });
}

inputBuscarEmp.addEventListener('input', (e) => {
    const texto = e.target.value.toLowerCase().trim();
    const filtrados = empleadosGlobal.filter(emp => 
        emp.nombre.toLowerCase().includes(texto) ||
        emp.apellidos.toLowerCase().includes(texto) ||
        emp.username.toLowerCase().includes(texto)
    );
    renderizarTablaEmpleados(filtrados);
});

// ==========================================
// 2. DETALLES, EDICIÓN Y ELIMINACIÓN
// ==========================================
window.abrirDetalles = function(id) {
    // Buscamos al empleado en la memoria RAM (caché global)
    const emp = empleadosGlobal.find(e => e.id === id);
    if (!emp) return;

    // Llenamos el modal con sus datos
    document.getElementById('edit-id').value = emp.id;
    document.getElementById('edit-nombre').value = emp.nombre;
    document.getElementById('edit-apellidos').value = emp.apellidos;
    document.getElementById('edit-telefono').value = emp.telefono || '';
    document.getElementById('edit-rol').value = emp.rol;

    // Mostramos el modal
    modalEditar.style.display = 'flex';
};

// Guardar los cambios del Modal
if (formEditar) {
    formEditar.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('edit-id').value;
        const payload = {
            nombre: document.getElementById('edit-nombre').value.trim(),
            apellidos: document.getElementById('edit-apellidos').value.trim(),
            telefono: document.getElementById('edit-telefono').value.trim(),
            id_rol: parseInt(document.getElementById('edit-rol').value)
        };

        try {
            await API.put(`/usuarios/${id}`, payload);
            alert("Datos del empleado actualizados.");
            modalEditar.style.display = 'none';
            cargarDirectorio(); // Recargamos la tabla
        } catch (error) {
            alert(`❌ Error al actualizar: ${error.message}`);
        }
    });
}

window.eliminarEmpleado = async function(id) {
    if(confirm("¿Estás seguro de que deseas eliminar este empleado del sistema?")) {
        try {
            await API.delete(`/usuarios/${id}`);
            alert("Empleado eliminado con éxito.");
            cargarDirectorio(); 
        } catch (error) {
            alert(`No se pudo eliminar: ${error.message}`);
        }
    }
};

// ==========================================
// 3. LÓGICA DE REGISTRO AUTOMATIZADO (Mantenida)
// ==========================================
if (formRegistro) {
    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        const msgError = document.getElementById('msg-error-registro');
        const msgExito = document.getElementById('msg-exito-registro');
        
        msgError.style.display = 'none';
        msgExito.style.display = 'none';

        const nombre = document.getElementById('reg-nombre').value.trim();
        const apellidos = document.getElementById('reg-apellidos').value.trim();
        
        const primerNombre = nombre.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
        const primerApellido = apellidos.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
        const numAleatorio = Math.floor(Math.random() * 900) + 100; 
        
        const generatedUsername = `${primerNombre.charAt(0)}${primerApellido}${numAleatorio}`;
        const generatedPassword = `Nova${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;

        const payload = {
            nombre: nombre,
            apellidos: apellidos,
            correo: document.getElementById('reg-correo').value.trim(),
            telefono: document.getElementById('reg-telefono').value.trim(),
            id_rol: parseInt(document.getElementById('reg-rol').value),
            username: generatedUsername,
            password: generatedPassword
        };

        try {
            await API.post('/usuarios/registro', payload);
            
            msgExito.innerHTML = `
                <div style="text-align: center; margin-bottom: 10px;"><strong>¡Empleado Registrado!</strong></div>
                Entréguele estas credenciales de acceso:<br><br>
                <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 4px; font-family: monospace;">
                    <strong>Usuario:</strong> ${generatedUsername}<br>
                    <strong>Clave:</strong> ${generatedPassword}
                </div>
            `;
            msgExito.style.display = 'block';
            
            formRegistro.reset();
            cargarDirectorio();

        } catch (error) {
            msgError.textContent = `Error: ${error.message}`;
            msgError.style.display = 'block';
        }
    });
}

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', cargarDirectorio);