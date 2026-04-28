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

    // Lista de colores para BOTONES (categoria_id = 5)
    const coloresBotones = [
        'verde hierba', 'lila', 'fucsia', 'rosa', 'rojo', 'azulon', 'azul cielo',
        'plata', 'blanco', 'negro', 'amarillo', 'amarillo fluor', 'naranja', 'crema'
    ];

    // Lista de colores para CADENAS (categoria_id = 6)
    const coloresCadenas = [
        'amarillo', 'verde', 'azul cielo', 'rosa', 'blanco', 'azul marino',
        'fucsia', 'amarillo fluor', 'morado', 'naranja', 'verde claro'
    ];

    container.innerHTML = productos.map(p => {
        // Determinar tipo de producto según tus IDs reales
        const esTextil = p.categoria_id === 2;                    // Textil (ID 2)
        const esBoton = p.categoria_id === 5;                     // botones (ID 5)
        const esCadena = p.categoria_id === 6;                    // cadenas (ID 6)

        // Seleccionar colores según la categoría
        let colores = [];
        let selectorLabel = '';
        if (esBoton) {
            colores = coloresBotones;
            selectorLabel = 'Color del botón:';
        } else if (esCadena) {
            colores = coloresCadenas;
            selectorLabel = 'Color de la cadena:';
        }

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

        // HTML para selector de colores (solo botones o cadenas)
        let coloresHTML = '';
        if (esBoton || esCadena) {
            coloresHTML = `
                <div class="color-selector" style="margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 5px;">
                    <label style="display: block; margin-bottom: 10px; font-weight: 500; font-size: 0.9rem;">
                        <i class="fas fa-palette" style="color: #e83083;"></i> ${selectorLabel}
                    </label>
                    <div class="color-options" style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${colores.map(color => `
                            <button type="button" 
                                    class="color-btn" 
                                    data-producto="${p.id}"
                                    data-color="${color}"
                                    style="background: ${getColorHex(color)}; width: 35px; height: 35px; border-radius: 50%; border: 2px solid #ddd; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"
                                    title="${color}">
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="color-${p.id}" value="">
                    <small style="display: block; margin-top: 8px; color: #666; font-size: 0.75rem;">
                        <i class="fas fa-info-circle"></i> Haz clic en un color para seleccionarlo
                    </small>
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
            if (hiddenInput) {
                hiddenInput.value = color;
            }

            // Marcar visualmente el color seleccionado
            document.querySelectorAll(`.color-btn[data-producto="${productId}"]`).forEach(b => {
                b.style.border = '2px solid #ddd';
                b.style.transform = 'scale(1)';
            });
            this.style.border = '3px solid #e83083';
            this.style.transform = 'scale(1.1)';

            console.log(`🎨 Color seleccionado para producto ${productId}: ${color}`);
        });
    });
}

// Función auxiliar para obtener el color hexadecimal
function getColorHex(color) {
    const colores = {
        // Colores de botones
        'verde hierba': '#4CAF50',
        'lila': '#C8A2C8',
        'fucsia': '#FF00FF',
        'rosa': '#FFC0CB',
        'rojo': '#FF0000',
        'azulon': '#00008B',
        'azul cielo': '#87CEEB',
        'plata': '#C0C0C0',
        'blanco': '#FFFFFF',
        'negro': '#000000',
        'amarillo': '#FFFF00',
        'amarillo fluor': '#CCFF00',
        'naranja': '#FFA500',
        'crema': '#FFFDD0',

        // Colores de cadenas
        'verde': '#4CAF50',
        'azul marino': '#000080',
        'morado': '#800080',
        'verde claro': '#90EE90'
    };
    return colores[color] || '#CCCCCC';
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

    let esTextil = false;
    let esBotonOCadena = false;
    let producto = null;
    let talla = null;
    let color = null;

    try {
        console.log('📡 Fetching producto:', productId);
        const response = await fetch(`${window.API_URL}/productos/${productId}`);
        console.log('📡 Respuesta status:', response.status);

        if (response.ok) {
            producto = await response.json();
            console.log('📦 Producto recibido:', producto);

            esTextil = producto.categoria_id === 2;                    // Textil (ID 2)
            esBotonOCadena = producto.categoria_id === 5 || producto.categoria_id === 6;
            console.log('👕 ¿Es textil?', esTextil);
            console.log('🎨 ¿Es botón/cadena?', esBotonOCadena);
            console.log('📋 Categoría ID:', producto.categoria_id);

            // Si es textil, obtener la talla seleccionada
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
                console.log('📏 Talla seleccionada:', talla);
            }

            // Si es botón o cadena, obtener el color seleccionado
            if (esBotonOCadena) {
                const hiddenInput = document.getElementById(`color-${productId}`);
                if (!hiddenInput) {
                    alert('Error: No se encontró el selector de colores');
                    return;
                }
                color = hiddenInput.value;
                if (!color) {
                    alert('Por favor, selecciona un color');
                    return;
                }
                console.log('🎨 Color seleccionado:', color);
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

    if (!producto) {
        console.error('❌ producto es null después de la petición');
        alert('Error: No se pudo obtener la información del producto');
        return;
    }

    try {
        console.log('📤 Usando CartCore.addToCart:', { productId, talla, color });

        const resultado = await window.CartCore.addToCart(productId, 1, talla, color);

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