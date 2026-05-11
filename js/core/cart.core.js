// js/core/cart.core.js - Lógica central del carrito MEJORADA
class CartCore {
    constructor() {
        this.cart = null;
        this.listeners = [];
        this.notifyTimeout = null;
        this.estaSincronizando = false;

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
        window.addEventListener('storage', (event) => {
            if (event.key === 'svl_cart') {
                console.log('🔄 Carrito modificado en otra pestaña, sincronizando...');
                this.cart = null;
                this.notifyListeners();
            }
            if (event.key === window.TOKEN_KEY) {
                console.log('🔄 Sesión cambiada en otra pestaña, recargando...');
                window.location.reload();
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('👁️ Pestaña activada, refrescando carrito...');
                this.cart = null;
                this.notifyListeners();
            }
        });
    }

    // ===== Obtener carrito (desde API o localStorage) =====
    async getCart(guardarEnStorage = true) {
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
                headers: { 'Authorization': 'Bearer ' + token }
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

            if (typeof cartData.shipping === 'undefined') {
                cartData.shipping = 4.99;
            }

            this.cart = cartData;

            // 🔥 MODIFICADO: No guardar durante sincronización
            if (guardarEnStorage && !this.estaSincronizando) {
                this.saveCartToStorage(cartData);
            }

            return this.cart;

        } catch (error) {
            console.error('Error loading cart:', error);
            if (window.errorHandler) {
                window.errorHandler.warning('Usando carrito offline');
            }
            return this.getCartFromStorage() || this.getEmptyCart();
        }
    }

    // ===== Carrito vacío por defecto =====
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

    // ===== Recuperar carrito de localStorage =====
    getCartFromStorage() {
        const saved = localStorage.getItem('svl_cart');
        if (!saved) return null;

        try {
            let cart = JSON.parse(saved);

            if (!cart.gift) {
                cart.gift = { active: false, message: '', cost: 2.00 };
            }

            if (cart.items) {
                cart.items = cart.items.map(item => ({
                    ...item,
                    talla: item.talla || null,
                    color: item.color || null
                }));
            }

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

    saveCartToStorage(cart) {
        // 🔥 NO guardar durante la sincronización o limpieza
        if (this.estaSincronizando) {
            console.log('⚠️ saveCartToStorage bloqueado (estaSincronizando=true)');
            return;
        }

        let cartToSave = { ...cart };
        if (cartToSave.items) {
            cartToSave.items = cartToSave.items.map(item => ({
                ...item,
                talla: item.talla || null,
                color: item.color || null
            }));
        }
        cartToSave = { ...cartToSave, lastUpdated: new Date().toISOString() };
        localStorage.setItem('svl_cart', JSON.stringify(cartToSave));
    }

    // ===== Establecer opción de regalo =====
    setGiftOption(active, message = '') {
        return new Promise(async (resolve) => {
            const cart = await this.getCart();

            if (!cart.gift) {
                cart.gift = { active: false, message: '', cost: 2.00 };
            }

            cart.gift.active = active;
            cart.gift.message = message.substring(0, 200);

            this.cart = cart;
            this.updateCartTotals(cart);
            this.saveCartToStorage(cart);
            this.notifyListeners();

            console.log('🎁 Opción de regalo actualizada:', cart.gift);
            resolve(cart.gift);
        });
    }

    // ===== Añadir producto al carrito =====
    async addToCart(productId, quantity = 1, talla = null, color = null) {
        const token = localStorage.getItem(window.TOKEN_KEY);

        try {
            if (token) {
                const response = await fetch(`${window.API_URL}/cart/add`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ productId, quantity, talla, color })
                });

                if (!response.ok) {
                    throw new Error('Error al añadir producto');
                }

                this.cart = null;
                await this.getCart();
                this.notifyListeners();

                window.errorHandler?.success('Producto añadido al carrito');
                return true;
            } else {
                const productResponse = await fetch(`${window.API_URL}/productos/${productId}`);
                if (!productResponse.ok) throw new Error('Error al obtener producto');
                const producto = await productResponse.json();

                let cart = this.getCartFromStorage() || this.getEmptyCart();

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

                this.updateCartTotals(cart);
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

    // ===== Cambiar cantidad de un producto =====
    async changeQty(productId, delta) {
        const token = localStorage.getItem(window.TOKEN_KEY);

        try {
            if (!token) {
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

            this.cart = null;
            await this.getCart();
            this.notifyListeners();

            window.errorHandler?.success('Carrito actualizado');
        } catch (error) {
            console.error('Error changing quantity:', error);
            window.errorHandler?.error('Error al actualizar el carrito');
        }
    }

    // ===== Eliminar producto del carrito =====
    async removeFromCart(productId) {
        const token = localStorage.getItem(window.TOKEN_KEY);

        try {
            if (!token) {
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

    // ===== Actualizar contadores del carrito =====
    async updateCartCounters() {
        // 🔥 Si estamos sincronizando, no hacer nada
        if (this.estaSincronizando) {
            console.log('⚠️ updateCartCounters bloqueado durante sincronización');
            return;
        }

        try {
            const cart = await this.getCart();
            const count = cart.items?.length || 0;
            console.log('🔄 updateCartCounters - nuevo count:', count);

            const counters = ['headerCartCount', 'headerCartCount2', 'mobileCartCount'];
            counters.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = count;
            });

            const mobileMenu = document.getElementById('mobileMenu');
            if (mobileMenu) {
                const cartLinks = mobileMenu.querySelectorAll('a[href="carrito.html"]');
                cartLinks.forEach(link => {
                    let span = link.querySelector('.cart-count');
                    if (!span) {
                        span = document.createElement('span');
                        span.className = 'cart-count';
                        link.appendChild(span);
                    }
                    span.textContent = count;
                });
            }
        } catch (error) {
            console.error('Error updating cart counters:', error);
        }
    }

    // ===== Calcular totales del carrito =====
    updateCartTotals(cart) {
        const itemsTotal = cart.items.reduce((sum, item) =>
            sum + (item.price * item.quantity), 0
        );

        const giftCost = (cart.gift && cart.gift.active) ? (cart.gift.cost || 2.00) : 0;

        cart.subtotal = itemsTotal + giftCost;
        cart.tax = 0;

        if (typeof cart.shipping === 'undefined' || cart.shipping === null) {
            cart.shipping = 4.99;
        }

        cart.total = cart.subtotal + cart.shipping;
    }

    // ===== Sistema de eventos =====
    onChange(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        }
    }

    notifyListeners() {
        if (this.notifyTimeout) clearTimeout(this.notifyTimeout);

        this.notifyTimeout = setTimeout(() => {
            this.listeners.forEach(cb => {
                try { cb(); } catch (e) { console.error('Error en listener:', e); }
            });

            // 🔥 Solo actualizar contadores si NO estamos sincronizando
            if (!this.estaSincronizando) {
                this.updateCartCounters();
            }

            this.notifyTimeout = null;
        }, 100);
    }

    // ===== Limpiar carrito completamente =====
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
        console.log('🚀 INICIO sincronizarCarritoLocal');

        // Bloquear guardado
        this.estaSincronizando = true;

        const token = localStorage.getItem(window.TOKEN_KEY);
        if (!token) {
            console.log('❌ No hay token');
            this.estaSincronizando = false;
            return;
        }

        const carritoLocal = this.getCartFromStorage();
        if (!carritoLocal || !carritoLocal.items.length) {
            console.log('📦 No hay carrito local para sincronizar');
            // Limpiar igualmente
            localStorage.removeItem('svl_cart');
            localStorage.removeItem('cart');
            localStorage.removeItem('carrito');
            sessionStorage.removeItem('svl_cart');
            this.estaSincronizando = false;
            return;
        }

        console.log(`📦 Items a sincronizar: ${carritoLocal.items.length}`);
        const itemsToSync = JSON.parse(JSON.stringify(carritoLocal.items));

        // Sincronizar items al backend
        for (const item of itemsToSync) {
            try {
                await fetch(`${window.API_URL}/cart/add`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({
                        productId: item.id,
                        quantity: item.quantity,
                        talla: item.talla || null,
                        color: item.color || null
                    })
                });
                console.log(`✅ Item ${item.id} sincronizado`);
            } catch (error) {
                console.error(`❌ Error sincronizando item ${item.id}:`, error);
            }
        }

        // 🔥 LIMPIAR LOCALSTORAGE (FORZADO)
        console.log('🧹 Limpiando localStorage...');
        localStorage.removeItem('svl_cart');
        localStorage.removeItem('cart');
        localStorage.removeItem('carrito');
        sessionStorage.removeItem('svl_cart');

        // 🔥 Vaciar carrito en memoria
        this.cart = null;

        // 🔥 Recargar carrito desde backend (usando fetch directo, no getCart)
        const response = await fetch(`${window.API_URL}/cart`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (response.ok) {
            let cartData = await response.json();
            if (cartData.items) {
                cartData.items = cartData.items.map(item => ({
                    ...item,
                    talla: item.talla || null,
                    color: item.color || null
                }));
            }
            this.cart = cartData;
            // 🔥 NO llamar a saveCartToStorage
        }

        // Reactivar guardado
        this.estaSincronizando = false;

        // Notificar cambios (sin actualizar contadores para evitar guardado)
        this.listeners.forEach(cb => { try { cb(); } catch (e) { } });

        // Actualizar contadores manualmente sin pasar por getCart
        const count = this.cart?.items?.length || 0;
        document.querySelectorAll('.cart-count, #headerCartCount, #mobileCartCount').forEach(el => {
            if (el) el.textContent = count;
        });

        console.log('✅ Carrito sincronizado correctamente');
        console.log('🧹 localStorage FINAL:', localStorage.getItem('svl_cart'));
    }

    // ===== Vaciar carrito completamente =====
    async vaciarCarritoCompleto() {
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
            this.updateCartCounters();

            console.log('✅ Carrito vaciado completamente');
            return true;
        } catch (error) {
            console.error('❌ Error vaciando carrito:', error);
            return false;
        }
    }
}

// Instancia global
window.CartCore = new CartCore();

console.log('✅ CartCore cargado y mejorado');