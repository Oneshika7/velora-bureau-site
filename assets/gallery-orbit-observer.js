(() => {
  const NativeIntersectionObserver = window.IntersectionObserver;
  if (!NativeIntersectionObserver) return;

  // The orbit bundle normally waits for a scrolling gallery section to intersect.
  // Gallery is now an overlay, so start that one observer as soon as it is registered.
  function GalleryIntersectionObserver(callback, options) {
    const observer = new NativeIntersectionObserver(callback, options);
    const nativeObserve = observer.observe.bind(observer);

    observer.observe = (target) => {
      nativeObserve(target);

      if (target?.id !== 'gallery-section') return;

      window.setTimeout(() => {
        callback([{ isIntersecting: true, target }], observer);
        window.IntersectionObserver = NativeIntersectionObserver;
      }, 0);
    };

    return observer;
  }

  GalleryIntersectionObserver.prototype = NativeIntersectionObserver.prototype;
  window.IntersectionObserver = GalleryIntersectionObserver;
})();
