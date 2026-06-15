/* ============================================
   FACTURAEXPRESS - CORE MODULE
   Funciones globales y configuración central
   ============================================ */

const FacturaExpress = {
    // Configuración global
    config: {
        version: '2.1.0',
        empresaId: '9001234567',
        nombreEmpresa: 'Industrias Metalúrgicas S.A.S',
        apiUrl: 'https://api.facturaexpress.com/v1',
        dianStatus: 'sincronizado',
        IVA_RATE: 0.19
    },
    
    // Estado de la aplicación
    state: {
        isLoggedIn: false,
        currentUser: {
            id: 1,
            nombre: null,
            rol: null,
            email: null,
            avatar: null
        },
        notificaciones: [],
        configuracion: {
            modoOscuro: false,
            altoContraste: false,
            tamanoTexto: 'medium'
        },
        hasUnsavedChanges: false
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
        
        showDialog: (options = {}) => {
            const {
                title = 'FacturaExpress',
                message = '',
                type = 'info',
                confirmText = 'Aceptar',
                cancelText = null,
                onConfirm = null,
                onCancel = null,
                input = false,
                inputType = 'text',
                inputLabel = '',
                inputValue = ''
            } = options;

            const existing = document.getElementById('fx-dialog-overlay');
            if (existing) existing.remove();

            const overlay = document.createElement('div');
            overlay.id = 'fx-dialog-overlay';
            overlay.className = 'fx-dialog-overlay';

            const icons = { success: 'check_circle', error: 'error', warning: 'warning', info: 'info' };
            const iconColors = { success: '#1abc9c', error: '#e74c3c', warning: '#f39c12', info: '#3498db' };

            overlay.innerHTML = `
                <div class="fx-dialog-box">
                    <div class="fx-dialog-header">
                        <i class="material-icons fx-dialog-icon" style="color:${iconColors[type] || '#3498db'};">${icons[type] || 'info'}</i>
                        <h5 class="fx-dialog-title">${title}</h5>
                    </div>
                    <p class="fx-dialog-message" style="margin-bottom:${input ? '8px' : '20px'};">${message}</p>
                    ${input ? `<div class="input-field"><input id="fx-dialog-input" type="${inputType}" value="${inputValue}"><label for="fx-dialog-input" class="active">${inputLabel}</label></div>` : ''}
                    <div class="fx-dialog-actions">
                        ${cancelText ? `<button id="fx-dialog-cancel" class="btn btn-cancel-compact">${cancelText}</button>` : ''}
                        <button id="fx-dialog-confirm" class="btn btn-teal">${confirmText}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            return new Promise((resolve) => {
                const confirmBtn = document.getElementById('fx-dialog-confirm');
                const cancelBtn = document.getElementById('fx-dialog-cancel');
                const inputEl = document.getElementById('fx-dialog-input');

                const close = (result) => {
                    overlay.remove();
                    resolve(result);
                    if (result && onConfirm) onConfirm(result);
                    else if (!result && onCancel) onCancel();
                };

                confirmBtn.addEventListener('click', () => {
                    close(inputEl ? inputEl.value : true);
                });

                if (cancelBtn) {
                    cancelBtn.addEventListener('click', () => close(null));
                }

                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay && cancelBtn) close(null);
                });

                document.addEventListener('keydown', function handler(e) {
                    if (e.key === 'Escape' && document.getElementById('fx-dialog-overlay')) {
                        close(null);
                        document.removeEventListener('keydown', handler);
                    }
                });

                if (inputEl) setTimeout(() => inputEl.focus(), 100);
            });
        },

        showConfirm: async (message, title = 'Confirmar') => {
            return await FacturaExpress.utils.showDialog({
                title,
                message,
                type: 'warning',
                confirmText: 'Sí',
                cancelText: 'Cancelar'
            });
        },

        showAlert: async (message, title = 'FacturaExpress', type = 'info') => {
            return await FacturaExpress.utils.showDialog({
                title,
                message,
                type,
                confirmText: 'Aceptar'
            });
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
        
        calcularIVA: (base) => {
            return base * FacturaExpress.config.IVA_RATE;
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
                showLogoutBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    if (logoutModal) {
                        this.updateSessionInfo();
                        logoutModal.open();
                    } else {
                        const res = await FacturaExpress.utils.showConfirm('¿Cerrar sesión?');
                        if (res) performLogout();
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
                const iva = FacturaExpress.utils.calcularIVA(base);
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
    // MANAGER DE EVENTOS - Usa event delegation
    // ============================================
    EventManager: {
        _delegations: [],

        delegate: function(containerSelector, selector, eventType, handler, context) {
            const container = document.querySelector(containerSelector);
            if (!container) return;

            const wrappedHandler = function(e) {
                const target = e.target.closest(selector);
                if (target && container.contains(target)) {
                    handler.call(context, e, target);
                }
            };

            container.addEventListener(eventType, wrappedHandler);

            this._delegations.push({
                container, selector, eventType, handler: wrappedHandler
            });
        },

        cleanup: function() {
            this._delegations.forEach(d => {
                d.container.removeEventListener(d.eventType, d.handler);
            });
            this._delegations = [];
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
                    ventasPorDia[indice] += (factura.total || 0);
                }
            });
            
            return diasSemana.slice(0, days).map((dia, i) => ({
                dia,
                monto: ventasPorDia[i]
            }));
        }
    },
    
    // Verificación de autenticación
    checkAuth: function() {
        const path = window.location.pathname.toLowerCase();
        const isLoginPage = path.includes('login.html');
        const sessionActive = this.storage.get('session_active', false);
        
        // Si estamos en la raíz o página vacía, redirigir según sesión
        if (path === '/' || path.endsWith('/')) {
            window.location.href = sessionActive ? 'index.html' : 'login.html';
            return false;
        }

        if (!sessionActive && !isLoginPage) {
            window.location.href = 'login.html';
            return false;
        }
        
        // Si ya hay sesión y estamos en login, ir al dashboard
        if (sessionActive && isLoginPage) {
            window.location.href = 'index.html';
            return false;
        }
        
        this.state.isLoggedIn = !!sessionActive;
        if (sessionActive) this.state.currentUser = this.storage.get('user_data', this.state.currentUser);
        return true;
    },

    // Sincronizar datos del usuario con la interfaz (Topbar, Modales, etc)
    syncUserInterface: function() {
        if (!this.state.isLoggedIn) return;
        
        const nameElems = document.querySelectorAll('.fx-topbar-user-name, #sessionUser, #modalSessionUser');
        const roleElems = document.querySelectorAll('.fx-topbar-user-role, #sessionRole, #modalSessionRole');
        
        nameElems.forEach(el => el.textContent = this.state.currentUser.nombre || 'Usuario');
        roleElems.forEach(el => el.textContent = this.state.currentUser.rol || 'Consultor');
    },

    // Inyectar modal de logout dinámicamente (evita duplicar HTML en cada página)
    injectLogoutModal: function() {
        if (document.getElementById('logoutModal')) return;

        const modalHTML = `
        <div id="logoutModal" class="modal logout-modal">
          <div class="modal-content">
            <div class="logout-header">
              <div class="logout-icon">
                <i class="material-icons">exit_to_app</i>
              </div>
              <h4>¿Cerrar sesión?</h4>
              <p>Estás a punto de salir del sistema</p>
            </div>
            <div class="logout-body">
              <div class="warning-compact">
                <i class="material-icons">warning</i>
                <div>
                  <strong>¡Atención!</strong>
                  <span> Los cambios no guardados se perderán</span>
                </div>
              </div>
              <div class="session-compact">
                <div class="session-title-compact">
                  <i class="material-icons tiny">info</i>
                  INFORMACIÓN DE SESIÓN
                </div>
                <div class="session-grid">
                  <div class="session-item">
                    <span class="session-label-compact">Usuario</span>
                    <span class="session-value-compact" id="sessionUser">--</span>
                  </div>
                  <div class="session-item">
                    <span class="session-label-compact">Rol</span>
                    <span class="session-value-compact" id="sessionRole">--</span>
                  </div>
                  <div class="session-item">
                    <span class="session-label-compact">Sesión activa</span>
                    <span class="session-value-compact" id="sessionTime">--</span>
                  </div>
                  <div class="session-item">
                    <span class="session-label-compact">Última actividad</span>
                    <span class="session-value-compact" id="lastActivity">--</span>
                  </div>
                </div>
              </div>
              <div class="modal-buttons-compact">
                <button class="btn btn-cancel-compact modal-close">
                  <i class="material-icons left" style="font-size: 16px;">close</i>
                  Cancelar
                </button>
                <button class="btn btn-logout-compact" id="confirmLogoutBtn">
                  <i class="material-icons left" style="font-size: 16px;">logout</i>
                  Salir Ahora
                </button>
              </div>
              <div class="security-note-compact">
                <span class="pulse-dot"></span>
                <span>Serás redirigido al inicio de sesión</span>
              </div>
            </div>
          </div>
        </div>
        <div id="loadingOverlay" class="logout-loading">
          <div class="loading-content">
            <div class="preloader-wrapper small active">
              <div class="spinner-layer spinner-green-only">
                <div class="circle-clipper left"><div class="circle"></div></div>
                <div class="gap-patch"><div class="circle"></div></div>
                <div class="circle-clipper right"><div class="circle"></div></div>
              </div>
            </div>
            <p>Cerrando sesión...</p>
          </div>
        </div>`;

        const wrapper = document.createElement('div');
        wrapper.innerHTML = modalHTML;
        while (wrapper.firstChild) {
            document.body.appendChild(wrapper.firstChild);
        }
    },

    // Inicialización
    init: function() {
        if (!this.checkAuth()) return;
        
        // Limpiar bandera persistente antigua para corregir el comportamiento molesto
        this.storage.remove('unsaved_changes');

        console.log(`FacturaExpress v${this.config.version} inicializado`);
        this.loadPreferences();
        this.applyAccessibilitySettings();
        this.injectLogoutModal();
        this.setupGlobalListeners();
        this.injectAccessibilityStyles();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.syncUserInterface();
                this.accessibility.setupControls();
                this.common.init();
            });
        } else {
            this.syncUserInterface();
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
        // No activar la advertencia de cambios sin guardar en la página de login
        if (window.location.pathname.includes('login.html')) return;

        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.state.hasUnsavedChanges = true;
            });
        });
        
        window.addEventListener('beforeunload', (e) => {
            if (this.state.hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'Hay cambios sin guardar. ¿Estás seguro?';
            }
        });
        
        // Limpiar bandera al guardar
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-teal') || e.target.closest('#guardarEmpresa')) {
                setTimeout(() => {
                    this.state.hasUnsavedChanges = false;
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