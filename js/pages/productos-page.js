// js/pages/productos-page.js - VERSIÓN CON API

window.InitManager.register('ProductosPage', async function () {
    console.log('📦 Inicializando página de productos');

    await loadProducts();
    setupCategoryFilters();

}, []);

async function loadProducts(categoria = '') {
    const container = document.getElementById('productsContainer');
    if (!container) return;

    // Mostrar loading
    container.innerHTML = `
    <div class="loading-spinner">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Cargando productos...</p>
    </div>
  `;

    try {
        let url = `${window.API_URL}/productos`;
        if (categoria && categoria !== 'todos') {
            url += `?categoria=${categoria}`;
        }

        console.log('📡 Fetching productos:', url);
        const response = await fetch(url);

        if (!response.ok) throw new Error('Error al cargar productos');

        const productos = await response.json();
        console.log('📦 Productos cargados:', productos.length);

        renderProducts(productos);
        window.allProducts = productos;

    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<p class="error">Error al cargar productos</p>';
    }
}

function renderProducts(productos) {
    const container = document.getElementById('productsContainer');

    if (!productos.length) {
        container.innerHTML = '<p class="no-products">No hay productos en esta categoría</p>';
        return;
    }

    container.innerHTML = productos.map(p => {
        // Determinar si es textil (categoria_id = 2 - AJUSTA SEGÚN TU BD)
        const esTextil = p.categoria_id === 2;

        // HTML para selector de tallas (solo si es textil)
        let tallasHTML = '';
        if (esTextil) {
            tallasHTML = `
                <div class="talla-selector" style="margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 5px;">
                    <label for="talla-${p.id}" style="display: block; margin-bottom: 5px; font-weight: 500; font-size: 0.9rem;">
                        <i class="fas fa-tshirt" style="color: #e83083;"></i> Talla:
                    </label>
                    <select id="talla-${p.id}" class="talla-select" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" required>
                        <option value="">Selecciona talla</option>
                        <option value="XS">XS</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                        <option value="XXL">XXL</option>
                    </select>
                </div>
            `;
        }

        return `
            <div class="product-card" data-categoria="${p.categoria_nombre?.toLowerCase() || ''}" data-categoria-id="${p.categoria_id}">
                <a href="producto-detalle.html?id=${p.id}" class="product-link">
                    <div class="product-image">
                        <img src="${p.imagen}" 
                             alt="${p.nombre}"
                             onerror="this.src='https://via.placeholder.com/300x300?text=Sin+imagen'">
                        <div class="product-overlay">
                            <span class="btn-quick-view">Ver detalles</span>
                        </div>
                    </div>
                    <div class="product-info">
                        <h3>${p.nombre}</h3>
                        <p class="product-description">${p.descripcion || 'Producto artesanal de Salamanca'}</p>
                        <div class="product-price">
                            <span class="current-price">${parseFloat(p.precio).toFixed(2)}€</span>
                        </div>
                    </div>
                </a>
                
                <!-- Selector de tallas (solo textil) -->
                ${tallasHTML}
                
                <button class="btn-add-cart" onclick="addToCart(${p.id})">
                    <i class="fas fa-shopping-cart"></i> Añadir al carrito
                </button>
            </div>
        `;
    }).join('');
}

function setupCategoryFilters() {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const categoria = this.dataset.category;
            loadProducts(categoria);
        });
    });
}

// 🔥🔥🔥 MODIFICADO: Eliminada verificación de login y simplificado
const addToCart = async function (productId) {
    console.log('🎯 addToCart llamado con productId:', productId);

    // 🔥 ELIMINADA la verificación de login
    // if (!window.sessionService?.isLoggedIn()) {
    //     if (window.showAuthModal) window.showAuthModal('login');
    //     return;
    // }

    // --- Obtener el producto y la talla seleccionada ---
    let esTextil = false;
    let producto = null;
    let talla = null;

    try {
        console.log('📡 Fetching producto:', productId);
        const response = await fetch(`${window.API_URL}/productos/${productId}`);
        console.log('📡 Respuesta status:', response.status);

        if (response.ok) {
            producto = await response.json();
            console.log('📦 Producto recibido:', producto);

            esTextil = producto.categoria_id === 2;
            console.log('👕 ¿Es textil?', esTextil, 'Categoría ID:', producto.categoria_id);

            // Si es textil, obtener la talla seleccionada del DOM
            if (esTextil) {
                const select = document.getElementById(`talla-${productId}`);
                console.log('🔍 Selector de talla encontrado?', !!select);

                if (!select) {
                    alert('Error: No se encontró el selector de tallas');
                    return;
                }
                talla = select.value;
                console.log('📏 Talla seleccionada:', talla);

                if (!talla) {
                    alert('Por favor, selecciona una talla');
                    return;
                }
            }
        } else {
            console.error('❌ Error response:', response.status);
            alert('Error al obtener información del producto');
            return;
        }
    } catch (error) {
        console.error('❌ Error obteniendo producto:', error);
        alert('Error de conexión');
        return;
    }

    // 🔥 Verificación crítica
    if (!producto) {
        console.error('❌ producto es null después de la petición');
        alert('Error: No se pudo obtener la información del producto');
        return;
    }

    try {
        // 🔥 Usar CartCore.addToCart (funciona con o sin token)
        console.log('📤 Usando CartCore.addToCart:', { productId, talla });

        const resultado = await window.CartCore.addToCart(productId, 1, talla);

        if (resultado) {
            console.log('✅ Producto añadido correctamente');
            alert('✅ Producto añadido al carrito');
            window.CartCore.updateCartCounters();
        } else {
            alert('Error al añadir producto');
        }

    } catch (error) {
        console.error('❌ Error en addToCart:', error);
        alert('Error de conexión');
    }
};

// Exponer la función globalmente
window.addToCart = addToCart;

window.quickView = async function (productId) {
    try {
        const response = await fetch(`${window.API_URL}/productos/${productId}`);
        if (!response.ok) throw new Error('Error al cargar producto');

        const producto = await response.json();
        alert(`🔍 ${producto.nombre}\nPrecio: ${producto.precio}€\n${producto.descripcion || 'Sin descripción'}`);
    } catch (error) {
        console.error('Error:', error);
    }
};

console.log('✅ productos-page.js cargado con API');