// js/ui/features/cookie-manager.ui.js

window.InitManager.register('CookieManager', function () {

    // --- Elementos del DOM ---
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

    // Si no hay banner en esta página, salir
    if (!banner) {
        console.log('🍪 No hay banner de cookies en esta página');
        return;
    }

    // --- Clave para localStorage ---
    const STORAGE_KEY = 'cookiesAccepted';
    
    // --- Tu ID de Google Analytics (CÁMBIALO POR EL TUYO) ---
    const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // ← CAMBIA ESTO

    // --- Estado de las cookies ---
    let cookiePreferences = {
        essential: true,
        analytics: false,
        marketing: false
    };

    // --- FUNCIÓN IMPORTANTE: Cargar Google Analytics ---
    function loadGoogleAnalytics() {
        if (typeof window.gtag === 'function') return; // Ya está cargado
        
        // Cargar el script de GA
        const script = document.createElement('script');
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
        script.async = true;
        document.head.appendChild(script);

        // Inicializar gtag
        window.dataLayer = window.dataLayer || [];
        window.gtag = function() { dataLayer.push(arguments); };
        gtag('js', new Date());
        gtag('config', GA_MEASUREMENT_ID, {
            'anonymize_ip': true,
            'cookie_flags': 'max-age=7200;secure;samesite=none',
            'cookie_domain': 'none'
        });
        
        console.log('📊 Google Analytics cargado');
    }

    // --- Cargar preferencias guardadas ---
    function loadPreferences() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object') {
                    cookiePreferences = {
                        essential: true,
                        analytics: parsed.analytics === true,
                        marketing: parsed.marketing === true
                    };
                }
            } catch (e) {
                console.warn("Error parsing cookie preferences", e);
            }
        }
        if (analyticsToggle) analyticsToggle.checked = cookiePreferences.analytics;
        if (marketingToggle) marketingToggle.checked = cookiePreferences.marketing;
    }

    // --- Guardar preferencias ---
    function savePreferences() {
        if (analyticsToggle) cookiePreferences.analytics = analyticsToggle.checked;
        if (marketingToggle) cookiePreferences.marketing = marketingToggle.checked;

        localStorage.setItem(STORAGE_KEY, JSON.stringify(cookiePreferences));
        console.log('💾 Preferencias guardadas:', cookiePreferences);
        
        applyConsent(cookiePreferences);
    }

    // --- Aplicar consentimiento ---
    function applyConsent(prefs) {
        console.log('🛡️ Aplicando consentimiento:', prefs);
        
        // Cargar Google Analytics SOLO si el usuario aceptó
        if (prefs.analytics) {
            loadGoogleAnalytics();
        }
        
        // Si ya hay gtag, actualizar consentimiento
        if (typeof window.gtag === 'function') {
            gtag('consent', 'update', {
                'analytics_storage': prefs.analytics ? 'granted' : 'denied',
                'ad_storage': prefs.marketing ? 'granted' : 'denied',
            });
        }
    }

    // --- Ocultar banner ---
    function hideBanner() {
        banner.classList.remove('show');
        if (overlay) overlay.classList.remove('show');
        if (settingsPanel) settingsPanel.classList.remove('active');
    }

    // --- Aceptar todas ---
    function handleAcceptAll() {
        cookiePreferences = { essential: true, analytics: true, marketing: true };
        if (analyticsToggle) analyticsToggle.checked = true;
        if (marketingToggle) marketingToggle.checked = true;
        savePreferences();
        hideBanner();
    }

    // --- Solo esenciales ---
    function handleEssentialOnly() {
        cookiePreferences = { essential: true, analytics: false, marketing: false };
        if (analyticsToggle) analyticsToggle.checked = false;
        if (marketingToggle) marketingToggle.checked = false;
        savePreferences();
        hideBanner();
    }

    // --- Verificar si mostrar banner ---
    function checkAndShowBanner() {
        const hasPreferences = localStorage.getItem(STORAGE_KEY) !== null;

        if (!hasPreferences) {
            setTimeout(() => {
                banner.classList.add('show');
                if (overlay) overlay.classList.add('show');
            }, 1000);
        } else {
            loadPreferences();
            applyConsent(cookiePreferences);
        }
    }

    // --- Inicialización ---
    loadPreferences();
    checkAndShowBanner();

    // Event listeners
    if (acceptBtn) acceptBtn.addEventListener('click', handleAcceptAll);
    if (essentialBtn) essentialBtn.addEventListener('click', handleEssentialOnly);

    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            if (settingsPanel) settingsPanel.classList.toggle('active');
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
            settingsPanel.classList.remove('active');
        });
    }

    window.InitManager.log('✅ Cookie Manager funcional con Google Analytics');
});