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
    let url = `${window.API_URL}/api/productos`;
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
    
    container.innerHTML = productos.map(p => `
        <div class="product-card" data-categoria="${p.categoria_nombre?.toLowerCase() || ''}">
            <a href="producto-detalle.html?id=${p.id}" class="product-link">
                <div class="product-image">
                    <img src="http://127.0.0.1:5500${p.imagen}" 
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
            <button class="btn-add-cart" onclick="addToCart(${p.id})">
                <i class="fas fa-shopping-cart"></i> Añadir al carrito
            </button>
        </div>
    `).join('');
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
  
  try {
    const response = await fetch(`${window.API_URL}/api/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + window.sessionService.getToken()
      },
      body: JSON.stringify({ productId, quantity: 1 })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('✅ Producto añadido al carrito');
      if (window.CartCore) window.CartCore.updateCartCounters();
    } else {
      alert(data.message || 'Error al añadir producto');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión');
  }
};

window.quickView = async function(productId) {
  try {
    const response = await fetch(`${window.API_URL}/api/productos/${productId}`);
    if (!response.ok) throw new Error('Error al cargar producto');
    
    const producto = await response.json();
    alert(`🔍 ${producto.nombre}\nPrecio: ${producto.precio}€\n${producto.descripcion || 'Sin descripción'}`);
  } catch (error) {
    console.error('Error:', error);
  }
};

console.log('✅ productos-page.js cargado con API');