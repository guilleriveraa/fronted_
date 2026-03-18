// admin/js/cupones.js - CRUD de cupones

let cuponModal = null;

document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Inicializando cupones...');
    loadUserInfo();
    cargarCupones();

    const modalElement = document.getElementById('cuponModal');
    if (modalElement) {
        cuponModal = new bootstrap.Modal(modalElement);
    }
});

// Cargar todos los cupones
async function cargarCupones() {
    try {
        console.log('🎫 Cargando cupones...');
        const response = await fetch(`${window.API_URL}/admin/cupones`);

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const cupones = await response.json();
        console.log('✅ Cupones cargados:', cupones.length);

        const tbody = document.getElementById('cupones-list');
        if (!tbody) return;

        if (!Array.isArray(cupones) || cupones.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center">No hay cupones</td></tr>';
            return;
        }

        tbody.innerHTML = cupones.map(c => `
            <tr>
                <td>${c.id}</td>
                <td><strong>${c.codigo}</strong></td>
                <td>${c.descripcion || '-'}</td>
                <td>${c.tipo_descuento === 'porcentaje' ? '%' : '€'}</td>
                <td>${parseFloat(c.valor_descuento).toFixed(2)}${c.tipo_descuento === 'porcentaje' ? '%' : '€'}</td>
                <td>${parseFloat(c.monto_minimo || 0).toFixed(2)}€</td>
                <td>${c.usos_actuales || 0}/${c.uso_maximo}</td>
                <td>
                    <label class="switch">
                        <input type="checkbox" ${c.activo ? 'checked' : ''} onchange="toggleCupon(${c.id}, this.checked)">
                        <span class="slider"></span>
                    </label>
                </td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editarCupon(${c.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarCupon(${c.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('❌ Error cargando cupones:', error);
        const tbody = document.getElementById('cupones-list');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Error al cargar cupones</td></tr>';
        }
    }
}

// Abrir modal para nuevo cupón
window.abrirModalNuevo = function () {
    document.getElementById('modalTitulo').textContent = 'Nuevo Cupón';
    document.getElementById('cuponForm').reset();
    document.getElementById('cuponId').value = '';
    cuponModal?.show();
};

// Editar cupón
window.editarCupon = async function (id) {
    try {
        console.log('✏️ Editando cupón:', id);
        const response = await fetch(`${window.API_URL}/admin/cupones/${id}`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const cupon = await response.json();
        console.log('✅ Cupón cargado:', cupon);

        document.getElementById('modalTitulo').textContent = 'Editar Cupón';
        document.getElementById('cuponId').value = cupon.id;
        document.getElementById('codigo').value = cupon.codigo;
        document.getElementById('descripcion').value = cupon.descripcion || '';
        document.getElementById('tipo_descuento').value = cupon.tipo_descuento;
        document.getElementById('valor_descuento').value = cupon.valor_descuento;
        document.getElementById('monto_minimo').value = cupon.monto_minimo || 0;
        document.getElementById('uso_maximo').value = cupon.uso_maximo || 1;

        if (cupon.fecha_fin) {
            document.getElementById('fecha_fin').value = cupon.fecha_fin.split('T')[0];
        } else {
            document.getElementById('fecha_fin').value = '';
        }

        cuponModal?.show();

    } catch (error) {
        console.error('❌ Error cargando cupón:', error);
        alert('Error al cargar el cupón');
    }
};

// Guardar cupón
window.guardarCupon = async function () {
    const cupon = {
        codigo: document.getElementById('codigo').value,
        descripcion: document.getElementById('descripcion').value,
        tipo_descuento: document.getElementById('tipo_descuento').value,
        valor_descuento: document.getElementById('valor_descuento').value,
        monto_minimo: document.getElementById('monto_minimo').value,
        uso_maximo: document.getElementById('uso_maximo').value,
        fecha_fin: document.getElementById('fecha_fin').value || null
    };

    const id = document.getElementById('cuponId').value;
    const url = id ? `${window.API_URL}/admin/cupones/${id}` : `${window.API_URL}/admin/cupones`;
    const method = id ? 'PUT' : 'POST';

    console.log('💾 Guardando cupón:', cupon);

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cupon)
        });

        const data = await response.json();

        if (response.ok) {
            cuponModal?.hide();
            alert(id ? 'Cupón actualizado' : 'Cupón creado');
            cargarCupones();
        } else {
            alert(data.message || 'Error al guardar');
        }
    } catch (error) {
        console.error('❌ Error guardando cupón:', error);
        alert('Error de conexión');
    }
};

// Activar/desactivar cupón
window.toggleCupon = async function (id, activo) {
    try {
        console.log('🔄 Cambiando estado cupón:', id, 'activo:', activo);
        const response = await fetch(`${window.API_URL}/admin/cupones/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activo: activo })
        });

        const data = await response.json();

        if (response.ok) {
            alert(`Cupón ${activo ? 'activado' : 'desactivado'}`);
        } else {
            alert(data.message || 'Error al cambiar estado');
            cargarCupones(); // Recargar para deshacer el cambio visual
        }
    } catch (error) {
        console.error('❌ Error cambiando estado:', error);
        alert('Error de conexión');
        cargarCupones(); // Recargar para deshacer el cambio visual
    }
};

// Eliminar cupón
window.eliminarCupon = async function (id) {
    if (!confirm('¿Estás seguro de eliminar este cupón?')) return;

    try {
        console.log('🗑️ Eliminando cupón:', id);
        const response = await fetch(`${window.API_URL}/admin/cupones/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            alert('Cupón eliminado');
            cargarCupones();
        } else {
            alert(data.message || 'Error al eliminar');
        }
    } catch (error) {
        console.error('❌ Error eliminando cupón:', error);
        alert('Error de conexión');
    }
};

console.log('✅ Cupones JS cargado');