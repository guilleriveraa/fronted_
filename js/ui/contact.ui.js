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

        // Reemplaza el try/catch actual con esto:

try {
    console.log('🌐 Enviando a:', window.API_URL + '/contact');
    
    // Añadir timeout de 10 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(window.API_URL + '/contact', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, subject, message }),
        signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('📥 Respuesta recibida. Status:', response.status);
    console.log('📥 Headers:', [...response.headers.entries()]);
    
    // Leer la respuesta como texto primero para ver qué devuelve
    const textResponse = await response.text();
    console.log('📥 Respuesta texto:', textResponse);
    
    let data;
    try {
        data = JSON.parse(textResponse);
        console.log('📥 Respuesta JSON:', data);
    } catch (e) {
        console.log('📥 No es JSON, es texto plano');
        data = { message: textResponse };
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
        const msg = "❌ Error del servidor: " + (data.message || textResponse || 'Error desconocido');
        console.error(msg);
        if (status) {
            status.textContent = msg;
            status.style.color = "#cc0000";
        }
    }
    
} catch (err) {
    console.error('❌ Error de conexión:', err);
    console.error('❌ Nombre del error:', err.name);
    console.error('❌ Mensaje:', err.message);
    
    let errorMsg = "❌ Error al conectar con el servidor";
    if (err.name === 'AbortError') {
        errorMsg = "❌ Tiempo de espera agotado (10 segundos)";
    }
    
    if (status) {
        status.textContent = errorMsg;
        status.style.color = "#cc0000";
    }
}
    });
});