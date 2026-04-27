document.addEventListener('DOMContentLoaded', () => {
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
