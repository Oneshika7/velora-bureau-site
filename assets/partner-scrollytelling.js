/**
 * Velora Bureau - Partner 30-Frame Canvas Scrollytelling Engine
 * Preloads 30 HD frames and scrubs seamlessly as the user scrolls through the section.
 */
document.addEventListener('DOMContentLoaded', () => {
  const section = document.getElementById('partners-section');
  const canvas = document.getElementById('partner-canvas');
  if (!section || !canvas) return;

  const ctx = canvas.getContext('2d');
  const frameIndicator = document.getElementById('partner-frame-num');
  const textCards = document.querySelectorAll('.partner-text-card');

  const TOTAL_FRAMES = 30;
  const frames = [];
  let loadedCount = 0;
  let currentFrameIndex = 0;
  let isTicking = false;

  // Format integer to 3-digit string e.g. 1 -> "001"
  function pad(num, size) {
    let s = num + '';
    while (s.length < size) s = '0' + s;
    return s;
  }

  // Preload all 30 frames
  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const img = new Image();
    const frameNumberStr = pad(i, 3);
    img.src = `/assets/partner-frames/frame_${frameNumberStr}.png`;
    img.onload = () => {
      loadedCount++;
      if (i === 1) {
        renderFrame(0);
      }
    };
    frames.push(img);
  }

  // Resize canvas resolution to fit container crispness
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    renderFrame(currentFrameIndex);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Render a specific frame index to canvas with cover fitting
  function renderFrame(index) {
    if (!frames[index] || !frames[index].complete) return;

    const img = frames[index];
    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;

    if (!iw || !ih) return;

    // Cover math
    const imgRatio = iw / ih;
    const canvasRatio = cw / ch;
    let renderW, renderH, offsetX, offsetY;

    if (canvasRatio > imgRatio) {
      renderW = cw;
      renderH = cw / imgRatio;
      offsetX = 0;
      offsetY = (ch - renderH) / 2;
    } else {
      renderH = ch;
      renderW = ch * imgRatio;
      offsetX = (cw - renderW) / 2;
      offsetY = 0;
    }

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
  }

  // Calculate scroll position inside the section
  function updateScroll() {
    const rect = section.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Total distance over which scrubbing happens
    const totalScrollable = rect.height - windowHeight;

    if (totalScrollable <= 0) return;

    // Distance scrolled from top of section entering top of screen
    const scrolled = -rect.top;

    // Progress clamped 0.0 to 1.0
    let progress = scrolled / totalScrollable;
    progress = Math.max(0, Math.min(1, progress));

    // Map progress to frame index 0 .. 29
    const frameIndex = Math.floor(progress * (TOTAL_FRAMES - 1));

    if (frameIndex !== currentFrameIndex) {
      currentFrameIndex = frameIndex;
      renderFrame(currentFrameIndex);

      // Update frame indicator text (1-indexed)
      if (frameIndicator) {
        frameIndicator.textContent = pad(currentFrameIndex + 1, 2);
      }

      // Update text card visibility based on data-start-frame and data-end-frame
      const currentFrameNum = currentFrameIndex + 1; // 1-indexed
      textCards.forEach((card) => {
        const start = parseInt(card.getAttribute('data-start-frame'), 10) || 1;
        const end = parseInt(card.getAttribute('data-end-frame'), 10) || TOTAL_FRAMES;

        if (currentFrameNum >= start && currentFrameNum <= end) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      });
    }

    isTicking = false;
  }

  window.addEventListener('scroll', () => {
    if (!isTicking) {
      requestAnimationFrame(updateScroll);
      isTicking = true;
    }
  });

  // Initial update
  updateScroll();
});
