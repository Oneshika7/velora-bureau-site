document.addEventListener("DOMContentLoaded", () => {
    const track = document.querySelector('.marquee-track');
    if (!track) return;
    
    // Duplicate the content to create a seamless infinite scroll loop
    // By duplicating, the track becomes 200% wide, and translating to -50% shifts it exactly one cycle seamlessly.
    const originalContent = track.innerHTML;
    track.innerHTML = originalContent + originalContent;
});
