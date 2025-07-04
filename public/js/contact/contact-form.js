/** 
 * CONTACT FORM
 * Developer: Giuseepe P. De Masi - TechnoForged Digital ApS
 * Date: 2023-09-26
 * 
 * This script handles the submission of a contact form using Firebase and EmailJS.
 * It validates the form inputs, sends the form data to Firebase, and then sends the form data to EmailJS for email delivery.
 * 
*/

const firebase = require('firebase');

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

        // EmailJS config
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
            // initialize firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(this.firebaseConfig);
            }
            this.db = firebase.firestore();

            // initialize EmailJS
            emailjs.init(this.emailJSConfig.publicKey);

            // setup form
            this.setupForm();
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize contact form:', error);
            this.showNotification('Failed to initialize form. Please refresh the pahge.', error);
        }
    }

    setupForm() {
        this.form = document.querySelector('.contact-form');
        if (!this.form) return;

        this.submitButton = this.form.querySelector('.form-button');

        // remove any existing listener
        const newForm = this.form.cloneNode(true);
        this.form.parentNode.replaceChild(newForm, this.form);
        this.form = newForm;
        this.submitButton = this.form.querySelector('.form-button');

        // add submit handler
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
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

        // remove any existing errors
        field.classList.remove('error');
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) existingError.remove();

        // validation rules
        if (field.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address.';
            }
        } else if (field.required && !value) {
            isValid = false;
            errorMessage = 'This field is required.';
        } else if (field.tagName === 'TEXTAREA' && value.length < 10) {
            isValid = false;
            errorMessage = 'Message must be at least 10 carachters.';
        } else if (value.length > 1000) {
            isValid = false;
            errorMessage = 'Message is too long.';
        }

        if (!isValid) {
            field.classList.add('error');
            const errorEl = document.createElement('span');
            errorEl.className = 'error-message';
            errorEl.textContent = errorMessage;
            field.parentNode.appendChild(errorEl);
        }

        return isValid;
    }

    async handleSubmit(e) {
        e.preventDefault();

        if (!this.initialized) {
            this.showNotification('Form is still loading. Please ewait...', 'warning');
            return;
        }

        // validate all fields
        const inputs = document.querySelectorAll('.form-input');
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

        const formData = {
            name: this.form.querySelector('input[placeholder="Your Name"]').value.trim(),
            email: this.form.querySelector('input[type="email"]').value.trim(),
            eventType: this.form.querySelector('input[placeholder="Event Type"]').value.trim(),
            message: this.form.querySelector('textarea').value.trim(),
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            submittedAt: new Date().toISOString()
        };

        // show loading state
        this.setLoadingState(true);

        try {
            // save to firestore
            const docRef = await this.db.collection('contact-submissions').add(formData);
            console.log('[+] Submission saved with ID:', docRef.id);

            // send email via EmailJS
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

            // Success
            this.showNotification('Thank You! Your message has been sent successfully', 'success');
            this.form.reset();

            // track submission
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
            this.submitButton.innerHTML = 'Sending...';
            this.submitButton.classList.add('loading');
        } else {
            this.submitButton.disabled = false;
            this.submitButton.innerHTML = 'Begin the Journey';
            this.submitButton.classList.remove('loading');
        }
    }

    showNotification(message, type = 'info') {
        // remove existing notifications
        const existing = document.querySelector('.form-notification');
        if (existing) existing.remove();

        // create notification
        const notification = document.createElement('div');
        notification.className = `form-notification ${type}`;
        notification.innerHTML = `
            

                ${this.getIcon(type)}
                ${message}
            

        `;

        // insert after form
        this.form.parentElement.appendChild(notification);

        // animate in
        setTimeout(() => notification.classList.add('show'), 10);

        // auto remove after 3.5 sec
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3500);
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

// initialize DOM
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.contact-form')) {
        window.ContactFormHandler = new ContactFormHandler();
    }
})