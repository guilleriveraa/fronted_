// admin/js/devoluciones.js

let filtroActual = 'todas';

document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Inicializando devoluciones...');
    loadUserInfo();
    cargarDevoluciones();
    setupFiltros();
});

function setupFiltros() {
    document.querySelectorAll('.btn-filtro').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filtroActual = this.dataset.filtro;
            cargarDevoluciones();
        });
    });
}

async function cargarDevoluciones() {
    try {
        console.log('📦 Cargando devoluciones...');
        const response = await fetch(`${window.API_URL}/admin/devoluciones`);

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        let devoluciones = await response.json();
        console.log('✅ Devoluciones cargadas:', devoluciones.length);

        // Aplicar filtro
        if (filtroActual !== 'todas') {
            devoluciones = devoluciones.filter(d => d.estado === filtroActual);
        }

        const tbody = document.getElementById('devoluciones-list');
        if (!tbody) return;

        if (!Array.isArray(devoluciones) || devoluciones.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay devoluciones</td></tr>';
            return;
        }

        tbody.innerHTML = devoluciones.map(d => {
            // Determinar la clase del badge según el estado
            const badgeClass = {
                'pendiente': 'warning',
                'aprobada': 'success',
                'rechazada': 'danger',
                'completada': 'info'
            }[d.estado] || 'secondary';

            return `
<tr>
    <td>#${d.id}</td>
    <td>${new Date(d.fecha).toLocaleDateString()}</td>
    <td>${d.cliente_nombre || 'Cliente'}</td>
    <td><a href="/fronted/admin/pedido-detalle.html?id=${d.pedido_id}" target="_blank" class="text-primary">#${d.pedido_id}</a></td>
    <td>${d.motivo ? (d.motivo.length > 50 ? d.motivo.substring(0, 50) + '...' : d.motivo) : '-'}</td>
    <td>
        <span class="badge bg-${badgeClass} p-2">${d.estado.toUpperCase()}</span>
    </td>
    <td>
            <div class="btn-group" role="group">
                <a href="/fronted/admin/devolucion-detalle.html?id=${d.id}" class="btn btn-sm btn-info" title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </a>
                <button class="btn btn-sm btn-warning" onclick="cambiarEstado(${d.id}, 'pendiente')" title="Marcar como pendiente">
                    <i class="fas fa-clock"></i>
                </button>
                <button class="btn btn-sm btn-success" onclick="cambiarEstado(${d.id}, 'aprobada')" title="Aprobar devolución">
                    <i class="fas fa-check"></i>
                </button>
                    <button class="btn btn-sm btn-danger" onclick="cambiarEstado(${d.id}, 'rechazada')" title="Rechazar devolución">
                        <i class="fas fa-times"></i>
                </button>
                    <button class="btn btn-sm btn-info" onclick="cambiarEstado(${d.id}, 'completada')" title="Completar devolución">
                        <i class="fas fa-undo-alt"></i>
                    </button>
                </div>
            </td>
    </tr>
    `}).join('');

    } catch (error) {
        console.error('❌ Error cargando devoluciones:', error);
        const tbody = document.getElementById('devoluciones-list');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error al cargar devoluciones</td></tr>';
        }
    }
}

window.cambiarEstado = async function (id, nuevoEstado) {
    try {
        console.log('🔄 Cambiando estado devolución:', id, 'a', nuevoEstado);

        // Confirmar acción
        if (!confirm(`¿Estás seguro de cambiar el estado a "${nuevoEstado}"?`)) {
            return;
        }

        const response = await fetch(`${window.API_URL}/admin/devoluciones/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        const data = await response.json();

        if (response.ok) {
            // Mostrar notificación si existe
            if (window.mostrarNotificacion) {
                window.mostrarNotificacion('✅ Estado actualizado correctamente', 'success');
            } else {
                alert('✅ Estado actualizado correctamente');
            }
            // Recargar la lista
            cargarDevoluciones();
        } else {
            throw new Error(data.message || 'Error al actualizar');
        }
    } catch (error) {
        console.error('❌ Error cambiando estado:', error);
        if (window.mostrarNotificacion) {
            window.mostrarNotificacion('❌ Error al actualizar el estado', 'danger');
        } else {
            alert('❌ Error al actualizar el estado');
        }
    }
};

console.log('✅ Devoluciones JS cargado y funcional');