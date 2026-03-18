window.InitManager.register('SmartForm', function () {

  const contactForm = document.getElementById('smartContactForm');
  if (!contactForm) return;

  const inputs = contactForm.querySelectorAll('input, textarea');

  function validate(field) {
    const feedback = field.parentElement.querySelector('.form-feedback');
    if (!feedback) return true;

    let valid = true;
    let message = '';

    if (field.required && !field.value.trim()) {
      valid = false;
      message = 'Este campo es obligatorio';
    }

    if (field.type === 'email' && field.value) {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!regex.test(field.value)) {
        valid = false;
        message = 'Email inválido';
      }
    }

    field.style.borderColor = valid ? '#4CAF50' : '#f44336';
    feedback.textContent = message;
    return valid;
  }

  inputs.forEach(input => {
    input.addEventListener('blur', () => validate(input));
  });

});
