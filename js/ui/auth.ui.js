// js/ui/auth.ui.js - VERSIÓN DE DEPURACIÓN

window.InitManager.register('AuthUI', function() {
  console.log('🔐 Inicializando AuthUI');
  
  const authModal = document.getElementById("authModal");
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");
  const authClose = document.querySelector(".auth-close");
  
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");
  const registerName = document.getElementById("registerName");
  const registerEmail = document.getElementById("registerEmail");
  const registerPassword = document.getElementById("registerPassword");

  if (!authModal) {
    console.log('📭 No hay modal de autenticación en esta página');
    return;
  }

  console.log('🔐 Elementos encontrados');

  // Abrir modal
  if (loginBtn) {
    loginBtn.addEventListener("click", (e) => {
      console.log('1️⃣ Click en loginBtn');
      e.preventDefault();
      console.log('2️⃣ preventDefault ejecutado en botón');
      showAuthModal("login");
    });
  }

  if (registerBtn) {
    registerBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showAuthModal("register");
    });
  }

  if (authClose) {
    authClose.addEventListener("click", closeModal);
  }

  // SOLUCIÓN RADICAL: Cambiar el tipo del botón dinámicamente
  const loginSubmitBtn = document.querySelector('#loginForm .btn-auth-submit');
  if (loginSubmitBtn) {
    console.log('3️⃣ Botón de login encontrado, cambiando tipo a button');
    loginSubmitBtn.type = 'button';
    loginSubmitBtn.onclick = handleLoginClick;
  }

  window.addEventListener("click", (e) => {
    if (e.target === authModal) closeModal();
  });

  window.showAuthModal = showAuthModal;

  function closeModal() {
    console.log('❌ Cerrando modal');
    if (authModal) authModal.style.display = "none";
  }

  function showAuthModal(form) {
    console.log('📱 Mostrando modal:', form);
    if (!authModal) return;
    authModal.style.display = "block";
    showForm(form);
  }

  function showForm(form) {
    if (form === "login") {
      loginForm.style.display = "block";
      registerForm.style.display = "none";
    } else {
      loginForm.style.display = "none";
      registerForm.style.display = "block";
    }
  }

  // Función para el login (NO usa el evento submit)
  async function handleLoginClick() {
    console.log('4️⃣ handleLoginClick ejecutado');
    
    try {
      if (!window.sessionService) {
        console.error('5️⃣ ERROR: sessionService no disponible');
        alert("Error: Servicio de autenticación no disponible");
        return;
      }

      const email = loginEmail.value;
      const password = loginPassword.value;
      
      console.log('6️⃣ Email ingresado:', email);
      console.log('7️⃣ Password ingresado:', password ? '****' : 'vacío');

      if (!email || !password) {
        console.log('8️⃣ ERROR: Campos vacíos');
        alert("Por favor, completa todos los campos");
        return;
      }

      console.log('9️⃣ Llamando a sessionService.login...');
      const result = await window.sessionService.login(email, password);
      console.log('🔟 Resultado:', result);
      
      if (result.success) {
        console.log('1️⃣1️⃣ Login exitoso, cerrando modal');
        closeModal();
        loginEmail.value = '';
        loginPassword.value = '';
        if (window.updateSessionUI) {
          console.log('1️⃣2️⃣ Actualizando UI');
          window.updateSessionUI();
        }
      } else {
        console.log('1️⃣3️⃣ Login falló:', result.error);
        alert(result.error || "Error al iniciar sesión");
      }
    } catch (error) {
      console.error('❌ ERROR CAPTURADO:', error);
      console.error('Stack:', error.stack);
      alert("Error al conectar con el servidor: " + error.message);
    }
  }

  // También prevenimos el envío del formulario por si acaso
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      console.log('⚠️ Intento de submit detectado - BLOQUEADO');
      e.preventDefault();
      e.stopPropagation();
      return false;
    });
  }
  
  window.InitManager.log('✅ AuthUI listo');
});