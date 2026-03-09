// js/ui/pages/contact.ui.js

window.InitManager.register('ContactPage', function() {
    const contactForm = document.getElementById('contactForm');
    const status = document.getElementById('formStatus');
    
    if (!contactForm || !status) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        status.textContent = "Enviando mensaje...";
        status.className = "form-status";

        const name = contactForm.querySelector('[name="name"]').value.trim();
        const email = contactForm.querySelector('[name="email"]').value.trim();
        const subject = contactForm.querySelector('[name="subject"]').value.trim();
        const message = contactForm.querySelector('[name="message"]').value.trim();

        try {
            const response = await fetch(`${window.API_URL}/contact`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name, email, subject, message })
            });

            const data = await response.json();

            if (response.ok) {
                status.textContent = "¡Mensaje enviado correctamente! Gracias por contactarnos.";
                status.className = "form-status success";
                contactForm.reset();
            } else {
                status.textContent = data.message || "Error al enviar el mensaje.";
                status.className = "form-status error";
            }

        } catch (err) {
            console.error(err);
            status.textContent = "Error al conectar con el servidor.";
            status.className = "form-status error";
        }
    });
    
    window.InitManager.log('✅ Página de contacto inicializada');
});