document.addEventListener('DOMContentLoaded', () => {
    fetchRecentActivity();
    fetchLatestCelebration();
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
                            <div class="winner-card" style="background: transparent; border-radius: 0; padding: 15px; text-align: center; min-width: 280px; max-width: 100%; display: inline-block; box-sizing: border-box; box-shadow: none; transition: transform 0.3s ease;">
                                <div style="position: relative; width: 250px; height: 250px; margin: 0 auto 20px; border-radius: 28px; overflow: hidden; border: 6px solid #FFD166; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);">
                                    <img src="${photoSrc}" alt="${winner.studentName}" style="width: 100%; height: 100%; object-fit: cover;">
                                </div>
                                <div style="margin-bottom: 12px;">
                                    <h5 class="activity-winner-name">${escapeHtml(winner.studentName)}</h5>
                                </div>
                                <div>
                                    <span class="badge" style="background: var(--yellow); color: var(--text-dark); font-weight: 800; padding: 8px 18px; font-size: 1.1rem; border-radius: 25px; box-shadow: 0 4px 15px rgba(255, 209, 102, 0.5);"><span class="material-symbols-rounded" style="font-size: 1.3rem; vertical-align: middle; margin-right: 5px;">emoji_events</span>${escapeHtml(winner.place)}</span>
                                </div>
                            </div>
                        `;
                    });

                    container.innerHTML += `
                        <div id="activity-${activity._id}" style="background: linear-gradient(rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.12)), url('assets/images/activitybg.webp') center/cover no-repeat fixed; border-radius: 30px; padding: 50px 40px; text-align: center; box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15); position: relative; overflow: hidden; color: white; margin-bottom: 30px;">
                            <!-- Decorative elements -->
                            <div style="position: absolute; top: -50px; left: -50px; width: 200px; height: 200px; background: rgba(255, 255, 255, 0.1); border-radius: 50%; z-index: 0;"></div>
                            <div style="position: absolute; bottom: -80px; right: -80px; width: 250px; height: 250px; background: rgba(255, 255, 255, 0.1); border-radius: 50%; z-index: 0;"></div>
                            
                            <div style="position: relative; z-index: 1;">
                                <div style="position: absolute; top: 0; right: 0;">
                                    <span style="background: rgba(15, 23, 42, 0.85); color: #FFFFFF; font-size: 0.95rem; padding: 8px 18px; border-radius: 20px; font-weight: 700; border: 1.5px solid rgba(255, 255, 255, 0.2);">${dateStr}</span>
                                </div>
                                
                                <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 35px; margin-top: 10px; gap: 15px;">
                                    <h4 class="activity-title-box">${escapeHtml(activity.activityName)}</h4>
                                     <p class="activity-congrats-text"><span class="material-symbols-rounded" style="color: #FFD166; vertical-align: middle; margin-right: 8px; font-size: 1.5rem; text-shadow: none;">celebration</span>Congratulations to our amazing stars!</p>
                                </div>
                                <div class="winners-grid" style="display: flex; gap: 40px; justify-content: center; flex-wrap: wrap; margin-top: 10px;">
                                    ${winnersHtml}
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                section.style.display = 'block';

                // Handle anchor links (since content is loaded asynchronously)
                if (window.location.hash) {
                    const targetElement = document.querySelector(window.location.hash);
                    if (targetElement) {
                        setTimeout(() => {
                            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 200); // Slight delay to ensure paint
                    }
                }
            }
        }
    } catch (err) {
        console.error('Error fetching recent activities:', err);
    }
}

async function fetchLatestCelebration() {
    try {
        const res = await fetch('/api/celebrations/latest');
        const section = document.getElementById('celebrations');
        
        if (!res.ok) {
            if (section) section.style.display = 'none';
            return;
        }
        
        const celeb = await res.json();
        
        const titleEl = document.getElementById('celebTitle');
        const descEl = document.getElementById('celebDesc');
        const carousel = document.getElementById('celebCarousel');
        
        if (titleEl) titleEl.innerHTML = `<span class="material-symbols-rounded icon-mini text-pink">favorite</span> ${celeb.name}`;
        if (descEl) descEl.textContent = celeb.about;
        
        if (carousel && celeb.photos && celeb.photos.length > 0) {
            carousel.innerHTML = '';
            celeb.photos.forEach((photoUrl, index) => {
                const img = document.createElement('img');
                img.src = photoUrl;
                img.alt = `${celeb.name} photo ${index + 1}`;
                img.loading = 'lazy';
                carousel.appendChild(img);
            });
            
            // Dispatch events after rendering to recalculate carousel scroll state and show arrows
            setTimeout(() => {
                carousel.dispatchEvent(new Event('scroll'));
                window.dispatchEvent(new Event('resize'));
            }, 300);
        }
        if (section) {
            section.style.display = 'block';
            initCelebScrollIndicators();
        }
    } catch (err) {
        console.error('Error fetching latest celebration:', err);
        const section = document.getElementById('celebrations');
        if (section) section.style.display = 'none';
    }
}

function initCelebScrollIndicators() {
    const desc = document.getElementById('celebDesc');
    const upArrow = document.getElementById('celebScrollUp');
    const downArrow = document.getElementById('celebScrollDown');
    
    if (!desc || !upArrow || !downArrow) return;
    
    function checkScroll() {
        const canScroll = desc.scrollHeight > desc.clientHeight;
        if (!canScroll) {
            upArrow.style.display = 'none';
            downArrow.style.display = 'none';
            return;
        }
        
        // Show up arrow if we have scrolled down a bit
        if (desc.scrollTop > 10) {
            upArrow.style.display = 'flex';
        } else {
            upArrow.style.display = 'none';
        }
        
        // Show down arrow if we are not at the bottom
        const isAtBottom = Math.ceil(desc.scrollTop + desc.clientHeight) >= desc.scrollHeight - 5;
        if (!isAtBottom) {
            downArrow.style.display = 'flex';
        } else {
            downArrow.style.display = 'none';
        }
    }
    
    desc.addEventListener('scroll', checkScroll);
    
    // Check when DOM reflows or container sizes change
    if (window.ResizeObserver) {
        new ResizeObserver(checkScroll).observe(desc);
    }
    window.addEventListener('resize', checkScroll);
    
    // Initial check
    setTimeout(checkScroll, 300);
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
