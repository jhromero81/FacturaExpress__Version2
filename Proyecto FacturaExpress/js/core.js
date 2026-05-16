/* ============================================
   FACTURAEXPRESS - CORE MODULE
   Funciones globales y configuración central
   ============================================ */

const FacturaExpress = {
    // Configuración global
    config: {
        version: '2.0.0',
        empresaId: '9001234567',
        nombreEmpresa: 'Industrias Metalúrgicas S.A.S',
        apiUrl: 'https://api.facturaexpress.com/v1',
        dianStatus: 'sincronizado'
    },
    
    // Estado de la aplicación
    state: {
        isLoggedIn: true,
        currentUser: {
            id: 1,
            nombre: 'Jhon H. Romero',
            rol: 'Administrador',
            email: 'jhon.romero@facturaexpress.com',
            avatar: null
        },
        notificaciones: [],
        configuracion: {
            modoOscuro: false,
            altoContraste: false,
            tamanoTexto: 'medium'
        }
    },
    
    // Utilidades y helpers
    utils: {
        formatMoney: (amount) => {
            if (!amount && amount !== 0) return '$0';
            return new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount);
        },
        
        formatDate: (date, format = 'dd/mm/yyyy') => {
            const d = date instanceof Date ? date : new Date(date);
            if (isNaN(d.getTime())) return 'Fecha inválida';
            
            const day = d.getDate().toString().padStart(2, '0');
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const year = d.getFullYear();
            const hours = d.getHours().toString().padStart(2, '0');
            const minutes = d.getMinutes().toString().padStart(2, '0');
            
            switch(format) {
                case 'dd/mm/yyyy': return `${day}/${month}/${year}`;
                case 'dd/mm/yyyy hh:mm': return `${day}/${month}/${year} ${hours}:${minutes}`;
                case 'hh:mm': return `${hours}:${minutes}`;
                default: return `${day}/${month}/${year}`;
            }
        },
        
        generateInvoiceNumber: () => {
            const date = new Date();
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const sequence = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
            return `FAC-${year}${month}-${sequence}`;
        },
        
        showToast: (message, type = 'success') => {
            if (typeof M !== 'undefined' && M.toast) {
                const colors = {
                    success: '#1abc9c',
                    error: '#e74c3c',
                    warning: '#f39c12',
                    info: '#3498db'
                };
                M.toast({
                    html: `<i class="material-icons left" style="font-size:16px;">${
                        type === 'success' ? 'check_circle' : 
                        type === 'error' ? 'error' : 
                        type === 'warning' ? 'warning' : 'info'
                    }</i>${message}`,
                    classes: `rounded ${colors[type]}`,
                    displayLength: 3000
                });
            } else {
                console.log(`[${type.toUpperCase()}] ${message}`);
            }
        },
        
        validateNIT: (nit) => {
            const nitRegex = /^\d{1,9}-\d{1}$/;
            return nitRegex.test(nit);
        },
        
        validateEmail: (email) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },
        
        validatePhone: (phone) => {
            const phoneRegex = /^[0-9+\-\s]{7,15}$/;
            return phoneRegex.test(phone);
        },
        
        calculatePercentage: (value, total) => {
            if (!total || total === 0) return 0;
            return Math.round((value / total) * 100);
        },
        
        debounce: (func, delay) => {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), delay);
            };
        }
    },
    
    // Gestión de almacenamiento
    storage: {
        set: (key, data) => {
            try {
                localStorage.setItem(`facturaexpress_${key}`, JSON.stringify(data));
                return true;
            } catch (e) {
                console.error('Error al guardar:', e);
                return false;
            }
        },
        
        get: (key, defaultValue = null) => {
            try {
                const data = localStorage.getItem(`facturaexpress_${key}`);
                return data ? JSON.parse(data) : defaultValue;
            } catch (e) {
                console.error('Error al leer:', e);
                return defaultValue;
            }
        },
        
        remove: (key) => {
            localStorage.removeItem(`facturaexpress_${key}`);
        },
        
        clearSession: () => {
            const prefs = localStorage.getItem('facturaexpress_prefs');
            const config = localStorage.getItem('facturaexpress_config');
            
            localStorage.clear();
            sessionStorage.clear();
            
            if (prefs) localStorage.setItem('facturaexpress_prefs', prefs);
            if (config) localStorage.setItem('facturaexpress_config', config);
        }
    },
    
    // ============================================
    // SISTEMA DE ACCESIBILIDAD GLOBAL CON CONTROLES EN TOPBAR
    // ============================================
    
    accessibility: {
        // Aplicar todas las preferencias guardadas
        applyAll: function() {
            const prefs = FacturaExpress.state.configuracion;
            this.applyDarkMode(prefs.modoOscuro);
            this.applyHighContrast(prefs.altoContraste);
            this.applyFontSize(prefs.tamanoTexto);
            // Actualizar estilos visuales de los controles después de aplicar
            setTimeout(() => this.updateControlStyles(), 100);
        },
        
        // Aplicar modo oscuro
        applyDarkMode: function(enabled) {
            if (enabled) {
                document.body.classList.add('fx-dark-mode');
            } else {
                document.body.classList.remove('fx-dark-mode');
            }
        },
        
        // Aplicar alto contraste
        applyHighContrast: function(enabled) {
            if (enabled) {
                document.body.classList.add('fx-high-contrast');
            } else {
                document.body.classList.remove('fx-high-contrast');
            }
        },
        
        // Aplicar tamaño de fuente
        applyFontSize: function(size) {
            const sizes = { small: '12px', medium: '15px', large: '18px' };
            document.body.style.fontSize = sizes[size] || '15px';
            
            // Ajustar tamaños específicos para elementos importantes
            const statValues = document.querySelectorAll('.stat-value');
            const configTitles = document.querySelectorAll('.config-title h3');
            const totalVal = document.querySelectorAll('.total-val');
            
            const statSizes = { small: '20px', medium: '26px', large: '32px' };
            const titleSizes = { small: '1.1rem', medium: '1.35rem', large: '1.6rem' };
            
            statValues.forEach(el => {
                el.style.fontSize = statSizes[size] || '26px';
            });
            
            configTitles.forEach(el => {
                el.style.fontSize = titleSizes[size] || '1.35rem';
            });
            
            totalVal.forEach(el => {
                el.style.fontSize = size === 'large' ? '34px' : size === 'small' ? '22px' : '28px';
            });
        },
        
        // Alternar modo oscuro
        toggleDarkMode: function() {
            const newState = !FacturaExpress.state.configuracion.modoOscuro;
            FacturaExpress.state.configuracion.modoOscuro = newState;
            this.applyDarkMode(newState);
            FacturaExpress.storage.set('prefs', FacturaExpress.state.configuracion);
            this.updateControlStyles();
            return newState;
        },
        
        // Alternar alto contraste
        toggleHighContrast: function() {
            const newState = !FacturaExpress.state.configuracion.altoContraste;
            FacturaExpress.state.configuracion.altoContraste = newState;
            this.applyHighContrast(newState);
            FacturaExpress.storage.set('prefs', FacturaExpress.state.configuracion);
            this.updateControlStyles();
            return newState;
        },
        
        // Cambiar tamaño de texto
        setFontSize: function(size) {
            if (!['small', 'medium', 'large'].includes(size)) return;
            FacturaExpress.state.configuracion.tamanoTexto = size;
            this.applyFontSize(size);
            FacturaExpress.storage.set('prefs', FacturaExpress.state.configuracion);
            this.updateControlStyles();
        },
        
        // Actualizar estilos visuales de los controles en el TOPBAR
        updateControlStyles: function() {
            const darkModeControl = document.getElementById('darkModeControl');
            const highContrastControl = document.getElementById('highContrastControl');
            const fontSizeSelect = document.getElementById('fontSizeControl');
            
            // Actualizar estilo del botón de modo oscuro
            if (darkModeControl) {
                if (FacturaExpress.state.configuracion.modoOscuro) {
                    darkModeControl.style.background = '#1abc9c';
                    darkModeControl.style.color = 'white';
                    const icon = darkModeControl.querySelector('i');
                    const span = darkModeControl.querySelector('span');
                    if (icon) icon.style.color = 'white';
                    if (span) span.style.color = 'white';
                } else {
                    darkModeControl.style.background = 'rgba(26,188,156,0.1)';
                    darkModeControl.style.color = '#1abc9c';
                    const icon = darkModeControl.querySelector('i');
                    const span = darkModeControl.querySelector('span');
                    if (icon) icon.style.color = '#1abc9c';
                    if (span) span.style.color = '#1abc9c';
                }
            }
            
            // Actualizar estilo del botón de alto contraste
            if (highContrastControl) {
                if (FacturaExpress.state.configuracion.altoContraste) {
                    highContrastControl.style.background = '#1abc9c';
                    highContrastControl.style.color = 'white';
                    const icon = highContrastControl.querySelector('i');
                    const span = highContrastControl.querySelector('span');
                    if (icon) icon.style.color = 'white';
                    if (span) span.style.color = 'white';
                } else {
                    highContrastControl.style.background = 'rgba(26,188,156,0.1)';
                    highContrastControl.style.color = '#1abc9c';
                    const icon = highContrastControl.querySelector('i');
                    const span = highContrastControl.querySelector('span');
                    if (icon) icon.style.color = '#1abc9c';
                    if (span) span.style.color = '#1abc9c';
                }
            }
            
            // Actualizar selector de tamaño
            if (fontSizeSelect) {
                fontSizeSelect.value = FacturaExpress.state.configuracion.tamanoTexto;
            }
        },
        
        // Configurar controles de accesibilidad en el TOPBAR
        setupControls: function() {
            const darkModeControl = document.getElementById('darkModeControl');
            const highContrastControl = document.getElementById('highContrastControl');
            const fontSizeSelect = document.getElementById('fontSizeControl');
            
            if (darkModeControl) {
                // Remover event listeners antiguos para evitar duplicados
                const newDarkModeControl = darkModeControl.cloneNode(true);
                darkModeControl.parentNode.replaceChild(newDarkModeControl, darkModeControl);
                
                newDarkModeControl.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleDarkMode();
                    const estado = FacturaExpress.state.configuracion.modoOscuro ? 'activado' : 'desactivado';
                    FacturaExpress.utils.showToast(`Modo oscuro ${estado}`, 'info');
                });
            }
            
            if (highContrastControl) {
                const newHighContrastControl = highContrastControl.cloneNode(true);
                highContrastControl.parentNode.replaceChild(newHighContrastControl, highContrastControl);
                
                newHighContrastControl.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleHighContrast();
                    const estado = FacturaExpress.state.configuracion.altoContraste ? 'activado' : 'desactivado';
                    FacturaExpress.utils.showToast(`Alto contraste ${estado}`, 'info');
                });
            }
            
            if (fontSizeSelect) {
                const newFontSizeSelect = fontSizeSelect.cloneNode(true);
                fontSizeSelect.parentNode.replaceChild(newFontSizeSelect, fontSizeSelect);
                
                newFontSizeSelect.addEventListener('change', (e) => {
                    this.setFontSize(e.target.value);
                    const sizeText = e.target.options[e.target.selectedIndex].text;
                    FacturaExpress.utils.showToast(`Tamaño de texto: ${sizeText}`, 'success');
                });
            }
            
            // Actualizar estilos iniciales
            this.updateControlStyles();
        }
    },

    common: {
        init: function() {
            if (typeof M !== 'undefined' && typeof M.AutoInit === 'function') {
                M.AutoInit();
            }
            this.setupLogoutModal();
        },

        setupLogoutModal: function() {
            const logoutModalElem = document.getElementById('logoutModal');
            const showLogoutBtn = document.getElementById('showLogoutBtn');
            const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
            const loadingOverlay = document.getElementById('loadingOverlay');

            if (!logoutModalElem && !showLogoutBtn && !confirmLogoutBtn) {
                return;
            }

            let logoutModal = null;
            if (logoutModalElem && typeof M !== 'undefined' && M.Modal) {
                logoutModal = M.Modal.init(logoutModalElem, {
                    dismissible: false,
                    opacity: 0.7,
                    onOpenStart: () => {
                        this.updateSessionInfo();
                    }
                });
            }

            const updateLastActivity = () => {
                localStorage.setItem('facturaexpress_last_activity', new Date().toISOString());
            };

            const performLogout = () => {
                if (loadingOverlay) loadingOverlay.classList.add('active');

                const logoutEvent = {
                    timestamp: new Date().toISOString(),
                    user: FacturaExpress.state.currentUser?.nombre || 'Usuario',
                    userAgent: navigator.userAgent
                };

                const logoutLogs = JSON.parse(localStorage.getItem('facturaexpress_logout_logs') || '[]');
                logoutLogs.push(logoutEvent);
                if (logoutLogs.length > 20) logoutLogs.shift();
                localStorage.setItem('facturaexpress_logout_logs', JSON.stringify(logoutLogs));

                setTimeout(() => {
                    const accessibilityPrefs = localStorage.getItem('facturaexpress_prefs');
                    const configuracion = localStorage.getItem('facturaexpress_config');

                    localStorage.clear();
                    sessionStorage.clear();

                    if (accessibilityPrefs) localStorage.setItem('facturaexpress_prefs', accessibilityPrefs);
                    if (configuracion) localStorage.setItem('facturaexpress_config', configuracion);

                    window.location.href = 'login.html';
                }, 600);
            };

            if (showLogoutBtn) {
                showLogoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (logoutModal) {
                        this.updateSessionInfo();
                        logoutModal.open();
                    } else if (confirm('¿Cerrar sesión?')) {
                        performLogout();
                    }
                });
            }

            if (confirmLogoutBtn) {
                confirmLogoutBtn.addEventListener('click', () => {
                    if (logoutModal) logoutModal.close();
                    performLogout();
                });
            }

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && logoutModal && logoutModal.isOpen) {
                    logoutModal.close();
                }
            });

            updateLastActivity();
            ['click', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(evt => {
                document.addEventListener(evt, updateLastActivity);
            });
        },

        updateSessionInfo: function() {
            const getElapsedText = (start) => {
                const diffMinutes = Math.floor((new Date() - new Date(start)) / 1000 / 60);
                if (diffMinutes < 1) return '< 1 min';
                if (diffMinutes === 1) return '1 min';
                if (diffMinutes < 60) return `${diffMinutes} min`;
                const hours = Math.floor(diffMinutes / 60);
                return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
            };

            const sessionStartTime = localStorage.getItem('facturaexpress_login_time') || new Date().toISOString();
            if (!localStorage.getItem('facturaexpress_login_time')) {
                localStorage.setItem('facturaexpress_login_time', sessionStartTime);
            }

            const sessionTimeElem = document.getElementById('sessionTime');
            const modalSessionTimeElem = document.getElementById('modalSessionTime');
            if (sessionStartTime) {
                const text = getElapsedText(sessionStartTime);
                if (sessionTimeElem) sessionTimeElem.textContent = text;
                if (modalSessionTimeElem) modalSessionTimeElem.textContent = text;
            }

            const lastActivityTime = localStorage.getItem('facturaexpress_last_activity');
            const lastActivityElem = document.getElementById('lastActivity');
            if (lastActivityTime && lastActivityElem) {
                const now = new Date();
                const last = new Date(lastActivityTime);
                const diffMinutes = Math.floor((now - last) / 1000 / 60);
                if (diffMinutes < 1) lastActivityElem.textContent = 'Ahora';
                else if (diffMinutes === 1) lastActivityElem.textContent = '1 min';
                else if (diffMinutes < 60) lastActivityElem.textContent = `${diffMinutes} min`;
                else lastActivityElem.textContent = `${Math.floor(diffMinutes / 60)} h`;
            }
        }
    },
    
    // ============================================
    // MANAGER DE MÓDULOS - Estandariza la inicialización
    // ============================================
    ModuleManager: {
        createModule: function(moduleName, moduleObj) {
            // Template de inicialización genérica si no existe
            if (!moduleObj.init) {
                moduleObj.init = function() {
                    console.log(`Módulo de ${moduleName} inicializado`);
                    if (this.loadData) this.loadData();
                    if (this.setupEventListeners) this.setupEventListeners();
                    if (this.render) this.render();
                };
            }
            return moduleObj;
        }
    },
    
    // ============================================
    // MANAGER DE DATOS - Consolida carga/generación de datos
    // ============================================
    DataManager: {
        loadOrGenerate: function(key, exampleDataFactory, options = {}) {
            let data = FacturaExpress.storage.get(key, []);
            
            if (data.length === 0 && exampleDataFactory) {
                data = exampleDataFactory(options);
                FacturaExpress.storage.set(key, data);
            }
            
            return data;
        },
        
        loadMultiple: function(configs) {
            const result = {};
            configs.forEach(config => {
                result[config.key] = this.loadOrGenerate(
                    config.key,
                    config.factory,
                    config.options
                );
            });
            return result;
        }
    },
    
    // ============================================
    // GENERADOR DE DATOS DE EJEMPLO - Centralizado
    // ============================================
    SampleData: {
        clientes: [
            'Maria Fernanda Gomez', 'Carlos Rodriguez', 'Juan Perez',
            'Luis Hernandez', 'Ana Martinez', 'Sofia Torres',
            'Diego Ramirez', 'Valentina Castro'
        ],
        
        generarFacturasEjemplo: function(cantidad = 25) {
            const facturasEjemplo = [];
            
            for (let i = 1; i <= cantidad; i++) {
                const fecha = new Date();
                fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 30));
                
                const estado = ['enviado', 'enviado', 'enviado', 'pendiente', 'procesando'][
                    Math.floor(Math.random() * 5)
                ];
                
                const base = Math.floor(Math.random() * 500000) + 50000;
                const iva = base * 0.19;
                const total = base + iva;
                
                facturasEjemplo.push({
                    id: i,
                    numero: FacturaExpress.utils.generateInvoiceNumber(),
                    fecha: fecha.toISOString(),
                    cliente: this.clientes[Math.floor(Math.random() * this.clientes.length)],
                    clienteIdentificacion: `900${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
                    estado: estado,
                    subtotal: base,
                    iva: iva,
                    monto: total,
                    total: total,
                    items: [
                        { 
                            nombre: 'Producto Ejemplo', 
                            cantidad: Math.floor(Math.random() * 5) + 1, 
                            precio: Math.floor(base / 3) 
                        }
                    ],
                    pdfUrl: '#',
                    xmlUrl: '#'
                });
            }
            
            return facturasEjemplo.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        }
    },
    
    // ============================================
    // MANAGER DE EVENTOS - Abstrae setup de handlers
    // ============================================
    EventManager: {
        attachHandlers: function(context, selectorConfigs) {
            selectorConfigs.forEach(config => {
                const elements = document.querySelectorAll(config.selector);
                elements.forEach(el => {
                    el.removeEventListener('click', config.handler);
                    el.addEventListener('click', config.handler.bind(context));
                });
            });
        }
    },
    
    // ============================================
    // UTILIDADES DE CÁLCULO - Operaciones comunes
    // ============================================
    CalculationUtils: {
        calculateVariation: function(current, previous) {
            if (!previous || previous === 0) return 0;
            return Math.round(((current - previous) / previous) * 100);
        },
        
        calculateDailySalesData: function(facturas, days = 7) {
            const ventasPorDia = new Array(days).fill(0);
            const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            const hoy = new Date();
            
            facturas.forEach(factura => {
                const fechaFactura = new Date(factura.fecha);
                const diffDias = Math.floor((hoy - fechaFactura) / (1000 * 60 * 60 * 24));
                const indice = days - 1 - diffDias;
                
                if (indice >= 0 && indice < days) {
                    ventasPorDia[indice] += (factura.total || factura.monto || 0);
                }
            });
            
            return diasSemana.slice(0, days).map((dia, i) => ({
                dia,
                monto: ventasPorDia[i]
            }));
        }
    },
    
    // Inicialización
    init: function() {
        console.log(`FacturaExpress v${this.config.version} inicializado`);
        this.loadPreferences();
        this.applyAccessibilitySettings();
        this.setupGlobalListeners();
        this.injectAccessibilityStyles();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.accessibility.setupControls();
                this.common.init();
            });
        } else {
            this.accessibility.setupControls();
            this.common.init();
        }
    },

    // Cargar preferencias del usuario
    loadPreferences: function() {
        const savedPrefs = this.storage.get('prefs');
        if (savedPrefs) {
            this.state.configuracion = savedPrefs;
        }
    },
    
    // Aplicar configuración de accesibilidad
    applyAccessibilitySettings: function() {
        this.accessibility.applyAll();
    },
    
    // Inyectar estilos base de accesibilidad
    injectAccessibilityStyles: function() {
        if (document.getElementById('fx-accessibility-base')) return;
        
        const style = document.createElement('style');
        style.id = 'fx-accessibility-base';
        style.textContent = `
            /* Transiciones suaves para cambios de accesibilidad */
            body, .stat-card, .content-card, .config-section-card, 
            .client-card, .fx-sidebar, .fx-topbar, .fx-footer, 
            .btn, .modal, .modal .modal-content {
                transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
            }
            
            /* Hover effects para controles de accesibilidad */
            .accessibility-option {
                cursor: pointer !important;
                transition: all 0.2s ease !important;
            }
            
            .accessibility-option:hover {
                transform: scale(1.02) !important;
                background: rgba(26,188,156,0.2) !important;
            }
            
            /* Estilos para el selector de tamaño */
            #fontSizeControl {
                cursor: pointer !important;
                outline: none !important;
            }
            
            /* Responsive: ocultar textos en móviles */
            @media (max-width: 768px) {
                .fx-accessibility-controls .accessibility-option span {
                    display: none !important;
                }
                .fx-accessibility-controls .accessibility-option {
                    padding: 5px 8px !important;
                }
            }
        `;
        document.head.appendChild(style);
    },
    
    // Configurar event listeners globales
    setupGlobalListeners: function() {
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.storage.set('unsaved_changes', true);
            });
        });
        
        window.addEventListener('beforeunload', (e) => {
            if (this.storage.get('unsaved_changes')) {
                e.preventDefault();
                e.returnValue = 'Hay cambios sin guardar. ¿Estás seguro?';
            }
        });
        
        // Limpiar bandera al guardar
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-teal') || e.target.closest('#guardarEmpresa')) {
                setTimeout(() => {
                    this.storage.set('unsaved_changes', false);
                }, 500);
            }
        });
    }
};

// Inicializar automáticamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        FacturaExpress.init();
    });
} else {
    FacturaExpress.init();
}