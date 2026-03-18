// admin/js/resenas-admin.js - VERSIÓN CORREGIDA

console.log('🔥 resenas-admin.js cargado');

// Asegurar que API_URL está definida
if (typeof window.API_URL === 'undefined') {
    window.API_URL = 'http://localhost:3000/api';
    console.log('⚠️ API_URL definida manualmente:', window.API_URL);
} else {
    console.log('✅ API_URL desde window:', window.API_URL);
}

// Variables globales
let reseñasData = [];
let reseñasFiltradas = [];
// Inicializar cuando cargue la página
document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ DOM cargado');
    cargarReseñas();
    configurarEventos();
});

// Configurar eventos de los filtros
function configurarEventos() {
    document.getElementById('applyFilters')?.addEventListener('click', aplicarFiltros);
    document.getElementById('resetFilters')?.addEventListener('click', resetearFiltros);
    document.getElementById('refreshData')?.addEventListener('click', cargarReseñas);

    const searchInput = document.getElementById('searchReviews');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            setTimeout(aplicarFiltros, 300);
        });
    }
}

// Cargar reseñas desde la API
async function cargarReseñas() {
    try {
        console.log('📦 Cargando reseñas...');
        const response = await fetch(`${window.API_URL}/admin/resenas`);

        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }

        reseñasData = await response.json();
        reseñasFiltradas = [...reseñasData];
        console.log('✅ Reseñas cargadas:', reseñasData);

        renderizarTabla();
        actualizarEstadisticas();

    } catch (error) {
        console.error('❌ Error:', error);
        const tbody = document.getElementById('reviewsTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error: ${error.message}</td></tr>`;
        }
    }
}

// Aplicar filtros
function aplicarFiltros() {
    const searchTerm = document.getElementById('searchReviews')?.value.toLowerCase() || '';
    const ratingFilter = document.getElementById('filterRating')?.value || 'all';
    const statusFilter = document.getElementById('filterStatus')?.value || 'all';

    reseñasFiltradas = reseñasData.filter(r => {
        const matchesSearch = searchTerm === '' ||
            (r.usuario_nombre?.toLowerCase() || '').includes(searchTerm) ||
            (r.producto_nombre?.toLowerCase() || '').includes(searchTerm) ||
            (r.comentario?.toLowerCase() || '').includes(searchTerm);

        const matchesRating = ratingFilter === 'all' || r.calificacion === parseInt(ratingFilter);
        const matchesStatus = statusFilter === 'all' || r.estado === statusFilter;

        return matchesSearch && matchesRating && matchesStatus;
    });

    renderizarTabla();
    actualizarEstadisticas();
}

// Resetear filtros
function resetearFiltros() {
    document.getElementById('searchReviews').value = '';
    document.getElementById('filterRating').value = 'all';
    document.getElementById('filterStatus').value = 'all';
    reseñasFiltradas = [...reseñasData];
    renderizarTabla();
    actualizarEstadisticas();
    mostrarNotificacion('Filtros restablecidos', 'info');
}

// Renderizar la tabla
function renderizarTabla() {
    const tbody = document.getElementById('reviewsTableBody');
    if (!tbody) return;

    if (reseñasFiltradas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay reseñas</td></tr>';
        return;
    }

    tbody.innerHTML = reseñasFiltradas.map(r => `
        <tr>
            <td><strong>${escapeHtml(r.usuario_nombre || 'Usuario')}</strong></td>
            <td>${escapeHtml(r.producto_nombre || 'Producto')}</td>
            <td>${escapeHtml(r.comentario || '')}</td>
            <td><span class="stars">${generarEstrellas(r.calificacion || 5)}</span></td>
            <td>${formatearFecha(r.fecha)}</td>
            <td>
                <span class="badge ${getClaseEstado(r.estado)}">
                    ${getTextoEstado(r.estado)}
                </span>
            </td>
            <td>
                <select class="form-select form-select-sm mb-2" onchange="cambiarEstadoReseña(${r.id}, this.value)">
                    <option value="pendiente" ${r.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="aprobada" ${r.estado === 'aprobada' ? 'selected' : ''}>Aprobada</option>
                    <option value="rechazada" ${r.estado === 'rechazada' ? 'selected' : ''}>Rechazada</option>
                </select>
                <button class="btn btn-sm btn-danger" onclick="eliminarReseña(${r.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Funciones auxiliares
function getClaseEstado(estado) {
    switch (estado) {
        case 'aprobada': return 'bg-success';
        case 'rechazada': return 'bg-danger';
        default: return 'bg-warning text-dark';
    }
}

function getTextoEstado(estado) {
    switch (estado) {
        case 'aprobada': return 'Aprobada';
        case 'rechazada': return 'Rechazada';
        default: return 'Pendiente';
    }
}

function generarEstrellas(rating) {
    let stars = '';
    for (let i = 0; i < 5; i++) {
        stars += i < rating ? '★' : '☆';
    }
    return stars;
}

function formatearFecha(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function actualizarEstadisticas() {
    const total = reseñasData.length;
    const aprobadas = reseñasData.filter(r => r.estado === 'aprobada').length;
    const pendientes = reseñasData.filter(r => r.estado === 'pendiente').length;
    const rechazadas = reseñasData.filter(r => r.estado === 'rechazada').length;
    const avg = total > 0 ? reseñasData.reduce((acc, r) => acc + (r.calificacion || 0), 0) / total : 0;

    // Añadir comprobaciones para evitar errores
    const statTotal = document.getElementById('statTotal');
    const statVisible = document.getElementById('statVisible');
    const statHidden = document.getElementById('statHidden');
    const statAvg = document.getElementById('statAvg');
    const totalBadge = document.getElementById('totalReviews');

    if (statTotal) statTotal.textContent = total;
    if (statVisible) statVisible.textContent = aprobadas;
    if (statHidden) statHidden.textContent = pendientes + rechazadas;
    if (statAvg) statAvg.textContent = avg.toFixed(1);
    if (totalBadge) totalBadge.textContent = total;
}

// Funciones globales para los botones
window.cambiarEstadoReseña = async function (id, nuevoEstado) {
    try {
        console.log('🔄 Cambiando estado:', id, nuevoEstado);
        const response = await fetch(`${window.API_URL}/admin/resenas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        if (!response.ok) throw new Error('Error al actualizar');

        mostrarNotificacion('Estado actualizado', 'success');
        cargarReseñas();

    } catch (error) {
        console.error('❌ Error:', error);
        mostrarNotificacion('Error al actualizar', 'error');
    }
};

// Función para eliminar reseña
window.eliminarReseña = async function (id) {
    if (!confirm('¿Estás seguro de eliminar esta reseña?')) return;

    try {
        console.log('🗑️ Eliminando reseña:', id);
        const response = await fetch(`${window.API_URL}/admin/resenas/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al eliminar');
        }

        console.log('✅ Reseña eliminada correctamente');
        mostrarNotificacion('Reseña eliminada', 'success');
        cargarReseñas(); // Recargar la lista

    } catch (error) {
        console.error('❌ Error:', error);
        mostrarNotificacion(error.message || 'Error al eliminar', 'error');
    }
};

// Función de notificación (CORREGIDA)
function mostrarNotificacion(mensaje, tipo) {
    // Usar window.mostrarNotificacion del admin.js si existe
    if (typeof window.mostrarNotificacion === 'function' && window.mostrarNotificacion !== mostrarNotificacion) {
        window.mostrarNotificacion(mensaje, tipo);
    } else {
        // Fallback simple
        alert(mensaje);
        console.log(`🔔 [${tipo}] ${mensaje}`);
    }
}

console.log('✅ Script de reseñas listo');