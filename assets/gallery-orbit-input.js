(() => {
  const forwardedEvents = new WeakSet();

  window.addEventListener('wheel', (event) => {
    if (forwardedEvents.has(event)) return;

    const canvas = document.querySelector('#orbit-canvas');
    const gallery = document.querySelector('#gallery-section');
    if (!canvas || !gallery?.classList.contains('gallery-open')) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const forwardedEvent = new WheelEvent('wheel', {
      deltaMode: event.deltaMode,
      deltaX: event.deltaX,
      deltaY: event.deltaY,
      clientX: event.clientX,
      clientY: event.clientY,
      bubbles: false,
      cancelable: true,
    });

    forwardedEvents.add(forwardedEvent);
    canvas.dispatchEvent(forwardedEvent);
  }, { capture: true, passive: false });
})();
