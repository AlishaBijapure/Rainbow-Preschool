document.addEventListener('DOMContentLoaded', () => {
    fetchRecentActivity();
    // Current Year for Footer
    document.getElementById('year').textContent = new Date().getFullYear();

    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.getElementById('nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            // Toggle icon
            const icon = menuToggle.querySelector('.material-symbols-rounded');
            if (navLinks.classList.contains('active')) {
                icon.textContent = 'close';
            } else {
                icon.textContent = 'menu';
            }
        });
    }

    // Smooth Scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            navLinks.classList.remove('active'); // Close mobile menu if open
            if(menuToggle) {
                const icon = menuToggle.querySelector('.material-symbols-rounded');
                if(icon) icon.textContent = 'menu';
            }

            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                const headerOffset = 80; // Adjust for sticky header
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // Simple sticky header effect (add shadow on scroll)
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            header.classList.add('header-scrolled');
        } else {
            header.classList.remove('header-scrolled');
        }
    });

    // Simple Testimonial Slider logic (if multiple testimonials added)
    // For now we just have one, but this structure allows for rotation.
    const testimonials = [
        {
            text: `"Rainbow Preschool is the best decision we made for our daughter. She loves her teachers, and we love the secure environment."`,
            author: "- Sarah M. (Nursery)"
        },
        {
            text: `"The progress my son has made in just 6 months is amazing. The play-way method really works wonders!"`,
            author: "- Rahul K. (LKG)"
        },
        {
            text: `"Wonderful staff, excellent hygiene, and my child comes home smiling every day. Highly recommended."`,
            author: "- Priya D. (Playgroup)"
        }
    ];

    let currentTestimonial = 0;
    const quoteEl = document.querySelector('.testimonial-content .quote');
    const authorEl = document.querySelector('.testimonial-content .parent-name');

    if (quoteEl && authorEl) {
        setInterval(() => {
            currentTestimonial = (currentTestimonial + 1) % testimonials.length;
            
            // Fade out
            quoteEl.style.opacity = '0';
            authorEl.style.opacity = '0';
            
            setTimeout(() => {
                quoteEl.textContent = testimonials[currentTestimonial].text;
                authorEl.textContent = testimonials[currentTestimonial].author;
                
                // Fade in
                quoteEl.style.transition = 'opacity 0.5s';
                authorEl.style.transition = 'opacity 0.5s';
                quoteEl.style.opacity = '1';
                authorEl.style.opacity = '1';
            }, 500); // Wait for fade out
            
        }, 5000); // Change every 5 seconds
    }

    // Inquiry Form Submission Logic
    const inquiryForm = document.getElementById('inquiry-form');
    if (inquiryForm) {
        inquiryForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = inquiryForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            const payload = {
                parentName: document.getElementById('parentName').value.trim(),
                childAge: Number(document.getElementById('childAge').value),
                phone: document.getElementById('phone').value.trim()
            };

            try {
                const response = await fetch('/api/enquiries', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || 'Failed to send inquiry');
                }

                alert('Thank you! Your inquiry has been sent successfully. We will get back to you soon.');
                inquiryForm.reset();
            } catch (error) {
                console.error(error);
                alert(`Oops! There was a problem sending your inquiry: ${error.message}\nPlease try again or call us directly.`);
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});

// Fetch recent activity for the homepage
async function fetchRecentActivity() {
    try {
        const response = await fetch('/api/activities/featured');
        if (response.ok) {
            const activities = await response.json();
            const section = document.getElementById('recent-activity-section');
            const container = document.getElementById('featuredActivitiesContainer');
            
            if (activities && activities.length > 0 && section && container) {
                container.innerHTML = ''; // Clear container

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

                    container.innerHTML += `
                        <div style="background: rgba(157, 113, 232, 0.05); border-radius: 20px; padding: 20px; text-align: left;">
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid rgba(157, 113, 232, 0.2); padding-bottom: 10px; margin-bottom: 20px;">
                                <h4 style="margin: 0; font-weight: 700; color: var(--text-dark);">${escapeHtml(activity.activityName)}</h4>
                                <span class="badge" style="background: rgba(157, 113, 232, 0.1); color: var(--purple); font-size: 0.9rem; padding: 5px 15px; border-radius: 20px;">${dateStr}</span>
                            </div>
                            <div class="winners-grid" style="display: flex; gap: 20px; justify-content: flex-start; flex-wrap: wrap;">
                                ${winnersHtml}
                            </div>
                        </div>
                    `;
                });
                
                section.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error fetching recent activity:', error);
    }
}

// Utility to escape HTML and prevent XSS
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
