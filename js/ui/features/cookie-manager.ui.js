// js/ui/features/cookie-manager.ui.js

window.InitManager.register('CookieManager', function () {

    const banner = document.getElementById('cookieBanner');
    const overlay = document.getElementById('cookieOverlay');
    const acceptBtn = document.getElementById('cookieAccept');
    const essentialBtn = document.getElementById('cookieEssential');
    const settingsBtn = document.getElementById('cookieSettings');
    const settingsPanel = document.getElementById('cookieSettingsPanel');
    const settingsClose = document.getElementById('settingsClose');
    const saveSettingsBtn = document.getElementById('saveCookieSettings');
    const analyticsToggle = document.getElementById('cookieAnalyticsToggle');
    const marketingToggle = document.getElementById('cookieMarketingToggle');

    if (!banner) {
        console.log('🍪 No hay banner de cookies en esta página');
        return;
    }

    // 🔥 CONFIGURACIÓN - CAMBIA ESTOS IDs POR LOS TUYOS
    const GA_ID = 'G-XXXXXXXXXX'; // Tu ID de Google Analytics (opcional)
    const FB_PIXEL_ID = '123456789012345'; // Tu ID de Facebook Pixel (opcional)

    const STORAGE_KEY = 'cookiesAccepted';

    let cookiePreferences = {
        essential: true,
        analytics: false,
        marketing: false
    };

    // ===== NUEVA FUNCIÓN: Aplicar preferencias =====
    function aplicarPreferencias(prefs) {
        console.log('🍪 Aplicando preferencias:', prefs);

        // 1. Cookies esenciales (siempre activas)
        console.log('✅ Cookies esenciales activadas');

        // 2. Cookies analíticas (Google Analytics)
        if (prefs.analytics) {
            console.log('📊 Activando cookies analíticas');
            
            if (GA_ID !== 'G-XXXXXXXXXX' && !window.ga) { // Solo si configuraste un ID real
                // Cargar Google Analytics
                const script = document.createElement('script');
                script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
                script.async = true;
                script.setAttribute('data-cookie-type', 'analytics');
                script.onload = () => {
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    window.gtag = gtag;
                    gtag('js', new Date());
                    gtag('config', GA_ID, { anonymize_ip: true });
                    console.log('✅ Google Analytics cargado');
                };
                document.head.appendChild(script);
            }
        } else {
            // Desactivar Google Analytics si ya estaba cargado
            if (window.gtag) {
                window['ga-disable-' + GA_ID] = true;
                console.log('🚫 Google Analytics desactivado');
            }
        }

        // 3. Cookies de marketing (Facebook Pixel)
        if (prefs.marketing) {
            console.log('🎯 Activando cookies de marketing');
            
            if (FB_PIXEL_ID !== '123456789012345' && !window.fbq) { // Solo si configuraste un ID real
                // Cargar Facebook Pixel
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                
                fbq('init', FB_PIXEL_ID);
                fbq('track', 'PageView');
                
                console.log('✅ Facebook Pixel cargado');
            }
        } else {
            // Desactivar Facebook Pixel si ya estaba cargado
            if (window.fbq) {
                window.fbq = function(){}; // Sobrescribir con función vacía
                console.log('🚫 Facebook Pixel desactivado');
            }
        }
    }

    // ===== MEJORADO: Cargar preferencias guardadas =====
    function loadPreferences() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                cookiePreferences = {
                    essential: true,
                    analytics: parsed.analytics === true,
                    marketing: parsed.marketing === true
                };
                
                // 🔥 Aplicar las preferencias al cargar
                aplicarPreferencias(cookiePreferences);
                
            } catch (e) {
                console.warn("Error parsing cookie preferences", e);
            }
        }
        if (analyticsToggle) analyticsToggle.checked = cookiePreferences.analytics;
        if (marketingToggle) marketingToggle.checked = cookiePreferences.marketing;
    }

    // ===== MEJORADO: Guardar preferencias =====
    function savePreferences() {
        if (analyticsToggle) cookiePreferences.analytics = analyticsToggle.checked;
        if (marketingToggle) cookiePreferences.marketing = marketingToggle.checked;

        // 🔥 Añadir expiración (1 año)
        const dataToSave = {
            ...cookiePreferences,
            expira: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        console.log('💾 Preferencias guardadas:', dataToSave);
        
        // 🔥 Aplicar las nuevas preferencias
        aplicarPreferencias(cookiePreferences);
        
        hideBanner();
    }

    // ===== NUEVA FUNCIÓN: Limpiar servicios previos =====
    function limpiarServiciosPrevios() {
        // Eliminar scripts de cookies previos
        const scripts = document.querySelectorAll('script[data-cookie-type]');
        scripts.forEach(script => script.remove());
        
        // Resetear variables globales
        if (window.gtag) delete window.gtag;
        if (window.fbq) window.fbq = function(){};
        if (window.dataLayer) window.dataLayer = [];
        
        console.log('🧹 Servicios previos limpiados');
    }

    // Ocultar banner
    function hideBanner() {
        banner.classList.remove('show');
        if (overlay) overlay.classList.remove('show');
        if (settingsPanel) settingsPanel.classList.remove('active');
    }

    // Aceptar todas
    function handleAcceptAll() {
        limpiarServiciosPrevios(); // Limpiar antes de aplicar nuevas
        cookiePreferences = { essential: true, analytics: true, marketing: true };
        if (analyticsToggle) analyticsToggle.checked = true;
        if (marketingToggle) marketingToggle.checked = true;
        savePreferences();
    }

    // Solo esenciales
    function handleEssentialOnly() {
        limpiarServiciosPrevios(); // Limpiar antes de aplicar nuevas
        cookiePreferences = { essential: true, analytics: false, marketing: false };
        if (analyticsToggle) analyticsToggle.checked = false;
        if (marketingToggle) marketingToggle.checked = false;
        savePreferences();
    }

    // Verificar si mostrar banner
    function checkAndShowBanner() {
        const hasPreferences = localStorage.getItem(STORAGE_KEY) !== null;

        if (!hasPreferences) {
            setTimeout(() => {
                banner.classList.add('show');
                if (overlay) overlay.classList.add('show');
            }, 1000);
        } else {
            loadPreferences();
        }
    }

    // Inicialización
    loadPreferences();
    checkAndShowBanner();

    // Event listeners
    if (acceptBtn) acceptBtn.addEventListener('click', handleAcceptAll);
    if (essentialBtn) essentialBtn.addEventListener('click', handleEssentialOnly);

    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            if (settingsPanel) settingsPanel.classList.toggle('active');
            
            // Cargar valores actuales en el panel
            if (analyticsToggle) analyticsToggle.checked = cookiePreferences.analytics;
            if (marketingToggle) marketingToggle.checked = cookiePreferences.marketing;
        });
    }

    if (settingsClose) {
        settingsClose.addEventListener('click', () => {
            settingsPanel.classList.remove('active');
        });
    }

    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            savePreferences();
            hideBanner();
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            hideBanner();
            if (settingsPanel) settingsPanel.classList.remove('active');
        });
    }

    window.InitManager.log('✅ Cookie Manager funcional activado');
});