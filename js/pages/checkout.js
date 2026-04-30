// js/pages/checkout.js

// ===================== CHECKOUT =====================

window.proceedToCheckout = async function () {
    console.log('🛒 proceedToCheckout llamado');

    if (!window.sessionService) {
        console.error('❌ sessionService no disponible');
        alert('Error de autenticación. Recarga la página.');
        return;
    }

    if (!window.sessionService.isLoggedIn()) {
        console.log('❌ Usuario no logueado - Guardando carrito para después del login');

        if (window.sessionService.setCallbackDespuesDeLogin) {
            window.sessionService.setCallbackDespuesDeLogin(async () => {
                console.log('🔄 Usuario logueado, sincronizando carrito y continuando...');
                if (window.CartCore.sincronizarCarritoLocal) {
                    await window.CartCore.sincronizarCarritoLocal();
                }
                window.proceedToCheckout();
            });
        }

        if (window.showAuthModal) {
            window.showAuthModal('login');
        } else {
            alert('Debes iniciar sesión para continuar con el pago');
        }
        return;
    }

    const cart = await window.CartCore.getCart();
    if (!cart || cart.items.length === 0) {
        alert('Tu carrito está vacío. Añade productos antes de proceder al pago.');
        return;
    }

    if (typeof bootstrap === 'undefined') {
        console.error('❌ Bootstrap no está cargado');
        alert('Error: No se pudo cargar el modal. Por favor, recarga la página.');
        return;
    }

    const modalElement = document.getElementById('direccionModal');
    if (!modalElement) {
        console.error('❌ No se encontró el elemento del modal');
        alert('Error: No se encontró el formulario de dirección.');
        return;
    }

    console.log('📦 Mostrando modal de dirección');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
};

window.guardarDireccionYProceder = async function () {
    console.log('📍 guardarDireccionYProceder llamado');

    const metodo = document.querySelector('input[name="metodoEntrega"]:checked')?.value;

    if (!metodo) {
        alert('Por favor, selecciona un método de entrega');
        return;
    }

    if (metodo === 'tienda') {
        console.log('🏪 Opción recogida en tienda seleccionada');

        if (!window.sessionService?.isLoggedIn()) {
            alert('Debes iniciar sesión para continuar');
            if (window.showAuthModal) window.showAuthModal('login');
            return;
        }

        const formaPago = confirm('¿Deseas pagar ahora con tarjeta?\n\n"OK" → Pago online con Stripe\n"Cancelar" → Pagar en tienda');

        if (formaPago) {
            await procesarPagoRecogidaTienda();
        } else {
            await procesarRecogidaTienda();
        }
        return;
    }

    if (!window.sessionService?.isLoggedIn()) {
        alert('Debes iniciar sesión para continuar');
        if (window.showAuthModal) window.showAuthModal('login');
        return;
    }

    const nombre = document.getElementById('direccionNombre')?.value;
    const linea1 = document.getElementById('direccionLinea1')?.value;
    const ciudad = document.getElementById('direccionCiudad')?.value;
    const cp = document.getElementById('direccionCP')?.value;
    const linea2 = document.getElementById('direccionLinea2')?.value || '';

    if (!nombre || !linea1 || !ciudad || !cp) {
        alert('Por favor, completa todos los campos obligatorios');
        return;
    }

    let direccion = `${linea1}, ${ciudad}, ${cp},`;
    if (linea2) {
        direccion = `${linea1} ${linea2}, ${ciudad}, ${cp}`;
    }

    const direccionData = {
        nombre: nombre,
        direccion_completa: direccion,
        calle: linea1,
        piso: linea2,
        ciudad: ciudad,
        codigo_postal: cp,
    };

    localStorage.setItem('direccion_envio', JSON.stringify(direccionData));

    const modalElement = document.getElementById('direccionModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();
    }

    await procesarPagoConDireccion(direccionData);
};

async function procesarRecogidaTienda() {
    console.log('🏪 Procesando recogida en tienda');

    const checkoutBtn = document.getElementById('checkoutBtn');
    let originalText = '';

    try {
        if (checkoutBtn) {
            originalText = checkoutBtn.innerHTML;
            checkoutBtn.disabled = true;
            checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        }

        const cart = await window.CartCore.getCart();
        if (!cart || cart.items.length === 0) {
            throw new Error('El carrito está vacío');
        }

        const giftData = cart.gift || { active: false, message: '', cost: 2.00 };

        const itemsParaEnviar = cart.items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
            talla: item.talla || null,
            color: item.color || null
        }));

        const response = await fetch(`${window.API_URL}/pedidos/recogida-tienda`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + window.sessionService.getToken(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: itemsParaEnviar,
                subtotal: cart.subtotal,
                gift: {
                    active: giftData.active,
                    message: giftData.message || '',
                    cost: giftData.active ? 2.00 : 0
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al crear pedido');
        }

        // 🔥🔥🔥 VACIAR CARRITO AQUÍ 🔥🔥🔥
        console.log('🧹 Vaciando carrito después del pedido...');
        await window.CartCore.vaciarCarritoCompleto();

        alert(`✅ ¡Pedido #${data.pedidoId} creado!\n\nCódigo de recogida: ${data.codigoRecogida}\n\nPasa por nuestra tienda a recogerlo.`);
        window.location.href = `recogida-confirmada.html?pedido=${data.pedidoId}&codigo=${data.codigoRecogida}`;

    } catch (error) {
        console.error('❌ Error detallado:', error);
        alert('Error: ' + error.message);
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = originalText;
        }
    } finally {
        const modalElement = document.getElementById('direccionModal');
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();
        }
    }
}

// ===================== RECOGIDA EN TIENDA (PAGAR ONLINE) =====================
async function procesarPagoRecogidaTienda() {
    console.log('💳 Procesando pago online para recogida en tienda');

    const checkoutBtn = document.getElementById('checkoutBtn');
    const originalText = checkoutBtn ? checkoutBtn.innerHTML : '';

    try {
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
            checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        }

        const cart = await window.CartCore.getCart();

        if (!cart || cart.items.length === 0) {
            throw new Error('El carrito está vacío');
        }

        cart.shipping = 0;
        cart.total = cart.subtotal;
        window.CartCore.saveCartToStorage(cart);
        window.CartCore.cart = cart;

        const userData = window.sessionService.getUserData ? window.sessionService.getUserData() : {};
        const direccionData = {
            nombre: userData.nombre || 'Cliente',
            calle: 'Recoger en tienda',
            piso: '',
            ciudad: 'Salamanca',
            codigo_postal: '37001',
            pais: 'ES'
        };

        const giftData = cart.gift || { active: false, message: '', cost: 2.00 };

        console.log('📤 Enviando a backend:', {
            cuponId: null,
            direccion: direccionData,
            gift: {
                active: giftData.active,
                message: giftData.message || '',
                cost: giftData.active ? 2.00 : 0
            },
            esRecogidaTienda: true
        });

        const response = await fetch(`${window.API_URL}/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + window.sessionService.getToken(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cuponId: null,
                direccion: direccionData,
                gift: {
                    active: giftData.active,
                    message: giftData.message || '',
                    cost: giftData.active ? 2.00 : 0
                },
                esRecogidaTienda: true
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Error response:', response.status, data);
            throw new Error(data.message || 'Error al crear sesión de pago');
        }

        console.log('✅ Redirigiendo a Stripe para pago...');
        window.location.href = data.url;

    } catch (error) {
        console.error('❌ Error detallado:', error);
        alert('Error: ' + error.message);
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = originalText;
        }
    } finally {
        const modalElement = document.getElementById('direccionModal');
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();
        }
    }
}

// ===================== ENVÍO A DOMICILIO =====================
async function procesarPagoConDireccion(direccionData) {
    console.log('💳 procesarPagoConDireccion llamado');
    console.log('📍 Dirección a enviar:', direccionData);

    if (!window.sessionService?.isLoggedIn()) {
        alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
        if (window.showAuthModal) window.showAuthModal('login');
        return;
    }

    const checkoutBtn = document.getElementById('checkoutBtn');
    const originalText = checkoutBtn ? checkoutBtn.innerHTML : '';

    try {
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
            checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        }

        const cuponGuardado = localStorage.getItem('cupon_aplicado');
        let cuponId = null;
        if (cuponGuardado) {
            try {
                const cupon = JSON.parse(cuponGuardado);
                cuponId = cupon.id;
            } catch (e) {
                console.warn('Error parsing cupón:', e);
            }
        }

        const cart = await window.CartCore.getCart();
        const giftData = cart.gift || { active: false, message: '', cost: 2.00 };

        const response = await fetch(`${window.API_URL}/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + window.sessionService.getToken(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cuponId: cuponId,
                direccion: direccionData,
                gift: {
                    active: giftData.active,
                    message: giftData.message || '',
                    cost: giftData.active ? 2.00 : 0
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al procesar el pago');
        }

        if (data.url) {
            window.location.assign(data.url);
        } else {
            throw new Error('No se recibió URL de Stripe');
        }

    } catch (error) {
        console.error('❌ Error completo:', error);
        if (window.errorHandler) {
            window.errorHandler.error(error.message);
        } else {
            alert('Error: ' + error.message);
        }
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = originalText;
        }
    }
}

window.limpiarDespuesDePago = function () {
    localStorage.removeItem('direccion_envio');
    localStorage.removeItem('cupon_aplicado');
    if (window.CartCore) {
        window.CartCore.cart = null;
        window.CartCore.notifyListeners();
    }
};

console.log('✅ checkout.js cargado');