/**
 * MAIN Handler for Index.html
 * Handles background circle gooey effect
 * Some section animations
 * Shaker animation at the beginning 
*/

// Global mobile detection function
function isMobile() {
    return window.innerWidth <= 768 || 
           'ontouchstart' in window || 
           navigator.maxTouchPoints > 0;
}

class LiquidMorphController {
    constructor() {
        this.container = document.getElementById('liquidMorphContainer');
        this.mainBlob = document.getElementById('mainBlob');
        this.currentBlob = null;
        this.birthBlob = null;
        this.dropConnector = null;
        this.scrollPosition = 0;
        this.lastScrollPosition = 0;
        this.sectionHeight = window.innerHeight;
        this.totalSections = 0;
        this.currentSide = 'left';
        this.isAnimating = false;
        this.currentSection = 0;
        
        // Animation properties
        this.currentProgress = 0;
        this.targetProgress = 0;
        this.lastProgress = 0;
        this.animationFrame = null;
        
        // Mobile specific
        this.isMobileDevice = this.checkMobile();
        this.isScrolling = false;
        this.scrollTimeout = null;
        this.lastTouchY = 0;
        this.velocity = 0;
        
        // Performance
        this.windowWidth = window.innerWidth;
        this.useSimpleAnimation = this.isMobileDevice;
        
        this.init();
    }
    
    checkMobile() {
        return window.innerWidth <= 768 || 
               'ontouchstart' in window || 
               navigator.maxTouchPoints > 0;
    }
    
    init() {
        // Count total sections (excluding hero)
        this.totalSections = document.querySelectorAll('section:not(.hero)').length;
        
        // Mobile-specific initialization
        this.blobSize = this.isMobileDevice ? 250 : 400;
        
        // Create initial state with will-change for performance
        this.mainBlob.style.opacity = '0.8';
        this.mainBlob.style.left = '0';
        this.mainBlob.style.top = this.isMobileDevice ? '20%' : '30%';
        this.mainBlob.style.transform = 'translate3d(0, -50%, 0)';
        this.mainBlob.style.willChange = 'transform';
        this.currentBlob = this.mainBlob;
        
        // Adjust blob size for mobile
        if (this.isMobileDevice) {
            this.mainBlob.style.width = this.blobSize + 'px';
            this.mainBlob.style.height = this.blobSize + 'px';
        }
        
        // Start with perfect circle
        const mainInner = this.mainBlob.querySelector('.liquid-blob-inner');
        if (mainInner) {
            mainInner.style.transform = 'scale(1)';
            mainInner.style.willChange = 'transform';
        }
        
        // Create birth blob element
        this.birthBlob = document.createElement('div');
        this.birthBlob.className = 'birth-blob';
        this.birthBlob.innerHTML = '<div class="birth-blob-inner"></div>';
        this.container.appendChild(this.birthBlob);
        
        // Create drop connector element
        this.dropConnector = document.createElement('div');
        this.dropConnector.className = 'drop-connector';
        this.dropConnector.innerHTML = '<div class="drop-connector-inner"></div>';
        this.container.appendChild(this.dropConnector);
        
        // Bind scroll handler after content is revealed
        this.bindScrollHandler = this.bindScrollHandler.bind(this);
    }
    
    bindScrollHandler() {
        // Mobile-optimized scroll handling
        if (this.isMobileDevice) {
            // Use touch events for better performance
            let touchStartY = 0;
            let lastTime = Date.now();
            
            document.addEventListener('touchstart', (e) => {
                touchStartY = e.touches[0].pageY;
                this.lastTouchY = touchStartY;
                lastTime = Date.now();
            }, { passive: true });
            
            document.addEventListener('touchmove', (e) => {
                const touchY = e.touches[0].pageY;
                const currentTime = Date.now();
                const timeDiff = currentTime - lastTime;
                
                if (timeDiff > 0) {
                    this.velocity = (this.lastTouchY - touchY) / timeDiff;
                }
                
                this.lastTouchY = touchY;
                lastTime = currentTime;
                
                // Update scroll position immediately
                this.handleScroll();
            }, { passive: true });
            
            document.addEventListener('touchend', () => {
                // Apply momentum
                this.velocity *= 0.95;
            }, { passive: true });
        }
        
        // Regular scroll event as fallback
        let scrollRAF = null;
        window.addEventListener('scroll', () => {
            if (scrollRAF) return;
            
            scrollRAF = requestAnimationFrame(() => {
                this.handleScroll();
                scrollRAF = null;
            });
        }, { passive: true });
        
        // Start animation loop
        this.startAnimationLoop();
        
        // Handle resize
        window.addEventListener('resize', () => {
            this.sectionHeight = window.innerHeight;
            this.windowWidth = window.innerWidth;
            this.isMobileDevice = this.checkMobile();
            this.useSimpleAnimation = this.isMobileDevice;
        });
    }
    
    startAnimationLoop() {
        const animate = () => {
            // Skip if not scrolling on mobile
            if (this.isMobileDevice && !this.isScrolling && Math.abs(this.velocity) < 0.01) {
                this.animationFrame = requestAnimationFrame(animate);
                return;
            }
            
            // Ultra smooth interpolation for mobile
            const diff = this.targetProgress - this.currentProgress;
            const smoothing = this.isMobileDevice ? 0.15 : 0.08;
            
            this.currentProgress += diff * smoothing;
            
            // Snap to target if very close
            if (Math.abs(diff) < 0.001) {
                this.currentProgress = this.targetProgress;
            }
            
            // Apply animation
            this.animateLiquidSeparation(this.currentProgress, this.currentSection);
            
            // Decay velocity
            if (this.isMobileDevice) {
                this.velocity *= 0.95;
            }
            
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        this.animationFrame = requestAnimationFrame(animate);
    }
    
    handleScroll() {
        this.scrollPosition = window.pageYOffset;
        this.isScrolling = true;
        
        // Clear existing timeout
        clearTimeout(this.scrollTimeout);
        
        // Set scrolling to false after scroll ends
        this.scrollTimeout = setTimeout(() => {
            this.isScrolling = false;
        }, 150);
        
        // Get actual content height excluding hero
        const heroHeight = document.querySelector('.hero').offsetHeight;
        const adjustedScrollPosition = Math.max(0, this.scrollPosition - heroHeight);
        
        // Calculate CONTINUOUS progress through ALL sections
        const contentSections = document.querySelectorAll('section:not(.hero)');
        const totalContentHeight = this.sectionHeight * contentSections.length;
        const totalProgress = adjustedScrollPosition / totalContentHeight;
        
        // Store both total and section progress
        this.targetProgress = Math.max(0, Math.min(1, totalProgress));
        this.currentSection = Math.floor(adjustedScrollPosition / this.sectionHeight);
        this.lastScrollPosition = this.scrollPosition;
    }
    
    animateLiquidSeparation(progress, section) {
        if (!this.currentBlob) return;
        
        const totalProgress = progress;
        const totalSections = this.totalSections;
        const progressPerSection = 1 / totalSections;
        const currentSectionProgress = totalProgress / progressPerSection;
        const currentFullSection = Math.floor(currentSectionProgress);
        const currentPartialProgress = currentSectionProgress - currentFullSection;
        
        // Adjust movement range for mobile
        const maxX = this.isMobileDevice ? 75 : 85;
        
        // Calculate X position with continuous zigzag
        let currentX;
        if (currentFullSection % 2 === 0) {
            currentX = 0 + (maxX * currentPartialProgress);
        } else {
            currentX = maxX - (maxX * currentPartialProgress);
        }
        
        currentX = Math.max(0, Math.min(maxX, currentX));
        
        // Use translate3d for hardware acceleration on mobile
        if (this.isMobileDevice) {
            this.currentBlob.style.transform = `translate3d(${currentX}vw, -50%, 0)`;
        } else {
            this.currentBlob.style.transform = `translateX(${currentX}vw) translateY(-50%)`;
        }
        
        // Simplified morphing for mobile
        const inner = this.currentBlob.querySelector('.liquid-blob-inner');
        if (inner && !this.useSimpleAnimation) {
            const velocity = Math.abs(this.currentProgress - this.lastProgress);
            this.lastProgress = this.currentProgress;
            
            if (velocity > 0.001) {
                const stretchFactor = this.isMobileDevice ? 3 : 10;
                const squashFactor = this.isMobileDevice ? 1.5 : 5;
                const stretch = 1 + velocity * stretchFactor;
                inner.style.transform = `scale(${Math.min(stretch, 1.1)}, ${Math.max(1 - velocity * squashFactor, 0.95)})`;
            } else {
                inner.style.transform = 'scale(1)';
            }
        }
        
        // Hide unused elements
        if (this.birthBlob) this.birthBlob.style.display = 'none';
        if (this.dropConnector) this.dropConnector.style.display = 'none';
    }
}

// Additional mobile-specific fixes
document.addEventListener('DOMContentLoaded', function() {
    // Prevent overscroll bounce on iOS
    if (isMobile()) {
        document.body.addEventListener('touchmove', function(e) {
            if (e.target.closest('.contact-form')) return; // Allow form scrolling
            
            const scrollable = e.target.closest('.content-page');
            if (scrollable && scrollable.scrollHeight > scrollable.clientHeight) {
                return;
            }
        }, { passive: true });
        
        // Fix for iOS momentum scrolling
        const contentPage = document.querySelector('.content-page');
        if (contentPage) {
            contentPage.style.webkitOverflowScrolling = 'touch';
            contentPage.style.overflowY = 'auto';
        }
    }
});

// Initialize liquid morph controller
const liquidMorph = new LiquidMorphController();

// Preserved shaking animation
const shaker = document.getElementById('shaker');
const splitTop = document.querySelector('.split-top');
const splitBottom = document.querySelector('.split-bottom');

// Start shaking immediately
shaker.classList.add('shaking');

// After 2.5s stop shaking and trigger split
setTimeout(() => {
    shaker.classList.remove('shaking');
    document.querySelector('.loading-container').classList.add('hide');
    
    // Trigger split
    setTimeout(() => {
        splitTop.classList.add('open');
        splitBottom.classList.add('open');
        
        // Show content with mind-blowing animation
        setTimeout(() => {
            const contentPage = document.querySelector('.content-page');
            contentPage.style.animation = 'mindBendingEntry 2.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
            contentPage.style.pointerEvents = 'auto';

            // Show hero content after animation completes
            setTimeout(() => {
                document.body.classList.add('scrollable');
                document.querySelector('.split-container').style.display = 'none';
                document.querySelector('.hero-content').classList.add('show');
                
                // Initialize scroll effects
                initScrollEffects();
                initObservers();
                
                // Bind liquid morph scroll handler
                liquidMorph.bindScrollHandler();
            }, 2500);
        }, 900);
    }, 500);
}, 2500);

// 3D Parallax on scroll - Optimized
function initScrollEffects() {
    const sections = document.querySelectorAll('section');
    const heroContent = document.querySelector('.hero-content');
    let ticking = false;
    
    function updateScrollEffects() {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;

        const rotationMultiplier = isMobile() ? 5 : 8;
        const depthMultiplier = isMobile() ? -30 : -50;
        
        // Disable 3D effects on hero section to prevent conflicts
        sections.forEach((section, index) => {
            if (section.classList.contains('hero')) {
                // Skip hero section transforms
                section.style.transform = 'none';
                return;
            }
            
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionCenter = sectionTop + sectionHeight / 2;
            const distanceFromCenter = scrollY + windowHeight / 2 - sectionCenter;
            const normalizedDistance = distanceFromCenter / windowHeight;
            
            // Gentler 3D rotation effect
            const rotateX = normalizedDistance * rotationMultiplier;
            const translateZ = Math.abs(normalizedDistance) * depthMultiplier;
            
            if (isMobile()) {
                section.style.transform = `translateY(${translateZ / 2}px)`;
            } else {
                section.style.transform = `perspective(1000px) rotateX(${rotateX}deg) translateZ(${translateZ}px)`;
            }
        });
        
        // Hero fade out with better performance
        if (heroContent) {
            const heroOpacity = Math.max(0, 1 - scrollY / (windowHeight * 0.8));
            heroContent.style.opacity = heroOpacity;
            const parallaxMultiplier = isMobile() ? 0.2 : 0.3;
            heroContent.style.transform = `translateY(${scrollY * parallaxMultiplier}px)`;
        }
        
        ticking = false;
    }
    
    // Throttled scroll handler
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateScrollEffects);
            ticking = true;
        }
    }, { passive: true });
}

// touch event handling for mobile
function initMobileTouchHandlers() {
    if (!isMobile()) return;

    // smooth scrolling for touch devices
    let touchStartY = 0;
    let touchEndY = 0;

    document.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        touchEndY = e.changedTouches[0].clientY;
        // add momentum scrolling hint
        const swipeDistance = touchStartY - touchEndY;
        if (Math.abs(swipeDistance) > 50) {
            document.body.style.webkitOverflowScrolling = 'touch';
        }
    }, { passive: true });

    // handle orientation changes
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            window.scrollTo(0, window.scrollY);
            liquidMorph.windowWidth = window.innerWidth;
            liquidMorph.windowHeight = window.innerHeight;
            liquidMorph.isMobileDevice = isMobile();
        }, 300);
    });
}

setTimeout(() => {
    initMobileTouchHandlers();
}, 50);

// Intersection Observer for fade-in animations
function initObservers() {
    const isMobileDevice = isMobile();

    const observerOptions = {
        threshold: isMobileDevice ? 0.1 : 0.2,
        rootMargin: isMobileDevice ? '0px 0px -50px 0px' : '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Special handling for info items
                if (entry.target.classList.contains('contact-info-card')) {
                    const infoItems = entry.target.querySelectorAll('.info-item');
                    infoItems.forEach((item, index) => {
                        setTimeout(() => {
                            item.classList.add('visible');
                        }, isMobileDevice ? index * 150 : index * 100);
                    });
                }
            } else {
                // Remove visible class when scrolling away for section headers and header lines
                if ((entry.target.tagName === 'H2' && entry.target.parentElement.classList.contains('section-header')) ||
                    entry.target.classList.contains('header-line')) {
                    entry.target.classList.remove('visible');
                }
            }
        });
    }, observerOptions);
    
    // Observe elements with correct class names
    document.querySelectorAll('.section-header h2, .header-line, .philosophy-card, .cocktail-card, .timeline-item, .contact-info').forEach(el => {
        observer.observe(el);
    });
}