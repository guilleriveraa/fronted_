// admin/js/productos.js - CRUD de productos

let productoModal = null;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Inicializando productos...');
    loadUserInfo();
    cargarProductos();
    cargarCategorias();

    // Inicializar modal de Bootstrap
    const modalElement = document.getElementById('productoModal');
    if (modalElement) {
        productoModal = new bootstrap.Modal(modalElement);
    }
});
// Cargar categorías desde la API
async function cargarCategorias() {
    try {
        const response = await fetch(`${window.API_URL}/categorias`);
        if (!response.ok) throw new Error('Error al cargar categorías');

        const categorias = await response.json();
        const select = document.getElementById('categoria_id');

        if (!select) return;

        // Limpiar opciones (dejar solo la primera)
        while (select.options.length > 1) {
            select.remove(1);
        }

        // Añadir categorías
        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.nombre.charAt(0).toUpperCase() + cat.nombre.slice(1);
            select.appendChild(option);
        });

        console.log('✅ Categorías cargadas:', categorias.length);
    } catch (error) {
        console.error('❌ Error cargando categorías:', error);
    }
}
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
window.abrirModalNuevo = function () {
    document.getElementById('modalTitulo').textContent = 'Nuevo Producto';
    document.getElementById('productoForm').reset();
    document.getElementById('productoId').value = '';
    productoModal?.show();
};

// Abrir modal para editar producto
window.editarProducto = async function (id) {
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

window.guardarProducto = async function () {
    // Validar campos obligatorios
    const nombre = document.getElementById('nombre').value.trim();
    const precio = document.getElementById('precio').value;
    const categoria = document.getElementById('categoria_id').value;

    if (!nombre) {
        alert('El nombre es obligatorio');
        return;
    }
    if (!precio || isNaN(parseFloat(precio)) || parseFloat(precio) <= 0) {
        alert('El precio debe ser un número válido mayor que 0');
        return;
    }
    if (!categoria || isNaN(parseInt(categoria))) {
        alert('La categoría no es válida');
        return;
    }

    // --- Construir el objeto solo con los campos que tienen valor ---
    const producto = {
        nombre: nombre,
        precio: parseFloat(precio),
        categoria_id: parseInt(categoria)
    };

    // Añadir descripción solo si tiene contenido
    const descripcion = document.getElementById('descripcion').value.trim();
    if (descripcion) {
        producto.descripcion = descripcion;
    }

    // Añadir imagen solo si tiene contenido
    const imagen = document.getElementById('imagen').value.trim();
    if (imagen) {
        // Validar que la imagen tiene un formato aceptable
        // Acepta URLs absolutas (con http) o rutas relativas desde la raíz (que empiecen con /)
        const esUrlAbsoluta = imagen.startsWith('http://') || imagen.startsWith('https://');
        const esRutaRelativaRaiz = imagen.startsWith('/');

        // También debe terminar con extensión de imagen válida
        const extensionesValidas = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        const tieneExtensionValida = extensionesValidas.some(ext =>
            imagen.toLowerCase().endsWith(ext)
        );

        if (!esUrlAbsoluta && !esRutaRelativaRaiz) {
            alert('La imagen debe ser una URL absoluta (https://...) o una ruta relativa que empiece con /');
            return;
        }

        if (!tieneExtensionValida) {
            alert('La imagen debe tener una extensión válida (.jpg, .png, .gif, etc.)');
            return;
        }

        // Validación adicional: si es ruta relativa, asegurar que no tenga .. ni otros caracteres peligrosos
        if (esRutaRelativaRaiz && (imagen.includes('..') || imagen.includes('//'))) {
            alert('La ruta de imagen contiene caracteres no permitidos');
            return;
        }

        producto.imagen = imagen;
    }

    const id = document.getElementById('productoId').value;
    const url = id ? `${window.API_URL}/admin/productos/${id}` : `${window.API_URL}/admin/productos`;
    const method = id ? 'PUT' : 'POST';

    console.log('💾 Datos a enviar (limpios):', producto);
    console.log('📡 URL:', url);

    const token = localStorage.getItem('token');
    if (!token) {
        alert('No hay sesión activa. Por favor, inicia sesión de nuevo.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(producto)
        });

        // --- Leer la respuesta como texto primero para ver qué devuelve ---
        const responseText = await response.text();
        console.log('📥 Respuesta del servidor (texto):', responseText);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('La respuesta no es JSON válido:', responseText);
            throw new Error('Respuesta inválida del servidor');
        }

        if (response.ok) {
            console.log('✅ Éxito:', data);
            productoModal?.hide();
            if (window.mostrarNotificacion) {
                window.mostrarNotificacion(id ? '✅ Producto actualizado' : '✅ Producto creado', 'success');
            } else {
                alert(id ? '✅ Producto actualizado' : '✅ Producto creado');
            }
            cargarProductos();
        } else {
            // --- Mostrar el error detallado que viene del servidor ---
            console.error('❌ Error del servidor (código 400):', data);
            let mensajeError = 'Error al guardar. ';
            if (data.message) {
                mensajeError += data.message;
            } else if (data.errors && data.errors.length > 0) {
                mensajeError += data.errors.map(e => e.msg || e.message).join(', ');
            } else {
                mensajeError += 'Revise los datos e intente de nuevo.';
            }
            alert('❌ ' + mensajeError);
        }
    } catch (error) {
        console.error('❌ Error en la petición:', error);
        alert('Error de conexión: ' + error.message);
    }
};

window.eliminarProducto = async function (id) {
    if (!window.confirmarAccion('¿Estás seguro de eliminar este producto?')) return;

    try {
        console.log('🗑️ Eliminando producto:', id);
        const token = localStorage.getItem('token');  // ✅ OBTENER TOKEN

        const response = await fetch(`${window.API_URL}/admin/productos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token  // ✅ AÑADIR TOKEN
            }
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