// js/pages/producto-detalle-page.js

window.cargarProductoDetalle = async function (productoId) {
    const container = document.getElementById('productDetailContainer');
    if (!container) return;

    try {
        const response = await fetch(`${window.API_URL}/productos/${productoId}`);
        if (!response.ok) throw new Error('Error al cargar producto');

        const producto = await response.json();

        // IDs de categorías (según tu BD)
        const esTextil = producto.categoria_id === 2;        // Textil
        const esBoton = producto.categoria_id === 5;        // botones
        const esCadena = producto.categoria_id === 6;       // cadenas

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

        // Seleccionar lista de colores según categoría
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
                <div class="talla-selector" style="margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 5px; border-left: 3px solid #e83083;">
                    <label style="display: block; margin-bottom: 10px; font-weight: 500;">
                        <i class="fas fa-tshirt" style="color: #e83083;"></i> Selecciona talla:
                    </label>
                    <select id="tallaSelect" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;" required>
                        <option value="">Elige una talla</option>
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
        if ((esBoton || esCadena) && colores.length > 0) {
            coloresHTML = `
                <div class="color-selector" style="margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 5px; border-left: 3px solid #e83083;">
                    <label style="display: block; margin-bottom: 10px; font-weight: 500;">
                        <i class="fas fa-palette" style="color: #e83083;"></i> ${selectorLabel}
                    </label>
                    <div class="color-options" style="display: flex; flex-wrap: wrap; gap: 10px;">
                        ${colores.map(color => `
                            <button type="button" 
                                    class="color-btn" 
                                    data-color="${color}"
                                    style="background: ${getColorHex(color)}; width: 40px; height: 40px; border-radius: 50%; border: 2px solid #ddd; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"
                                    title="${color}">
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="selectedColor" value="">
                    <small style="display: block; margin-top: 10px; color: #666;">
                        <i class="fas fa-info-circle"></i> Haz clic en un color para seleccionarlo
                    </small>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="product-detail">
                <div class="product-gallery">
                    <img src="${producto.imagen}" 
                         alt="${producto.nombre}"
                         class="main-image"
                         onerror="this.src='https://via.placeholder.com/400x400?text=Producto'">
                </div>
                
                <div class="product-info">
                    <h1>${producto.nombre}</h1>
                    <p class="product-category">Categoría: ${producto.categoria_nombre || 'General'}</p>
                    <p class="product-price">${parseFloat(producto.precio).toFixed(2)}€</p>
                    <p class="product-description">${producto.descripcion || 'Producto artesanal de Salamanca'}</p>
                    
                    ${tallasHTML}
                    ${coloresHTML}
                    
                    <button class="btn-add-cart" id="addToCartBtn">
                        <i class="fas fa-shopping-cart"></i> Añadir al carrito
                    </button>
                </div>
            </div>
        `;

        // Actualizar categoría en el breadcrumb
        const breadcrumb = document.getElementById('product-category');
        if (breadcrumb) {
            breadcrumb.textContent = producto.categoria_nombre || 'Producto';
        }

        // Inicializar eventos de los botones de color
        if (esBoton || esCadena) {
            document.querySelectorAll('.color-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const color = this.dataset.color;
                    document.getElementById('selectedColor').value = color;

                    // Marcar visualmente el color seleccionado
                    document.querySelectorAll('.color-btn').forEach(b => {
                        b.style.border = '2px solid #ddd';
                        b.style.transform = 'scale(1)';
                    });
                    this.style.border = '3px solid #e83083';
                    this.style.transform = 'scale(1.1)';

                    console.log('🎨 Color seleccionado:', color);
                });
            });
        }

        // Configurar botón de añadir al carrito
        const addBtn = document.getElementById('addToCartBtn');
        if (addBtn) {
            addBtn.onclick = () => addToCart(producto.id, esTextil, esBoton || esCadena);
        }

    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<p class="error">Error al cargar el producto</p>';
    }
};

// Función para obtener el color hexadecimal
function getColorHex(color) {
    const colores = {
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
        'verde': '#4CAF50',
        'azul marino': '#000080',
        'morado': '#800080',
        'verde claro': '#90EE90'
    };
    return colores[color] || '#CCCCCC';
}

// Función addToCart para producto-detalle
window.addToCart = async function (productId, esTextil, esBotonOCadena) {
    console.log('🎯 addToCart desde detalle:', productId);

    let talla = null;
    let color = null;

    // Obtener talla (si es textil)
    if (esTextil) {
        const tallaSelect = document.getElementById('tallaSelect');
        if (tallaSelect) {
            talla = tallaSelect.value;
            if (!talla) {
                alert('Por favor, selecciona una talla');
                return;
            }
        }
    }

    // Obtener color (si es botón o cadena)
    if (esBotonOCadena) {
        const colorInput = document.getElementById('selectedColor');
        if (colorInput) {
            color = colorInput.value;
            if (!color) {
                alert('Por favor, selecciona un color');
                return;
            }
            console.log('🎨 Color seleccionado para el carrito:', color);
        }
    }

    const resultado = await window.CartCore.addToCart(productId, 1, talla, color);

    if (resultado) {
        alert('✅ Producto añadido al carrito');
        window.CartCore.updateCartCounters();
    } else {
        alert('Error al añadir producto');
    }
};

console.log('✅ producto-detalle-page.js cargado');