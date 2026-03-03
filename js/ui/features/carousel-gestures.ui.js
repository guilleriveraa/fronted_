window.InitManager.register('CarouselGestures', function () {

    document.querySelectorAll('.carousel').forEach(carousel => {

      const track = carousel.querySelector('.carousel-track');
      if (!track) return;

      carousel.querySelector('.carousel-prev')?.addEventListener('click', () => {
        track.scrollBy({ left: -track.offsetWidth, behavior: 'smooth' });
      });

      carousel.querySelector('.carousel-next')?.addEventListener('click', () => {
        track.scrollBy({ left: track.offsetWidth, behavior: 'smooth' });
      });

    });

  });