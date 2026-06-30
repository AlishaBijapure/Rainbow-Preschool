document.addEventListener('DOMContentLoaded', () => {
    fetchCelebrations();
});

async function fetchCelebrations() {
    try {
        const res = await fetch('/api/celebrations');
        const celebrations = await res.json();
        const container = document.getElementById('allCelebrationsContainer');
        const noMsg = document.getElementById('noCelebrationsMsg');
        
        if (!celebrations || celebrations.length === 0) {
            container.style.display = 'none';
            noMsg.style.display = 'block';
            return;
        }

        container.style.display = 'flex';
        noMsg.style.display = 'none';
        
        container.innerHTML = '';
        
        const colors = [
            { bg: 'var(--bg-soft-blue)', title: 'var(--primary)' },
            { bg: 'rgba(255, 219, 79, 0.15)', title: 'var(--yellow)' },
            { bg: 'rgba(76, 175, 80, 0.15)', title: 'var(--green)' },
            { bg: 'rgba(157, 113, 232, 0.15)', title: 'var(--purple)' }
        ];

        celebrations.forEach((celeb, index) => {
            const dateObj = new Date(celeb.date);
            const month = dateObj.toLocaleString('default', { month: 'long' });
            const colorTheme = colors[index % colors.length];

            const block = document.createElement('div');
            block.style.background = colorTheme.bg;
            block.style.padding = '30px';
            block.style.borderRadius = 'var(--radius-lg)';
            block.style.textAlign = 'left';
            
            let photosHtml = '';
            if (celeb.photos && celeb.photos.length > 0) {
                photosHtml = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">';
                celeb.photos.forEach(photoUrl => {
                    photosHtml += `<img src="${photoUrl}" style="width: 100%; height: 200px; object-fit: cover; border-radius: var(--radius-sm);" alt="Photo">`;
                });
                photosHtml += '</div>';
            }

            block.innerHTML = `
                <h2 style="color: ${colorTheme.title};"><span class="material-symbols-rounded" style="vertical-align: middle;">event</span> ${celeb.name} (${month})</h2>
                <p style="color: var(--text-dark); margin-bottom: 20px;">${celeb.about}</p>
                ${photosHtml}
            `;
            
            container.appendChild(block);
        });
        
    } catch (err) {
        console.error('Error fetching celebrations:', err);
    }
}
