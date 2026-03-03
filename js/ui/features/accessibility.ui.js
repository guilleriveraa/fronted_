window.InitManager.register('Accessibility', function () {

    const highContrastToggle = document.getElementById('highContrastToggle');
    const fontSizeDecrease = document.getElementById('fontSizeDecrease');
    const fontSizeReset = document.getElementById('fontSizeReset');
    const fontSizeIncrease = document.getElementById('fontSizeIncrease');

    let currentFontSize = parseInt(localStorage.getItem('fontSize') || '1');

    function updateFontSize() {
      document.body.classList.remove('small-font', 'large-font');
      if (currentFontSize === 0) document.body.classList.add('small-font');
      if (currentFontSize === 2) document.body.classList.add('large-font');
      localStorage.setItem('fontSize', currentFontSize);
    }

    if (highContrastToggle) {
      const saved = localStorage.getItem('highContrast') === 'true';
      if (saved) document.body.classList.add('high-contrast');

      highContrastToggle.addEventListener('click', () => {
        document.body.classList.toggle('high-contrast');
        localStorage.setItem('highContrast',
          document.body.classList.contains('high-contrast'));
      });
    }

    fontSizeDecrease?.addEventListener('click', () => {
      if (currentFontSize > 0) { currentFontSize--; updateFontSize(); }
    });

    fontSizeReset?.addEventListener('click', () => {
      currentFontSize = 1; updateFontSize();
    });

    fontSizeIncrease?.addEventListener('click', () => {
      if (currentFontSize < 2) { currentFontSize++; updateFontSize(); }
    });

    updateFontSize();
  });
