// fronted/admin/js/admin.js - Versión completa

window.API_URL = window.API_URL || 'https://json-production-48ce.up.railway.app/api';
console.log('✅ API_URL definida:', window.API_URL);

// Interceptor para añadir token a todas las peticiones
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
    const token = localStorage.getItem('token');
    
    options.headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        options.headers['Authorization'] = 'Bearer ' + token;
    }
    
    console.log('📡 Fetching:', url, 'with token:', token ? '✅ Sí' : '❌ No');
    return originalFetch(url, options);
};

// Verificar autenticación al cargar
(function checkAuth() {
    const token = localStorage.getItem('token');
    const currentPage = window.location.pathname.split('/').pop();
    
    console.log('🔐 Token en localStorage:', token ? '✅ Sí' : '❌ No');
    
    if (!token && currentPage !== 'login.html' && currentPage !== '') {
        console.log('🚫 No token, redirigiendo a login');
        window.location.href = 'login.html';
        return;
    }
})();

// Función para cerrar sesión
window.logout = function() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
};

// Función para confirmar acciones (reemplaza confirmAction)
window.confirmarAccion = function(message) {
    return confirm(message);
};

// Función para mostrar notificaciones
window.mostrarNotificacion = function(message, tipo = 'success') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `alert alert-${tipo} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    notification.style.zIndex = '9999';
    notification.style.minWidth = '300px';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
    document.body.appendChild(notification);
    
    // Auto-cerrar después de 3 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
};

// Cargar datos del usuario
window.loadUserInfo = async function() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        console.log('👤 Cargando info de usuario...');
        const response = await fetch(`${window.API_URL}/users/me`);
        
        if (!response.ok) {
            throw new Error('Error al cargar usuario');
        }
        
        const user = await response.json();
        console.log('✅ Usuario cargado:', user);
        
        const userNameElement = document.getElementById('adminName');
        const userAvatarElement = document.getElementById('adminAvatar');
        
        if (userNameElement) {
            userNameElement.textContent = user.nombre || 'Administrador';
        }
        if (userAvatarElement) {
            const iniciales = (user.nombre || 'A').charAt(0).toUpperCase();
            userAvatarElement.src = `https://ui-avatars.com/api/?name=${iniciales}&background=c62828&color=fff&size=40`;
        }
    } catch (error) {
        console.error('❌ Error cargando usuario:', error);
    }
};

console.log('✅ Admin JS cargado');