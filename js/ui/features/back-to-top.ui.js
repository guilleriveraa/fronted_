window.InitManager.register('BackToTop', function () {

    const btn = document.getElementById('backToTop');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.pageYOffset > 300);
    });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

  });
