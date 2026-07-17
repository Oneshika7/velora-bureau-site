(() => {
  const gallery = document.querySelector('#gallery-section');
  const openButtons = document.querySelectorAll('[data-gallery-open]');
  const navigationLinks = document.querySelectorAll(
    '.home-nav-link:not([data-gallery-open]), .home-command:not([data-gallery-open]), .contact-btn'
  );

  if (!gallery) return;

  const setOpen = (open, updateHash = false) => {
    gallery.classList.toggle('gallery-open', open);
    gallery.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('gallery-is-open', open);

    if (open) {
      window.requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
      });
    }

    if (!updateHash) return;

    if (open) {
      window.history.pushState(null, '', '#gallery');
    } else {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
  };

  openButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      setOpen(!gallery.classList.contains('gallery-open'), true);
    });
  });

  navigationLinks.forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  window.addEventListener('hashchange', () => {
    setOpen(window.location.hash === '#gallery');
  });

  setOpen(window.location.hash === '#gallery');
})();
