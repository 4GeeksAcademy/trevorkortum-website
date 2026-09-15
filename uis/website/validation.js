// validation.js - Real-time validation for ALL form fields
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('application-form')
    const successMessage = document.getElementById('success-message')
    if (!form || !successMessage) return

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

    const submitButton = form.querySelector('button[type="submit"]')

    // Form submission (demo — no backend yet)
    form.addEventListener('submit', (e) => {
        e.preventDefault()

        let isValid = true
        inputs.forEach(input => {
            if (!validateField(input)) isValid = false
        })

        if (!isValid) return

        if (submitButton) submitButton.disabled = true
        try {
            form.classList.add('hidden')
            successMessage.classList.remove('hidden')
            console.log('Brasa Points interest form accepted (demo; not sent to an API).')
        } catch (err) {
            form.classList.remove('hidden')
            successMessage.classList.add('hidden')
            showError('email', 'Something went wrong. Please try again.')
        } finally {
            if (submitButton) submitButton.disabled = false
        }
    })

    // Clear form button
    const clearButton = document.getElementById('clear-form')
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            form.reset()
            successMessage.classList.add('hidden')
            form.classList.remove('hidden')
            document.querySelectorAll('.text-red-500').forEach(el => el.classList.add('hidden'))
        })
    }

    // Tailwind initialization (same as landing page)
    if (typeof initializeTailwind === 'function') initializeTailwind()
})
