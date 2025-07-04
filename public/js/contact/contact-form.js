/** 
 * CONTACT FORM
 * Developer: Giuseppe P. De Masi - TechnoForged Digital ApS
 * Date: 2023-09-26
 * 
 * This script handles the submission of a contact form using Firebase and EmailJS.
 * It validates the form inputs, sends the form data to Firebase, and then sends the form data to EmailJS for email delivery.
 * 
*/

// Remove this line - require doesn't work in browsers!
// const firebase = require('firebase');

class ContactFormHandler {
    constructor() {
        this.firebaseConfig = {
            apiKey: "AIzaSyAb-fMlccD_XacgXiAba2-wM8fX_ZaQQPo",
            authDomain: "dazfersubero-757ee.firebaseapp.com",
            projectId: "dazfersubero-757ee",
            storageBucket: "dazfersubero-757ee.firebasestorage.app",
            messagingSenderId: "1087785377007",
            appId: "1:1087785377007:web:33e28b34f2bcc3a38ccf1a",
            measurementId: "G-P7V2CJL37V"          
        };

        // EmailJS config - UPDATE THESE VALUES!
        this.emailJSConfig = {
            publicKey: "YOUR_EMAILJS_PUBLIC_KEY",
            serviceID: "YOUR_SERVICE_ID",
            templateID: "YOUR_TEMPLATE_ID"
        };

        this.form = null;
        this.submitButton = null;
        this.db = null;
        this.initialized = false;

        this.init();
    }

    async init() {
        try {
            // Check if Firebase is loaded
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase is not loaded. Please check script tags.');
            }

            // Initialize Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(this.firebaseConfig);
            }
            this.db = firebase.firestore();

            // Check if EmailJS is loaded
            if (typeof emailjs === 'undefined') {
                throw new Error('EmailJS is not loaded. Please check script tags.');
            }

            // Initialize EmailJS
            emailjs.init(this.emailJSConfig.publicKey);

            // Setup form
            this.setupForm();
            this.initialized = true;
            console.log('[+] Contact form initialized successfully');
        } catch (error) {
            console.error('Failed to initialize contact form:', error);
            this.showNotification('Failed to initialize form. Please refresh the page.', 'error');
        }
    }

    setupForm() {
        this.form = document.querySelector('.contact-form');
        if (!this.form) return;

        this.submitButton = this.form.querySelector('.form-button');

        // Remove any existing listeners
        const newForm = this.form.cloneNode(true);
        this.form.parentNode.replaceChild(newForm, this.form);
        this.form = newForm;
        this.submitButton = this.form.querySelector('.form-button');

        // Add submit handler
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        
        // Add validation
        this.addValidation();
    }

    addValidation() {
        const inputs = this.form.querySelectorAll('.form-input');

        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    this.validateField(input);
                }
            });
        });
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Remove any existing errors
        field.classList.remove('error');
        const existingError = field.parentElement.querySelector('.error-message');
        if (existingError) existingError.remove();

        // Validation rules
        if (field.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        } else if (field.required && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        } else if (field.tagName === 'TEXTAREA' && value.length < 10) {
            isValid = false;
            errorMessage = 'Message must be at least 10 characters';
        } else if (value.length > 1000) {
            isValid = false;
            errorMessage = 'Text is too long';
        }

        if (!isValid) {
            field.classList.add('error');
            const errorEl = document.createElement('span');
            errorEl.className = 'error-message';
            errorEl.textContent = errorMessage;
            field.parentElement.appendChild(errorEl);
        }

        return isValid;
    }

    async handleSubmit(e) {
        e.preventDefault();

        if (!this.initialized) {
            this.showNotification('Form is still loading. Please wait...', 'warning');
            return;
        }

        // Validate all fields
        const inputs = this.form.querySelectorAll('.form-input');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        if (!isValid) {
            this.showNotification('Please fix the errors in the form', 'error');
            return;
        }

        // Get form data
        const formData = {
            name: this.form.querySelector('input[placeholder="Your Name"]').value.trim(),
            email: this.form.querySelector('input[type="email"]').value.trim(),
            eventType: this.form.querySelector('input[placeholder="Event Type"]').value.trim(),
            message: this.form.querySelector('textarea').value.trim(),
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            submittedAt: new Date().toISOString()
        };

        // Show loading state
        this.setLoadingState(true);

        try {
            // Save to Firestore
            const docRef = await this.db.collection('contact-submissions').add(formData);
            console.log('[+] Submission saved with ID:', docRef.id);

            // Send email via EmailJS
            const emailParams = {
                from_name: formData.name,
                reply_to: formData.email,
                event_type: formData.eventType,
                message: formData.message,
                submission_date: new Date().toLocaleString('en-US', {
                    dateStyle: 'full',
                    timeStyle: 'short'
                })
            };

            await emailjs.send(
                this.emailJSConfig.serviceID,
                this.emailJSConfig.templateID,
                emailParams
            );

            // Success!
            this.showNotification('Thank you! Your message has been sent successfully.', 'success');
            this.form.reset();

            // Track submission (optional)
            if (typeof gtag !== 'undefined') {
                gtag('event', 'form_submit', {
                    'event_category': 'engagement',
                    'event_label': 'contact_form'
                });
            }

        } catch (error) {
            console.error('[-] Error submitting form:', error);
            this.showNotification('Sorry, there was an error sending your message. Please try again or email directly to hello@dazfersubero.com', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    setLoadingState(isLoading) {
        if (isLoading) {
            this.submitButton.disabled = true;
            this.submitButton.innerHTML = '<span>Sending...</span><div class="button-accent"></div>';
            this.submitButton.classList.add('loading');
        } else {
            this.submitButton.disabled = false;
            this.submitButton.innerHTML = '<span>Begin the Journey</span><div class="button-accent"></div>';
            this.submitButton.classList.remove('loading');
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelector('.form-notification');
        if (existing) existing.remove();

        // Create notification
        const notification = document.createElement('div');
        notification.className = `form-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getIcon(type)}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;

        // Insert after form
        this.form.parentElement.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on a page with the contact form
    if (document.querySelector('.contact-form')) {
        window.contactFormHandler = new ContactFormHandler();
    }
});