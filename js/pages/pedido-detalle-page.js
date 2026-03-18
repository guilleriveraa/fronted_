// js/pages/pedido-detalle-page.js
// SOBRESCRIBIR CONSOLA PARA VER TODO
const originalLog = console.log;
const originalError = console.error;

//console.log = function(...args) {
//originalLog.apply(console, args);
// También mostrar en la página
// const debug = document.getElementById('debug-output') || (() => {
// const div = document.createElement('div');
// div.id = 'debug-output';
// div.style.cssText = 'position:fixed; bottom:0; left:0; right:0; background:black; color:lime; padding:10px; font-family:monospace; max-height:200px; overflow:auto; z-index:9999;';
// document.body.appendChild(div);
// return div;
//})();
//debug.innerHTML += '<div>' + args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ') + '</div>';
//};

console.error = function (...args) {
    originalError.apply(console, args);
    const debug = document.getElementById('debug-output') || document.createElement('div');
    debug.innerHTML += '<div style="color:red">❌ ' + args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ') + '</div>';
};

window.InitManager.register('PedidoDetallePage', async function () {
    console.log('📋 Inicializando página de detalle de pedido');

    const token = localStorage.getItem(window.TOKEN_KEY);
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Obtener ID del pedido de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');

    if (!orderId) {
        showError('No se especificó el pedido');
        return;
    }

    // Mostrar ID en la cabecera
    document.getElementById('orderIdDisplay').textContent = `#${orderId}`;

    try {
        // Verificar si el usuario es admin
        const isAdmin = await checkIfAdmin();

        if (isAdmin) {
            console.log('👑 Usuario admin, usando rutas admin');
            await loadOrderDetailsAdmin(orderId);
        } else {
            await loadOrderDetails(orderId);
        }
    } catch (error) {
        console.error('❌ Error:', error);
        showError('No se pudo cargar el detalle del pedido');
    }
}, []);

async function checkIfAdmin() {
    try {
        const token = localStorage.getItem(window.TOKEN_KEY);
        const response = await fetch(`${window.API_URL}/user/is-admin`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();
        return data.isAdmin || false;
    } catch {
        return false;
    }
}

async function loadOrderDetails(orderId) {
    const container = document.getElementById('orderDetailContainer');
    if (!container) return;

    const token = localStorage.getItem(window.TOKEN_KEY);

    try {
        // Obtener datos del pedido (ruta normal)
        const response = await fetch(`${window.API_URL}/orders/${orderId}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!response.ok) {
            throw new Error('Error al obtener el pedido');
        }

        const order = await response.json();
        console.log('📦 Pedido recibido:', order);

        // Obtener items del pedido (ruta normal)
        const itemsResponse = await fetch(`${window.API_URL}/orders/${orderId}/items`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        let items = [];
        if (itemsResponse.ok) {
            items = await itemsResponse.json();
            console.log('📦 Items recibidos:', items);
        }

        renderOrderDetails(order, items, false);

    } catch (error) {
        console.error('❌ Error:', error);
        container.innerHTML = '<p class="error">Error al cargar el pedido</p>';
    }
}

async function loadOrderDetailsAdmin(orderId) {
    const container = document.getElementById('orderDetailContainer');
    if (!container) return;

    const token = localStorage.getItem(window.TOKEN_KEY);

    try {
        // Obtener datos del pedido (ruta admin)
        const response = await fetch(`${window.API_URL}/admin/orders/${orderId}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!response.ok) {
            throw new Error('Error al obtener el pedido');
        }

        const order = await response.json();
        console.log('📦 Pedido admin recibido:', order);

        // Obtener items del pedido (ruta admin)
        const itemsResponse = await fetch(`${window.API_URL}/admin/orders/${orderId}/items`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        let items = [];
        if (itemsResponse.ok) {
            items = await itemsResponse.json();
            console.log('📦 Items admin recibidos:', items);
        }

        renderOrderDetails(order, items, true);

    } catch (error) {
        console.error('❌ Error:', error);
        container.innerHTML = '<p class="error">Error al cargar el pedido</p>';
    }
}

// 🔥 NUEVA FUNCIÓN: Mostrar banner de recogida en tienda (AHORA ANTES DE renderOrderDetails)
function mostrarBannerRecogida(order) {
    // Verificar si existe el contenedor del banner
    let banner = document.getElementById('recogidaBanner');

    // Si no existe, crearlo
    if (!banner) {
        const mainContainer = document.querySelector('.order-detail-page .container');
        if (!mainContainer) return;

        banner = document.createElement('div');
        banner.id = 'recogidaBanner';
        banner.className = 'recogida-banner';
        banner.style.display = 'none';

        // Insertar después del page-header
        const pageHeader = document.querySelector('.page-header');
        if (pageHeader) {
            pageHeader.insertAdjacentElement('afterend', banner);
        } else {
            mainContainer.prepend(banner);
        }
    }

    // Verificar si es un pedido para recoger en tienda
    const esRecogidaTienda =
        order.metodo_pago === 'pago_en_tienda' ||
        order.direccion_envio === 'Recoger en tienda' ||
        (order.direccion_detalles && order.direccion_detalles.includes('Recoger en tienda'));

    if (esRecogidaTienda) {
        const codigoRecogida = order.codigo_recogida || 'REC-' + order.id;

        banner.innerHTML = `
            <div class="banner-content">
                <i class="fas fa-store"></i>
                <div>
                    <h3>📦 Pedido para recoger en tienda</h3>
                    <p>Presenta este código cuando pases a recoger tu pedido:</p>
                    <div class="codigo-recogida">${codigoRecogida}</div>
                    <p class="direccion-tienda">
                        <i class="fas fa-map-marker-alt"></i> Calle Azafranal 26, Salamanca
                    </p>
                </div>
            </div>
        `;
        banner.style.display = 'block';
        console.log('🏪 Mostrando banner de recogida en tienda con código:', codigoRecogida);
    } else {
        banner.style.display = 'none';
    }
}

function renderOrderDetails(order, items, isAdmin) {
    const container = document.getElementById('orderDetailContainer');

    // Determinar el estado (puede venir como 'estado' o 'status')
    const estado = order.estado || order.status || 'pendiente';

    // 🔥 NUEVO: Mostrar banner de recogida en tienda
    mostrarBannerRecogida(order);

    // Actualizar badge de estado
    const statusBadge = document.getElementById('orderStatusBadge');
    statusBadge.innerHTML = `<span class="status-${estado}">${traducirEstado(estado)}</span>`;

    const fecha = new Date(order.fecha || order.date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Calcular subtotal y envío
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.precio) * item.cantidad), 0);
    const envio = 4.99; // Podrías obtenerlo del pedido si lo guardas
    const total = parseFloat(order.total) || subtotal + envio;

    // Dirección de envío (intentar obtener de diferentes formas)
    let direccionHTML = '';
    let direccionTexto = order.direccion_envio || 'No especificada';

    // 🔥 NUEVO: Verificar si es recogida en tienda
    const esRecogidaTienda = order.metodo_pago === 'pago_en_tienda' ||
        order.direccion_envio === 'Recoger en tienda' ||
        (order.direccion_detalles && order.direccion_detalles.includes('Recoger en tienda'));

    if (esRecogidaTienda) {
        // Mostrar dirección especial para recogida en tienda
        direccionTexto = `
            <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: #fff3e0; border-radius: 8px;">
                <i class="fas fa-store" style="color: #c62828; font-size: 1.5rem;"></i>
                <div>
                    <strong style="color: #c62828;">📦 RECOGER EN TIENDA</strong><br>
                    <span>Calle Azafranal 26, Salamanca</span><br>
                    <small class="text-muted">Presenta el código de recogida cuando pases</small>
                </div>
            </div>
        `;

        // Si hay código de recogida, añadirlo
        if (order.codigo_recogida) {
            direccionTexto += `<div style="margin-top: 10px; padding: 8px; background: #e8f5e9; border-radius: 8px; text-align: center;">
                <strong>Código de recogida:</strong> 
                <span style="font-family: monospace; font-size: 1.2rem; color: #c62828;">${order.codigo_recogida}</span>
            </div>`;
        }

    } else if (order.direccion_detalles) {
        // Si hay dirección detallada, mostrarla mejor
        try {
            const direccionDetalles = JSON.parse(order.direccion_detalles);
            direccionTexto = `
                <div style="background: #f8f9fa; padding: 10px; border-radius: 8px;">
                    <strong>${direccionDetalles.nombre || ''}</strong><br>
                    ${direccionDetalles.calle || ''} ${direccionDetalles.piso || ''}<br>
                    ${direccionDetalles.ciudad || ''}, ${direccionDetalles.codigo_postal || ''}<br>
                    ${direccionDetalles.pais || ''}
                </div>
            `;
        } catch (e) {
            // Si no es JSON, usar el texto plano
            direccionTexto = `<div style="background: #f8f9fa; padding: 10px; border-radius: 8px;">${order.direccion_envio || 'No especificada'}</div>`;
        }
    } else {
        // Texto plano simple
        direccionTexto = `<div style="background: #f8f9fa; padding: 10px; border-radius: 8px;">${order.direccion_envio || 'No especificada'}</div>`;
    }

    // 🎁 SECCIÓN DE REGALO - NUEVO
    let giftHTML = '';
    if (order.gift_active) {
        giftHTML = `
            <div class="order-info-section" style="background: #fff9f9; border-left: 4px solid #e83083; padding: 20px; margin-bottom: 25px; border-radius: 8px;">
                <h3 style="margin-bottom: 15px; color: #e83083;"><i class="fas fa-gift"></i> 🎁 Detalles del regalo</h3>
                <div style="display: flex; align-items: flex-start; gap: 15px;">
                    <div style="font-size: 2.5rem; color: #e83083;">🎁</div>
                    <div style="flex: 1;">
                        <p><strong>Este pedido es un regalo</strong></p>
                        <p><strong>Mensaje para la tarjeta:</strong></p>
                        <div style="background: white; padding: 20px; border-radius: 8px; border: 2px dashed #e83083; font-style: italic; margin: 10px 0;">
                            "${order.gift_message || 'Sin mensaje personalizado'}"
                        </div>
                        <p style="color: #666; font-size: 0.95rem; margin-top: 10px;">
                            <i class="fas fa-info-circle" style="color: #e83083;"></i> 
                            Coste adicional: <strong>${parseFloat(order.gift_cost || 0).toFixed(2)}€</strong>
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    const html = `
        <div class="order-detail-card">
            <!-- Información del cliente (solo para admin) -->
            ${isAdmin && (order.cliente_nombre || order.usuario_nombre) ? `
            <div class="order-info-section" style="background: #f8f9fa; border-left: 4px solid #c62828; padding: 20px; margin-bottom: 25px; border-radius: 8px;">
                <h3 style="margin-bottom: 15px; color: #c62828;"><i class="fas fa-user"></i> Información del cliente</h3>
                <p><strong>Nombre:</strong> ${order.cliente_nombre || order.usuario_nombre}</p>
                <p><strong>Email:</strong> ${order.cliente_email || order.usuario_email}</p>
            </div>
            ` : ''}

            <!-- Dirección de envío -->
            <div class="order-info-section" style="background: #f8f9fa; border-left: 4px solid #28a745; padding: 20px; margin-bottom: 25px; border-radius: 8px;">
                <h3 style="margin-bottom: 15px; color: #28a745;"><i class="fas fa-map-marker-alt"></i> Dirección de envío</h3>
                <div style="line-height: 1.6;">${direccionTexto}</div>
            </div>

            <!-- 🎁 SECCIÓN DE REGALO -->
            ${giftHTML}

            <div class="order-info-section">
                <div class="info-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 25px;">
                    <div class="info-item" style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <span class="info-label" style="color: #666; display: block; margin-bottom: 5px;">Fecha del pedido</span>
                        <span class="info-value" style="font-size: 1.1rem; font-weight: 600;">${fecha}</span>
                    </div>
                    <div class="info-item" style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <span class="info-label" style="color: #666; display: block; margin-bottom: 5px;">Total</span>
                        <span class="info-value total" style="font-size: 1.3rem; font-weight: 700; color: #c62828;">${total.toFixed(2)}€</span>
                    </div>
                </div>
            </div>

            <div class="order-tracking-section" style="margin-bottom: 30px;">
                <h3 style="margin-bottom: 20px;"><i class="fas fa-truck"></i> Estado del envío</h3>
                ${getTrackingHTML(estado)}
            </div>

            <div class="order-items-section" style="margin-bottom: 30px;">
                <h3 style="margin-bottom: 20px;"><i class="fas fa-box"></i> Productos</h3>
                <div class="items-table" style="border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden;">
                    <div class="items-header" style="display: grid; grid-template-columns: 3fr 1fr 1fr 1fr; background: #f8f9fa; padding: 12px 15px; font-weight: 600; border-bottom: 2px solid #dee2e6;">
                        <div>Producto</div>
                        <div>Precio</div>
                        <div>Cantidad</div>
                        <div>Subtotal</div>
                    </div>
                    <div class="items-body">
    ${items.map(item => {
        console.log('🎽 Item recibido en renderOrderDetails:', item);
        return `
            <div class="item-row" style="display: grid; grid-template-columns: 3fr 1fr 1fr 1fr; padding: 15px; border-bottom: 1px solid #dee2e6; align-items: center;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <img src="${item.imagen || item.imagen_producto || '/fronted/img/default.jpg'}" 
                         alt="${item.nombre || item.nombre_producto}" 
                         style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;"
                         onerror="this.src='https://via.placeholder.com/60'">
                    <div>
                        <span style="font-weight: 500;">${item.nombre || item.nombre_producto}</span>
                        ${item.talla ? `<br><small style="color: #e83083; font-size: 0.85rem;"><i class="fas fa-tshirt"></i> Talla: <strong>${item.talla}</strong></small>` : ''}
                    </div>
                </div>
                <div>${parseFloat(item.precio).toFixed(2)}€</div>
                <div>${item.cantidad}</div>
                <div style="font-weight: 600;">${(item.precio * item.cantidad).toFixed(2)}€</div>
            </div>
        `;
    }).join('')}
</div>
                </div>
            </div>

            <div class="order-summary-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                <h3 style="margin-bottom: 15px;"><i class="fas fa-receipt"></i> Resumen</h3>
                <div class="summary-details" style="max-width: 400px; margin-left: auto;">
                    <div class="summary-row" style="display: flex; justify-content: space-between; padding: 8px 0;">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}€</span>
                    </div>
                    <div class="summary-row" style="display: flex; justify-content: space-between; padding: 8px 0;">
                        <span>Envío</span>
                        <span>${envio.toFixed(2)}€</span>
                    </div>
                    <div class="summary-row total" style="display: flex; justify-content: space-between; padding: 15px 0 0; margin-top: 10px; border-top: 2px solid #dee2e6; font-weight: 700; font-size: 1.2rem;">
                        <span>Total</span>
                        <span style="color: #c62828;">${total.toFixed(2)}€</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;

    // Mostrar botón de devolución si el estado es entregado
    const returnBtn = document.getElementById('requestReturnBtn');
    if (returnBtn && estado === 'entregado') {
        returnBtn.style.display = 'inline-block';
        returnBtn.onclick = () => window.location.href = `devoluciones.html?order=${order.id}`;
    }
}

function traducirEstado(estado) {
    const traducciones = {
        'pendiente': 'Pendiente',
        'procesando': 'Procesando',
        'enviado': 'Enviado',
        'entregado': 'Entregado',
        'cancelado': 'Cancelado',
        'pagado': 'Pagado'
    };
    return traducciones[estado] || estado;
}

function getTrackingHTML(estado) {
    const steps = [
        { name: 'Pendiente', icon: 'fa-clock', estado: 'pendiente' },
        { name: 'Procesando', icon: 'fa-cog', estado: 'procesando' },
        { name: 'Enviado', icon: 'fa-truck', estado: 'enviado' },
        { name: 'Entregado', icon: 'fa-check-circle', estado: 'entregado' }
    ];

    const statusOrder = {
        'pendiente': 0,
        'procesando': 1,
        'enviado': 2,
        'entregado': 3,
        'cancelado': -1,
        'pagado': 1
    };

    const currentStep = statusOrder[estado] !== undefined ? statusOrder[estado] : 0;

    return `
        <div style="display: flex; justify-content: space-between; align-items: center; position: relative; padding: 20px 0;">
            ${steps.map((step, index) => `
                <div style="flex: 1; text-align: center; position: relative;">
                    <div style="
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        background: ${index <= currentStep ? '#c62828' : '#e0e0e0'};
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 10px;
                        position: relative;
                        z-index: 2;
                    ">
                        <i class="fas ${step.icon}"></i>
                    </div>
                    <div style="font-weight: ${index === currentStep ? '600' : '400'}; color: ${index <= currentStep ? '#c62828' : '#999'};">
                        ${step.name}
                    </div>
                    ${index < steps.length - 1 ? `
                        <div style="
                            position: absolute;
                            top: 20px;
                            left: 60%;
                            width: 80%;
                            height: 2px;
                            background: ${index < currentStep ? '#c62828' : '#e0e0e0'};
                            z-index: 1;
                        "></div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

function showError(message) {
    const container = document.getElementById('orderDetailContainer');
    container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
            <i class="fas fa-exclamation-circle" style="font-size: 4rem; color: #c62828; margin-bottom: 20px;"></i>
            <p style="font-size: 1.2rem; margin-bottom: 30px;">${message}</p>
            <button onclick="window.location.href='pedidos.html'" style="
                background: #c62828;
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 6px;
                font-size: 1rem;
                cursor: pointer;
            ">
                Volver a mis pedidos
            </button>
        </div>
    `;
}

console.log('✅ pedido-detalle-page.js cargado');