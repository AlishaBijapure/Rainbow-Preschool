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
                            <div class="winner-card" style="background: linear-gradient(145deg, #ffffff, #f0f0f0); border-radius: 20px; padding: 20px; text-align: center; width: 180px; box-shadow: 0 10px 20px rgba(0,0,0,0.05); transition: transform 0.3s ease, box-shadow 0.3s ease;">
                                <div style="position: relative; width: 90px; height: 90px; margin: 0 auto 15px; border-radius: 50%; overflow: hidden; border: 4px solid var(--purple); box-shadow: 0 5px 15px rgba(157, 113, 232, 0.3);">
                                    <img src="${photoSrc}" alt="${winner.studentName}" style="width: 100%; height: 100%; object-fit: cover;">
                                </div>
                                <h5 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--text-dark);">${escapeHtml(winner.studentName)}</h5>
                                <div style="margin-top: 10px;">
                                    <span class="badge" style="background: var(--yellow); color: var(--text-dark); font-weight: bold; padding: 6px 12px; font-size: 0.95rem; border-radius: 20px; box-shadow: 0 3px 10px rgba(255, 209, 102, 0.4);"><span class="material-symbols-rounded" style="font-size: 1.1rem; vertical-align: middle; margin-right: 4px;">emoji_events</span>${escapeHtml(winner.place)}</span>
                                </div>
                            </div>
                        `;
                    });

                    container.innerHTML += `
                        <div style="background: white; border-radius: 25px; padding: 30px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.05); position: relative; overflow: hidden;">
                            <!-- Decorative blob -->
                            <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: rgba(255, 209, 102, 0.2); border-radius: 50%; z-index: 0;"></div>
                            
                            <div style="position: relative; z-index: 1;">
                                <div style="display: inline-block; margin-bottom: 25px;">
                                    <span class="badge" style="background: rgba(157, 113, 232, 0.1); color: var(--purple); font-size: 0.95rem; padding: 8px 20px; border-radius: 25px; font-weight: 600;">${dateStr}</span>
                                    <h4 style="margin: 15px 0 5px; font-size: 1.8rem; font-weight: 800; color: var(--text-dark);">${escapeHtml(activity.activityName)}</h4>
                                    <p style="color: var(--text-light); font-size: 1.1rem; margin: 0;"><span class="material-symbols-rounded" style="color: var(--pink); vertical-align: middle; margin-right: 5px;">celebration</span><strong>Congratulations</strong> to our amazing stars!</p>
                                </div>
                                <div class="winners-grid" style="display: flex; gap: 30px; justify-content: center; flex-wrap: wrap; margin-top: 10px;">
                                    ${winnersHtml}
                                </div>
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
