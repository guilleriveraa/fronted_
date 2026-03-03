// js/services/session.service.js
async function request(endpoint, options = {}) {
    const response = await fetch(`${window.API_URL}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Error API');
    }

    return data;
}

// AÑADIR ESTO: Sistema de listeners
const listeners = [];

function onChange(callback) {
    if (typeof callback === 'function') {
        listeners.push(callback);
    }
}

function notifyListeners() {
    listeners.forEach(cb => cb());
}

function saveSession(token, user) {
    localStorage.setItem(window.TOKEN_KEY, token);
    localStorage.setItem(window.USER_KEY, JSON.stringify(user));
    notifyListeners(); // AÑADIR
}

function getUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
}

function getToken() {
    return localStorage.getItem(window.TOKEN_KEY);
}

function isLoggedIn() {
    return !!getToken();
}

function logout() {
    localStorage.removeItem(window.TOKEN_KEY);
    localStorage.removeItem(window.USER_KEY);
    notifyListeners(); // AÑADIR
}

async function login(email, contraseña) {
    const data = await request('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, contraseña })
    });

    const user = {
        id: data.userId,
        nombre: data.nombre,
        email: data.email
    };

    saveSession(data.token, user);
    notifyListeners(); // AÑADIR
    return { success: true, user };
}

async function register(nombre, email, contraseña) {
    const data = await request('/api/register', {
        method: 'POST',
        body: JSON.stringify({ nombre, email, contraseña })
    });

    const user = {
        id: data.userId,
        nombre: data.nombre,
        email: data.email
    };

    saveSession(data.token, user);
    notifyListeners(); // AÑADIR
    return { success: true, user };
}

// Exponer globalmente (para scripts sin módulos)
function isLoggedIn() {
    return !!getToken();
}
window.sessionService = {
    isLoggedIn,
    getToken,
    getUser,
    logout,
    login,
    register,
    onChange  // AÑADIR
};