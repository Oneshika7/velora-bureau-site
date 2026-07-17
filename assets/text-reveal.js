function initTextReveal() {
  console.log('[Text Reveal] Initializing Smooth Scatter-Gather with Lerp Scroll...');
  
  const headingElements = document.querySelectorAll(
    '.scroll-reveal-text, .home-section h2:not(.slide-title)'
  );
  
  const paragraphElements = document.querySelectorAll(
    '.home-intro p, .discipline-item p, .section-heading--split > p, .process-list p, .fit-copy p, .discipline-item h3, .process-list h3'
  );

  // 1. Process character-level reveal for headings
  headingElements.forEach(element => {
    if (element.querySelectorAll('.reveal-char').length > 0) return;
    
    const text = element.textContent.trim();
    element.innerHTML = '';
    element.style.perspective = '1000px';
    element.style.display = 'inline-block';
    element.style.width = '100%';

    const words = text.split(' ');
    let globalCharIndex = 0;
    const totalChars = text.replace(/ /g, '').length;
    const centerIndex = Math.floor(totalChars / 2);

    words.forEach((word, wordIdx) => {
      const wordSpan = document.createElement('span');
      wordSpan.style.display = 'inline-block';
      wordSpan.style.whiteSpace = 'nowrap'; // Keeps word characters glued together
      
      const chars = word.split('');
      chars.forEach(char => {
        const span = document.createElement('span');
        span.className = 'reveal-char';
        span.textContent = char;
        span.style.display = 'inline-block';
        span.style.transformOrigin = 'center';
        span.style.setProperty('--char-index', globalCharIndex);
        span.style.setProperty('--center-dist', globalCharIndex - centerIndex);
        wordSpan.appendChild(span);
        globalCharIndex++;
      });
      
      element.appendChild(wordSpan);
      
      if (wordIdx < words.length - 1) {
        const spaceSpan = document.createElement('span');
        spaceSpan.className = 'reveal-char reveal-space';
        spaceSpan.innerHTML = '&nbsp;';
        spaceSpan.style.display = 'inline-block';
        element.appendChild(spaceSpan);
      }
    });
  });

  // 2. Process word-level reveal for paragraphs
  paragraphElements.forEach(element => {
    if (element.querySelectorAll('.reveal-word').length > 0) return;
    
    const text = element.textContent.trim();
    const words = text.split(/\s+/);
    element.innerHTML = '';

    words.forEach((word, index) => {
      const span = document.createElement('span');
      span.className = 'reveal-word';
      span.textContent = word + ' ';
      span.style.setProperty('--word-index', index);
      element.appendChild(span);
    });
  });

  const introSection = document.querySelector('#home-content');
  const video3d = document.querySelector('.video-3d-element');
  const introContent = document.querySelector('.home-intro');

  // LERP Scroll variables
  let targetScrollY = window.scrollY;
  let currentScrollY = window.scrollY;
  const lerpFactor = 0.08;

  // Track page scroll targets
  window.addEventListener('scroll', () => {
    targetScrollY = window.scrollY;
  }, { passive: true });

  // Main video mouse tilt variables
  let targetRotX = 0;
  let targetRotY = 0;
  let currentRotX = 0;
  let currentRotY = 0;

  // Footer video mouse tilt variables
  let footerTargetRotX = 0;
  let footerTargetRotY = 0;
  let footerCurrentRotX = 0;
  let footerCurrentRotY = 0;

  // Hover image reveal tracking variables
  let hoverTargetX = 0;
  let hoverTargetY = 0;
  let hoverCurrentX = 0;
  let hoverCurrentY = 0;

  const updateAnimations = () => {
    // Lerp the scroll value
    currentScrollY += (targetScrollY - currentScrollY) * lerpFactor;
    
    const viewportHeight = window.innerHeight;
    const triggerHeight = viewportHeight * 0.95;

    // Animate Characters in Headings (Scatter-Gather)
    headingElements.forEach(element => {
      // Calculate position relative to document
      const docTop = element.getBoundingClientRect().top + window.scrollY;
      // Calculate relative top in smooth scroll coordinates
      const smoothTop = docTop - currentScrollY;
      
      const progress = Math.max(0, Math.min(1, (triggerHeight - smoothTop) / (viewportHeight * 0.45)));

      const chars = element.querySelectorAll('.reveal-char:not(.reveal-space)');
      chars.forEach(char => {
        const dist = parseFloat(char.style.getPropertyValue('--center-dist'));
        const ease = 1 - Math.pow(1 - progress, 3); // Cubic Ease Out
        const factor = 1 - ease;
        
        const xOffset = factor * dist * 14; 
        const rotateXVal = factor * dist * 10; 
        const opacity = 0.25 + (ease * 0.75);

        char.style.transform = `translateX(${xOffset}px) rotateX(${rotateXVal}deg) translateZ(${factor * -50}px)`;
        char.style.opacity = opacity;
      });
    });

    // Animate Words in Paragraphs
    paragraphElements.forEach(element => {
      const docTop = element.getBoundingClientRect().top + window.scrollY;
      const smoothTop = docTop - currentScrollY;
      
      const progress = Math.max(0, Math.min(1, (triggerHeight - smoothTop) / (viewportHeight * 0.4)));

      const words = element.querySelectorAll('.reveal-word');
      const totalWords = words.length;

      words.forEach((word, index) => {
        const threshold = index / totalWords;
        if (progress > threshold) {
          const wordProgress = Math.min(1, (progress - threshold) * totalWords * 1.8);
          word.style.opacity = 0.25 + (wordProgress * 0.75);
          word.style.transform = `translateY(${6 * (1 - wordProgress)}px)`;
        } else {
          word.style.opacity = 0.25;
          word.style.transform = `translateY(6px)`;
        }
      });
    });

    // 3D Video Parallax
    if (introSection && video3d) {
      const rect = introSection.getBoundingClientRect();
      const docTop = rect.top + window.scrollY;
      const smoothTop = docTop - currentScrollY;
      
      if (smoothTop < viewportHeight && (smoothTop + rect.height) > 0) {
        const scrollPercent = Math.max(0, Math.min(1, (viewportHeight - smoothTop) / (viewportHeight + rect.height)));
        const zoomZ = scrollPercent * 300;
        
        if (introContent) {
          // Subtle parallax vertical shift for content inside the home container
          const textY = (scrollPercent - 0.5) * -50;
          introContent.style.transform = `translateY(${textY}px)`;
        }
        
        video3d.style.transform = `translateZ(${zoomZ}px) rotateX(${currentRotX}deg) rotateY(${currentRotY}deg)`;
      }
    }

    // 3D Footer Video Parallax (Z-Axis Zoom)
    const footerSection = document.querySelector('#footer-section');
    const footerVideo3d = document.querySelector('.footer-video-element');
    if (footerSection && footerVideo3d) {
      const rect = footerSection.getBoundingClientRect();
      const docTop = rect.top + window.scrollY;
      const smoothTop = docTop - currentScrollY;
      
      if (smoothTop < viewportHeight && (smoothTop + rect.height) > 0) {
        const scrollPercent = Math.max(0, Math.min(1, (viewportHeight - smoothTop) / (viewportHeight + rect.height)));
        const zoomZ = scrollPercent * 250; // zoom up to 250px deep
        
        footerVideo3d.style.transform = `translateZ(${zoomZ}px) rotateX(${footerCurrentRotX}deg) rotateY(${footerCurrentRotY}deg)`;
      }
    }
  };

  // Main video mouse tilt
  if (introSection) {
    introSection.addEventListener('mousemove', (e) => {
      const rect = introSection.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotX = y * -12;
      targetRotY = x * 12;
    });

    introSection.addEventListener('mouseleave', () => {
      targetRotX = 0;
      targetRotY = 0;
    });
  }

  // Footer video mouse tilt
  const footerSectionEl = document.querySelector('#footer-section');

  if (footerSectionEl) {
    footerSectionEl.addEventListener('mousemove', (e) => {
      const rect = footerSectionEl.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      footerTargetRotX = y * -15; // slightly higher rotation sensitivity for dramatic footer look
      footerTargetRotY = x * 15;
    });

    footerSectionEl.addEventListener('mouseleave', () => {
      footerTargetRotX = 0;
      footerTargetRotY = 0;
    });
  }

  // Fade out footer video on end
  const footerVideo = document.querySelector('.footer-video-element');
  const footerVideoWrap = document.querySelector('.footer-video-wrap');
  if (footerVideo && footerVideoWrap) {
    footerVideo.addEventListener('ended', () => {
      console.log('[Text Reveal] Footer video ended. Fading out...');
      footerVideoWrap.classList.add('video-ended');
    });
  }

  // Initialize Hover Image Reveal
  const hoverContainer = document.querySelector('#hover-reveal-container');
  const hoverImageBox = document.querySelector('#hover-reveal-image-box');
  const hoverSlidesWrapper = document.querySelector('#hover-reveal-slides-wrapper');
  const revealItems = document.querySelectorAll('.reveal-item');

  if (hoverContainer && hoverImageBox) {
    console.log('[Text Reveal] Initializing Hover Image Reveal...');
    
    hoverContainer.addEventListener('mousemove', (e) => {
      const rect = hoverContainer.getBoundingClientRect();
      // Mouse coordinates relative to the hover container
      hoverTargetX = e.clientX - rect.left;
      hoverTargetY = e.clientY - rect.top;
    });

    hoverContainer.addEventListener('mouseenter', () => {
      // Show container on hover
    });

    hoverContainer.addEventListener('mouseleave', () => {
      hoverImageBox.classList.remove('active');
    });

    revealItems.forEach(item => {
      item.addEventListener('mouseenter', () => {
        const index = parseInt(item.getAttribute('data-index'), 10);
        // Translate slides vertically to match the index
        if (hoverSlidesWrapper) {
          hoverSlidesWrapper.style.transform = `translateY(-${index * 100}%)`;
        }
        hoverImageBox.classList.add('active');
      });
    });
  }

  const tick = () => {
    currentRotX += (targetRotX - currentRotX) * 0.1;
    currentRotY += (targetRotY - currentRotY) * 0.1;
    
    footerCurrentRotX += (footerTargetRotX - footerCurrentRotX) * 0.1;
    footerCurrentRotY += (footerTargetRotY - footerCurrentRotY) * 0.1;

    // Smooth hover image reveal follower tracking (stiffness/inertia)
    if (hoverContainer && hoverImageBox) {
      hoverCurrentX += (hoverTargetX - hoverCurrentX) * 0.15; // spring trail factor
      hoverCurrentY += (hoverTargetY - hoverCurrentY) * 0.15;
      hoverImageBox.style.left = `${hoverCurrentX}px`;
      hoverImageBox.style.top = `${hoverCurrentY}px`;
    }

    updateAnimations();
    requestAnimationFrame(tick);
  };
  tick();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initTextReveal();
    setTimeout(initTextReveal, 500);
  });
} else {
  initTextReveal();
  setTimeout(initTextReveal, 500);
}

window.addEventListener('load', () => {
  initTextReveal();
});
