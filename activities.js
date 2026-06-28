document.addEventListener('DOMContentLoaded', () => {
    fetchActivities();
});

async function fetchActivities() {
    try {
        const response = await fetch('/api/activities');
        if (response.ok) {
            const activities = await response.json();
            const container = document.getElementById('allActivitiesContainer');
            const msg = document.getElementById('noActivitiesMsg');
            
            if (!activities || activities.length === 0) {
                msg.style.display = 'block';
                return;
            }
            
            let html = '';
            
            activities.forEach(activity => {
                const dateObj = new Date(activity.date);
                const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                
                let winnersHtml = '';
                activity.winners.forEach(winner => {
                    const photoSrc = winner.studentPhoto || 'assets/images/default-avatar.webp';
                    winnersHtml += `
                        <div class="winner-card" style="background: white; border-radius: 15px; padding: 15px; text-align: center; width: 160px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); transition: transform 0.3s ease;">
                            <div style="width: 80px; height: 80px; margin: 0 auto 10px; border-radius: 50%; overflow: hidden; border: 3px solid var(--purple);">
                                <img src="${photoSrc}" alt="${winner.studentName}" style="width: 100%; height: 100%; object-fit: cover;">
                            </div>
                            <h5 style="margin: 0; font-size: 1.1rem; color: var(--text-dark);">${winner.studentName}</h5>
                            <span class="badge" style="background: var(--yellow); color: #fff; margin-top: 5px; display: inline-block;">${winner.place}</span>
                        </div>
                    `;
                });
                
                html += `
                    <div class="activity-section" style="background: var(--bg-light); border-radius: 20px; padding: 30px; text-align: left;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid rgba(157, 113, 232, 0.2); padding-bottom: 15px; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                            <h2 style="margin: 0; color: var(--text-dark);">${activity.activityName}</h2>
                            <span class="badge" style="background: var(--purple); color: white; font-size: 1rem; padding: 8px 20px; border-radius: 20px;">${dateStr}</span>
                        </div>
                        <div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: flex-start;">
                            ${winnersHtml}
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
        }
    } catch (error) {
        console.error('Error fetching activities:', error);
    }
}
