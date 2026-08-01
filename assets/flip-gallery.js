document.addEventListener("DOMContentLoaded", () => {
    const container = document.querySelector('.flip-gallery-container');
    if (!container) return;

    const tiltWrapper = document.querySelector('.flip-tilt-wrapper');
    const textContainer = document.getElementById('brand-text-container');
    if (!textContainer) return;

    const brands = [
        { name: "SENTRY", color: "54, 45, 89" },
        { name: "GITLAB", color: "252, 109, 38" },
        { name: "ALCHEMY", color: "69, 104, 220" },
        { name: "LOOM", color: "98, 77, 254" },
        { name: "LINEAR SEARCH", color: "88, 133, 255" },
        { name: "ZENDESK", color: "3, 54, 61" }
    ];

    let currentIndex = 0;
    const interval = 3000;
    let isAnimating = false;
    let timer = null;

    const animateLetters = async (newBrand) => {
        isAnimating = true;

        // 1. Exit current letters
        const currentLetters = Array.from(textContainer.children);
        if (currentLetters.length > 0) {
            const exitPromises = currentLetters.map((letter, i) => {
                return letter.animate([
                    { transform: 'rotateX(0deg) translateY(0)', opacity: 1, filter: 'blur(0px)' },
                    { transform: 'rotateX(-90deg) translateY(-20px)', opacity: 0, filter: 'blur(8px)' }
                ], {
                    duration: 400,
                    delay: i * 50,
                    easing: 'ease-in',
                    fill: 'forwards'
                }).finished;
            });
            await Promise.all(exitPromises);
            textContainer.innerHTML = '';
        }

        // 2. Enter new letters
        const brandName = newBrand.name;
        // Keep the chanel-style tinted text shadow
        const textShadow = `0 4px 15px rgba(0,0,0,0.4), 0 0 40px rgba(${newBrand.color}, 0.3)`;
        
        const enterPromises = brandName.split('').map((char, i) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char; // Non-breaking space
            span.className = 'anim-letter';
            span.style.textShadow = textShadow;
            textContainer.appendChild(span);

            return span.animate([
                { transform: 'rotateX(90deg) translateY(20px)', opacity: 0, filter: 'blur(8px)' },
                { transform: 'rotateX(0deg) translateY(0)', opacity: 1, filter: 'blur(0px)' }
            ], {
                duration: 600,
                delay: i * 100,
                easing: 'cubic-bezier(0.2, 0.65, 0.3, 0.9)',
                fill: 'forwards'
            }).finished;
        });

        await Promise.all(enterPromises);
        isAnimating = false;
    };

    const nextBrand = () => {
        if (isAnimating) return;
        currentIndex = (currentIndex + 1) % brands.length;
        animateLetters(brands[currentIndex]);
    };

    // Initial render
    animateLetters(brands[0]);

    // Loop
    timer = setInterval(nextBrand, interval);

    // Keep the hover tilt effect for the card!
    const tiltLimit = 15;
    const scale = 1.05;

    container.addEventListener('mousemove', (e) => {
        const rect = tiltWrapper.getBoundingClientRect();
        const mult = -1; // -1 for repel
        const tiltX = ((e.clientY - rect.top) / rect.height - 0.5) * (tiltLimit * 2) * mult;
        const tiltY = ((e.clientX - rect.left) / rect.width - 0.5) * -(tiltLimit * 2) * mult;
        
        tiltWrapper.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(${scale}, ${scale}, ${scale})`;
    });

    container.addEventListener('mouseleave', () => {
        tiltWrapper.style.transform = `rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    });
});
