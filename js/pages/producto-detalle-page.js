// js/pages/producto-detalle-page.js

window.cargarProductoDetalle = async function (productoId) {
    const container = document.getElementById('productDetailContainer');
    if (!container) return;

    try {
        const response = await fetch(`${window.API_URL}/productos/${productoId}`);
        if (!response.ok) throw new Error('Error al cargar producto');

        const producto = await response.json();

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
                    
                    <button class="btn-add-cart" onclick="addToCart(${producto.id})">
                        <i class="fas fa-shopping-cart"></i> Añadir al carrito
                    </button>
                </div>
            </div>
        `;

        // Actualizar categoría en el breadcrumb
        document.getElementById('product-category').textContent =
            producto.categoria_nombre || 'Producto';

    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<p class="error">Error al cargar el producto</p>';
    }
};

console.log('✅ producto-detalle-page.js cargado');