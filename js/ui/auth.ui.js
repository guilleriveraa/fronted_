// js/ui/auth.ui.js - VERSIÓN SIN FORMULARIOS

window.InitManager.register('AuthUI', function() {
  console.log('🔐 Inicializando AuthUI');
  
  // Elementos del modal
  const authModal = document.getElementById("authModal");
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");
  const authClose = document.querySelector(".auth-close");
  
  // Elementos de los contenedores
  const loginContainer = document.getElementById("loginContainer");
  const registerContainer = document.getElementById("registerContainer");
  
  // Inputs
  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");
  const registerName = document.getElementById("registerName");
  const registerEmail = document.getElementById("registerEmail");
  const registerPassword = document.getElementById("registerPassword");
  
  // Botones
  const loginButton = document.getElementById("loginButton");
  const registerButton = document.getElementById("registerButton");

  if (!authModal) {
    console.log('📭 No hay modal de autenticación en esta página');
    return;
  }

  console.log('🔐 Elementos encontrados');

  // Abrir modal
  if (loginBtn) {
    loginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showAuthModal("login");
    });
  }

  if (registerBtn) {
    registerBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showAuthModal("register");
    });
  }

  // Botones de acción
  if (loginButton) {
    loginButton.addEventListener("click", handleLogin);
  }
  
  if (registerButton) {
    registerButton.addEventListener("click", handleRegister);
  }

  // Cerrar modal
  if (authClose) {
    authClose.addEventListener("click", closeModal);
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
    
    if (form === "login") {
      loginContainer.style.display = "block";
      registerContainer.style.display = "none";
    } else {
      loginContainer.style.display = "none";
      registerContainer.style.display = "block";
    }
  }

  async function handleLogin() {
    console.log('🔐 handleLogin ejecutado');
    
    try {
      if (!window.sessionService) {
        alert("Error: Servicio de autenticación no disponible");
        return;
      }

      const email = loginEmail.value;
      const password = loginPassword.value;
      
      if (!email || !password) {
        alert("Por favor, completa todos los campos");
        return;
      }

      console.log('🔐 Intentando login con:', email);
      const result = await window.sessionService.login(email, password);
      console.log('🔐 Resultado:', result);
      
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
      alert("Error al conectar con el servidor");
    }
  }

  async function handleRegister() {
    console.log('📝 handleRegister ejecutado');
    
    try {
      if (!window.sessionService) {
        alert("Error: Servicio de autenticación no disponible");
        return;
      }

      const nombre = registerName.value;
      const email = registerEmail.value;
      const password = registerPassword.value;
      
      if (!nombre || !email || !password) {
        alert("Todos los campos son obligatorios");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert("Email con formato inválido");
        return;
      }

      console.log('📝 Intentando registro con:', { nombre, email });
      const result = await window.sessionService.register(nombre, email, password);
      console.log('📝 Resultado:', result);
      
      if (result.success) {
        closeModal();
        registerName.value = '';
        registerEmail.value = '';
        registerPassword.value = '';
        if (window.updateSessionUI) {
          window.updateSessionUI();
        }
      } else {
        alert(result.error || "Error al registrarse");
      }
    } catch (error) {
      console.error("Error en registro:", error);
      alert("Error al conectar con el servidor");
    }
  }
  
  window.InitManager.log('✅ AuthUI listo');
});