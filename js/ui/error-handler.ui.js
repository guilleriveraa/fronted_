// js/ui/error-handler.ui.js - Sistema de notificaciones visuales

class ErrorHandler {
    constructor() {
        this.container = null;
        this.toasts = [];
        this.init();
    }

    init() {
        // Crear contenedor para notificaciones
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 350px;
        `;
        document.body.appendChild(this.container);
    }

    // Mostrar mensaje de éxito
    success(message, duration = 5000) {
        this.show(message, 'success', duration);
    }

    // Mostrar mensaje de error
    error(message, duration = 7000) {
        this.show(message, 'error', duration);
    }

    // Mostrar mensaje de advertencia
    warning(message, duration = 6000) {
        this.show(message, 'warning', duration);
    }

    // Mostrar mensaje informativo
    info(message, duration = 4000) {
        this.show(message, 'info', duration);
    }

    // Método principal para mostrar notificaciones
    show(message, type = 'info', duration = 5000) {
        const colors = {
            success: '#4caf50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196f3'
        };

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

        const toast = document.createElement('div');
        toast.id = id;
        toast.style.cssText = `
            background: white;
            border-left: 4px solid ${colors[type]};
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
            pointer-events: auto;
            cursor: pointer;
        `;

        toast.innerHTML = `
            <i class="fas ${icons[type]}" style="color: ${colors[type]}; font-size: 1.2rem;"></i>
            <div style="flex: 1; color: #333; font-size: 0.95rem; line-height: 1.4;">${message}</div>
            <i class="fas fa-times" style="color: #999; cursor: pointer; font-size: 0.9rem;"></i>
        `;

        // Añadir al contenedor
        this.container.appendChild(toast);

        // Animar entrada
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        }, 10);

        // Configurar cierre al hacer clic en la X
        const closeBtn = toast.querySelector('.fa-times');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.close(toast);
        });

        // Cerrar al hacer clic en la notificación
        toast.addEventListener('click', (e) => {
            if (!e.target.classList.contains('fa-times')) {
                this.close(toast);
            }
        });

        // Auto-cerrar después de duration
        if (duration > 0) {
            setTimeout(() => this.close(toast), duration);
        }

        // Guardar referencia
        this.toasts.push(toast);

        return id;
    }

    // Cerrar una notificación
    close(toast) {
        toast.style.transform = 'translateX(100%)';
        toast.style.opacity = '0';

        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            this.toasts = this.toasts.filter(t => t !== toast);
        }, 300);
    }

    // Cerrar todas las notificaciones
    closeAll() {
        this.toasts.forEach(toast => this.close(toast));
    }

    // Mostrar error de red con opción de reintentar
    networkError(message, retryCallback) {
        const colors = { error: '#f44336' };
        const id = 'toast-' + Date.now();

        const toast = document.createElement('div');
        toast.id = id;
        toast.style.cssText = `
            background: white;
            border-left: 4px solid ${colors.error};
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 16px;
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
        `;

        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <i class="fas fa-exclamation-circle" style="color: ${colors.error}; font-size: 1.2rem;"></i>
                <div style="flex: 1; color: #333; font-size: 0.95rem;">${message}</div>
                <i class="fas fa-times" style="color: #999; cursor: pointer; font-size: 0.9rem;"></i>
            </div>
            <button class="retry-btn" style="
                background: ${colors.error};
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.9rem;
                width: 100%;
                transition: opacity 0.2s;
            ">Reintentar</button>
        `;

        this.container.appendChild(toast);

        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        }, 10);

        // Botón de reintentar
        const retryBtn = toast.querySelector('.retry-btn');
        retryBtn.addEventListener('click', async () => {
            retryBtn.disabled = true;
            retryBtn.textContent = 'Reintentando...';

            try {
                await retryCallback();
                this.close(toast);
            } catch (e) {
                retryBtn.disabled = false;
                retryBtn.textContent = 'Reintentar';
            }
        });

        // Cerrar con X
        toast.querySelector('.fa-times').addEventListener('click', () => this.close(toast));
    }
}

// Instancia global
window.errorHandler = new ErrorHandler();

// Interceptar errores globales no capturados
window.addEventListener('error', (event) => {
    console.error('Error global:', event.error);
    window.errorHandler?.error('Ha ocurrido un error inesperado');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promesa rechazada:', event.reason);
    window.errorHandler?.error('Error en la aplicación');
});

console.log('✅ ErrorHandler cargado');