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
        
        // Simple smooth animation properties
        this.currentProgress = 0;
        this.targetProgress = 0;
        this.lastProgress = 0;
        this.animationFrame = null;
        
        // Track scroll direction
        this.scrollDirection = 1; // 1 for down, -1 for up
        this.isReversing = false;
        
        // Cache for performance
        this.lastStyles = {
            currentBlob: { left: '', top: '', opacity: '', transform: '' },
            birthBlob: { left: '', top: '', opacity: '', transform: '' },
            dropConnector: { left: '', top: '', opacity: '', transform: '' }
        };
        
        // Cache window width for transform calculations
        this.windowWidth = window.innerWidth;
        
        this.init();
    }
    
    init() {
        // Count total sections (excluding hero)
        this.totalSections = document.querySelectorAll('section:not(.hero)').length;
        
        // Create initial state - super simple
        this.mainBlob.style.opacity = '0.8';
        this.mainBlob.style.left = '0';
        this.mainBlob.style.top = '30%';
        this.mainBlob.style.transform = 'translateX(0vw) translateY(-50%)';
        this.currentBlob = this.mainBlob;
        
        // Start with perfect circle
        const mainInner = this.mainBlob.querySelector('.liquid-blob-inner');
        if (mainInner) {
            mainInner.style.transform = 'scale(1)';
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
        // Throttled scroll handler
        let scrollTimeout;
        let lastScrollTime = 0;
        const throttleDelay = 16; // ~60fps
        
        const throttledScroll = () => {
            const now = Date.now();
            
            if (now - lastScrollTime >= throttleDelay) {
                lastScrollTime = now;
                this.handleScroll();
            } else {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    this.handleScroll();
                }, throttleDelay);
            }
        };
        
        window.addEventListener('scroll', throttledScroll, { passive: true });
        
        // Start animation loop
        this.startAnimationLoop();
        
        // Handle resize
        window.addEventListener('resize', () => {
            this.sectionHeight = window.innerHeight;
            this.windowWidth = window.innerWidth;
        });
    }
    
    startAnimationLoop() {
        let lastTime = 0;
        let skipFrames = 0;
        
        const animate = (timestamp) => {
            const deltaTime = timestamp - lastTime;
            lastTime = timestamp;
            
            // Skip frames if performance is poor
            if (deltaTime > 33) { // Less than 30fps
                skipFrames = 2;
            }
            
            if (skipFrames > 0) {
                skipFrames--;
                this.animationFrame = requestAnimationFrame(animate);
                return;
            }
            
            // Frame-rate independent animation
            const frameCorrection = Math.min(deltaTime / 16.67, 2); // 60fps baseline
            
            // Enhanced smooth interpolation
            const diff = this.targetProgress - this.currentProgress;
            const absDiff = Math.abs(diff);
            
            // Ultra smooth following with even gentler transitions
            let smoothingFactor = 0.06; // Even smoother base
            if (absDiff > 0.8) {
                smoothingFactor = 0.2; // Still smooth for jumps
            } else if (absDiff > 0.3) {
                smoothingFactor = 0.1; // Gentle medium speed
            } else if (absDiff < 0.01) {
                smoothingFactor = 0.03; // Ultra smooth settling
            }
            
            // Apply frame correction for consistent speed
            this.currentProgress += diff * smoothingFactor * frameCorrection;
            
            // Snap to target if very close
            if (absDiff < 0.001) {
                this.currentProgress = this.targetProgress;
            }
            
            // Always animate to ensure smooth transitions
            this.animateLiquidSeparation(this.currentProgress, this.currentSection);
            
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        this.animationFrame = requestAnimationFrame(animate);
    }
    
    handleScroll() {
        this.scrollPosition = window.pageYOffset;
        
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
    
    setStyle(element, styleName, styles) {
        // Only update if changed (reduces reflows)
        const cache = this.lastStyles[styleName];
        let hasChanges = false;
        
        for (const [key, value] of Object.entries(styles)) {
            if (cache[key] !== value) {
                cache[key] = value;
                hasChanges = true;
            }
        }
        
        if (hasChanges) {
            Object.assign(element.style, styles);
        }
    }
    
    animateLiquidSeparation(progress, section) {
        if (!this.currentBlob) return;
        
        // Use total progress for continuous movement
        const totalProgress = progress;
        
        // Create a continuous zigzag path through all sections
        const totalSections = this.totalSections;
        const progressPerSection = 1 / totalSections;
        const currentSectionProgress = totalProgress / progressPerSection;
        const currentFullSection = Math.floor(currentSectionProgress);
        const currentPartialProgress = currentSectionProgress - currentFullSection;
        
        // Calculate X position with continuous zigzag
        let currentX;
        if (currentFullSection % 2 === 0) {
            // Even sections: left to right (0 to 85)
            currentX = 0 + (85 * currentPartialProgress);
        } else {
            // Odd sections: right to left (85 to 0)
            currentX = 85 - (85 * currentPartialProgress);
        }
        
        // Clamp to valid range
        currentX = Math.max(0, Math.min(85, currentX));
        
        // Apply position
        this.currentBlob.style.transform = `translateX(${currentX}vw) translateY(-50%)`;
        
        // Morphing based on movement
        const inner = this.currentBlob.querySelector('.liquid-blob-inner');
        if (inner) {
            const velocity = Math.abs(this.currentProgress - this.lastProgress);
            this.lastProgress = this.currentProgress;
            
            if (velocity > 0.001) {
                const stretch = 1 + velocity * 10;
                inner.style.transform = `scaleX(${Math.min(stretch, 1.2)}) scaleY(${Math.max(1 - velocity * 5, 0.9)})`;
            } else {
                inner.style.transform = 'scale(1)';
            }
        }
        
        // Hide unused elements
        if (this.birthBlob) this.birthBlob.style.display = 'none';
        if (this.dropConnector) this.dropConnector.style.display = 'none';
    }
    
    swapBlobs() {
        // Not needed with single blob approach
        this.isAnimating = false;
    }
}

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
        const scrollY = window.pageYOffset;
        const windowHeight = window.innerHeight;
        
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
            const rotateX = normalizedDistance * 8; // Reduced from 15
            const translateZ = Math.abs(normalizedDistance) * -50; // Reduced from -100
            
            section.style.transform = `perspective(1000px) rotateX(${rotateX}deg) translateZ(${translateZ}px)`;
        });
        
        // Hero fade out with better performance
        if (heroContent) {
            const heroOpacity = Math.max(0, 1 - scrollY / (windowHeight * 0.8));
            heroContent.style.opacity = heroOpacity;
            heroContent.style.transform = `translateY(${scrollY * 0.3}px)`;
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

// Intersection Observer for fade-in animations
function initObservers() {
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
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
                        }, index * 100);
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