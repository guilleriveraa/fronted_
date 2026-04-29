// js/home-page.js - Funcionalidades de la página de inicio

// ===============================
// INICIALIZACIÓN
// ===============================
window.InitManager.register('HomePage', function () {
  console.log('🏠 Inicializando HomePage');
  setupBuyButtons();
  loadLatestProducts(); // ← AÑADIDA
});

// ===============================
// BOTONES AÑADIR AL CARRITO (EXISTENTE)
// ===============================
function setupBuyButtons() {
  document.querySelectorAll('.btn-buy').forEach(btn => {
    btn.addEventListener('click', async () => {

      if (!window.sessionService || !window.sessionService.isLoggedIn()) {
        alert('Debes iniciar sesión para añadir productos');
        if (window.showAuthModal) {
          window.showAuthModal('login');
        }
        return;
      }

      const productId = parseInt(btn.dataset.productId);
      const token = window.sessionService?.getToken ? window.sessionService.getToken() : null;
      if (!token) {
        alert('Error de sesión. Por favor, inicia sesión de nuevo.');
        return;
      }

      try {

        const response = await fetch(`${window.API_URL}/cart/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ productId, quantity: 1 })
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.message || 'Error añadiendo producto');
          return;
        }

        if (window.CartCore && typeof window.CartCore.updateCartCounters === 'function') {
          window.CartCore.updateCartCounters();
        }

        alert('✅ Producto añadido al carrito');

      } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión con el servidor');
      }
    });
  });
}

// ===============================
// NUEVA FUNCIÓN: Cargar últimos 3 productos
// ===============================
async function loadLatestProducts() {
  console.log('🚀 loadLatestProducts INICIADO');
  const container = document.getElementById('latestProductsContainer');
  console.log('📦 Contenedor encontrado:', container ? 'SÍ' : 'NO');

  if (!container) {
    console.log('⚠️ No se encontró el contenedor de últimos productos');
    return;
  }

  try {
    console.log('📡 Fetching productos desde:', `${window.API_URL}/productos`);
    const response = await fetch(`${window.API_URL}/productos`);
    console.log('📡 Respuesta status:', response.status);

    if (!response.ok) throw new Error('Error al cargar productos');

    const productos = await response.json();
    console.log('📦 Productos recibidos:', productos.length, productos);

    if (productos.length === 0) {
      console.log('⚠️ No hay productos en la BD');
      container.innerHTML = '<p class="no-products">No hay productos disponibles</p>';
      return;
    }

    const ultimosProductos = productos
      .sort((a, b) => b.id - a.id)
      .slice(0, 3);

    console.log('✨ Últimos 3 productos:', ultimosProductos.map(p => p.nombre));
    renderLatestProducts(ultimosProductos);

  } catch (error) {
    console.error('❌ Error cargando últimos productos:', error);
    if (container) {
      container.innerHTML = '<p class="error">Error al cargar productos</p>';
    }
  }
}

// ===============================
// NUEVA FUNCIÓN: Renderizar los productos
// ===============================
function renderLatestProducts(productos) {
  const container = document.getElementById('latestProductsContainer');
  if (!container) return;

  if (!productos.length) {
    container.innerHTML = '<p class="no-products">No hay productos disponibles</p>';
    return;
  }

  container.innerHTML = productos.map(p => `
    <div class="product-card">
      <div class="product-image">
        <img src="${p.imagen}"  
             alt="${p.nombre}"
             onerror="this.src='https://via.placeholder.com/300x300?text=Producto'">
        <div class="product-overlay">
          <a href="producto-detalle.html?id=${p.id}" class="btn-quick-view">
            <i class="fas fa-eye"></i> Ver detalles
          </a>
        </div>
      </div>
      <div class="product-info">
        <h3>${p.nombre}</h3>
        <p class="product-description">${p.descripcion || 'Producto artesanal de Salamanca'}</p>
        <div class="product-price">
          <span class="current-price">${parseFloat(p.precio).toFixed(2)}€</span>
        </div>
        <button class="btn-add-cart" onclick="addToCart(${p.id})">
          <i class="fas fa-shopping-cart"></i> Añadir al carrito
        </button>
      </div>
    </div>
  `).join('');
}

// ===============================
// FUNCIONES GLOBALES (para los botones)
// ===============================
window.quickView = async function (productId) {
  try {
    const response = await fetch(`${window.API_URL}/productos/${productId}`);
    if (!response.ok) throw new Error('Error al cargar producto');

    const producto = await response.json();
    alert(`🔍 ${producto.nombre}\nPrecio: ${producto.precio}€\n${producto.descripcion || 'Sin descripción'}`);
  } catch (error) {
    console.error('Error:', error);
    alert('Error al cargar el producto');
  }
};

window.addToCart = async function (productId) {
  if (!window.sessionService?.isLoggedIn()) {
    if (window.showAuthModal) window.showAuthModal('login');
    return;
  }

  try {

    const response = await fetch(`${window.API_URL}/cart/add`, {
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