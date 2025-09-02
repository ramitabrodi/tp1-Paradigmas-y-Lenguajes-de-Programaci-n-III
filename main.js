// Main JavaScript for Lubricentro R/18

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    initializeTooltips();
    
    // Initialize form validation
    initializeFormValidation();
    
    // Initialize product selection
    initializeProductSelection();
    
    // Initialize smooth scrolling
    initializeSmoothScrolling();
    
    // Initialize loading states
    initializeLoadingStates();
});

/**
 * Initialize Bootstrap tooltips
 */
function initializeTooltips() {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

/**
 * Initialize form validation for purchase form
 */
function initializeFormValidation() {
    const forms = document.querySelectorAll('form[novalidate]');
    
    forms.forEach(function(form) {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
                
                // Show first invalid field
                const firstInvalidField = form.querySelector(':invalid');
                if (firstInvalidField) {
                    firstInvalidField.focus();
                    firstInvalidField.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }
            } else {
                // Validate custom requirements
                if (!validateCustomRequirements(form)) {
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                }
                
                // Show loading state
                showFormLoading(form);
            }
            
            form.classList.add('was-validated');
        }, false);
        
        // Real-time validation
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(function(input) {
            input.addEventListener('blur', function() {
                validateField(input);
                if (form.classList.contains('was-validated')) {
                    input.classList.toggle('is-valid', input.checkValidity() && validateField(input));
                    input.classList.toggle('is-invalid', !(input.checkValidity() && validateField(input)));
                }
            });
            
            // Special handling for phone field - validate on input
            if (input.name === 'telefono') {
                input.addEventListener('input', function() {
                    const isValid = validateField(this);
                    
                    // Always show validation feedback for phone once user starts typing
                    if (this.value.length > 0) {
                        this.classList.toggle('is-valid', isValid);
                        this.classList.toggle('is-invalid', !isValid);
                        
                        // Show specific message for invalid characters
                        if (!isValid && this.value.length > 0) {
                            const hasLetters = /[a-zA-Z]/.test(this.value);
                            if (hasLetters) {
                                this.setCustomValidity('No se permiten letras en el teléfono');
                            }
                        }
                    } else {
                        this.classList.remove('is-valid', 'is-invalid');
                    }
                });
            }
        });
    });
}

/**
 * Validate custom form requirements
 */
function validateCustomRequirements(form) {
    let isValid = true;
    
    // Check if at least one payment method is selected
    const paymentMethods = form.querySelectorAll('input[name="medio_pago"]');
    const paymentSelected = Array.from(paymentMethods).some(radio => radio.checked);
    
    if (!paymentSelected) {
        showAlert('Por favor seleccione un medio de pago', 'error');
        isValid = false;
    }
    
    // Check if at least one product is selected
    const products = form.querySelectorAll('input[name="productos[]"]');
    const productSelected = Array.from(products).some(checkbox => checkbox.checked);
    
    if (products.length > 0 && !productSelected) {
        showAlert('Por favor seleccione al menos un producto', 'error');
        isValid = false;
    }
    
    // Validate email format
    const email = form.querySelector('input[name="email"]');
    if (email && email.value) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email.value)) {
            email.setCustomValidity('Por favor ingrese un email válido');
            email.classList.add('is-invalid');
            isValid = false;
        } else {
            email.setCustomValidity('');
            email.classList.remove('is-invalid');
        }
    }
    
    // Validate phone number
    const phone = form.querySelector('input[name="telefono"]');
    if (phone && phone.value) {
        // Remove all non-numeric characters to count actual digits
        const numbersOnly = phone.value.replace(/[^\d]/g, '');
        const phonePattern = /^[0-9\s\-\+\(\)]{8,15}$/;
        
        if (!phonePattern.test(phone.value) || numbersOnly.length < 8 || numbersOnly.length > 15) {
            phone.setCustomValidity('Ingrese un teléfono válido (8-15 números)');
            phone.classList.add('is-invalid');
            isValid = false;
        } else {
            phone.setCustomValidity('');
            phone.classList.remove('is-invalid');
        }
    }
    
    return isValid;
}

/**
 * Initialize product selection functionality
 */
function initializeProductSelection() {
    const productCheckboxes = document.querySelectorAll('input[name="productos[]"]');
    const totalElement = document.getElementById('total-amount');
    
    if (productCheckboxes.length > 0) {
        // Add change event listeners
        productCheckboxes.forEach(function(checkbox) {
            checkbox.addEventListener('change', function() {
                updateProductSelection();
                calculateTotal();
            });
        });
        
        // Add select all functionality if needed
        addSelectAllFunctionality();
    }
}

/**
 * Update product selection visual feedback
 */
function updateProductSelection() {
    const selectedCount = document.querySelectorAll('input[name="productos[]"]:checked').length;
    const selectedCountElement = document.getElementById('selected-count');
    
    if (selectedCountElement) {
        selectedCountElement.textContent = selectedCount;
    }
    
    // Update submit button state
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = selectedCount === 0;
    }
}

/**
 * Calculate total amount of selected products
 */
function calculateTotal() {
    const selectedCheckboxes = document.querySelectorAll('input[name="productos[]"]:checked');
    let total = 0;
    
    selectedCheckboxes.forEach(function(checkbox) {
        const productCard = checkbox.closest('.card');
        if (productCard) {
            const priceElement = productCard.querySelector('[data-price]');
            if (priceElement) {
                total += parseFloat(priceElement.dataset.price);
            }
        }
    });
    
    const totalElement = document.getElementById('total-amount');
    if (totalElement) {
        totalElement.textContent = '$' + total.toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
}

/**
 * Add select all functionality for products
 */
function addSelectAllFunctionality() {
    const selectAllButton = document.getElementById('select-all-products');
    const clearAllButton = document.getElementById('clear-all-products');
    
    if (selectAllButton) {
        selectAllButton.addEventListener('click', function() {
            const checkboxes = document.querySelectorAll('input[name="productos[]"]:not(:disabled)');
            checkboxes.forEach(function(checkbox) {
                checkbox.checked = true;
            });
            updateProductSelection();
            calculateTotal();
        });
    }
    
    if (clearAllButton) {
        clearAllButton.addEventListener('click', function() {
            const checkboxes = document.querySelectorAll('input[name="productos[]"]');
            checkboxes.forEach(function(checkbox) {
                checkbox.checked = false;
            });
            updateProductSelection();
            calculateTotal();
        });
    }
}

/**
 * Initialize smooth scrolling for anchor links
 */
function initializeSmoothScrolling() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Initialize loading states for buttons and forms
 */
function initializeLoadingStates() {
    // Add loading state to navigation links
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    navLinks.forEach(function(link) {
        link.addEventListener('click', function() {
            if (!this.href.includes('#')) {
                showLinkLoading(this);
            }
        });
    });
}

/**
 * Show form loading state
 */
function showFormLoading(form) {
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<span class="loading me-2"></span>Enviando...';
        submitButton.disabled = true;
        
        // Store original text for potential restoration
        submitButton.dataset.originalText = originalText;
    }
}

/**
 * Show link loading state
 */
function showLinkLoading(link) {
    const originalText = link.innerHTML;
    link.innerHTML = '<span class="loading me-2"></span>' + link.textContent;
    link.style.pointerEvents = 'none';
    
    // Restore after a short delay if still on page
    setTimeout(function() {
        link.innerHTML = originalText;
        link.style.pointerEvents = '';
    }, 2000);
}

/**
 * Show alert messages
 */
function showAlert(message, type = 'info') {
    const alertContainer = document.querySelector('.container') || document.body;
    const alertElement = document.createElement('div');
    
    alertElement.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.insertBefore(alertElement, alertContainer.firstChild);
    
    // Auto dismiss after 5 seconds
    setTimeout(function() {
        if (alertElement.parentNode) {
            alertElement.remove();
        }
    }, 5000);
}

/**
 * Format currency values
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2
    }).format(amount);
}

/**
 * Validate form fields in real-time
 */
function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let message = '';
    
    switch (field.type) {
        case 'email':
            isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            message = 'Por favor ingrese un email válido';
            break;
        case 'tel':
            const numbersOnly = value.replace(/[^\d]/g, '');
            const phonePattern = /^[0-9\s\-\+\(\)]{8,15}$/;
            isValid = phonePattern.test(value) && numbersOnly.length >= 8 && numbersOnly.length <= 15;
            message = 'Ingrese un teléfono válido (8-15 números)';
            break;
        case 'text':
            if (field.hasAttribute('required')) {
                isValid = value.length > 0;
                message = 'Este campo es requerido';
            }
            break;
    }
    
    field.setCustomValidity(isValid ? '' : message);
    return isValid;
}

/**
 * Initialize search functionality (if needed in future)
 */
function initializeSearch() {
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const productCards = document.querySelectorAll('.product-card, tr');
            
            productCards.forEach(function(card) {
                const text = card.textContent.toLowerCase();
                const shouldShow = text.includes(searchTerm);
                card.style.display = shouldShow ? '' : 'none';
            });
        });
    }
}

/**
 * Initialize price filters (if needed in future)
 */
function initializePriceFilter() {
    const minPriceInput = document.getElementById('min-price');
    const maxPriceInput = document.getElementById('max-price');
    
    if (minPriceInput && maxPriceInput) {
        function filterByPrice() {
            const minPrice = parseFloat(minPriceInput.value) || 0;
            const maxPrice = parseFloat(maxPriceInput.value) || Infinity;
            
            const productCards = document.querySelectorAll('[data-price]');
            productCards.forEach(function(card) {
                const price = parseFloat(card.dataset.price);
                const shouldShow = price >= minPrice && price <= maxPrice;
                card.closest('.col-lg-4, tr').style.display = shouldShow ? '' : 'none';
            });
        }
        
        minPriceInput.addEventListener('input', filterByPrice);
        maxPriceInput.addEventListener('input', filterByPrice);
    }
}

// Utility functions
window.LubricentroUtils = {
    formatCurrency: formatCurrency,
    showAlert: showAlert,
    validateField: validateField
};
