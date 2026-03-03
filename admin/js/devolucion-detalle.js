// js/devolucion-detalle.js

document.addEventListener('DOMContentLoaded', async function() {
    console.log('📦 Cargando detalle de devolución...');
    
    // Verificar si es admin
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../index.html';
        return;
    }

    try {
        // Verificar admin
        const adminCheck = await fetch(`${window.API_URL}/user/is-admin`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const adminData = await adminCheck.json();
        
        if (!adminData.isAdmin) {
            window.location.href = '../index.html';
            return;
        }

        // Obtener ID de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const returnId = urlParams.get('id');
        
        if (!returnId) {
            mostrarError('No se especificó la devolución');
            return;
        }

        document.getElementById('returnId').textContent = `#${returnId}`;
        await cargarDetalleDevolucion(returnId);

    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar los datos');
    }
});

async function cargarDetalleDevolucion(returnId) {
    try {
        const token = localStorage.getItem('token');
        
        // Obtener datos de la devolución
        const response = await fetch(`${window.API_URL}/admin/devoluciones`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!response.ok) {
            throw new Error('Error al cargar devoluciones');
        }

        const devoluciones = await response.json();
        const devolucion = devoluciones.find(d => d.id == returnId);

        if (!devolucion) {
            mostrarError('Devolución no encontrada');
            return;
        }

        // Obtener detalles del pedido
        const pedidoResponse = await fetch(`${window.API_URL}/admin/orders/${devolucion.pedido_id}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const pedido = await pedidoResponse.json();

        // Obtener items del pedido
        const itemsResponse = await fetch(`${window.API_URL}/admin/orders/${devolucion.pedido_id}/items`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const items = await itemsResponse.json();

        renderizarDetalle(devolucion, pedido, items);

    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar los datos');
    }
}

function renderizarDetalle(devolucion, pedido, items) {
    const container = document.getElementById('returnDetailContainer');
    
    const fecha = new Date(devolucion.fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const estadoClase = {
        'pendiente': 'warning',
        'aprobada': 'success',
        'rechazada': 'danger',
        'completada': 'info'
    }[devolucion.estado] || 'secondary';

    const itemsHTML = items.map(item => `
        <tr>
            <td>
                <img src="${item.imagen || '../img/default-product.jpg'}" 
                     alt="${item.nombre}" 
                     style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"
                     onerror="this.src='https://via.placeholder.com/50'">
            </td>
            <td>${item.nombre}</td>
            <td>${item.cantidad}</td>
            <td>${parseFloat(item.precio).toFixed(2)}€</td>
            <td>${(item.cantidad * item.precio).toFixed(2)}€</td>
        </tr>
    `).join('');

    container.innerHTML = `
        <div class="return-detail">
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="info-group">
                        <label>ID Devolución</label>
                        <p><strong>#${devolucion.id}</strong></p>
                    </div>
                    <div class="info-group">
                        <label>ID Pedido</label>
                        <p><strong>#${devolucion.pedido_id}</strong></p>
                    </div>
                    <div class="info-group">
                        <label>Fecha de solicitud</label>
                        <p>${fecha}</p>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="info-group">
                        <label>Estado</label>
                        <p>
                            <span class="badge bg-${estadoClase} p-2">
                                ${devolucion.estado.toUpperCase()}
                            </span>
                        </p>
                    </div>
                    <div class="info-group">
                        <label>Total del pedido</label>
                        <p><strong>${parseFloat(pedido.total).toFixed(2)}€</strong></p>
                    </div>
                </div>
            </div>

            <div class="row mb-4">
                <div class="col-12">
                    <div class="info-group">
                        <label>Motivo de la devolución</label>
                        <div class="p-3 bg-light rounded">
                            ${devolucion.motivo}
                        </div>
                    </div>
                </div>
            </div>

            <h5 class="mb-3">Productos del pedido</h5>
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Nombre</th>
                            <th>Cantidad</th>
                            <th>Precio</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>
            </div>

            <div class="row mt-4">
                <div class="col-12">
                    <h5 class="mb-3">Actualizar estado</h5>
                    <div class="d-flex gap-2">
                        <button class="btn btn-warning" onclick="cambiarEstado(${devolucion.id}, 'pendiente')" ${devolucion.estado === 'pendiente' ? 'disabled' : ''}>
                            Pendiente
                        </button>
                        <button class="btn btn-success" onclick="cambiarEstado(${devolucion.id}, 'aprobada')" ${devolucion.estado === 'aprobada' ? 'disabled' : ''}>
                            Aprobar
                        </button>
                        <button class="btn btn-danger" onclick="cambiarEstado(${devolucion.id}, 'rechazada')" ${devolucion.estado === 'rechazada' ? 'disabled' : ''}>
                            Rechazar
                        </button>
                        <button class="btn btn-info" onclick="cambiarEstado(${devolucion.id}, 'completada')" ${devolucion.estado === 'completada' ? 'disabled' : ''}>
                            Completada
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

window.cambiarEstado = async function(returnId, nuevoEstado) {
    if (!confirm(`¿Estás seguro de cambiar el estado a "${nuevoEstado}"?`)) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.API_URL}/admin/devoluciones/${returnId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        if (!response.ok) {
            throw new Error('Error al actualizar estado');
        }

        alert('✅ Estado actualizado correctamente');
        location.reload();

    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al actualizar el estado');
    }
};

function mostrarError(mensaje) {
    const container = document.getElementById('returnDetailContainer');
    container.innerHTML = `
        <div class="text-center py-5">
            <i class="fas fa-exclamation-circle text-danger" style="font-size: 3rem;"></i>
            <p class="mt-3">${mensaje}</p>
            <button class="btn btn-primary mt-3" onclick="window.location.href='devoluciones.html'">
                Volver a devoluciones
            </button>
        </div>
    `;
}