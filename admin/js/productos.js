// admin/js/productos.js - CRUD de productos

let productoModal = null;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando productos...');
    loadUserInfo();
    cargarProductos();
    
    // Inicializar modal de Bootstrap
    const modalElement = document.getElementById('productoModal');
    if (modalElement) {
        productoModal = new bootstrap.Modal(modalElement);
    }
});

// Cargar todos los productos
async function cargarProductos() {
    try {
        console.log('📦 Cargando productos...');
        const response = await fetch(`${window.API_URL}/productos`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const productos = await response.json();
        console.log('✅ Productos cargados:', productos.length);
        
        const tbody = document.getElementById('productos-list');
        if (!tbody) return;
        
        if (!Array.isArray(productos) || productos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay productos</td></tr>';
            return;
        }

        tbody.innerHTML = productos.map(p => `
            <tr>
                <td>${p.id}</td>
                <td>
                    <img src="${p.imagen}"  
                         width="50" height="50" style="object-fit: cover; border-radius: 5px;"
                         onerror="this.src='https://ui-avatars.com/api/?name=Error&background=ccc&color=fff&size=50'">
                </td>
                <td>${p.nombre}</td>
                <td>${parseFloat(p.precio).toFixed(2)}€</td>
                <td>${p.categoria_nombre || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editarProducto(${p.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarProducto(${p.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        const tbody = document.getElementById('productos-list');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar productos</td></tr>';
        }
    }
}

// Abrir modal para nuevo producto
window.abrirModalNuevo = function() {
    document.getElementById('modalTitulo').textContent = 'Nuevo Producto';
    document.getElementById('productoForm').reset();
    document.getElementById('productoId').value = '';
    productoModal?.show();
};

// Abrir modal para editar producto
window.editarProducto = async function(id) {
    try {
        console.log('✏️ Editando producto:', id);
        const response = await fetch(`${window.API_URL}/productos/${id}`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const producto = await response.json();
        console.log('✅ Producto cargado:', producto);
        
        document.getElementById('modalTitulo').textContent = 'Editar Producto';
        document.getElementById('productoId').value = producto.id;
        document.getElementById('nombre').value = producto.nombre;
        document.getElementById('descripcion').value = producto.descripcion || '';
        document.getElementById('precio').value = producto.precio;
        document.getElementById('categoria_id').value = producto.categoria_id;
        document.getElementById('imagen').value = producto.imagen || '';
        
        productoModal?.show();
        
    } catch (error) {
        console.error('❌ Error cargando producto:', error);
        alert('Error al cargar el producto');
    }
};

// Guardar producto (crear o actualizar)
window.guardarProducto = async function() {
    // Validar campos obligatorios
    const nombre = document.getElementById('nombre').value;
    const precio = document.getElementById('precio').value;
    const categoria = document.getElementById('categoria_id').value;
    
    if (!nombre || !precio || !categoria) {
        alert('Por favor completa los campos obligatorios');
        return;
    }
    
    const producto = {
        nombre: nombre,
        descripcion: document.getElementById('descripcion').value,
        precio: parseFloat(precio),
        categoria_id: parseInt(categoria),
        imagen: document.getElementById('imagen').value
    };
    
    const id = document.getElementById('productoId').value;
    const url = id ? `${window.API_URL}/admin/productos/${id}` : `${window.API_URL}/admin/productos`;
    const method = id ? 'PUT' : 'POST';
    
    console.log('💾 Guardando producto:', producto);
    console.log('📡 URL:', url);
    console.log('🔑 Token:', localStorage.getItem('token'));
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: { 
                'Content-Type': 'application/json'
                // El token ya lo añade el interceptor en admin.js
            },
            body: JSON.stringify(producto)
        });
        
        const data = await response.json();
        console.log('📥 Respuesta:', data);
        
        if (response.ok) {
            // Cerrar modal
            productoModal?.hide();
            
            // Mostrar notificación
            if (window.mostrarNotificacion) {
                window.mostrarNotificacion(id ? '✅ Producto actualizado' : '✅ Producto creado', 'success');
            } else {
                alert(id ? '✅ Producto actualizado' : '✅ Producto creado');
            }
            
            cargarProductos(); // Recargar lista
        } else {
            const mensaje = data.message || 'Error al guardar';
            if (window.mostrarNotificacion) {
                window.mostrarNotificacion('❌ ' + mensaje, 'danger');
            } else {
                alert('❌ ' + mensaje);
            }
        }
    } catch (error) {
        console.error('❌ Error guardando producto:', error);
        if (window.mostrarNotificacion) {
            window.mostrarNotificacion('❌ Error de conexión', 'danger');
        } else {
            alert('Error de conexión');
        }
    }
};

// Eliminar producto
window.eliminarProducto = async function(id) {
    // Usar la función confirmarAccion de admin.js
    if (!window.confirmarAccion('¿Estás seguro de eliminar este producto?')) return;
    
    try {
        console.log('🗑️ Eliminando producto:', id);
        const response = await fetch(`${window.API_URL}/admin/productos/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (window.mostrarNotificacion) {
                window.mostrarNotificacion('✅ Producto eliminado', 'success');
            } else {
                alert('Producto eliminado');
            }
            cargarProductos();
        } else {
            const mensaje = data.message || 'Error al eliminar';
            if (window.mostrarNotificacion) {
                window.mostrarNotificacion('❌ ' + mensaje, 'danger');
            } else {
                alert('❌ ' + mensaje);
            }
        }
    } catch (error) {
        console.error('❌ Error eliminando producto:', error);
        if (window.mostrarNotificacion) {
            window.mostrarNotificacion('❌ Error de conexión', 'danger');
        } else {
            alert('Error de conexión');
        }
    }
};

console.log('✅ Productos JS cargado');