// js/home-page.js - Funcionalidades de la página de inicio

// ===============================
// INICIALIZACIÓN
// ===============================
window.InitManager.register('HomePage', function () {
  console.log('🏠 Inicializando HomePage');
  loadLatestProducts();
});

// ===============================
// Cargar últimos productos
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
    console.log('📦 Productos recibidos:', productos.length);

    if (productos.length === 0) {
      container.innerHTML = '<p class="no-products">No hay productos disponibles</p>';
      return;
    }

    const ultimosProductos = productos
      .sort((a, b) => b.id - a.id)
      .slice(0, 4); // Mostrar 4 productos

    console.log('✨ Últimos productos:', ultimosProductos.map(p => p.nombre));
    renderLatestProducts(ultimosProductos);

  } catch (error) {
    console.error('❌ Error cargando últimos productos:', error);
    container.innerHTML = '<p class="error">Error al cargar productos</p>';
  }
}

// ===============================
// Renderizar productos (con soporte para tallas y colores)
// ===============================
function renderLatestProducts(productos) {
  const container = document.getElementById('latestProductsContainer');
  if (!container) return;

  if (!productos.length) {
    container.innerHTML = '<p class="no-products">No hay productos disponibles</p>';
    return;
  }

  container.innerHTML = productos.map(p => {
    // Determinar tipo de producto según IDs reales
    const esTextil = p.categoria_id === 2;        // Textil
    const esBoton = p.categoria_id === 5;         // botones
    const esCadena = p.categoria_id === 6;        // cadenas

    // Lista de colores para BOTONES
    const coloresBotones = [
      'verde hierba', 'lila', 'fucsia', 'rosa', 'rojo', 'azulon', 'azul cielo',
      'plata', 'blanco', 'negro', 'amarillo', 'amarillo fluor', 'naranja', 'crema'
    ];

    // Lista de colores para CADENAS
    const coloresCadenas = [
      'amarillo', 'verde', 'azul cielo', 'rosa', 'blanco', 'azul marino',
      'fucsia', 'amarillo fluor', 'morado', 'naranja', 'verde claro'
    ];

    // Seleccionar colores según categoría
    let colores = [];
    if (esBoton) colores = coloresBotones;
    if (esCadena) colores = coloresCadenas;

    // HTML para selector de tallas (solo textil)
    let tallasHTML = '';
    if (esTextil) {
      tallasHTML = `
                <div class="talla-selector" style="margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 5px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; font-size: 0.9rem;">
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

    // HTML para selector de colores (solo botones/cadenas)
    let coloresHTML = '';
    if ((esBoton || esCadena) && colores.length > 0) {
      coloresHTML = `
                <div class="color-selector" style="margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 5px;">
                    <label style="display: block; margin-bottom: 10px; font-weight: 500; font-size: 0.9rem;">
                        <i class="fas fa-palette" style="color: #e83083;"></i> Color:
                    </label>
                    <div class="color-options" style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${colores.map(color => `
                            <button type="button" 
                                    class="color-btn" 
                                    data-producto="${p.id}"
                                    data-color="${color}"
                                    style="background: ${getColorHex(color)}; width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ddd; cursor: pointer;"
                                    title="${color}">
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="color-${p.id}" value="">
                </div>
            `;
    }

    return `
            <div class="product-card">
                <a href="producto-detalle.html?id=${p.id}" class="product-link">
                    <div class="product-image">
                        <img src="${p.imagen}" alt="${p.nombre}" onerror="this.src='https://via.placeholder.com/300x300?text=Producto'">
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
                
                ${tallasHTML}
                ${coloresHTML}
                
                <button class="btn-add-cart" onclick="addToCart(${p.id})">
                    <i class="fas fa-shopping-cart"></i> Añadir al carrito
                </button>
            </div>
        `;
  }).join('');

  // Inicializar eventos de los botones de color
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const productId = this.dataset.producto;
      const color = this.dataset.color;
      const hiddenInput = document.getElementById(`color-${productId}`);
      if (hiddenInput) hiddenInput.value = color;

      document.querySelectorAll(`.color-btn[data-producto="${productId}"]`).forEach(b => {
        b.style.border = '2px solid #ddd';
      });
      this.style.border = '3px solid #e83083';
      console.log(`🎨 Color seleccionado: ${color}`);
    });
  });
}

// Función para obtener el color hexadecimal
function getColorHex(color) {
  const colores = {
    'verde hierba': '#4CAF50', 'lila': '#C8A2C8', 'fucsia': '#FF00FF',
    'rosa': '#FFC0CB', 'rojo': '#FF0000', 'azulon': '#00008B',
    'azul cielo': '#87CEEB', 'plata': '#C0C0C0', 'blanco': '#FFFFFF',
    'negro': '#000000', 'amarillo': '#FFFF00', 'amarillo fluor': '#CCFF00',
    'naranja': '#FFA500', 'crema': '#FFFDD0', 'verde': '#4CAF50',
    'azul marino': '#000080', 'morado': '#800080', 'verde claro': '#90EE90'
  };
  return colores[color] || '#CCCCCC';
}

// ===============================
// 🔥 NUEVA FUNCIÓN addToCart (sin bloqueo de login)
// ===============================
window.addToCart = async function (productId) {
  console.log('🎯 addToCart desde home llamado:', productId);

  let producto = null;
  let talla = null;
  let color = null;

  try {
    const response = await fetch(`${window.API_URL}/productos/${productId}`);
    if (response.ok) {
      producto = await response.json();
      console.log('📦 Producto:', producto.nombre);
      console.log('📋 Categoría ID:', producto.categoria_id);

      const tallaSelect = document.getElementById(`talla-${productId}`);
      if (tallaSelect) {
        talla = tallaSelect.value;
        if (tallaSelect.style.display !== 'none' && !talla) {
          alert('Por favor, selecciona una talla');
          return;
        }
      }

      const colorInput = document.getElementById(`color-${productId}`);
      if (colorInput) {
        color = colorInput.value;
        if (!color) {
          alert('Por favor, selecciona un color');
          return;
        }
        console.log('🎨 Color seleccionado:', color);
      }
    }
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    alert('Error de conexión');
    return;
  }

  try {
    const resultado = await window.CartCore.addToCart(productId, 1, talla, color);

    if (resultado) {
      console.log('✅ Producto añadido correctamente');
      alert('✅ Producto añadido al carrito');

      // Esperar a que se actualice el carrito
      await new Promise(resolve => setTimeout(resolve, 200));

      // Obtener el carrito actualizado
      const cartActualizado = await window.CartCore.getCart();
      const nuevoCount = cartActualizado.items?.length || 0;
      console.log('📊 Nuevo contador:', nuevoCount);

      // 🔥 ACTUALIZAR TODOS LOS POSIBLES CONTADORES DEL MENÚ MÓVIL
      // Buscar por ID
      const mobileSpan = document.getElementById('mobileCartCount');
      if (mobileSpan) {
        mobileSpan.textContent = nuevoCount;
        console.log('✅ Contador móvil (#mobileCartCount) actualizado a:', nuevoCount);
      }

      // Buscar dentro del menú móvil
      const mobileMenu = document.getElementById('mobileMenu');
      if (mobileMenu) {
        const menuCartSpan = mobileMenu.querySelector('.cart-count, [class*="cart-count"]');
        if (menuCartSpan) {
          menuCartSpan.textContent = nuevoCount;
          console.log('✅ Contador dentro del menú móvil actualizado');
        }
      }

      // Actualizar cualquier elemento con clase 'cart-count'
      document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = nuevoCount;
        console.log('✅ Actualizado:', el.id || 'clase cart-count');
      });

      // Forzar actualización del sistema de contadores
      if (window.CartCore) {
        await window.CartCore.updateCartCounters();
      }

    } else {
      alert('Error al añadir producto');
    }
  } catch (error) {
    console.error('❌ Error en addToCart:', error);
    alert('Error de conexión');
  }
};

// Vista rápida (redirige a detalle)
window.quickView = async function (productId) {
  window.location.href = `producto-detalle.html?id=${productId}`;
};

console.log('✅ home-page.js cargado correctamente');