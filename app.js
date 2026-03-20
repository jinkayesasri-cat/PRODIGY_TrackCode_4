document.addEventListener('DOMContentLoaded', () => {
    // Determine the API Base URL. 
    // If the user opens the file directly from their desktop (file:// protocol),
    // we hardcode the URL to point to the Python backend running on localhost:5000.
    const API_BASE_URL = window.location.protocol === 'file:' ? 'http://127.0.0.1:5000' : '';

    // === THEME TOGGLE (LIGHT/DARK MODE) ===
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = themeToggleBtn.querySelector('i');

    // Check local storage for theme, or user system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Default to dark unless light is saved or system prefers light and nothing is saved
    if (savedTheme === 'light' || (!savedTheme && !systemPrefersDark)) {
        document.documentElement.setAttribute('data-theme', 'light');
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    }

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'light') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'dark');
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    });

    // === SCROLL NAVBAR EFFECTS ===
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Active link switching on scroll
        const sections = document.querySelectorAll('section');
        const navLinks = document.querySelectorAll('.nav-link');

        let currentSection = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(currentSection)) {
                link.classList.add('active');
            }
        });
    });

    // === MOBILE MENU TOGGLE ===
    const menuBtn = document.querySelector('.menu-btn');
    const navLinksContainer = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-link');

    let menuOpen = false;

    menuBtn.addEventListener('click', () => {
        if (!menuOpen) {
            menuBtn.classList.add('open');
            navLinksContainer.classList.add('active');
            menuOpen = true;
        } else {
            menuBtn.classList.remove('open');
            navLinksContainer.classList.remove('active');
            menuOpen = false;
        }
    });

    // Close menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            menuBtn.classList.remove('open');
            navLinksContainer.classList.remove('active');
            menuOpen = false;
        });
    });

    // === FORM SUBMISSION ===
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Basic form effect
            const btn = contactForm.querySelector('.submit-btn');
            const originalText = btn.innerHTML;

            btn.innerHTML = 'Sending... <i class="fas fa-spinner fa-spin"></i>';
            btn.style.opacity = '0.7';

            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };

            try {
                const response = await fetch(API_BASE_URL + '/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    btn.innerHTML = 'Sent Successfully! <i class="fas fa-check"></i>';
                    btn.classList.add('btn-outline');
                    btn.classList.remove('btn-primary');
                    btn.style.opacity = '1';

                    contactForm.reset();

                    setTimeout(() => {
                        btn.innerHTML = originalText;
                        btn.classList.remove('btn-outline');
                        btn.classList.add('btn-primary');
                    }, 3000);
                } else {
                    throw new Error('Failed to send message');
                }
            } catch (error) {
                console.error('Error:', error);
                btn.innerHTML = 'Error Sending <i class="fas fa-times"></i>';
                btn.style.backgroundColor = '#ff6b6b';

                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.backgroundColor = '';
                    btn.style.opacity = '1';
                }, 3000);
            }
        });
    }

    // === LOAD PROJECTS FROM BACKEND ===
    const loadProjects = async () => {
        try {
            const response = await fetch(API_BASE_URL + '/api/projects');
            if (response.ok) {
                const projects = await response.json();
                const projectsGrid = document.querySelector('.projects-grid');
                if (projectsGrid && projects.length > 0) {
                    projectsGrid.innerHTML = ''; // Clear static projects
                    projects.forEach((project, index) => {
                        const techStackList = project.tech_stack.split(',').map(tech => `<li>${tech.trim()}</li>`).join('');
                        const card = `
                            <div class="project-card glass-card">
                                <div class="project-mockup ${project.image_class}">
                                    <div class="mockup-overlay">
                                        <a href="#" class="project-link" aria-label="View Project"><i class="fas fa-external-link-alt"></i></a>
                                        <a href="#" class="project-link" aria-label="GitHub Repo"><i class="fab fa-github"></i></a>
                                    </div>
                                </div>
                                <div class="project-info">
                                    <h4 class="project-type">${project.featured ? 'Featured Project' : 'Project'}</h4>
                                    <h3 class="project-title">${project.title}</h3>
                                    <p class="project-description">
                                        ${project.description}
                                    </p>
                                    <ul class="project-tech-list">
                                        ${techStackList}
                                    </ul>
                                </div>
                            </div>
                        `;
                        projectsGrid.innerHTML += card;
                    });

                    // Re-observe new elements for reveal animation
                    const newCards = projectsGrid.querySelectorAll('.glass-card');
                    newCards.forEach((el, index) => {
                        el.style.opacity = '0';
                        el.style.transform = 'translateY(30px)';
                        el.style.transition = `all 0.6s cubic-bezier(0.5, 0, 0, 1) ${index % 5 * 0.1}s`;
                        observer.observe(el);
                    });
                }
            }
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    };

    loadProjects();

    // === SIMPLE REVEAL ANIMATION (Intersection Observer) ===
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Apply init styles and observe elements
    const elementsToReveal = document.querySelectorAll('.section-heading, .glass-card, .timeline-item, .hero-content > *, .hero-visual');

    elementsToReveal.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `all 0.6s cubic-bezier(0.5, 0, 0, 1) ${index % 5 * 0.1}s`;
        observer.observe(el);
    });
});
