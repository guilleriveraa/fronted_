// js/ui/contact.ui.js - VERSIÓN INDEPENDIENTE (sin InitManager)
console.log('🔥 Script de contacto independiente cargado');

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('📧 DOM listo, configurando formulario de contacto');
    
    const contactForm = document.getElementById('contactForm');
    const status = document.getElementById('formStatus');
    
    console.log('🔍 Formulario encontrado:', !!contactForm);
    console.log('🔍 Status encontrado:', !!status);
    
    if (!contactForm) {
        console.error('❌ No se encontró el formulario de contacto');
        return;
    }

    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('📤 Formulario enviado');
        
        // Mostrar estado
        if (status) {
            status.textContent = "Enviando mensaje...";
            status.style.color = "#0066cc";
        }

        // Obtener datos
        const name = contactForm.querySelector('[name="name"]')?.value.trim();
        const email = contactForm.querySelector('[name="email"]')?.value.trim();
        const subject = contactForm.querySelector('[name="subject"]')?.value.trim();
        const message = contactForm.querySelector('[name="message"]')?.value.trim();
        
        console.log('📦 Datos del formulario:', { name, email, subject, message });

        // Validaciones básicas
        if (!name || !email || !message) {
            const msg = "❌ Por favor, completa todos los campos obligatorios";
            console.warn(msg);
            if (status) {
                status.textContent = msg;
                status.style.color = "#cc0000";
            }
            return;
        }

        try {
            console.log('🌐 Enviando a:', window.API_URL + '/contact');
            
            const response = await fetch(window.API_URL + '/contact', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, subject, message })
            });
            
            console.log('📥 Respuesta recibida. Status:', response.status);
            
            let data;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
                console.log('📦 Datos JSON:', data);
            } else {
                const text = await response.text();
                console.log('📦 Respuesta texto:', text);
                data = { message: text };
            }
            
            if (response.ok) {
                const msg = "✅ ¡Mensaje enviado correctamente! Gracias por contactarnos.";
                console.log(msg);
                if (status) {
                    status.textContent = msg;
                    status.style.color = "#008800";
                }
                contactForm.reset();
            } else {
                const msg = "❌ Error: " + (data.message || 'Error desconocido');
                console.error(msg);
                if (status) {
                    status.textContent = msg;
                    status.style.color = "#cc0000";
                }
            }
            
        } catch (err) {
            console.error('❌ Error de conexión:', err);
            if (status) {
                status.textContent = "❌ Error al conectar con el servidor";
                status.style.color = "#cc0000";
            }
        }
    });
});