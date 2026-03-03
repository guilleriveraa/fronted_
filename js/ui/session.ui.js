// js/ui/session.ui.js

function updateSessionUI() {
    if (!window.sessionService) {
        console.warn('sessionService no disponible');
        return;
    }
    
    const user = window.sessionService.getUser();
    const authButtons = document.getElementById('authButtons');
    const usuarioMenu = document.getElementById('userMenu');

    console.log('updateSessionUI - user:', user);
    console.log('updateSessionUI - authButtons:', authButtons);
    console.log('updateSessionUI - usuarioMenu:', usuarioMenu);

    if (!authButtons || !usuarioMenu) return;

    if (user) {
        console.log('✅ Usuario logueado, mostrando menú');
        authButtons.style.display = 'none';
        usuarioMenu.style.display = 'flex';
        
        const userNameDisplay = document.getElementById('userNameDisplay');
        if (userNameDisplay && user.nombre) {
            userNameDisplay.textContent = user.nombre;
        }
        
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar && user.nombre) {
            userAvatar.textContent = user.nombre.charAt(0).toUpperCase();
        }

        // 🔥 NUEVO: Verificar si el usuario es admin
        checkIfAdmin(user.id);
        
    } else {
        console.log('❌ Usuario no logueado, mostrando botones');
        authButtons.style.display = 'flex';
        usuarioMenu.style.display = 'none';
    }
}

// 🔥 NUEVA FUNCIÓN: Verificar si el usuario es admin
async function checkIfAdmin(userId) {
    try {
        const token = localStorage.getItem(window.TOKEN_KEY);
        const response = await fetch(`${window.API_URL}/api/user/is-admin`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        const data = await response.json();
        
        if (data.isAdmin) {
            console.log('👑 Usuario es administrador, mostrando enlace');
            addAdminLinkToMenu();
        }
    } catch (error) {
        console.error('Error verificando admin:', error);
    }
}

// 🔥 NUEVA FUNCIÓN: Añadir enlace al panel admin en el menú
function addAdminLinkToMenu() {
    const dropdown = document.querySelector('.user-dropdown');
    if (!dropdown) return;
    
    // Verificar si ya existe el enlace para no duplicar
    if (document.querySelector('.dropdown-item.admin-link')) return;
    
    // Crear el nuevo enlace
    const adminLink = document.createElement('a');
    adminLink.href = '/fronted/admin/index.html';
    adminLink.className = 'dropdown-item admin-link';
    adminLink.innerHTML = '<i class="fas fa-cog"></i> Panel Administrador';
    
    // Insertar antes del divider
    const divider = dropdown.querySelector('.dropdown-divider');
    if (divider) {
        dropdown.insertBefore(adminLink, divider);
    } else {
        // Si no hay divider, añadir al final
        dropdown.appendChild(adminLink);
        // Añadir divider después
        const newDivider = document.createElement('div');
        newDivider.className = 'dropdown-divider';
        dropdown.appendChild(newDivider);
    }
    
    console.log('✅ Enlace admin añadido al menú');
}

// Función global para logout
window.logoutUser = function() {
    console.log('🚪 logoutUser llamado');
    if (window.sessionService) {
        window.sessionService.logout();
        updateSessionUI();
        return true;
    }
    return false;
};

function setupLogout() {
    console.log('🔄 setupLogout ejecutado');
    
    // Eliminar todos los eventos onclick anteriores de UNA SOLA VEZ
    document.querySelectorAll('.logout').forEach(btn => {
        // Reemplazar el botón para eliminar todos los eventos
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
    });
    
    // Asignar evento a los nuevos botones
    document.querySelectorAll('.logout').forEach(btn => {
        console.log('🎯 Asignando evento a botón:', btn);
        
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('👆 Click en botón de logout');
            
            if (window.sessionService) {
                window.sessionService.logout();
                updateSessionUI();
            } else {
                console.error('❌ sessionService no disponible');
            }
        });
    });
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('📢 DOMContentLoaded - Inicializando UI de sesión');
    setupLogout();
    updateSessionUI();
    
    // Código del dropdown - VERSIÓN MEJORADA
const avatar = document.querySelector('.user-avatar');
const dropdown = document.querySelector('.user-dropdown');
let timeoutId;
let isHovering = false;

if (avatar && dropdown) {
    // Función para mostrar el dropdown
    function showDropdown() {
        clearTimeout(timeoutId);
        dropdown.style.display = 'block';
    }

    // Función para ocultar el dropdown con retraso
    function hideDropdown() {
        timeoutId = setTimeout(function() {
            if (!isHovering) {
                dropdown.style.display = 'none';
            }
        }, 800); // Aumentado a 500ms
    }

    // Eventos para el avatar
    avatar.addEventListener('mouseenter', function() {
        isHovering = true;
        showDropdown();
    });

    avatar.addEventListener('mouseleave', function() {
        isHovering = false;
        hideDropdown();
    });

    // Eventos para el dropdown
    dropdown.addEventListener('mouseenter', function() {
        isHovering = true;
        clearTimeout(timeoutId);
        dropdown.style.display = 'block';
    });

    dropdown.addEventListener('mouseleave', function() {
        isHovering = false;
        hideDropdown();
    });

    // Cerrar al hacer clic fuera (opcional pero recomendado)
    document.addEventListener('click', function(e) {
        if (!avatar.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });

    console.log('✅ Menú dropdown mejorado con 500ms de retraso');
}
});

// También ejecutar cuando la página se carga completamente (por si acaso)
window.addEventListener('load', function() {
    console.log('📢 window.load - Reasignando eventos de logout');
    setupLogout();
    updateSessionUI();
});

// Exponer globalmente
window.updateSessionUI = updateSessionUI;
window.setupLogout = setupLogout;

console.log('✅ session.ui cargado');