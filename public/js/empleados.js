const formRegistro = document.getElementById('form-registro');
const tbodyEmpleados = document.getElementById('tabla-empleados-body');
const inputBuscarEmp = document.getElementById('input-buscar-emp');

// Referencias Modales
const modalEditar = document.getElementById('modal-editar-emp');
const formEditar = document.getElementById('form-editar-emp');
const modalEliminar = document.getElementById('modal-confirmar-eliminar');
const modalAdminConfirm = document.getElementById('modal-validar-admin');

// Variables de estado
let empleadosGlobal = [];
let idEliminarTemporal = null;
let payloadRegistroTemporal = null;
const usuarioActual = JSON.parse(localStorage.getItem('usuario_botica') || '{}');

// 1. CARGAR Y DIBUJAR DIRECTORIO
async function cargarDirectorio() {
    try {
        empleadosGlobal = await API.get('/usuarios');
        renderizarTablaEmpleados(empleadosGlobal);
    } catch (error) {
        console.error("Error al cargar empleados:", error);
        tbodyEmpleados.innerHTML = `<tr><td colspan="5" class="py-10 text-center text-red-500 font-medium">Error al cargar directorio del personal</td></tr>`;
    }
}

function renderizarTablaEmpleados(lista) {
    tbodyEmpleados.innerHTML = '';

    if(lista.length === 0) {
        tbodyEmpleados.innerHTML = `<tr><td colspan="5" class="py-10 text-center text-slate-400 italic">No hay empleados registrados en el sistema</td></tr>`;
        return;
    }

    lista.forEach(emp => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50/50 transition-colors";
        
        const badgeRol = emp.rol === 1 
            ? `<span class="bg-violet-100 text-violet-700 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">Administrador</span>`
            : `<span class="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">Vendedor</span>`;

        const correo = emp.correo || '<span class="text-slate-300 italic text-xs">Sin correo</span>';
        const telefono = emp.telefono || '<span class="text-slate-300 italic text-xs">Sin teléfono</span>';

        let botonesAdmin = '';
        if (usuarioActual.rol === 1) { 
            if (emp.id === usuarioActual.id) {
                botonesAdmin = `<span class="text-emerald-500 font-bold text-xs">Tú</span>`;
            } else {
                botonesAdmin = `
                    <div class="flex gap-2 justify-center group">
                        <button onclick="abrirDetalles(${emp.id})" class="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Editar">
                            <img src="img/editar.png" alt="editar" class="w-4 h-4 transition-all group-hover:brightness-0 group-hover:invert">
                        </button>
                        <button onclick="eliminarEmpleado(${emp.id})" class="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm" title="Eliminar">
                            <img src="img/papelera-de-reciclaje.png" alt="eliminar" class="w-4 h-4 transition-all group-hover:brightness-0 group-hover:invert">
                        </button>
                    </div>
                `;
            }
        }

        tr.innerHTML = `
            <td class="px-6 py-4 font-semibold text-slate-700">${emp.nombre} ${emp.apellidos}</td>
            <td class="px-6 py-4">${badgeRol}</td>
            <td class="px-6 py-4">
                <div class="text-sm text-slate-600 flex items-center gap-2">📧 ${correo}</div>
                <div class="text-xs text-slate-400 mt-1 flex items-center gap-2 font-medium">📞 ${telefono}</div>
            </td>
            <td class="px-6 py-4 font-mono text-xs text-emerald-600 font-bold">${emp.username}</td>
            <td class="px-6 py-4 text-center">${botonesAdmin}</td>
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

// 2. MODAL DE EDICIÓN 
window.abrirDetalles = function(id) {
    const emp = empleadosGlobal.find(e => e.id === id);
    if (!emp) return;

    document.getElementById('edit-id').value = emp.id;
    document.getElementById('edit-nombre').value = emp.nombre;
    document.getElementById('edit-apellidos').value = emp.apellidos;
    document.getElementById('edit-telefono').value = emp.telefono || '';
    document.getElementById('edit-rol').value = emp.rol;

    modalEditar.classList.replace('hidden', 'flex');
};

window.cerrarModalEdicion = function() {
    modalEditar.classList.replace('flex', 'hidden');
    formEditar.reset();
};

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
            cerrarModalEdicion();
            cargarDirectorio(); 
        } catch (error) {
            alert(`❌ Error al actualizar: ${error.message}`);
        }
    });
}

// 3. ELIMINACIÓN CON VENTANA EMERGENTE
window.eliminarEmpleado = function(id) {
    const emp = empleadosGlobal.find(e => e.id === id);
    if (!emp) return;
    
    idEliminarTemporal = id;
    document.getElementById('nombre-emp-eliminar').textContent = `${emp.nombre} ${emp.apellidos}`;
    modalEliminar.classList.replace('hidden', 'flex');
};

window.cerrarModalEliminar = function() {
    modalEliminar.classList.replace('flex', 'hidden');
    idEliminarTemporal = null;
};

document.getElementById('btn-confirmar-delete').addEventListener('click', async () => {
    try {
        await API.delete(`/usuarios/${idEliminarTemporal}`);
        cerrarModalEliminar();
        cargarDirectorio(); 
    } catch (error) {
        alert(`No se pudo eliminar: ${error.message}`);
    }
});

// 4. REGISTRO CON VALIDACIÓN ADMIN
if (formRegistro) {
    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        const msgError = document.getElementById('msg-error-registro');
        const msgExito = document.getElementById('msg-exito-registro');
        msgError.classList.add('hidden');
        msgExito.classList.add('hidden');

        const idRol = parseInt(document.getElementById('reg-rol').value);
        const nombre = document.getElementById('reg-nombre').value.trim();
        const apellidos = document.getElementById('reg-apellidos').value.trim();
        
        const primerNombre = nombre.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
        const primerApellido = apellidos.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
        
        const generatedUsername = `${primerNombre.charAt(0)}${primerApellido}${Math.floor(Math.random() * 900) + 100}`;
        const generatedPassword = `Nova${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;

        payloadRegistroTemporal = {
            id_rol: idRol,
            nombre,
            apellidos,
            correo: document.getElementById('reg-correo').value.trim(),
            telefono: document.getElementById('reg-telefono').value.trim(),
            username: generatedUsername,
            password: generatedPassword
        };

        if (idRol === 1) {
            modalAdminConfirm.classList.replace('hidden', 'flex');
            document.getElementById('confirm-pass-admin').focus();
        } else {
            ejecutarRegistro();
        }
    });
}

window.cerrarModalAdmin = function() {
    modalAdminConfirm.classList.replace('flex', 'hidden');
    document.getElementById('confirm-pass-admin').value = '';
    document.getElementById('msg-error-admin-confirm').classList.add('hidden');
    payloadRegistroTemporal = null;
};

document.getElementById('btn-validar-y-registrar').addEventListener('click', async () => {
    const passActual = document.getElementById('confirm-pass-admin').value;
    const errorMsg = document.getElementById('msg-error-admin-confirm');
    
    if (!passActual) return;

    try {
        const sessionData = JSON.parse(localStorage.getItem('usuario_botica') || '{}');
        const usernameAdmin = sessionData.username;

        const response = await fetch('/api/usuarios/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username: usernameAdmin, 
                password: passActual 
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Contraseña incorrecta");
        }
        await ejecutarRegistro(); 
        cerrarModalAdmin();
        
    } catch (error) {
        errorMsg.textContent = error.message;
        errorMsg.classList.remove('hidden');
    }
});

async function ejecutarRegistro() {
    const msgError = document.getElementById('msg-error-registro');
    const msgExito = document.getElementById('msg-exito-registro');
    
    if (!payloadRegistroTemporal) {
        console.error("Error: El payload de registro se perdió.");
        return;
    }

    try {
        await API.post('/usuarios/registro', payloadRegistroTemporal);
        
        msgExito.innerHTML = `
            <div class="text-center font-bold mb-2 italic text-emerald-800">✅ Registro Exitoso</div>
            <div class="bg-emerald-900/10 p-3 rounded-lg border border-emerald-200 font-mono text-[11px]">
                <strong>User:</strong> ${payloadRegistroTemporal.username}<br>
                <strong>Pass:</strong> ${payloadRegistroTemporal.password}
            </div>
        `;
        msgExito.classList.remove('hidden');
        formRegistro.reset();
        cargarDirectorio();
        
    } catch (error) {
        msgError.textContent = `Error: ${error.message}`;
        msgError.classList.remove('hidden');
        throw error;
    }
}

window.cerrarModalAdmin = function() {
    modalAdminConfirm.classList.replace('flex', 'hidden');
    document.getElementById('confirm-pass-admin').value = '';
    document.getElementById('msg-error-admin-confirm').classList.add('hidden');
};

document.addEventListener('DOMContentLoaded', cargarDirectorio);