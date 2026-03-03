// fronted/admin/js/dashboard.js - Versión mejorada

// Cargar estadísticas
async function loadStats() {
    try {
        console.log('📊 Cargando estadísticas...');
        
        // Productos
        const prodRes = await fetch(`${window.API_URL}/productos`);
        if (!prodRes.ok) throw new Error('Error al cargar productos');
        const productos = await prodRes.json();
        console.log('✅ Productos cargados:', productos.length);
        
        const totalProductos = document.getElementById('totalProductos');
        if (totalProductos) totalProductos.textContent = Array.isArray(productos) ? productos.length : 0;

        // Cupones (solo si el usuario es admin)
        try {
            const cupRes = await fetch(`${window.API_URL}/admin/cupones`);
            if (cupRes.ok) {
                const cupones = await cupRes.json();
                console.log('✅ Cupones cargados:', cupones.length);
                
                const totalCupones = document.getElementById('totalCupones');
                if (totalCupones) {
                    totalCupones.textContent = Array.isArray(cupones) 
                        ? cupones.filter(c => c.activo).length 
                        : 0;
                }
            } else {
                console.warn('⚠️ No se pudieron cargar cupones:', cupRes.status);
            }
        } catch (cupError) {
            console.warn('⚠️ Error cargando cupones:', cupError);
        }

        // Pedidos
        try {
            const pedRes = await fetch(`${window.API_URL}/admin/pedidos`);
            if (pedRes.ok) {
                const pedidos = await pedRes.json();
                console.log('✅ Pedidos cargados:', pedidos.length);
                
                const totalPedidos = document.getElementById('totalPedidos');
                if (totalPedidos) totalPedidos.textContent = Array.isArray(pedidos) ? pedidos.length : 0;
                
                // Calcular ingresos totales
                const totalIngresos = Array.isArray(pedidos) 
                    ? pedidos.reduce((sum, p) => sum + parseFloat(p.total || 0), 0) 
                    : 0;
                    
                const ingresosEl = document.getElementById('totalIngresos');
                if (ingresosEl) ingresosEl.textContent = totalIngresos.toFixed(2) + '€';
            }
        } catch (pedError) {
            console.warn('⚠️ Error cargando pedidos:', pedError);
        }

    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
    }
}

// Cargar últimos pedidos
async function loadUltimosPedidos() {
    try {
        console.log('📦 Cargando últimos pedidos...');
        const response = await fetch(`${window.API_URL}/admin/ultimos-pedidos?limite=5`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const pedidos = await response.json();
        console.log('✅ Últimos pedidos cargados:', pedidos);
        
        const tbody = document.getElementById('ultimos-pedidos');
        if (!tbody) return;
        
        if (!Array.isArray(pedidos) || pedidos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay pedidos</td></tr>';
            return;
        }

        tbody.innerHTML = pedidos.map(p => `
            <tr>
                <td>#${p.id}</td>
                <td>${p.cliente_nombre || 'Cliente'}</td>
                <td>${new Date(p.fecha).toLocaleDateString()}</td>
                <td>${parseFloat(p.total || 0).toFixed(2)}€</td>
                <td><span class="badge-${p.estado === 'entregado' ? 'success' : 'warning'}">${p.estado || 'pendiente'}</span></td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('❌ Error cargando pedidos:', error);
        const tbody = document.getElementById('ultimos-pedidos');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar pedidos</td></tr>';
        }
    }
}

// Inicializar dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando dashboard...');
    if (typeof loadUserInfo === 'function') loadUserInfo();
    loadStats();
    loadUltimosPedidos();
});

console.log('✅ Dashboard JS cargado');