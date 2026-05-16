/* ============================================
   FACTURAEXPRESS - ACCESSIBILITY BOOTSTRAP
   Aplica estilos de accesibilidad inmediatamente
   SIN esperar a DOMContentLoaded
   ============================================ */

(function() {
    'use strict';
    
    // Leer preferencias de accesibilidad guardadas
    // Primero intenta 'prefs', luego 'config' como respaldo
    let prefs = null;
    const rawPrefs = localStorage.getItem('facturaexpress_prefs');
    const rawConfig = localStorage.getItem('facturaexpress_config');

    const safeParse = (value) => {
        try {
            return value ? JSON.parse(value) : null;
        } catch (e) {
            return null;
        }
    };

    prefs = safeParse(rawPrefs);
    if (!prefs) {
        const configData = safeParse(rawConfig);
        if (configData && typeof configData === 'object') {
            prefs = {
                modoOscuro: configData.modoOscuro || false,
                altoContraste: configData.altoContraste || false,
                tamanoTexto: configData.tamanoTexto || 'medium'
            };
        }
    }

    if (!prefs) {
        prefs = {
            modoOscuro: false,
            altoContraste: false,
            tamanoTexto: 'medium'
        };
    }
    
    // Aplicar clases de accesibilidad al documento
    const applyBodyClass = (className, enabled) => {
        const setClass = () => {
            if (!document.body) return;
            document.body.classList.toggle(className, enabled);
        };

        if (document.body) {
            setClass();
        } else {
            document.addEventListener('DOMContentLoaded', setClass);
        }
    };

    if (prefs.modoOscuro === true) {
        document.documentElement.setAttribute('data-fx-dark-mode', 'true');
    }
    applyBodyClass('fx-dark-mode', prefs.modoOscuro === true);

    if (prefs.altoContraste === true) {
        document.documentElement.setAttribute('data-fx-high-contrast', 'true');
    }
    applyBodyClass('fx-high-contrast', prefs.altoContraste === true);

    // Aplicar tamaño de fuente
    const sizes = { small: '12px', medium: '15px', large: '18px' };
    const fontSize = sizes[prefs.tamanoTexto] || '15px';
    document.documentElement.style.fontSize = fontSize;
    
    // Inyectar solo transiciones críticas. El resto reside en styles.css
    const style = document.createElement('style');
    style.id = 'fx-accessibility-bootstrap';
    style.textContent = `
        * { transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important; }
    `;
    
    // Insertar el estilo al inicio del head
    if (document.head) {
        document.head.insertBefore(style, document.head.firstChild);
    } else {
        // Si head no está listo, esperar a que se cree
        document.addEventListener('DOMContentLoaded', function() {
            if (!document.getElementById('fx-accessibility-bootstrap')) {
                document.head.insertBefore(style, document.head.firstChild);
            }
        });
    }
    
    // Guardar las preferencias en data attributes para que core.js pueda acceder
    window.FX_ACCESSIBILITY_PREFS = prefs;
})();
