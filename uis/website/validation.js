// validation.js - Real-time validation for ALL form fields
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('application-form')
    const successMessage = document.getElementById('success-message')
    
    // Helper: show error under field
    function showError(fieldId, message) {
        const errorEl = document.getElementById(fieldId + '_error')
        if (errorEl) {
            errorEl.textContent = message
            errorEl.classList.remove('hidden')
        }
    }
    
    // Helper: clear error
    function clearError(fieldId) {
        const errorEl = document.getElementById(fieldId + '_error')
        if (errorEl) errorEl.classList.add('hidden')
    }
    
    // Real-time validation on input + blur
    function validateField(field) {
        clearError(field.id)
        
        if (field.hasAttribute('required') && !field.value.trim()) {
            showError(field.id, 'This field is required')
            return false
        }
        
        if (field.type === 'email' && field.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(field.value)) {
                showError(field.id, 'Please enter a valid email address')
                return false
            }
        }
        
        if (field.type === 'tel' && field.value) {
            const phoneRegex = /^\+?\d{10,15}$/
            if (!phoneRegex.test(field.value.replace(/\s+/g, ''))) {
                showError(field.id, 'Phone must be 10–15 digits (with optional +)')
                return false
            }
        }
        
        // Domain-specific validation for country
        if (field.id === 'preferred_country' && field.value === '') {
            showError(field.id, 'Please select a country')
            return false
        }
        
        return true
    }
    
    // Attach real-time listeners to every input/select
    const inputs = form.querySelectorAll('input, select')
    inputs.forEach(input => {
        input.addEventListener('input', () => validateField(input))
        input.addEventListener('blur', () => validateField(input))
    })
    
    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault()
        
        let isValid = true
        inputs.forEach(input => {
            if (!validateField(input)) isValid = false
        })
        
        if (isValid) {
            // Simulate successful submission
            form.classList.add('hidden')
            successMessage.classList.remove('hidden')
            
            // Optional: console log the submitted data (for demo)
            console.log('%c✅ Form submitted successfully!', 'color:#10b981;font-weight:bold')
            console.table({
                first_name: document.getElementById('first_name').value,
                last_name: document.getElementById('last_name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                preferred_country: document.getElementById('preferred_country').value,
                preferred_location: document.getElementById('preferred_location').value,
                favorite_grill_item: document.getElementById('favorite_grill_item').value,
                how_did_you_hear: document.getElementById('how_did_you_hear').value
            })
            
            // In a real project this would POST to an API
        }
    })
    
    // Clear form button
    document.getElementById('clear-form').addEventListener('click', () => {
        form.reset()
        successMessage.classList.add('hidden')
        form.classList.remove('hidden')
        // Clear all error messages
        document.querySelectorAll('.text-red-500').forEach(el => el.classList.add('hidden'))
    })
    
    // Tailwind initialization (same as landing page)
    if (typeof initializeTailwind === 'function') initializeTailwind()
})