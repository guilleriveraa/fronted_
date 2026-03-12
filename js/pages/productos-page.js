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
        const esTextil = p.categoria_id === 2; // ⚠️ Verifica este ID
        
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
    btn.addEventListener('click', function() {
      document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      const categoria = this.dataset.category;
      loadProducts(categoria);
    });
  });
}

window.addToCart = async function(productId) {
    if (!window.sessionService?.isLoggedIn()) {
        if (window.showAuthModal) window.showAuthModal('login');
        return;
    }

    // --- Obtener el producto y la talla seleccionada ---
    let esTextil = false;
    let producto = null;
    let talla = null;
    
    try {
        const response = await fetch(`${window.API_URL}/productos/${productId}`);
        if (response.ok) {
            producto = await response.json();
            esTextil = producto.categoria_id === 2; // ⚠️ AJUSTA ESTE ID SEGÚN TU BD

            // Si es textil, obtener la talla seleccionada del DOM
            if (esTextil) {
                const select = document.getElementById(`talla-${productId}`);
                if (!select) {
                    alert('Error: No se encontró el selector de tallas');
                    return;
                }
                talla = select.value;
                if (!talla) {
                    alert('Por favor, selecciona una talla');
                    return;
                }
            }
        } else {
            alert('Error al obtener información del producto');
            return;
        }
    } catch (error) {
        console.error('Error obteniendo producto:', error);
        alert('Error de conexión');
        return;
    }
    // --- Fin de la obtención de datos ---

    try {
        // 1. Enviar al backend
        const response = await fetch(`${window.API_URL}/cart/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + window.sessionService.getToken()
            },
            body: JSON.stringify({ 
                productId, 
                quantity: 1,
                talla: talla
            })
        });

        const data = await response.json();

        if (response.ok) {
            // =====================================================
            // 2. Actualizar el CARRITO LOCAL (el objeto en memoria)
            // =====================================================
            // Obtener el carrito actual (puede venir del backend o de localStorage)
            const cart = await window.CartCore.getCart();

            // Buscar si el producto YA ESTÁ en el carrito con la MISMA TALLA
            const itemExistente = cart.items.find(item => 
                item.id === productId && item.talla === talla
            );

            if (itemExistente) {
                // Si ya existe, solo aumentamos la cantidad
                itemExistente.quantity += 1;
            } else {
                // Si no existe, creamos el nuevo objeto ¡INCLUYENDO LA TALLA!
                const nuevoItem = {
                    id: productId,
                    name: producto.nombre, // Usamos el nombre que ya tenemos
                    price: producto.precio,
                    quantity: 1,
                    image: producto.imagen || '',
                    talla: talla  // <--- ¡¡¡ESTA LÍNEA ES LA CLAVE!!!
                };
                cart.items.push(nuevoItem);
            }

            // Recalcular totales (subtotal, envío, total)
            window.CartCore.updateCartTotals(cart);

            // Guardar el carrito actualizado en localStorage
            window.CartCore.saveCartToStorage(cart);
            
            // Actualizar la copia en memoria de CartCore
            window.CartCore.cart = cart;
            
            // Notificar a todos los componentes que el carrito cambió
            window.CartCore.notifyListeners();

            // Feedback al usuario
            alert('✅ Producto añadido al carrito');
            
            // Actualizar contadores en la interfaz
            window.CartCore.updateCartCounters();

        } else {
            alert(data.message || 'Error al añadir producto');
        }
    } catch (error) {
        console.error('Error en addToCart:', error);
        alert('Error de conexión');
    }
};

window.quickView = async function(productId) {
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