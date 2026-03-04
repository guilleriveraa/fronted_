// js/ui/auth.ui.js

window.InitManager.register('AuthUI', function() {
  console.log('🔐 Inicializando AuthUI');
  
  const authModal = document.getElementById("authModal");
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");
  const authClose = document.querySelector(".auth-close");
  
  // Elementos de los formularios
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");
  const registerName = document.getElementById("registerName");
  const registerEmail = document.getElementById("registerEmail");
  const registerPassword = document.getElementById("registerPassword");

  // Si no hay modal en esta página, salir
  if (!authModal) {
    console.log('📭 No hay modal de autenticación en esta página');
    return;
  }

  console.log('🔐 Elementos encontrados:', { 
    authModal, loginBtn, registerBtn, loginForm, registerForm 
  });

  // Abrir modal
  if (loginBtn) {
    loginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log('👆 Click en loginBtn');
      showAuthModal("login");
    });
  }

  if (registerBtn) {
    registerBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log('👆 Click en registerBtn');
      showAuthModal("register");
    });
  }

  if (authClose) {
    authClose.addEventListener("click", closeModal);
  }

  // Event listeners para los formularios
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
  
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }

  window.addEventListener("click", (e) => {
    if (e.target === authModal) closeModal();
  });

  window.showAuthModal = showAuthModal;

  function closeModal() {
    if (authModal) authModal.style.display = "none";
  }

  function showAuthModal(form) {
    if (!authModal) return;
    authModal.style.display = "block";
    showForm(form);
  }

  function showForm(form) {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const tabLogin = document.getElementById("tabLogin");
    const tabRegister = document.getElementById("tabRegister");

    if (!loginForm || !registerForm) return;

    if (form === "login") {
      loginForm.style.display = "block";
      registerForm.style.display = "none";
      if (tabLogin) tabLogin.classList.add("active");
      if (tabRegister) tabRegister.classList.remove("active");
    } else {
      loginForm.style.display = "none";
      registerForm.style.display = "block";
      if (tabLogin) tabLogin.classList.remove("active");
      if (tabRegister) tabRegister.classList.add("active");
    }
  }

  async function handleLogin(e) {
  // 👇 Esto DEBE ser lo PRIMERO que se ejecute
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  console.log('🔐 handleLogin ejecutado - preventDefault ejecutado');
  
  try {
    if (!window.sessionService) {
      throw new Error("Servicio de autenticación no disponible");
    }

    const email = loginEmail.value;
    const password = loginPassword.value;
    
    if (!email || !password) {
      alert("Por favor, completa todos los campos");
      return;
    }
    
    console.log('🔐 Intentando login con:', email);
    const result = await window.sessionService.login(email, password);
    console.log('🔐 Resultado login:', result);
    
    if (result.success) {
      closeModal();
      loginEmail.value = '';
      loginPassword.value = '';
      if (window.updateSessionUI) {
        window.updateSessionUI();
      }
    } else {
      alert(result.error || "Error al iniciar sesión");
    }
  } catch (error) {
    console.error("Error en login:", error);
    alert("Error al conectar con el servidor: " + error.message);
  }
}

  // En auth.ui.js - Reemplaza SOLO la función handleRegister
async function handleRegister(e) {
    e.preventDefault();
    console.log('📝 handleRegister ejecutado');
    
    if (!window.sessionService) {
        alert("Error: Servicio de autenticación no disponible");
        return;
    }

    const nombre = registerName.value;
    const email = registerEmail.value;
    const password = registerPassword.value;
    console.log('📝 Intentando registro con:', { nombre, email });

    if (!nombre || !email || !password) {
        alert("Todos los campos son obligatorios");
        return;
    }

    // Validación básica de formato antes de enviar
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert("Por favor, introduce un email con formato válido");
        return;
    }

    try {
        const result = await window.sessionService.register(nombre, email, password);
        console.log('📝 Resultado registro:', result);
        
        if (result.success) {
            closeModal();
            registerName.value = '';
            registerEmail.value = '';
            registerPassword.value = '';
            if (window.updateSessionUI) {
                window.updateSessionUI();
            }
        } else {
            // Mostrar el mensaje de error del backend
            alert(result.error || "Error al registrarse");
        }
    } catch (error) {
        console.error("Error en registro:", error);
        alert("Error al conectar con el servidor");
    }
}
// Función alternativa para el botón (no depende del evento submit)
window.handleLoginFromButton = async function() {
  console.log('🔐 handleLoginFromButton ejecutado');
  
  try {
    if (!window.sessionService) {
      throw new Error("Servicio de autenticación no disponible");
    }

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
      alert("Por favor, completa todos los campos");
      return;
    }
    
    const result = await window.sessionService.login(email, password);
    
    if (result.success) {
      document.getElementById('authModal').style.display = 'none';
      if (window.updateSessionUI) window.updateSessionUI();
    } else {
      alert(result.error || "Error al iniciar sesión");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Error al iniciar sesión");
  }
};
  
  window.InitManager.log('✅ Interfaz de autenticación inicializada');
});