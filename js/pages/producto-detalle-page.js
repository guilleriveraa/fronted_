// js/pages/producto-detalle-page.js

window.cargarProductoDetalle = async function (productoId) {
    const container = document.getElementById('productDetailContainer');
    if (!container) return;

    try {
        const response = await fetch(`${window.API_URL}/productos/${productoId}`);
        if (!response.ok) throw new Error('Error al cargar producto');

        const producto = await response.json();
        
        // Verificar si es textil (categoria_id = 2 - AJUSTA SEGÚN TU BD)
        const esTextil = producto.categoria_id === 2;
        
        // HTML para selector de tallas (solo si es textil)
        let tallasHTML = '';
        if (esTextil) {
            tallasHTML = `
                <div class="talla-selector" style="margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 5px; border-left: 3px solid #e83083;">
                    <label for="talla-${producto.id}" style="display: block; margin-bottom: 10px; font-weight: 500;">
                        <i class="fas fa-tshirt" style="color: #e83083;"></i> Selecciona talla:
                    </label>
                    <select id="talla-${producto.id}" class="talla-select" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;" required>
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
                    
                    <button class="btn-add-cart" onclick="addToCart(${producto.id})">
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

    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<p class="error">Error al cargar el producto</p>';
    }
};

console.log('✅ producto-detalle-page.js cargado con selector de tallas');