// js/core/cart.core.js - Lógica central del carrito MEJORADA
class CartCore {
    constructor() {
        this.cart = null;
        this.listeners = [];
        this.notifyTimeout = null;

        // 🎁 NUEVO: Inicializar opción de regalo
        this.gift = {
            active: false,
            message: '',
            cost: 2.00
        };

        // ===== NUEVO: Sincronización entre pestañas =====
        this.setupCrossTabSync();

        // ===== NUEVO: Cargar carrito inicial =====
        this.init();
    }

    // ===== NUEVO: Inicialización =====
    async init() {
        try {
            await this.getCart();
            this.notifyListeners();
        } catch (error) {
            console.error('Error inicializando carrito:', error);
        }
    }

    // ===== NUEVO: Sincronización entre pestañas =====
    setupCrossTabSync() {
        // Escuchar cambios en localStorage de otras pestañas
        window.addEventListener('storage', (event) => {
            if (event.key === 'svl_cart') {
                console.log('🔄 Carrito modificado en otra pestaña, sincronizando...');
                this.cart = null; // Invalidar caché
                this.notifyListeners();
            }
            if (event.key === window.TOKEN_KEY) {
                console.log('🔄 Sesión cambiada en otra pestaña, recargando...');
                window.location.reload();
            }
        });

        // Escuchar cuando la pestaña se activa
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('👁️ Pestaña activada, refrescando carrito...');
                this.cart = null;
                this.notifyListeners();
            }
        });
    }

    // Obtener carrito (desde API o localStorage)
    async getCart() {
        if (this.cart) return this.cart;

        try {
            const token = localStorage.getItem(window.TOKEN_KEY);

            if (!token) {
                const localCart = this.getCartFromStorage();
                if (localCart) {
                    this.cart = localCart;
                    return this.cart;
                }
                return this.getEmptyCart();
            }

            const response = await fetch(`${window.API_URL}/cart`, {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            if (!response.ok) {
                throw new Error('Error al obtener carrito');
            }

            let cartData = await response.json();

            if (cartData.items) {
                cartData.items = cartData.items.map(item => ({
                    ...item,
                    talla: item.talla || null,
                    color: item.color || null
                }));
            }

            // 🔥 NUEVA LÍNEA - Asegurar que shipping tiene valor por defecto
            if (typeof cartData.shipping === 'undefined') {
                cartData.shipping = 4.99;
            }

            this.cart = cartData;
            this.saveCartToStorage(cartData);

            return this.cart;

        } catch (error) {
            console.error('Error loading cart:', error);
            if (window.errorHandler) {
                window.errorHandler.warning('Usando carrito offline');
            }
            return this.getCartFromStorage() || this.getEmptyCart();
        }
    }

    // Carrito vacío por defecto
    getEmptyCart() {
        return {
            items: [],
            subtotal: 0,
            tax: 0,
            shipping: 0,
            total: 0,
            gift: {
                active: false,
                message: '',
                cost: 2.00
            },
            lastUpdated: new Date().toISOString()
        };
    }
    // 🎁 NUEVO: Establecer opción de regalo
    setGiftOption(active, message = '') {
        return new Promise(async (resolve) => {
            const cart = await this.getCart();

            // Asegurar que existe el objeto gift
            if (!cart.gift) {
                cart.gift = { active: false, message: '', cost: 2.00 };
            }

            cart.gift.active = active;
            cart.gift.message = message.substring(0, 200); // Limitar a 200 caracteres

            // Actualizar carrito
            this.cart = cart;
            this.updateCartTotals(cart);
            this.saveCartToStorage(cart);
            this.notifyListeners();

            console.log('🎁 Opción de regalo actualizada:', cart.gift);
            resolve(cart.gift);
        });
    }
    // 🆕 NUEVO: Añadir producto al carrito (con o sin sesión)
    async addToCart(productId, quantity = 1, talla = null, color = null) {
        const token = localStorage.getItem(window.TOKEN_KEY);

        try {
            // 🔥 Si hay token, usar el backend
            if (token) {
                const response = await fetch(`${window.API_URL}/cart/add`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({
                        productId,
                        quantity,
                        talla,
                        color
                    })
                });

                if (!response.ok) {
                    throw new Error('Error al añadir producto');
                }

                // Invalidar caché y recargar carrito
                this.cart = null;
                await this.getCart();
                this.notifyListeners();

                window.errorHandler?.success('Producto añadido al carrito');
                return true;
            }

            // 🔥 Si NO hay token (usuario no logueado), guardar en localStorage
            else {
                // Obtener información del producto
                const productResponse = await fetch(`${window.API_URL}/productos/${productId}`);
                if (!productResponse.ok) throw new Error('Error al obtener producto');
                const producto = await productResponse.json();

                // Obtener carrito actual de localStorage
                let cart = this.getCartFromStorage() || this.getEmptyCart();

                // Buscar si el producto ya está en el carrito con la misma talla
                const existingItem = cart.items.find(item =>
                    item.id === productId && item.talla === talla && item.color === color
                );

                if (existingItem) {
                    existingItem.quantity += quantity;
                } else {
                    cart.items.push({
                        id: productId,
                        name: producto.nombre,
                        price: parseFloat(producto.precio),
                        quantity: quantity,
                        image: producto.imagen || '',
                        talla: talla,
                        color: color
                    });
                }

                // Recalcular totales
                this.updateCartTotals(cart);

                // Guardar en localStorage
                this.saveCartToStorage(cart);
                this.cart = cart;
                this.notifyListeners();

                window.errorHandler?.success('Producto añadido al carrito');
                return true;
            }

        } catch (error) {
            console.error('Error adding to cart:', error);
            window.errorHandler?.error('Error al añadir producto');
            return false;
        }
    }
    // Guardar carrito en localStorage (offline)
    saveCartToStorage(cart) {
        // 🔥🔥🔥 CAMBIO 2: Procesar items antes de guardar
        let cartToSave = { ...cart };

        if (cartToSave.items) {
            cartToSave.items = cartToSave.items.map(item => ({
                ...item,
                talla: item.talla || null,
                color: item.color || null
            }));
        }

        // ===== MEJORADO: Añadir timestamp =====
        cartToSave = {
            ...cartToSave,
            lastUpdated: new Date().toISOString()
        };

        localStorage.setItem('svl_cart', JSON.stringify(cartToSave));
    }

    // Recuperar carrito de localStorage
    getCartFromStorage() {
        const saved = localStorage.getItem('svl_cart');
        if (!saved) return null;

        try {
            let cart = JSON.parse(saved);

            // 🎁 NUEVO: Añadir propiedad gift si no existe (para compatibilidad)
            if (!cart.gift) {
                cart.gift = { active: false, message: '', cost: 2.00 };
            }

            // 🆕 NUEVO: Asegurar que cada item tiene campo talla y color
            if (cart.items) {
                cart.items = cart.items.map(item => ({
                    ...item,
                    talla: item.talla || null,
                    color: item.color || null
                }));
            }

            // ===== NUEVO: Validar que no sea demasiado antiguo (24h) =====
            if (cart.lastUpdated) {
                const lastUpdate = new Date(cart.lastUpdated);
                const now = new Date();
                const hoursDiff = (now - lastUpdate) / (1000 * 60 * 60);

                if (hoursDiff > 24) {
                    console.log('🗑️ Carrito offline demasiado antiguo, limpiando...');
                    localStorage.removeItem('svl_cart');
                    return null;
                }
            }

            return cart;
        } catch (e) {
            console.error('Error parsing cart from storage:', e);
            localStorage.removeItem('svl_cart');
            return null;
        }
    }

    // Cambiar cantidad de un producto
    async changeQty(productId, delta) {
        const token = localStorage.getItem(window.TOKEN_KEY);

        try {
            if (!token) {
                // Modo offline
                const cart = await this.getCart();
                const item = cart.items.find(i => i.id === productId);

                if (item) {
                    item.quantity += delta;
                    if (item.quantity <= 0) {
                        cart.items = cart.items.filter(i => i.id !== productId);
                    }
                } else if (delta > 0) {
                    window.errorHandler?.warning('No puedes añadir productos sin conexión');
                    return;
                }

                this.updateCartTotals(cart);
                this.saveCartToStorage(cart);
                this.cart = cart;
                this.notifyListeners();

                window.errorHandler?.success('Carrito actualizado (modo offline)');
                return;
            }

            // Modo online
            const response = await fetch(`${window.API_URL}/cart/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ productId, delta })
            });

            if (!response.ok) {
                throw new Error('Error al actualizar carrito');
            }

            this.cart = null; // Invalidar caché
            await this.getCart(); // Recargar
            this.notifyListeners();

            window.errorHandler?.success('Carrito actualizado');

        } catch (error) {
            console.error('Error changing quantity:', error);
            window.errorHandler?.error('Error al actualizar el carrito');
        }
    }

    // Eliminar producto del carrito
    async removeFromCart(productId) {
        const token = localStorage.getItem(window.TOKEN_KEY);

        try {
            if (!token) {
                // Modo offline
                const cart = await this.getCart();
                const itemIndex = cart.items.findIndex(i => i.id === productId);

                if (itemIndex === -1) return;

                cart.items.splice(itemIndex, 1);
                this.updateCartTotals(cart);
                this.saveCartToStorage(cart);
                this.cart = cart;
                this.notifyListeners();

                window.errorHandler?.success('Producto eliminado');
                return;
            }

            // Modo online
            const response = await fetch(`${window.API_URL}/cart/remove/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            if (!response.ok) {
                throw new Error('Error al eliminar producto');
            }

            this.cart = null;
            await this.getCart();
            this.notifyListeners();

            window.errorHandler?.success('Producto eliminado');

        } catch (error) {
            console.error('Error removing item:', error);
            window.errorHandler?.error('Error al eliminar el producto');
        }
    }

    // Actualizar contadores del carrito en el header
    async updateCartCounters() {
        try {
            const cart = await this.getCart();
            const count = cart.items?.length || 0;

            const counters = [
                'headerCartCount',
                'headerCartCount2',
                'mobileCartCount'
            ];

            counters.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    const oldCount = parseInt(el.textContent);
                    el.textContent = count;

                    // ===== NUEVO: Animación si cambió =====
                    if (oldCount !== count) {
                        el.classList.add('cart-count-changed');
                        setTimeout(() => el.classList.remove('cart-count-changed'), 300);
                    }
                }
            });
        } catch (error) {
            console.error('Error updating cart counters:', error);
        }
    }

    // Calcular totales del carrito (con opción de regalo)
    updateCartTotals(cart) {
        // Calcular subtotal de productos
        const itemsTotal = cart.items.reduce((sum, item) =>
            sum + (item.price * item.quantity), 0
        );

        // 🎁 Añadir coste de regalo si está activo
        const giftCost = (cart.gift && cart.gift.active) ? (cart.gift.cost || 2.00) : 0;

        cart.subtotal = itemsTotal + giftCost;
        cart.tax = 0;

        // 🔥 MODIFICADO: NO recalcular el envío automáticamente
        // Mantener el valor actual de shipping si ya existe, si no usar 4.99 por defecto
        if (typeof cart.shipping === 'undefined' || cart.shipping === null) {
            cart.shipping = 4.99;
        }

        // Si el envío es 0 (recogida en tienda), mantenerlo como 0
        // Si no, mantener el valor que tenga (que ya se actualiza desde el frontend)

        cart.total = cart.subtotal + cart.shipping;
    }

    // Sistema de eventos MEJORADO
    onChange(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        }
    }

    notifyListeners() {
        // ===== NUEVO: Debounce para evitar múltiples actualizaciones =====
        if (this.notifyTimeout) {
            clearTimeout(this.notifyTimeout);
        }

        this.notifyTimeout = setTimeout(() => {
            this.listeners.forEach(cb => {
                try {
                    cb();
                } catch (e) {
                    console.error('Error en listener del carrito:', e);
                }
            });
            this.updateCartCounters();
            this.notifyTimeout = null;
        }, 100);
    }

    // ===== NUEVO: Limpiar carrito completamente =====
    async clearCart() {
        const token = localStorage.getItem(window.TOKEN_KEY);

        try {
            if (token) {
                await fetch(`${window.API_URL}/cart/clear`, {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + token }
                });
            }

            this.cart = this.getEmptyCart();
            this.saveCartToStorage(this.cart);
            this.notifyListeners();

        } catch (error) {
            console.error('Error clearing cart:', error);
        }
    }


    // 🔥 Sincronizar carrito local con el backend después del login
    async sincronizarCarritoLocal() {
        const token = localStorage.getItem(window.TOKEN_KEY);
        if (!token) return;

        // Obtener carrito local
        const carritoLocal = this.getCartFromStorage();
        if (!carritoLocal || !carritoLocal.items.length) return;

        console.log('🔄 Sincronizando carrito local con el backend...');

        for (const item of carritoLocal.items) {
            await this.addToCart(item.id, item.quantity, item.talla, item.color);
        }

        // Limpiar carrito local y recargar
        this.cart = null;
        localStorage.removeItem('svl_cart');
        await this.getCart();
        this.notifyListeners();

        console.log('✅ Carrito sincronizado correctamente');
    }
}
// Instancia global
window.CartCore = new CartCore();

console.log('✅ CartCore cargado y mejorado');