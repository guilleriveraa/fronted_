window.InitManager.register('ProductFilters', function () {

  const filterBtns = document.querySelectorAll('.filter-btn');
  const productCards = document.querySelectorAll('.event-card');

  if (!filterBtns.length || !productCards.length) return;

  function filter(type) {

    productCards.forEach(card => {

      const category = card.dataset.category || '';
      const gift = card.dataset.regalo === 'true';
      let show = true;

      switch (type.toLowerCase()) {
        case 'más vendidos': show = category === 'vendidos'; break;
        case 'ofertas': show = category === 'ofertas'; break;
        case 'novedades': show = category === 'nuevo'; break;
        case 'para regalo': show = gift; break;
        case 'todos': default: show = true;
      }

      card.style.display = show ? 'block' : 'none';
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      filter(this.textContent);
    });
  });

});