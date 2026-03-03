// js/ui/pages/profile-page.js

console.log('📦 profile-page.js cargando...');

window.InitManager.register('ProfilePage', async function () {
    console.log('📋 Inicializando página de perfil');
    console.log('1. TOKEN_KEY:', window.TOKEN_KEY);
    
    const token = localStorage.getItem(window.TOKEN_KEY);
    console.log('2. Token:', token ? 'existe' : 'no existe');

    if (!token) {
        console.log('3. No hay token, redirigiendo a index');
        window.location.href = 'index.html';
        return;
    }

    console.log('4. Token obtenido, llamando a fetchCurrentUser');
    
    try {
        const user = await fetchCurrentUser(token);
        console.log('5. Usuario recibido:', user);
        
        console.log('6. Renderizando perfil');
        renderProfile(user);
        
        console.log('7. Configurando eventos');
        setupProfileEvents();

    } catch (error) {
        console.error('❌ Error en catch:', error);
        showError('No se pudo cargar el perfil. Intenta de nuevo más tarde.');
    }
}, []);

async function fetchCurrentUser(token) {
    console.log('📡 fetchCurrentUser llamado');
    const response = await fetch(`${window.API_URL}/api/users/me`, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    });

    if (!response.ok) {
        throw new Error('Error al obtener usuario');
    }

    return await response.json();
}

function renderProfile(user) {
    console.log('🎨 renderProfile ejecutado');
    const container = document.getElementById('profileContainer');
    
    if (!container) {
        console.error('❌ No se encontró #profileContainer');
        return;
    }
    
    const html = `
        <div class="profile-header">
            <div class="profile-avatar">
                <i class="fas fa-user-circle"></i>
                <button class="avatar-upload" onclick="uploadAvatar()">
                    <i class="fas fa-camera"></i>
                </button>
            </div>
            <div class="profile-info">
                <h1>${user.nombre || 'Usuario'}</h1>
                <p class="profile-email">${user.email || ''}</p>
                <p class="profile-member">Miembro desde ${formatDate(user.fecha_creacion)}</p>
                <div class="profile-badges">
                    <span class="badge customer">
                        <i class="fas fa-star"></i> Cliente
                    </span>
                </div>
            </div>
        </div>

        <div class="profile-tabs">
            <button class="profile-tab active" data-tab="info">
                <i class="fas fa-user"></i> Información Personal
            </button>
            <button class="profile-tab" data-tab="orders">
                <i class="fas fa-shopping-bag"></i> Mis Pedidos
            </button>
            <button class="profile-tab" data-tab="security">
                <i class="fas fa-shield-alt"></i> Seguridad
            </button>
        </div>

        <div class="profile-content">
            <!-- Información Personal -->
            <div id="tabInfo" class="profile-tab-content active">
                <form id="profileForm" class="profile-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Nombre completo</label>
                            <input type="text" id="profileName" value="${user.nombre || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <!-- CAMBIADO: readonly para que no se pueda editar -->
                            <input type="email" id="profileEmail" value="${user.email || ''}" readonly class="form-control-plaintext">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-save">
                            <i class="fas fa-save"></i> Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>

            <!-- Mis Pedidos -->
            <div id="tabOrders" class="profile-tab-content">
                <div class="orders-list" id="ordersList">
                    <div class="loading-orders">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Cargando pedidos...</p>
                    </div>
                </div>
            </div>

            <!-- Seguridad -->
            <div id="tabSecurity" class="profile-tab-content">
                <form id="securityForm" class="security-form">
                    <h3>Cambiar contraseña</h3>
                    <div class="form-group">
                        <label>Contraseña actual</label>
                        <input type="password" id="currentPassword" placeholder="Contraseña actual">
                    </div>
                    <div class="form-group">
                        <label>Nueva contraseña</label>
                        <input type="password" id="newPassword" placeholder="Nueva contraseña">
                    </div>
                    <div class="form-group">
                        <label>Confirmar nueva contraseña</label>
                        <input type="password" id="confirmNewPassword" placeholder="Confirmar contraseña">
                    </div>
                    <button type="submit" class="btn-save-security">
                        <i class="fas fa-key"></i> Cambiar contraseña
                    </button>
                </form>
            </div>
        </div>
    `;

    container.innerHTML = html;
    console.log('✅ Perfil renderizado en DOM');
}

function setupProfileEvents() {
    console.log('🔧 setupProfileEvents ejecutado');
    
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }

    const securityForm = document.getElementById('securityForm');
    if (securityForm) {
        securityForm.addEventListener('submit', handleSecurityUpdate);
    }

    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.profile-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.add('active');
            
            if (tabName === 'orders') {
                loadOrders();
            }
        });
    });
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const token = localStorage.getItem(window.TOKEN_KEY);
    if (!token) return;

    const userData = {
        nombre: document.getElementById('profileName').value,
        email: document.getElementById('profileEmail').value
    };

    try {
        const response = await fetch(`${window.API_URL}/api/users/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error actualizando perfil');
        }

        alert('Perfil actualizado correctamente');
        
        if (window.updateSessionUI) {
            window.updateSessionUI();
        }

    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}

async function handleSecurityUpdate(e) {
    e.preventDefault();

    const token = localStorage.getItem(window.TOKEN_KEY);
    if (!token) return;

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;

    if (!currentPassword || !newPassword) {
        alert('Completa todos los campos');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('Las contraseñas no coinciden');
        return;
    }

    try {
        const response = await fetch(`${window.API_URL}/api/users/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error cambiando contraseña');
        }

        alert('Contraseña actualizada correctamente');
        document.getElementById('securityForm').reset();

    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}

async function loadOrders() {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;

    const token = localStorage.getItem(window.TOKEN_KEY);

    try {
        const response = await fetch(`${window.API_URL}/api/orders/my-orders`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        if (!response.ok) {
            throw new Error('Error cargando pedidos');
        }

        const orders = await response.json();

        if (!orders.length) {
            ordersList.innerHTML = '<p class="no-orders">No tienes pedidos aún</p>';
            return;
        }

        ordersList.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <h4>Pedido #${order.id}</h4>
                    <span class="order-status">${order.status}</span>
                </div>
                <p class="order-date">${new Date(order.date).toLocaleDateString()}</p>
                <p class="order-total">Total: ${order.total}€</p>
                <button onclick="viewOrderDetails(${order.id})">Ver detalles</button>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error:', error);
        ordersList.innerHTML = '<p class="error">Error cargando pedidos</p>';
    }
}

function formatDate(dateString) {
    if (!dateString) return 'fecha desconocida';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
}

function showError(message) {
    const container = document.getElementById('profileContainer');
    container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
            <button onclick="location.reload()">Reintentar</button>
        </div>
    `;
}

window.viewOrderDetails = function(orderId) {
    window.location.href = `pedido-detalle.html?id=${orderId}`;
};

window.uploadAvatar = function() {
    alert('Función de avatar próximamente');
};

console.log('✅ profile-page.js cargado correctamente');