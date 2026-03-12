// js/pages/checkout.js

// ===================== CHECKOUT =====================

window.proceedToCheckout = async function() {
    console.log('🛒 proceedToCheckout llamado');
    
    // 🔥 VERIFICAR QUE EL USUARIO ESTÁ LOGUEADO
    if (!window.sessionService) {
        console.error('❌ sessionService no disponible');
        alert('Error de autenticación. Recarga la página.');
        return;
    }
    
    if (!window.sessionService.isLoggedIn()) {
        console.log('❌ Usuario no logueado');
        if (window.showAuthModal) {
            window.showAuthModal('login');
        } else {
            alert('Debes iniciar sesión para continuar con el pago');
        }
        return;
    }

    // 🔥 VERIFICAR QUE EL CARRITO NO ESTÁ VACÍO
    const cart = await window.CartCore.getCart();
    if (!cart || cart.items.length === 0) {
        alert('Tu carrito está vacío. Añade productos antes de proceder al pago.');
        return;
    }

    // 🔥 VERIFICAR QUE BOOTSTRAP ESTÁ DISPONIBLE
    if (typeof bootstrap === 'undefined') {
        console.error('❌ Bootstrap no está cargado');
        alert('Error: No se pudo cargar el modal. Por favor, recarga la página.');
        return;
    }

    // 🔥 VERIFICAR QUE EL MODAL EXISTE
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

window.guardarDireccionYProceder = async function() {
    console.log('📍 guardarDireccionYProceder llamado');
    
    // Verificar método de entrega
    const metodo = document.querySelector('input[name="metodoEntrega"]:checked')?.value;
    
    if (!metodo) {
        alert('Por favor, selecciona un método de entrega');
        return;
    }
    
    // 🔥 CASO 1: RECOGER EN TIENDA
    if (metodo === 'tienda') {
        console.log('🏪 Opción recogida en tienda seleccionada');
        
        if (!window.sessionService?.isLoggedIn()) {
            alert('Debes iniciar sesión para continuar');
            if (window.showAuthModal) window.showAuthModal('login');
            return;
        }
        
        await procesarRecogidaTienda();
        return;
    }
    
    // 🔥 CASO 2: ENVÍO A DOMICILIO (código actual)
    if (!window.sessionService?.isLoggedIn()) {
        alert('Debes iniciar sesión para continuar');
        if (window.showAuthModal) window.showAuthModal('login');
        return;
    }
    
    // Obtener valores del formulario (tu código actual de validación)
    const nombre = document.getElementById('direccionNombre')?.value;
    const linea1 = document.getElementById('direccionLinea1')?.value;
    const ciudad = document.getElementById('direccionCiudad')?.value;
    const cp = document.getElementById('direccionCP')?.value;
    const pais = document.getElementById('direccionPais')?.value;
    const linea2 = document.getElementById('direccionLinea2')?.value || '';

    if (!nombre || !linea1 || !ciudad || !cp || !pais) {
        alert('Por favor, completa todos los campos obligatorios');
        return;
    }

    // Construir dirección (tu código actual)
    let direccion = `${linea1}, ${ciudad}, ${cp}, ${pais}`;
    if (linea2) {
        direccion = `${linea1} ${linea2}, ${ciudad}, ${cp}, ${pais}`;
    }

    const direccionData = {
        nombre: nombre,
        direccion_completa: direccion,
        calle: linea1,
        piso: linea2,
        ciudad: ciudad,
        codigo_postal: cp,
        pais: pais
    };

    localStorage.setItem('direccion_envio', JSON.stringify(direccionData));
    
    // Cerrar modal (tu código actual)
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
    const originalText = checkoutBtn ? checkoutBtn.innerHTML : '';
    
    try {
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        
        // 1. Obtener carrito actual
        const cart = await window.CartCore.getCart();
        
        if (!cart || cart.items.length === 0) {
            throw new Error('El carrito está vacío');
        }
        
        // 🎁 Obtener datos de regalo
        const giftData = cart.gift || { active: false, message: '', cost: 2.00 };
        
        // 🔥 Mapear items para incluir la talla
        const itemsParaEnviar = cart.items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
            talla: item.talla || null
        }));
        
        // ===== LOGS DE VERIFICACIÓN =====
        console.log('📦 Items a enviar (VERIFICACIÓN):', itemsParaEnviar);
        itemsParaEnviar.forEach((item, i) => {
            console.log(`   Item ${i}: ID=${item.id}, Talla=${item.talla}`);
        });
        // ================================
        
        // 2. Crear pedido en backend
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
        
        // ... resto del código ...
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error al crear pedido');
        }
        
        // 3. Vaciar carrito
        window.CartCore.cart = { items: [], subtotal: 0, shipping: 0, total: 0 };
        window.CartCore.saveCartToStorage(window.CartCore.cart);
        window.CartCore.notifyListeners();
        
        // 4. Mostrar confirmación
        alert(`✅ ¡Pedido #${data.pedidoId} creado!\n\nPasa por nuestra tienda a recogerlo. Te esperamos.`);
        
        // 5. Redirigir a página de confirmación
        window.location.href = `recogida-confirmada.html?pedido=${data.pedidoId}`;
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error: ' + error.message);
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = originalText;
    } finally {
        const modalElement = document.getElementById('direccionModal');
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();
        }
    }
}

async function procesarPagoConDireccion(direccionData) {
    console.log('💳 procesarPagoConDireccion llamado');
    console.log('📍 Dirección a enviar:', direccionData);
    
    // 🔥 VERIFICACIÓN DE SEGURIDAD
    if (!window.sessionService?.isLoggedIn()) {
        alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
        if (window.showAuthModal) window.showAuthModal('login');
        return;
    }
    
    const checkoutBtn = document.getElementById('checkoutBtn');
    const originalText = checkoutBtn ? checkoutBtn.innerHTML : '';
    
    try {
        // Deshabilitar botón mientras se procesa
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
            checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        }
        
        console.log('📤 Enviando petición a Stripe...');
        console.log('Token:', window.sessionService.getToken()?.substring(0, 20) + '...');

        // En checkout.js, dentro de procesarPagoConDireccion
// Obtener cupón guardado - VERSIÓN CORREGIDA (campo 'descuento')
const cuponGuardado = localStorage.getItem('cupon_aplicado');
let cuponId = null;

if (cuponGuardado) {
    try {
        const cupon = JSON.parse(cuponGuardado);
        
        console.log('🎫 Cupón completo desde localStorage:', cupon);
        
        // Obtener el ID
        cuponId = cupon.id;
        
        // Obtener el valor del campo 'descuento' (que es el que tiene)
        const valorDescuento = cupon.descuento;
        
        console.log('🎫 Cupón aplicado ID:', cuponId);
        console.log('🎫 Código:', cupon.codigo);
        console.log('🎫 Tipo:', cupon.tipo);
        console.log('🎫 Valor (descuento):', valorDescuento);
        
        // AHORA SÍ tenemos el valor correctamente
        
        // Opcional: guardar el valor en el objeto para usarlo después si es necesario
        cupon.valor = valorDescuento; // Añadimos el campo 'valor' para compatibilidad
        
        // Verificar que el valor existe
        if (valorDescuento === undefined || valorDescuento === null) {
            console.warn('⚠️ El cupón no tiene campo "descuento" válido');
        }
    } catch (e) {
        console.warn('Error parsing cupón:', e);
    }
}

// 🎁 NUEVO: Obtener datos de regalo del carrito
const cart = await window.CartCore.getCart();
const giftData = cart.gift || { active: false, message: '', cost: 2.00 };

console.log('🎁 Datos de regalo:', giftData);

// Crear sesión de pago
const response = await fetch(`${window.API_URL}/create-checkout-session`, {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ' + window.sessionService.getToken(),
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        cuponId: cuponId,
        direccion: direccionData,
        // 🎁 NUEVO: Añadir datos de regalo
        gift: {
            active: giftData.active,
            message: giftData.message || '',
            cost: giftData.active ? 2.00 : 0
        }
    })
});


        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Error del servidor:', data);
            
            // Mostrar error específico si existe
            let errorMsg = 'Error al procesar el pago';
            if (data.errors && data.errors.length > 0) {
                errorMsg = data.errors[0].msg || errorMsg;
            } else if (data.message) {
                errorMsg = data.message;
            }
            
            throw new Error(errorMsg);
        }

        console.log('✅ Sesión creada, redirigiendo a Stripe:', data.url);

// ====================================================
// 🚀 VACIAR CARRITO AHORA MISMO - SIN ESPERAR NADA
// ====================================================
console.log('🧹 VACIANDO CARRITO INMEDIATAMENTE...');

try {
    // 1. Vaciar en backend (opcional, por si acaso)
    const token = window.sessionService.getToken();
    if (token) {
        fetch(`${window.API_URL}/emergency-clear-cart`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
        }).then(res => res.json())
          .then(data => console.log('🧹 Backend:', data))
          .catch(err => console.error('🧹 Error:', err));
    }
    
    // 2. VACIAR EN FRONTEND (inmediato)
    if (window.CartCore) {
        // Vaciar estructura
        window.CartCore.cart = { 
            items: [], 
            subtotal: 0, 
            shipping: 0, 
            total: 0 
        };
        
        // Guardar en localStorage
        window.CartCore.saveCartToStorage(window.CartCore.cart);
        
        // Notificar cambios
        window.CartCore.notifyListeners();
        
        // Actualizar contadores manualmente
        document.querySelectorAll('.cart-count').forEach(el => {
            el.textContent = '0';
        });
        
        console.log('✅ CARRITO VACIADO EN FRONTEND');
    } else {
        // Vaciar localStorage directamente
        localStorage.removeItem('cart');
        localStorage.removeItem('carrito');
        localStorage.setItem('cart', JSON.stringify({ items: [] }));
        console.log('✅ localStorage vaciado');
    }
    
    // 3. Evento personalizado
    window.dispatchEvent(new CustomEvent('cart-updated'));
    
} catch (e) {
    console.error('Error vaciando carrito:', e);
}

// Redirigir a Stripe
window.location.href = data.url;
    } catch (error) {
        console.error('❌ Error completo:', error);
        
        // Mostrar error al usuario
        if (window.errorHandler) {
            window.errorHandler.error(error.message);
        } else {
            alert('Error: ' + error.message);
        }
        
        // Reactivar botón
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = originalText;
        }
    }
}

// Función para limpiar después del pago (opcional)
window.limpiarDespuesDePago = function() {
    localStorage.removeItem('direccion_envio');
    localStorage.removeItem('cupon_aplicado');
    if (window.CartCore) {
        window.CartCore.cart = null;
        window.CartCore.notifyListeners();
    }
};