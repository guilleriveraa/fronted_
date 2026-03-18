// admin/js/pedidos.js - VERSIÓN CORREGIDA

let filtroActual = 'todos';

document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Inicializando pedidos...');
    loadUserInfo();
    cargarPedidos();
    setupFiltros();
});

function setupFiltros() {
    document.querySelectorAll('.btn-filtro').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filtroActual = this.dataset.filtro;
            cargarPedidos();
        });
    });
}

async function cargarPedidos() {
    try {
        console.log('📦 Cargando pedidos...');
        const response = await fetch(`${window.API_URL}/admin/pedidos`);

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        let pedidos = await response.json();
        console.log('✅ Pedidos cargados:', pedidos.length);

        // Aplicar filtro
        if (filtroActual !== 'todos') {
            pedidos = pedidos.filter(p => p.estado === filtroActual);
        }

        const tbody = document.getElementById('pedidos-list');
        if (!tbody) return;

        if (!Array.isArray(pedidos) || pedidos.length === 0) {
            // 🔥 CAMBIADO: colspan de 7 a 8 (por la nueva columna)
            tbody.innerHTML = '<tr><td colspan="9" class="text-center">No hay pedidos</td></tr>';
            return;
        }

        // 🔥 MODIFICADO: Añadida columna de dirección
        tbody.innerHTML = pedidos.map(p => {
            // Determinar el badge para el método de pago/entrega
            let metodoBadge = '';
            let codigoHtml = '';

            if (p.metodo_pago === 'pago_en_tienda') {
                metodoBadge = '<span class="badge bg-warning text-dark"><i class="fas fa-store"></i> Recoger en tienda</span>';
                if (p.codigo_recogida) {
                    codigoHtml = `<br><small class="text-muted">Código: ${p.codigo_recogida}</small>`;
                }
            } else if (p.metodo_pago === 'stripe') {
                metodoBadge = '<span class="badge bg-success"><i class="fas fa-credit-card"></i> Pagado online</span>';
            } else {
                metodoBadge = '<span class="badge bg-secondary">' + (p.metodo_pago || 'No especificado') + '</span>';
            }

            // Determinar el badge para el estado del pago
            let estadoPagoBadge = '';
            if (p.estado_pago === 'pendiente') {
                estadoPagoBadge = '<br><span class="badge bg-warning text-dark">Pendiente de pago</span>';
            } else if (p.estado_pago === 'pagado') {
                estadoPagoBadge = '<br><span class="badge bg-success">Pagado</span>';
            }

            return `
    <tr>
        <td>#${p.id}</td>
        <td>${p.cliente_nombre || 'Cliente'}</td>
        <td>${p.cliente_email || '-'}</td>
        <td>${new Date(p.fecha).toLocaleDateString()}</td>
        <td>${p.direccion_detalles ? p.direccion_detalles : 'No especificada'}</td>
        <td>${parseFloat(p.total || 0).toFixed(2)}€</td>
        <td>
            ${metodoBadge}
            ${codigoHtml}
            ${estadoPagoBadge}
        </td>
        <td>
            <select class="form-select form-select-sm" onchange="cambiarEstado(${p.id}, this.value)" style="width: auto;">
                <option value="pendiente" ${p.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                <option value="procesando" ${p.estado === 'procesando' ? 'selected' : ''}>Procesando</option>
                <option value="enviado" ${p.estado === 'enviado' ? 'selected' : ''}>Enviado</option>
                <option value="entregado" ${p.estado === 'entregado' ? 'selected' : ''}>Entregado</option>
                <option value="cancelado" ${p.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
            </select>
        </td>
        <td>
            <button class="btn btn-sm btn-info" onclick="verDetalle(${p.id})">
                <i class="fas fa-eye"></i>
            </button>
        </td>
    </tr>
`}).join('');
    } catch (error) {
        console.error('❌ Error cargando pedidos:', error);
        const tbody = document.getElementById('pedidos-list');
        if (tbody) {
            // 🔥 CAMBIADO: colspan de 7 a 8
            tbody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Error al cargar pedidos</td></tr>';
        }
    }
}

window.cambiarEstado = async function (id, nuevoEstado) {
    try {
        console.log('🔄 Cambiando estado pedido:', id, 'a', nuevoEstado);
        const response = await fetch(`${window.API_URL}/admin/pedidos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        if (!response.ok) throw new Error('Error al actualizar');

        if (window.mostrarNotificacion) {
            window.mostrarNotificacion('✅ Estado actualizado', 'success');
        }

    } catch (error) {
        console.error('❌ Error cambiando estado:', error);
        if (window.mostrarNotificacion) {
            window.mostrarNotificacion('❌ Error al actualizar', 'danger');
        }
    }
};

window.verDetalle = function (id) {
    window.location.href = `../pedido-detalle.html?id=${id}`;
};

console.log('✅ Pedidos JS cargado');