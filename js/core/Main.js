// js/Main.js - Funcionalidades básicas con InitManager

// =====================
// 1. SMOOTH SCROLL
// =====================
window.InitManager.register('SmoothScroll', function () {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return;

      e.preventDefault();
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: 'smooth'
        });
      }
    });
  });

  window.InitManager.log('✅ Smooth Scroll activado');
});

// =====================
// 2. MENÚ MÓVIL
// =====================
window.InitManager.register('MobileMenu', function () {
  const menuToggle = document.getElementById('menuToggle');
  const menuClose = document.getElementById('menuClose');
  const mainNav = document.getElementById('mainNav');

  if (!menuToggle || !mainNav) return;

  const closeMenu = () => {
    mainNav.classList.remove('active');
    document.body.style.overflow = '';
  };

  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    mainNav.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  if (menuClose) menuClose.addEventListener('click', closeMenu);

  // Cerrar al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (mainNav.classList.contains('active') &&
      !mainNav.contains(e.target) &&
      e.target !== menuToggle) {
      closeMenu();
    }
  });

  // Cerrar con ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mainNav.classList.contains('active')) {
      closeMenu();
    }
  });

  window.InitManager.log('✅ Menú móvil activado');
});

// =====================
// 3. FILTROS BÁSICOS
// =====================
window.InitManager.register('BasicFilters', function () {
  const filterBtns = document.querySelectorAll('.filter-btn');
  if (filterBtns.length === 0) return;

  const setActiveFilter = (btn) => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  };

  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      setActiveFilter(btn);
    });
  });

  // Aplicar filtro guardado al cargar
  const lastFilter = localStorage.getItem('lastFilter'); // antes de usarlo

  if (lastFilter) {
    const matchingBtn = Array.from(filterBtns).find(btn => btn.textContent === lastFilter);
    if (matchingBtn) setActiveFilter(matchingBtn);
  }

  window.InitManager.log('✅ Filtros básicos activados');
});
