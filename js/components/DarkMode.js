// js/darkmode.js - Modo oscuro con InitManager
window.InitManager.register('DarkMode', function() {
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  const themeToggle = document.getElementById('themeToggle');

  // Función para actualizar iconos del botón
  function updateToggleIcons(theme) {
    if (!themeToggle) return;
    const moonIcon = themeToggle.querySelector('.fa-moon');
    const sunIcon = themeToggle.querySelector('.fa-sun');

    if (theme === 'dark') {
      if (moonIcon) moonIcon.style.display = 'none';
      if (sunIcon) sunIcon.style.display = 'inline-block';
    } else {
      if (moonIcon) moonIcon.style.display = 'inline-block';
      if (sunIcon) sunIcon.style.display = 'none';
    }
  }

  // Función para cambiar tema
  function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme); // ← guardar elección
  updateToggleIcons(theme);
  }


  // Aplicar tema guardado o preferencia del sistema
  const savedTheme = localStorage.getItem('theme');

  if (savedTheme) {
    setTheme(savedTheme);
  }else if (prefersDarkScheme.matches) {
    setTheme('dark');
  } else {
    setTheme('light');
  }


  // Configurar toggle
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // Actualizar si cambia preferencia del sistema y no hay tema guardado
  prefersDarkScheme.addEventListener('change', (e) => {

  });

  window.InitManager.log('✅ Dark Mode activado');
});
