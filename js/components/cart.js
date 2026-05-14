// js/components/cart.js - UI del carrito MEJORADA

window.InitManager.register('CartFull', async function () {
    console.log('🚀 Inicializando funcionalidades del carrito');

    if (!window.CartCore) {
        console.error('❌ CartCore no disponible');
        window.errorHandler?.error('Error al cargar el carrito');
        return;
    }

    try {
        await renderCartPage();
        setupDiscountCode();

        // ===== NUEVO: Escuchar cambios del carrito =====
        if (window.CartCore) {
            window.CartCore.onChange(renderCartPage);
        }

        if (window.sessionService?.onChange) {
            window.sessionService.onChange(() => {
                window.CartCore.cart = null;
                renderCartPage();
            });
        }

        window.InitManager.log('✅ Funcionalidades del carrito inicializadas');
    } catch (error) {
        console.error('Error inicializando carrito:', error);
        window.errorHandler?.error('No se pudo cargar el carrito');
    }
}, ['CartCore']);

const cartContainer = document.getElementById('cartContainer');
const cartSummary = document.getElementById('cartSummary');

async function renderCartPage() {
    try {
        const cart = await window.CartCore.getCart();

        if (!cart || !cart.items || cart.items.length === 0) {
            if (cartContainer) {
                cartContainer.innerHTML = `
                    <div class="empty-cart">
                        <i class="fas fa-shopping-cart" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                        <p>Tu carrito está vacío.</p>
                        <a href="productos.html" class="btn-shop">Ver productos</a>
                    </div>
                `;
            }
            if (cartSummary) cartSummary.innerHTML = '';
            updateHeaderCartCount(0);
            return;
        }

        if (cartContainer) {
            cartContainer.innerHTML = '';
            cart.items.forEach((item) => {
                const subtotal = (item.price * item.quantity).toFixed(2);
                const itemDiv = document.createElement('div');
                itemDiv.className = 'cart-item';
                itemDiv.dataset.productId = item.id;
                itemDiv.innerHTML = `
                    <div class="cart-product">
                        <img src="${item.image || '/fronted/img/default-product.jpg'}" 
                             alt="${item.name}" 
                             class="cart-product-img"
                             onerror="this.src='https://via.placeholder.com/80'">
                        <div class="cart-product-info">
    <h3>${item.name}</h3>
    <p class="product-description">${item.description || ''}</p>
    ${item.talla ? `<p class="product-talla" style="font-size: 0.9rem; color: #e83083; margin-top: 5px;">
        <i class="fas fa-tshirt"></i> Talla: <strong>${item.talla}</strong>
    </p>` : ''}
</div>
                    </div>
                    <div class="cart-price">${item.price.toFixed(2)}€</div>
                    <div class="cart-quantity">
                        <button class="quantity-btn" onclick="decreaseQuantity(${item.id})" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="99" 
                               onchange="updateQuantityInput(${item.id}, this.value)">
                        <button class="quantity-btn" onclick="increaseQuantity(${item.id})">+</button>
                    </div>
                    <div class="cart-subtotal">${subtotal}€</div>
                    <button class="cart-remove" onclick="removeFromCart(${item.id})" title="Eliminar producto">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
                cartContainer.appendChild(itemDiv);
            });
        }

        renderCartSummary(cart);
        updateHeaderCartCount(cart.items.length);

    } catch (error) {
        console.error('Error rendering cart:', error);
        if (cartContainer) {
            cartContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error al cargar el carrito</p>
                    <button onclick="location.reload()" class="btn-retry">Reintentar</button>
                </div>
            `;
        }
    }
}

function renderCartSummary(cart) {
    if (!cartSummary) return;

    const subtotal = cart.subtotal.toFixed(2);

    // 🔥 OBTENER MÉTODO DE ENTREGA SELECCIONADO
    const metodoEntrega = document.querySelector('input[name="metodoEntrega"]:checked')?.value;

    // 🔥 CALCULAR ENVÍO SEGÚN MÉTODO
    let shippingValue = 4.99; // valor por defecto
    if (metodoEntrega === 'tienda') {
        shippingValue = 0;
    } else if (metodoEntrega === 'domicilio') {
        shippingValue = 4.99;
    } else {
        shippingValue = cart.shipping || 4.99;
    }

    const shipping = shippingValue.toFixed(2);

    // 🎁 Obtener estado del regalo
    const giftActive = cart.gift?.active || false;
    const giftMessage = cart.gift?.message || '';

    const cuponGuardado = localStorage.getItem('cupon_aplicado');
    let descuento = 0;
    let codigoAplicado = '';

    if (cuponGuardado) {
        try {
            const cupon = JSON.parse(cuponGuardado);
            descuento = parseFloat(cupon.descuento) || 0;
            codigoAplicado = cupon.codigo || '';
        } catch (e) {
            console.error('Error parsing cupon:', e);
            localStorage.removeItem('cupon_aplicado');
        }
    }

    // 🔥 TOTAL CON ENVÍO DINÁMICO
    const total = (cart.subtotal - descuento + shippingValue).toFixed(2);

    cartSummary.innerHTML = `
        <div class="summary-card">
            <h2>Resumen del Pedido</h2>
            <div class="summary-details">
                <div class="summary-row">
                    <span>Subtotal</span>
                    <span class="summary-value">${subtotal}€</span>
                </div>
                ${descuento > 0 ? `
                <div class="summary-row descuento">
                    <span>Descuento (${codigoAplicado})</span>
                    <span class="summary-value">-${descuento.toFixed(2)}€</span>
                </div>
                ` : ''}
                <div class="summary-row" id="shippingRow">
                    <span>Envío</span>
                    <span class="summary-value" id="shippingValue">${shipping}€</span>
                </div>
                
                <!-- 🎁 NUEVO: Opción de regalo -->
                <div class="gift-option-summary" style="margin: 15px 0; padding: 15px; background: #f9f9f9; border-radius: 8px;">
                    <div class="form-check mb-3">
                        <input class="form-check-input" type="checkbox" id="giftCheckbox" ${giftActive ? 'checked' : ''}>
                        <label class="form-check-label fw-bold" for="giftCheckbox">
                            🎁 ¿Es un regalo? (+2€)
                        </label>
                    </div>
                    
                    <div id="giftMessageContainer" style="display: ${giftActive ? 'block' : 'none'}; margin-top: 15px;">
                        <label for="giftMessage" class="form-label">Mensaje para la tarjeta:</label>
                        <textarea class="form-control" id="giftMessage" rows="3" maxlength="200" placeholder="Escribe aquí tu dedicatoria...">${giftMessage}</textarea>
                        <small class="text-muted">El mensaje se incluirá en una tarjeta dentro del paquete.</small>
                    </div>
                </div>
                
                <div class="summary-divider"></div>
                <div class="summary-row total">
                    <span>TOTAL</span>
                    <span class="total-value" id="totalValue">${total}€</span>
                </div>
            </div>
            <div class="discount-section">
                <div class="discount-input-group">
                    <input type="text" id="discountCode" placeholder="Código descuento" value="${codigoAplicado}">
                    <button type="button" onclick="applyDiscount()" class="btn-apply">Aplicar</button>
                </div>
                ${descuento > 0 ? `
                <button type="button" onclick="removeDiscount()" class="btn-remove-discount">
                    <i class="fas fa-times"></i> Quitar descuento
                </button>
                ` : ''}
            </div>
        </div>
    `;

    // 🎁 Añadir eventos para la opción de regalo
    setupGiftEvents();
}
// Actualizar el total del carrito según el método de entrega
// 🔥 Función para actualizar el total cuando cambia el método de entrega
window.actualizarTotalPorEnvio = async function () {
    const cart = await window.CartCore.getCart();
    if (!cart) return;

    const metodoEntrega = document.querySelector('input[name="metodoEntrega"]:checked')?.value;

    let shippingValue = 4.99;
    if (metodoEntrega === 'tienda') {
        shippingValue = 0;
    } else if (metodoEntrega === 'domicilio') {
        shippingValue = 4.99;
    }

    // 🔥 CORREGIDO: Usar selectores simples y válidos
    // Buscar la fila de envío por su estructura
    const summaryRows = document.querySelectorAll('.summary-row');
    let shippingRow = null;
    let shippingElement = null;

    // Recorrer las filas para encontrar la que contiene "Envío"
    summaryRows.forEach(row => {
        const span = row.querySelector('span:first-child');
        if (span && span.textContent.trim() === 'Envío') {
            shippingRow = row;
            shippingElement = row.querySelector('.summary-value');
        }
    });

    // Actualizar el valor del envío
    if (shippingElement) {
        shippingElement.textContent = shippingValue.toFixed(2) + '€';
        console.log('✅ Envío actualizado a:', shippingValue.toFixed(2) + '€');
    } else {
        console.warn('⚠️ No se encontró la fila de envío');
    }

    // Actualizar el total
    const cuponGuardado = localStorage.getItem('cupon_aplicado');
    let descuento = 0;
    if (cuponGuardado) {
        try {
            const cupon = JSON.parse(cuponGuardado);
            descuento = parseFloat(cupon.descuento) || 0;
        } catch (e) { }
    }

    const total = (cart.subtotal - descuento + shippingValue).toFixed(2);
    const totalElement = document.querySelector('.summary-row.total .total-value');
    if (totalElement) {
        totalElement.textContent = total + '€';
        console.log('✅ Total actualizado a:', total + '€');
    } else {
        console.warn('⚠️ No se encontró el elemento del total');
    }
};

// 🎁 NUEVO: Configurar eventos para la opción de regalo
function setupGiftEvents() {
    const giftCheckbox = document.getElementById('giftCheckbox');
    const giftMessageContainer = document.getElementById('giftMessageContainer');
    const giftMessage = document.getElementById('giftMessage');

    if (!giftCheckbox) return;

    // Evento cambio en checkbox
    giftCheckbox.addEventListener('change', async function () {
        const active = this.checked;
        if (giftMessageContainer) {
            giftMessageContainer.style.display = active ? 'block' : 'none';
        }

        // Actualizar en CartCore
        const message = active && giftMessage ? giftMessage.value : '';
        await window.CartCore.setGiftOption(active, message);
    });

    // Evento cambio en mensaje (con debounce)
    if (giftMessage) {
        let timeout;
        giftMessage.addEventListener('input', function () {
            clearTimeout(timeout);
            timeout = setTimeout(async () => {
                if (giftCheckbox.checked) {
                    await window.CartCore.setGiftOption(true, this.value);
                }
            }, 500);
        });
    }
}

window.removeDiscount = function () {
    localStorage.removeItem('cupon_aplicado');
    window.errorHandler?.success('Descuento eliminado');
    renderCartPage();
};

window.increaseQuantity = async function (productId) {
    try {
        await window.CartCore.changeQty(productId, 1);
    } catch (error) {
        console.error('Error increasing quantity:', error);
    }
};

window.decreaseQuantity = async function (productId) {
    try {
        await window.CartCore.changeQty(productId, -1);
    } catch (error) {
        console.error('Error decreasing quantity:', error);
    }
};

window.updateQuantityInput = async function (productId, value) {
    const quantity = parseInt(value);
    if (!isNaN(quantity) && quantity >= 1 && quantity <= 99) {
        try {
            const cart = await window.CartCore.getCart();
            const item = cart.items.find(i => i.id === productId);
            if (item) {
                const delta = quantity - item.quantity;
                await window.CartCore.changeQty(productId, delta);
            }
        } catch (error) {
            console.error('Error updating quantity:', error);
            window.errorHandler?.error('Error al actualizar cantidad');
        }
    }
};

window.removeFromCart = async function (productId) {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
        try {
            await window.CartCore.removeFromCart(productId);
        } catch (error) {
            console.error('Error removing item:', error);
        }
    }
};

window.applyDiscount = async function () {
    const codeInput = document.getElementById('discountCode');
    if (!codeInput) return;

    const codigo = codeInput.value.trim().toUpperCase();

    if (codigo === '') {
        window.errorHandler?.warning('Introduce un código de descuento');
        return;
    }

    try {
        const cart = await window.CartCore.getCart();
        const response = await fetch(`${window.API_URL}/cupones/validar`, {

            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': window.sessionService?.isLoggedIn() ? 'Bearer ' + window.sessionService.getToken() : ''
            },
            body: JSON.stringify({
                codigo: codigo,
                subtotal: cart.subtotal,
                usuarioId: window.sessionService?.getUser()?.id
            })
        });

        const data = await response.json();

        if (data.valido) {
            let descuentoCalculado = data.cupon?.descuento_calculado || 0;

            localStorage.setItem('cupon_aplicado', JSON.stringify({
                codigo: codigo,
                descuento: descuentoCalculado,
                tipo: data.cupon.tipo,
                id: data.cupon.id
            }));

            window.errorHandler?.success(`✅ Cupón aplicado: ${descuentoCalculado.toFixed(2)}€ de descuento`);
            await renderCartPage();

        } else {
            window.errorHandler?.error(data.message || 'Código no válido');
        }

    } catch (error) {
        console.error('Error applying discount:', error);
        window.errorHandler?.networkError('Error al verificar el código', async () => {
            await window.applyDiscount();
        });
    }

    codeInput.value = '';
};

function setupDiscountCode() {
    const codeInput = document.getElementById('discountCode');
    if (codeInput) {
        codeInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyDiscount();
            }
        });
    }
}

function updateHeaderCartCount(count) {
    const counters = [
        'headerCartCount',
        'headerCartCount2',
        'mobileCartCount'
    ];

    counters.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const oldCount = parseInt(el.textContent) || 0;
            el.textContent = count;

            if (oldCount !== count) {
                el.classList.add('cart-count-changed');
                setTimeout(() => el.classList.remove('cart-count-changed'), 300);
            }
        }
    });
}

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderCartPage);
} else {
    renderCartPage();
}

console.log('✅ Cart UI mejorado');