// js/pages/pedidos-page.js

window.InitManager.register('PedidosPage', async function () {
    console.log('📦 Inicializando página de pedidos');

    const token = localStorage.getItem(window.TOKEN_KEY);

    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    try {
        await loadOrders();
        setupFilters();
    } catch (error) {
        console.error('❌ Error cargando pedidos:', error);
        showError('No se pudieron cargar los pedidos');
    }
}, []);

async function loadOrders() {
    const container = document.getElementById('ordersContainer');
    if (!container) return;

    const token = localStorage.getItem(window.TOKEN_KEY);

    try {
        const response = await fetch(`${window.API_URL}/orders/my-orders`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener pedidos');
        }

        const orders = await response.json();
        console.log('📦 Pedidos:', orders);

        // Guardar pedidos para filtros
        window.allOrders = orders;

        // Actualizar estadísticas
        updateStats(orders);

        // Renderizar pedidos
        renderOrders(orders);

    } catch (error) {
        console.error('❌ Error:', error);
        container.innerHTML = '<p class="error">Error al cargar los pedidos</p>';
    }
}

function renderOrders(orders) {
    const container = document.getElementById('ordersContainer');
    
    if (!orders.length) {
        container.innerHTML = `
            <div class="no-orders">
                <i class="fas fa-shopping-bag"></i>
                <h3>No tienes pedidos aún</h3>
                <p>Explora nuestros productos y haz tu primera compra</p>
                <a href="index.html#productos" class="btn-shop">Ver productos</a>
            </div>
        `;
        return;
    }

    container.innerHTML = orders.map(order => `
        <div class="order-card" data-status="${order.status}">
            <div class="order-header">
                <div>
                    <h3>Pedido #${order.id}</h3>
                    <p class="order-date">${new Date(order.date).toLocaleDateString()}</p>
                </div>
                <span class="order-status status-${order.status}">${order.status}</span>
            </div>
            
            <div class="order-body">
                <div class="order-tracking">
                    ${getTrackingSteps(order.status)}
                </div>
                
                <div class="order-summary">
                    <p><strong>Total:</strong> ${order.total}€</p>
                    <p><strong>Productos:</strong> ${order.itemsCount || 0}</p>
                </div>
                
                <div class="order-actions">
                    <button onclick="viewOrderDetails(${order.id})" class="btn-view">
                        <i class="fas fa-eye"></i> Ver detalles
                    </button>
                    ${order.status === 'entregado' ? `
                        <button onclick="requestReturn(${order.id})" class="btn-return">
                            <i class="fas fa-undo"></i> Devolver
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function getTrackingSteps(status) {
    const steps = [
        { name: 'Pendiente', icon: 'fa-clock', done: false },
        { name: 'Procesando', icon: 'fa-cog', done: false },
        { name: 'Enviado', icon: 'fa-truck', done: false },
        { name: 'Entregado', icon: 'fa-check-circle', done: false }
    ];

    const statusOrder = {
        'pendiente': 0,
        'procesando': 1,
        'enviado': 2,
        'entregado': 3,
        'cancelado': -1
    };

    const currentStep = statusOrder[status] || 0;

    return `
        <div class="tracking-steps">
            ${steps.map((step, index) => `
                <div class="tracking-step ${index <= currentStep ? 'completed' : ''} ${index === currentStep ? 'active' : ''}">
                    <i class="fas ${step.icon}"></i>
                    <span>${step.name}</span>
                </div>
                ${index < steps.length - 1 ? '<div class="step-connector"></div>' : ''}
            `).join('')}
        </div>
    `;
}

function updateStats(orders) {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pendiente' || o.status === 'procesando').length;
    const delivered = orders.filter(o => o.status === 'entregado').length;
    const totalSpent = orders.reduce((sum, o) => sum + parseFloat(o.total), 0).toFixed(2);

    document.getElementById('totalOrders').textContent = total;
    document.getElementById('pendingOrders').textContent = pending;
    document.getElementById('deliveredOrders').textContent = delivered;
    document.getElementById('totalSpent').textContent = totalSpent + '€';
}

function setupFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Actualizar botón activo
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const filter = this.dataset.filter;
            const orders = window.allOrders || [];

            if (filter === 'todos') {
                renderOrders(orders);
            } else {
                const filtered = orders.filter(o => o.status === filter);
                renderOrders(filtered);
            }
        });
    });
}

window.viewOrderDetails = function(orderId) {
    window.location.href = `pedido-detalle.html?id=${orderId}`;
};

window.requestReturn = function(orderId) {
    window.location.href = `devoluciones.html?order=${orderId}`;
};

function showError(message) {
    const container = document.getElementById('ordersContainer');
    container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
            <button onclick="location.reload()">Reintentar</button>
        </div>
    `;
}

console.log('✅ pedidos-page.js cargado');