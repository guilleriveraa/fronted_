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
    
    // 🔥 VERIFICAR SESIÓN OTRA VEZ (por si acaso)
    if (!window.sessionService?.isLoggedIn()) {
        alert('Debes iniciar sesión para continuar');
        if (window.showAuthModal) window.showAuthModal('login');
        return;
    }
    
    // Obtener valores del formulario
    const nombre = document.getElementById('direccionNombre')?.value;
    const linea1 = document.getElementById('direccionLinea1')?.value;
    const ciudad = document.getElementById('direccionCiudad')?.value;
    const cp = document.getElementById('direccionCP')?.value;
    const pais = document.getElementById('direccionPais')?.value;
    const linea2 = document.getElementById('direccionLinea2')?.value || '';

    // Validar campos obligatorios
    if (!nombre || !linea1 || !ciudad || !cp || !pais) {
        alert('Por favor, completa todos los campos obligatorios');
        return;
    }

    // Construir dirección formateada
    let direccion = `${linea1}, ${ciudad}, ${cp}, ${pais}`;
    if (linea2) {
        direccion = `${linea1} ${linea2}, ${ciudad}, ${cp}, ${pais}`;
    }

    // Crear objeto de dirección completo
    const direccionData = {
        nombre: nombre,
        direccion_completa: direccion,
        calle: linea1,
        piso: linea2,
        ciudad: ciudad,
        codigo_postal: cp,
        pais: pais
    };

    // Guardar en localStorage como backup
    localStorage.setItem('direccion_envio', JSON.stringify(direccionData));

    // Cerrar modal - VERSIÓN CORREGIDA
    const modalElement = document.getElementById('direccionModal');
    if (modalElement) {
        try {
            // Verificar si Bootstrap está definido
            if (typeof bootstrap !== 'undefined') {
                let modal = bootstrap.Modal.getInstance(modalElement);
                if (!modal) {
                    modal = new bootstrap.Modal(modalElement);
                }
                modal.hide();
            } else {
                console.warn('Bootstrap no está disponible, cerrando modal manualmente');
                modalElement.style.display = 'none';
                modalElement.classList.remove('show');
                document.body.classList.remove('modal-open');
                document.querySelector('.modal-backdrop')?.remove();
            }
        } catch (e) {
            console.error('Error al cerrar modal:', e);
            // Fallback: ocultar manualmente
            modalElement.style.display = 'none';
            modalElement.classList.remove('show');
            document.body.classList.remove('modal-open');
            document.querySelector('.modal-backdrop')?.remove();
        }
    }

    // Proceder al pago
    await procesarPagoConDireccion(direccionData);
};

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
// Obtener cupón guardado - VERSIÓN CORREGIDA
const cuponGuardado = localStorage.getItem('cupon_aplicado');
let cuponId = null;

if (cuponGuardado) {
    try {
        const cupon = JSON.parse(cuponGuardado);
        
        // Mostrar el objeto completo para depurar
        console.log('🎫 Cupón completo desde localStorage:', cupon);
        
        // Intentar obtener el ID de diferentes formas
        cuponId = cupon.id || cupon.cuponId || null;
        
        // Mostrar toda la información disponible
        console.log('🎫 Cupón aplicado ID:', cuponId);
        console.log('🎫 Código:', cupon.codigo || cupon.code);
        console.log('🎫 Tipo:', cupon.tipo || cupon.tipo_descuento || cupon.type);
        console.log('🎫 Valor:', cupon.valor || cupon.valor_descuento || cupon.value);
        
        // Si no hay valor, mostrar advertencia
        if (!cupon.valor && !cupon.valor_descuento) {
            console.warn('⚠️ El cupón no tiene campo "valor" o "valor_descuento"');
            console.warn('Campos disponibles:', Object.keys(cupon));
        }
    } catch (e) {
        console.warn('Error parsing cupón:', e);
    }
}

        // Crear sesión de pago
        const response = await fetch(`${window.API_URL}/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + window.sessionService.getToken(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cuponId: cuponId,
                direccion: direccionData
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