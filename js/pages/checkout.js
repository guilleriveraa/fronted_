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

    // Cerrar modal
    const modalElement = document.getElementById('direccionModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();
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

        // Obtener cupón guardado
        const cuponGuardado = localStorage.getItem('cupon_aplicado');
        let cuponId = null;
        
        if (cuponGuardado) {
            try {
                const cupon = JSON.parse(cuponGuardado);
                cuponId = cupon.id;
                console.log('🎫 Cupón aplicado:', cupon.codigo);
            } catch (e) {
                console.warn('Error parsing cupón:', e);
            }
        }

        // Crear sesión de pago
        const response = await fetch(`${window.API_URL}/api/create-checkout-session`, {
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
        
        // Limpiar datos temporales (opcional, se puede hacer después del pago)
        // localStorage.removeItem('direccion_envio');
        
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