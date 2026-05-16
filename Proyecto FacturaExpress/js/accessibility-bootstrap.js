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
    
    // Inyectar estilos de accesibilidad base temprano
    const style = document.createElement('style');
    style.id = 'fx-accessibility-bootstrap';
    style.textContent = `
        /* Transiciones suaves para cambios de accesibilidad */
        * { transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important; }
        
        /* Modo oscuro - Variables CSS */
        body.fx-dark-mode {
            --bg-main: #1a2535;
            --text-dark: #e8f0f5;
            --text-muted: #8da0b3;
            --card-bg: #253548;
            --border: #3d4d5c;
            --sidebar-bg: #0d1117;
            background-color: #1a2535;
            color: #e8f0f5;
        }
        
        /* Aplicar modo oscuro a componentes principales */
        body.fx-dark-mode .fx-sidebar { 
            background-color: #0d1117 !important; 
            color: #e8f0f5 !important;
        }
        
        body.fx-dark-mode .fx-topbar { 
            background-color: #253548 !important; 
            color: #e8f0f5 !important;
            border-color: #3d4d5c !important;
        }
        
        body.fx-dark-mode .fx-main-area { background-color: #1a2535 !important; }
        body.fx-dark-mode .fx-content { background-color: #1a2535 !important; }
        body.fx-dark-mode .fx-footer { 
            background-color: #0d1117 !important; 
            color: #e8f0f5 !important;
            border-color: #3d4d5c !important;
        }
        
        body.fx-dark-mode .content-card { 
            background-color: #253548 !important; 
            border-color: #3d4d5c !important; 
            color: #e8f0f5 !important; 
        }
        
        body.fx-dark-mode .stat-card { 
            background-color: #253548 !important; 
            color: #e8f0f5 !important;
            border-color: #3d4d5c !important;
        }
        
        body.fx-dark-mode .config-section-card {
            background-color: #253548 !important;
            border-color: #3d4d5c !important;
            color: #e8f0f5 !important;
        }
        
        body.fx-dark-mode .client-card { 
            background-color: #253548 !important;
            border-color: #3d4d5c !important;
            color: #e8f0f5 !important;
        }
        
        body.fx-dark-mode input, 
        body.fx-dark-mode textarea, 
        body.fx-dark-mode select {
            background-color: #3d4d5c !important; 
            color: #e8f0f5 !important; 
            border-color: #5d6d7c !important;
        }
        
        body.fx-dark-mode input::placeholder {
            color: #8da0b3 !important;
        }
        
        body.fx-dark-mode .input-field > label {
            color: #8da0b3 !important;
        }
        
        body.fx-dark-mode table { 
            color: #e8f0f5 !important; 
            border-color: #3d4d5c !important;
        }
        
        body.fx-dark-mode table th { 
            background-color: #0d1117 !important; 
            color: #e8f0f5 !important;
            border-color: #3d4d5c !important;
        }
        
        body.fx-dark-mode table td { 
            border-color: #3d4d5c !important; 
        }
        
        body.fx-dark-mode .modal { 
            background-color: #253548 !important; 
            color: #e8f0f5 !important;
        }
        
        body.fx-dark-mode .modal-content {
            background-color: #253548 !important;
            color: #e8f0f5 !important;
        }
        
        body.fx-dark-mode .btn-flat { 
            color: #1abc9c !important; 
        }
        
        body.fx-dark-mode .btn-teal {
            background-color: #1abc9c !important;
            color: #fff !important;
        }
        
        body.fx-dark-mode .badge-status { 
            background-color: #3d4d5c !important;
            color: #e8f0f5 !important;
        }
        
        body.fx-dark-mode .fx-nav-item {
            color: #8da0b3 !important;
        }
        
        body.fx-dark-mode .fx-nav-item.fx-active {
            background-color: rgba(26, 188, 156, 0.1) !important;
            color: #1abc9c !important;
        }
        
        body.fx-dark-mode .fx-nav-item:hover {
            background-color: rgba(255,255,255,0.05) !important;
            color: #e8f0f5 !important;
        }
        
        /* Alto contraste */
        body.fx-high-contrast {
            --text-dark: #000000;
            --text-muted: #333333;
        }
        
        body.fx-high-contrast button, 
        body.fx-high-contrast .btn {
            border-width: 2px !important;
            font-weight: 700 !important;
        }
        
        body.fx-high-contrast .stat-card { 
            border-left-width: 4px !important; 
            border-color: #1abc9c !important; 
        }
        
        body.fx-high-contrast input, 
        body.fx-high-contrast textarea, 
        body.fx-high-contrast select {
            border-width: 2px !important;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .fx-accessibility-controls .accessibility-option span {
                display: none !important;
            }
        }
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
