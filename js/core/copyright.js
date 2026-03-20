// js/core/copyright.js
// Actualización automática del año de copyright

document.addEventListener('DOMContentLoaded', function() {
    // Buscar cualquier elemento con la clase 'copyright-year'
    const yearElements = document.querySelectorAll('.copyright-year, #copyright-year, [data-copyright-year]');
    
    const currentYear = new Date().getFullYear();
    
    yearElements.forEach(element => {
        // Si el elemento tiene texto que contiene "2024" o similar, lo reemplazamos
        const originalText = element.textContent;
        
        // Opción 1: Si es un año simple (solo el número)
        if (element.tagName === 'SPAN' || element.tagName === 'DIV') {
            element.textContent = currentYear;
        }
        
        // Opción 2: Si es texto completo (ej: "© 2024 SalamancaVivela")
        if (originalText.includes('2024') || originalText.includes('2025') || originalText.includes('2026')) {
            element.textContent = originalText.replace(/2024|2025|2026/g, currentYear);
        }
    });
    
    // También buscar dentro del footer por si acaso
    const footer = document.querySelector('footer');
    if (footer) {
        const footerText = footer.innerHTML;
        if (footerText.includes('2024') || footerText.includes('2025') || footerText.includes('2026')) {
            footer.innerHTML = footerText.replace(/2024|2025|2026/g, currentYear);
        }
    }
    
    console.log(`📅 Copyright actualizado a ${currentYear}`);
});