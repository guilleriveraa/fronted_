// js/pages/gestion-pedidos-page.js

window.InitManager.register('GestionPedidosPage', async function () {
    console.log('📦 Inicializando página de gestión de pedidos');

    const token = localStorage.getItem(window.TOKEN_KEY);

    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    try {
        // Cargar pedidos principales
        await loadOrders();
        
        // Cargar pedidos elegibles para devolución
        await loadEligibleReturns();
        
        // Configurar pestañas
        setupTabs();
        
        // Configurar filtros
        setupFilters();
        
        // Configurar eventos de devolución
        setupReturnEvents();
        
        // Detectar si venimos de un pedido específico
        checkUrlForOrder();
        
    } catch (error) {
        console.error('❌ Error:', error);
        showError('No se pudieron cargar los datos');
    }
}, []);

// ========== VARIABLES GLOBALES ==========
let selectedOrderId = null;
let selectedProductId = null;

// ========== PEDIDOS PRINCIPALES ==========
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

        window.allOrders = orders;
        updateStats(orders);
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
                <a href="productos.html" class="btn-shop">Ver productos</a>
            </div>
        `;
        return;
    }

    container.innerHTML = orders.map(order => `
        <div class="order-card" data-status="${order.status}" data-order-id="${order.id}">
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
                </div>
                
                <!-- SECCIÓN DE SEGUIMIENTO (NUEVO) -->
                ${order.tracking_number ? `
                <div class="tracking-info">
                    <p><strong>Nº de seguimiento:</strong> ${order.tracking_number}</p>
                    <p><strong>Transportista:</strong> ${getTransportistaName(order.tracking_company)}</p>
                    <a href="${getTrackingUrl(order.tracking_number, order.tracking_company)}" 
                       target="_blank" 
                       class="btn-track">
                        <i class="fas fa-truck"></i> Seguir paquete
                    </a>
                </div>
                ` : order.status === 'enviado' || order.status === 'entregado' ? `
                <p class="tracking-pending">El número de seguimiento estará disponible pronto</p>
                ` : ''}
                
                <div class="order-actions">
                    <button onclick="viewOrderDetails(${order.id})" class="btn-view">
                        <i class="fas fa-eye"></i> Ver detalles
                    </button>
                    ${order.status === 'entregado' ? `
                        <button onclick="switchToReturns(${order.id})" class="btn-return">
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
        { name: 'Pendiente', icon: 'fa-clock' },
        { name: 'Procesando', icon: 'fa-cog' },
        { name: 'Enviado', icon: 'fa-truck' },
        { name: 'Entregado', icon: 'fa-check-circle' }
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

// ========== DEVOLUCIONES ==========
async function loadEligibleReturns() {
    const container = document.getElementById('returnsContainer');
    if (!container) return;

    const token = localStorage.getItem(window.TOKEN_KEY);

    try {
        const response = await fetch(`${window.API_URL}/orders/eligible-for-return`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener pedidos para devolución');
        }

        const orders = await response.json();
        console.log('📦 Pedidos elegibles:', orders);

        if (!orders.length) {
            container.innerHTML = `
                <div class="no-returns">
                    <i class="fas fa-undo-alt"></i>
                    <h3>No tienes pedidos disponibles para devolución</h3>
                    <p>Solo puedes devolver productos de los últimos 30 días</p>
                </div>
            `;
            return;
        }

        renderEligibleOrders(orders);

    } catch (error) {
        console.error(error);
        container.innerHTML = `
            <p class="error">Error cargando pedidos para devolución</p>
        `;
    }
}

function renderEligibleOrders(orders) {
    const container = document.getElementById('returnsContainer');

    container.innerHTML = `
        <div class="returns-orders">
            <h3>Pedidos disponibles para devolución (últimos 30 días)</h3>
            ${orders.map(order => `
                <div class="order-card return-card" data-order-id="${order.id}">
                    <div class="order-header">
                        <h4>Pedido #${order.id}</h4>
                        <span class="order-date">${order.date}</span>
                    </div>

                    <div class="order-items">
                        ${order.items.map(item => `
                            <label class="product-option">
                                <input type="radio" 
                                    name="returnItem-${order.id}" 
                                    value="${item.id}"
                                    data-order="${order.id}"
                                    data-product="${item.id}"
                                    onchange="selectProduct('${order.id}', '${item.id}')">
                                <span class="product-name">${item.name}</span>
                            </label>
                        `).join('')}
                    </div>

                    <button onclick="startReturnProcess('${order.id}')" class="btn-start-return">
                        <i class="fas fa-undo-alt"></i> Iniciar devolución
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

// ========== FUNCIONES DE DEVOLUCIÓN ==========
window.selectProduct = function(orderId, productId) {
    console.log('✅ Producto seleccionado:', { orderId, productId });
    selectedOrderId = orderId;
    selectedProductId = productId;
    
    // Opcional: resaltar la opción seleccionada
    document.querySelectorAll('.product-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    const selectedLabel = document.querySelector(`input[value="${productId}"][data-order="${orderId}"]`).closest('.product-option');
    if (selectedLabel) {
        selectedLabel.classList.add('selected');
    }
};

window.startReturnProcess = function(orderId) {
    console.log('🔍 Iniciando devolución para pedido:', orderId);
    console.log('📦 Producto seleccionado:', { selectedOrderId, selectedProductId });
    
    // Verificar si hay producto seleccionado para ESTE pedido
    if (!selectedProductId || selectedOrderId !== orderId) {
        alert('Selecciona un producto primero.');
        return;
    }

    // Ocultar lista de pedidos y mostrar formulario
    const formContainer = document.getElementById('returnFormContainer');
    const ordersDiv = document.querySelector('.returns-orders');
    
    if (formContainer) formContainer.style.display = 'block';
    if (ordersDiv) ordersDiv.style.display = 'none';
    
    console.log('✅ Formulario de devolución mostrado');
};

window.cancelReturn = function() {
    document.getElementById('returnFormContainer').style.display = 'none';
    document.querySelector('.returns-orders').style.display = 'block';
    selectedOrderId = null;
    selectedProductId = null;
};

function setupReturnEvents() {
    const form = document.getElementById('returnForm');
    if (form) {
        form.addEventListener('submit', handleReturnSubmit);
    }
}

async function handleReturnSubmit(e) {
    e.preventDefault();

    const token = localStorage.getItem(window.TOKEN_KEY);
    if (!token) {
        alert('Sesión expirada.');
        return;
    }

    const formData = new FormData(e.target);
    const payload = {
        orderId: selectedOrderId,
        productId: selectedProductId,
        reason: formData.get('returnReason'),
        type: formData.get('returnType'),
        comments: document.getElementById('returnComments')?.value || ''
    };

    try {
        const response = await fetch(`${window.API_URL}/returns`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al enviar devolución');
        }

        showReturnStatus('Solicitud enviada correctamente', 'success');
        
        // Reset y volver a la lista
        setTimeout(() => {
            cancelReturn();
            loadEligibleReturns();
        }, 2000);

    } catch (error) {
        console.error(error);
        showReturnStatus(error.message, 'error');
    }
}

function showReturnStatus(message, type) {
    const form = document.getElementById('returnForm');
    if (!form) return;

    const status = document.createElement('div');
    status.className = `return-status ${type}`;
    status.textContent = message;
    form.appendChild(status);

    setTimeout(() => status.remove(), 4000);
}

// ========== NAVEGACIÓN ENTRE PESTAÑAS ==========
function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            // Actualizar botones
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Actualizar contenido
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.add('active');
        });
    });
}

// ========== FILTROS DE PEDIDOS ==========
function setupFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
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

// ========== FUNCIÓN PARA CAMBIAR A DEVOLUCIONES ==========
window.switchToReturns = function(orderId) {
    // Cambiar a la pestaña de devoluciones
    document.querySelector('[data-tab="devoluciones"]').click();
    
    // Seleccionar el pedido automáticamente
    setTimeout(() => {
        const orderCard = document.querySelector(`.return-card[data-order-id="${orderId}"]`);
        if (orderCard) {
            orderCard.scrollIntoView({ behavior: 'smooth' });
            orderCard.classList.add('highlight');
            
            // Seleccionar primer producto
            setTimeout(() => {
                const firstRadio = orderCard.querySelector('input[type="radio"]');
                if (firstRadio) {
                    firstRadio.checked = true;
                    firstRadio.dispatchEvent(new Event('change'));
                }
            }, 500);
        }
    }, 500);
};

// ========== DETECTAR PARÁMETROS DE URL ==========
function checkUrlForOrder() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order');

    if (orderId) {
        window.switchToReturns(orderId);
    }
}

// ========== FUNCIONES AUXILIARES ==========
window.viewOrderDetails = function(orderId) {
    window.location.href = `pedido-detalle.html?id=${orderId}`;
};

function showError(message) {
    const container = document.getElementById('ordersContainer');
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
                <button onclick="location.reload()">Reintentar</button>
            </div>
        `;
    }
}
// ===============================
// FUNCIONES PARA SEGUIMIENTO
// ===============================

function getTransportistaName(company) {
    const names = {
        'correos': 'Correos',
        'seur': 'SEUR',
        'dhl': 'DHL',
        'fedex': 'FedEx',
        'ups': 'UPS',
        'correos-express': 'Correos Express',
        'nacex': 'NACEX',
        'gls': 'GLS',
        'tnt': 'TNT'
    };
    return names[company?.toLowerCase()] || company || 'Transportista no especificado';
}

function getTrackingUrl(trackingNumber, company) {
    if (!trackingNumber) return '#';
    
    const urls = {
        'correos': `https://www.correos.es/es/es/individuales/rastreo?tracking-number=${trackingNumber}`,
        'seur': `https://www.seur.com/livetracking/pages/seguimiento-online-busqueda.do?segOnline=${trackingNumber}`,
        'dhl': `https://www.dhl.com/es-es/home/tracking.html?tracking-id=${trackingNumber}`,
        'fedex': `https://www.fedex.com/apps/fedextrack/?tracknumbers=${trackingNumber}`,
        'ups': `https://www.ups.com/track?tracknum=${trackingNumber}`,
        'correos-express': `https://www.correos.es/es/es/individuales/paquetes-envios/correos-express?tracking-number=${trackingNumber}`,
        'nacex': `https://www.nacex.es/rastrear-envio?codigo=${trackingNumber}`,
        'gls': `https://gls-spain.es/es/rastreo-envios?numero=${trackingNumber}`,
        'tnt': `https://www.tnt.com/express/es_es/site/herramientas-de-seguimiento/segui-tus-envios.html?consignments=${trackingNumber}`
    };
    
    return urls[company?.toLowerCase()] || `https://www.google.com/search?q=${encodeURIComponent(trackingNumber)}`;
}
console.log('✅ gestion-pedidos-page.js cargado');