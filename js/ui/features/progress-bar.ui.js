window.InitManager.register('ProgressBar', function () {

    const progressBar = document.getElementById('progressBar');
    if (!progressBar) return;

    function update() {
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.pageYOffset;
      const percent = Math.min(100, Math.max(0, (scrolled / docHeight) * 100));
      progressBar.style.width = percent + '%';
    }

    window.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    update();
  });