window.InitManager.register('ProductSearch', function () {

    const searchToggle = document.getElementById('searchToggle');
    const searchDropdown = document.getElementById('searchDropdown');
    const searchClose = document.getElementById('searchClose');

    if (!searchToggle || !searchDropdown) return;

    function closeSearch() {
      searchDropdown.classList.remove('active');
      document.body.style.overflow = '';
    }

    searchToggle.addEventListener('click', e => {
      e.preventDefault();
      searchDropdown.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    searchClose?.addEventListener('click', closeSearch);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeSearch();
    });

  });