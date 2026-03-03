// js/core/auth-interceptor.js

// Intercepta todas las peticiones fetch
const originalFetch = window.fetch;

window.fetch = function(...args) {
    return originalFetch.apply(this, args).then(response => {
        // Si la respuesta es 401 (No autorizado)
        if (response.status === 401) {
            console.log('🔒 Sesión expirada - Redirigiendo a login');
            
            // Limpiar sesión
            if (window.sessionService) {
                window.sessionService.logout();
            } else {
                localStorage.removeItem(window.TOKEN_KEY);
                localStorage.removeItem(window.USER_KEY);
            }
            
            // Redirigir al index
            window.location.href = '/index.html';
            
            // Lanzar error para detener la ejecución
            throw new Error('Sesión expirada');
        }
        return response;
    });
};

console.log('✅ Auth interceptor cargado');