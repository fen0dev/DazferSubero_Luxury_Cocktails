// Neumorphic image animations - subtle depth transitions
document.addEventListener('DOMContentLoaded', function() {
    const imageFrames = document.querySelectorAll('.image-frame, .gallery-item img, .service-image img, .about-image img, .cocktail-image-placeholder img');
    
    // Create Intersection Observer for scroll-triggered animations
    const observerOptions = {
        root: null,
        rootMargin: '50px', // Trigger slightly before entering viewport
        threshold: 0.1
    };
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting && !entry.target.classList.contains('revealed')) {
                // Calculate delay based on visible position
                const rect = entry.target.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const elementTop = rect.top;
                
                // Stagger based on vertical position
                const delay = Math.min((elementTop / viewportHeight) * 200, 400);
                
                setTimeout(() => {
                    entry.target.classList.add('revealed');
                }, delay);
            }
        });
    }, observerOptions);
    
    // Observe all image frames
    imageFrames.forEach((frame) => {
        imageObserver.observe(frame);
    });
    
    // Add subtle parallax depth effect on scroll
    let ticking = false;
    function updateParallax() {
        const scrolled = window.pageYOffset;
        
        imageFrames.forEach((frame) => {
            if (frame.classList.contains('revealed')) {
                const rect = frame.getBoundingClientRect();
                const speed = 0.5; // Subtle parallax speed
                const yPos = -(rect.top * speed) / 10;
                
                // Update shadow depth based on scroll position
                const shadowIntensity = Math.max(0.3, Math.min(0.5, (rect.top + rect.height) / window.innerHeight));
                const shadowBlur = 20 + (shadowIntensity * 10);
                
                frame.style.boxShadow = `
                    -10px -10px ${shadowBlur}px rgba(255, 255, 255, 0.05),
                    10px 10px ${shadowBlur}px rgba(0, 0, 0, ${shadowIntensity}),
                    inset 1px 1px 2px rgba(255, 255, 255, 0.1)
                `;
            }
        });
        
        ticking = false;
    }
    
    // Throttled scroll event for performance
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateParallax);
            ticking = true;
        }
    });
    
    // Dynamic observer for new images
    const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    const images = node.matches('img') ? [node] : node.querySelectorAll('img');
                    images.forEach((img) => {
                        if (img.closest('.image-frame, .gallery-item, .service-image, .about-image, .cocktail-image-placeholder')) {
                            imageObserver.observe(img);
                        }
                    });
                }
            });
        });
    });
    
    mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
});