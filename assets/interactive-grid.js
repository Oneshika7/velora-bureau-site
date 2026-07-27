document.addEventListener("DOMContentLoaded", () => {
    const gridEl = document.querySelector('.ag-grid');
    if(!gridEl) return;
    
    const cols = 7;
    const rows = 3;
    const count = cols * rows;
    
    // Default logos from the React component
    const images = [
      "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/9928789f-3ad5-4a72-9e61-b4212d90a900/w=800",
      "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/c6c3f0fd-de9d-4e38-e9de-42bb144c8b00/w=800",
      "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/6f4d7205-55dc-4fc6-8aea-261b91959300/w=800",
      "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/58cc03e2-9cf5-4c6a-e0ec-e71110579700/w=800",
      "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/96893eb2-f5ca-4aa1-e59e-474847bb4e00/w=800",
      "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/2bda84c8-1c36-4cac-cf2f-a12218d3ff00/w=800",
      "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/242516d3-ee0f-414a-8482-3bd38a4b6100/w=800",
      "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/80b1db5f-878b-4752-f8e0-159d308fb800/w=800",
      "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/b17683f8-25ff-4259-614c-343bb8793a00/w=800",
      "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/64475cf9-5072-4a75-c391-3e0627794c00/w=800"
    ];
    
    gridEl.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    gridEl.style.gridTemplateRows = `repeat(${rows}, minmax(0, 1fr))`;
    
    const cards = [];
    
    for(let i=0; i<count; i++) {
        const card = document.createElement('div');
        card.className = 'ag-card';
        card.style.zIndex = i + 1;
        
        const img = document.createElement('img');
        img.src = images[i % images.length];
        
        card.appendChild(img);
        gridEl.appendChild(card);
        cards.push(card);
        
        card.addEventListener('pointerenter', () => {
            setHovered(i);
        });
    }
    
    let leaveTimer = null;
    
    gridEl.parentElement.addEventListener('pointerleave', () => {
        if(leaveTimer) clearTimeout(leaveTimer);
        leaveTimer = setTimeout(() => {
            setHovered(null);
        }, 200);
    });
    
    function setHovered(index) {
        if(leaveTimer) {
            clearTimeout(leaveTimer);
            leaveTimer = null;
        }
        
        cards.forEach((card, i) => {
            card.classList.remove('ag-big', 'ag-small', 'ag-glow-big', 'ag-glow-small');
            card.style.zIndex = i + 1;
        });
        
        if (index === null) return;
        
        const neighbours = [];
        if (index % cols !== 0) neighbours.push(index - 1);
        if (index % cols !== cols - 1) neighbours.push(index + 1);
        neighbours.push(index - cols);
        neighbours.push(index + cols);
        
        const validNeighbours = neighbours.filter(n => n >= 0 && n < count);
        
        cards[index].classList.add('ag-big', 'ag-glow-big');
        cards[index].style.zIndex = count + 1;
        
        validNeighbours.forEach(n => {
            cards[n].classList.add('ag-small', 'ag-glow-small');
            cards[n].style.zIndex = count;
        });
    }
});
