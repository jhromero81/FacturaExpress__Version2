/* ============================================
   FACTURAEXPRESS - CONFIGURACION MODULE
   Configuración del sistema y preferencias
   ============================================ */

const ConfiguracionModule = {
    // Estado del módulo
    state: {
        configuracion: {
            empresa: {
                nit: '900.123.456-7',
                razonSocial: 'Industrias Metalúrgicas S.A.S',
                email: 'facturacion@metalurgicasas.com',
                telefono: '+57 601 555 7890',
                direccion: 'Calle 123 #45-67, Bogotá'
            },
            fiscal: {
                resolucionDIAN: '18764000001',
                certificadoVence: '2026-06-15',
                ultimaSincronizacion: new Date().toLocaleString()
            },
            notificaciones: {
                email: true,
                push: true,
                alertasFacturacion: true,
                recordatorios: true
            },
            seguridad: {
                ultimoCambioPass: '10 de febrero 2026',
                dispositivosConectados: 2,
                ultimoAcceso: 'IP 190.84.45.12 - Bogotá, hace 12 min',
                dosFactoresActivo: false
            }
        }
    },
    
    // Inicializar módulo
    init: function() {
        console.log('Módulo de Configuración inicializado');
        this.loadConfiguracion();
        this.renderConfiguracion();
        this.setupEventListeners();
        this.setupAccesibilidad();  // ← Inicializar accesibilidad
    },
    
    // Cargar configuración desde localStorage
    loadConfiguracion: function() {
        const saved = FacturaExpress.storage.get('config');
        if (saved) {
            this.state.configuracion = saved;
        }
    },
    
    // Guardar configuración
    saveConfiguracion: function() {
        FacturaExpress.storage.set('config', this.state.configuracion);
    },
    
    // Renderizar configuración en la UI
    renderConfiguracion: function() {
        // Datos de la empresa
        const nitInput = document.getElementById('nit_empresa');
        const razonInput = document.getElementById('razon_social');
        const emailInput = document.getElementById('email_facturacion');
        const telefonoInput = document.getElementById('telefono_empresa');
        
        if (nitInput) nitInput.value = this.state.configuracion.empresa.nit;
        if (razonInput) razonInput.value = this.state.configuracion.empresa.razonSocial;
        if (emailInput) emailInput.value = this.state.configuracion.empresa.email;
        if (telefonoInput) telefonoInput.value = this.state.configuracion.empresa.telefono;
        
        // Datos fiscales
        const resolucionSpan = document.getElementById('resolucionDIAN');
        const certificadoSpan = document.getElementById('certificadoVence');
        const sincronizacionSpan = document.getElementById('ultimaSincronizacion');
        
        if (resolucionSpan) {
            resolucionSpan.innerHTML = `<i class="material-icons tiny card-title-icon">receipt</i> ${this.state.configuracion.fiscal.resolucionDIAN}`;
        }
        
        if (certificadoSpan) {
            const diasRestantes = this.calcularDiasRestantes(this.state.configuracion.fiscal.certificadoVence);
            certificadoSpan.innerHTML = `<i class="material-icons tiny">schedule</i> Vence en ${diasRestantes} días`;
            if (diasRestantes <= 30) {
                certificadoSpan.style.background = 'rgba(231, 76, 60, 0.2)';
            } else {
                certificadoSpan.style.background = 'rgba(231, 76, 60, 0.1)';
            }
        }
        
        if (sincronizacionSpan) {
            sincronizacionSpan.textContent = this.state.configuracion.fiscal.ultimaSincronizacion;
        }
        
        // Notificaciones
        const notifEmail = document.getElementById('notifEmail');
        const notifPush = document.getElementById('notifPush');
        const alertasFact = document.getElementById('alertasFacturacion');
        const recordatorios = document.getElementById('recordatorios');
        
        if (notifEmail) notifEmail.checked = this.state.configuracion.notificaciones.email;
        if (notifPush) notifPush.checked = this.state.configuracion.notificaciones.push;
        if (alertasFact) alertasFact.checked = this.state.configuracion.notificaciones.alertasFacturacion;
        if (recordatorios) recordatorios.checked = this.state.configuracion.notificaciones.recordatorios;
        
        // Seguridad
        const ultimoCambioSpan = document.getElementById('ultimoCambioPass');
        const dispositivosSpan = document.getElementById('dispositivosConectados');
        const ultimoAccesoSpan = document.getElementById('ultimoAcceso');
        
        if (ultimoCambioSpan) ultimoCambioSpan.textContent = this.state.configuracion.seguridad.ultimoCambioPass;
        if (dispositivosSpan) dispositivosSpan.textContent = `${this.state.configuracion.seguridad.dispositivosConectados} sesiones activas`;
        if (ultimoAccesoSpan) ultimoAccesoSpan.textContent = this.state.configuracion.seguridad.ultimoAcceso;
    },
    
    // ============================================
    // ACCESIBILIDAD - Integrada con sistema global
    // ============================================
    
    setupAccesibilidad: function() {
        let currentSize = FacturaExpress.state.configuracion.tamanoTexto || 'medium';
        const sizeBadges = document.querySelectorAll('.size-badge');
        const highContrastToggle = document.getElementById('highContrastToggle');
        const darkModeToggle = document.getElementById('darkModeToggle');
        const applyAccessBtn = document.getElementById('applyAccessBtn');
        
        // Sincronizar toggles con el estado actual
        if (highContrastToggle) {
            highContrastToggle.checked = FacturaExpress.state.configuracion.altoContraste;
        }
        if (darkModeToggle) {
            darkModeToggle.checked = FacturaExpress.state.configuracion.modoOscuro;
        }
        
        // Marcar badge activo
        sizeBadges.forEach(badge => {
            if (badge.dataset.size === currentSize) {
                badge.classList.add('active');
            } else {
                badge.classList.remove('active');
            }
        });
        
        // Aplicar preferencias guardadas en la página de configuración
        FacturaExpress.accessibility.applyDarkMode(FacturaExpress.state.configuracion.modoOscuro);
        FacturaExpress.accessibility.applyHighContrast(FacturaExpress.state.configuracion.altoContraste);
        FacturaExpress.accessibility.applyFontSize(currentSize);
        
        // Eventos de selección de tamaño
        sizeBadges.forEach(badge => {
            badge.addEventListener('click', () => {
                sizeBadges.forEach(b => b.classList.remove('active'));
                badge.classList.add('active');
                currentSize = badge.dataset.size;
            });
        });
        
        // Aplicar preferencias usando el sistema global
        if (applyAccessBtn) {
            applyAccessBtn.addEventListener('click', (e) => {
                e.preventDefault();
                
                FacturaExpress.accessibility.applyDarkMode(darkModeToggle.checked);
                FacturaExpress.accessibility.applyHighContrast(highContrastToggle.checked);
                FacturaExpress.accessibility.setFontSize(currentSize);
                
                // Actualizar estado global
                FacturaExpress.state.configuracion.modoOscuro = darkModeToggle.checked;
                FacturaExpress.state.configuracion.altoContraste = highContrastToggle.checked;
                FacturaExpress.state.configuracion.tamanoTexto = currentSize;
                
                // Guardar preferencias globales para que se apliquen en todas las páginas
                FacturaExpress.storage.set('prefs', FacturaExpress.state.configuracion);
                this.saveConfiguracion();
                
                FacturaExpress.utils.showToast('Preferencias de accesibilidad aplicadas', 'success');
            });
        }
    },
    
    // Calcular días restantes del certificado
    calcularDiasRestantes: function(fechaVencimiento) {
        const hoy = new Date();
        const vencimiento = new Date(fechaVencimiento);
        const diffTime = vencimiento - hoy;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    },
    
    // Guardar datos de la empresa
    guardarEmpresa: function() {
        const nit = document.getElementById('nit_empresa')?.value;
        const razonSocial = document.getElementById('razon_social')?.value;
        const email = document.getElementById('email_facturacion')?.value;
        const telefono = document.getElementById('telefono_empresa')?.value;
        
        if (!nit || !razonSocial) {
            FacturaExpress.utils.showToast('NIT y Razón Social son obligatorios', 'error');
            return;
        }
        
        if (!FacturaExpress.utils.validateNIT(nit)) {
            FacturaExpress.utils.showToast('Formato de NIT inválido (ej: 900123456-7)', 'error');
            return;
        }
        
        if (email && !FacturaExpress.utils.validateEmail(email)) {
            FacturaExpress.utils.showToast('Email inválido', 'error');
            return;
        }
        
        this.state.configuracion.empresa = {
            ...this.state.configuracion.empresa,
            nit,
            razonSocial,
            email: email || '',
            telefono: telefono || ''
        };
        
        this.saveConfiguracion();
        FacturaExpress.utils.showToast('Datos de empresa guardados', 'success');
    },
    
    // Sincronizar con DIAN
    sincronizarDIAN: function() {
        FacturaExpress.utils.showToast('Sincronizando con DIAN...', 'info');
        
        setTimeout(() => {
            this.state.configuracion.fiscal.ultimaSincronizacion = new Date().toLocaleString();
            this.saveConfiguracion();
            this.renderConfiguracion();
            FacturaExpress.utils.showToast('Sincronización completada exitosamente', 'success');
        }, 2000);
    },
    
    // Guardar preferencias de notificaciones
    guardarNotificaciones: function() {
        const notifEmail = document.getElementById('notifEmail')?.checked || false;
        const notifPush = document.getElementById('notifPush')?.checked || false;
        const alertasFact = document.getElementById('alertasFacturacion')?.checked || false;
        const recordatorios = document.getElementById('recordatorios')?.checked || false;
        
        this.state.configuracion.notificaciones = {
            email: notifEmail,
            push: notifPush,
            alertasFacturacion: alertasFact,
            recordatorios
        };
        
        this.saveConfiguracion();
        FacturaExpress.utils.showToast('Preferencias de notificaciones guardadas', 'success');
    },
    
    // Cambiar contraseña
    cambiarContrasena: async function() {
        const actual = await FacturaExpress.utils.showDialog({
            title: 'Cambiar Contraseña',
            message: 'Ingrese su contraseña <strong>actual</strong>:',
            type: 'warning',
            confirmText: 'Siguiente',
            cancelText: 'Cancelar',
            input: true,
            inputType: 'password',
            inputLabel: 'Contraseña actual'
        });
        if (!actual) return;

        const nueva = await FacturaExpress.utils.showDialog({
            title: 'Nueva Contraseña',
            message: 'Ingrese su <strong>nueva</strong> contraseña (mín. 6 caracteres):',
            type: 'info',
            confirmText: 'Siguiente',
            cancelText: 'Cancelar',
            input: true,
            inputType: 'password',
            inputLabel: 'Nueva contraseña'
        });
        if (!nueva) return;

        if (nueva.length < 6) {
            FacturaExpress.utils.showToast('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        const confirmar = await FacturaExpress.utils.showDialog({
            title: 'Confirmar Contraseña',
            message: 'Confirme su nueva contraseña:',
            type: 'info',
            confirmText: 'Guardar',
            cancelText: 'Cancelar',
            input: true,
            inputType: 'password',
            inputLabel: 'Confirmar contraseña'
        });
        if (!confirmar) return;
        
        if (nueva !== confirmar) {
            FacturaExpress.utils.showToast('Las contraseñas no coinciden', 'error');
            return;
        }
        
        this.state.configuracion.seguridad.ultimoCambioPass = new Date().toLocaleDateString();
        this.saveConfiguracion();
        this.renderConfiguracion();
        
        FacturaExpress.utils.showToast('Contraseña actualizada correctamente', 'success');
    },
    
    // Configurar autenticación de dos factores
    configurarDosFactores: function() {
        this.state.configuracion.seguridad.dosFactoresActivo = !this.state.configuracion.seguridad.dosFactoresActivo;
        this.saveConfiguracion();
        
        const estado = this.state.configuracion.seguridad.dosFactoresActivo ? 'activada' : 'desactivada';
        FacturaExpress.utils.showToast(`Autenticación de dos factores ${estado}`, 'success');
    },
    
    // Ver dispositivos conectados
    verDispositivosConectados: function() {
        const dispositivos = [
            'Chrome - Windows 11 (Sesión actual)',
            'Firefox - MacOS (Hace 2 horas)',
            'Safari - iOS (Ayer)'
        ];
        
        FacturaExpress.utils.showDialog({
            title: 'Dispositivos Conectados',
            message: dispositivos.map(d => `• ${d}`).join('<br>'),
            type: 'info',
            confirmText: 'Cerrar'
        });
    },
    
    // Configurar event listeners
    setupEventListeners: function() {
        // Botones de empresa
        const guardarEmpresaBtn = document.getElementById('guardarEmpresa');
        if (guardarEmpresaBtn) {
            guardarEmpresaBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.guardarEmpresa();
            });
        }
        
        // Botones DIAN
        const sincronizarBtn = document.getElementById('sincronizarDIAN');
        if (sincronizarBtn) {
            sincronizarBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.sincronizarDIAN();
            });
        }
        
        // Botones notificaciones
        const guardarNotifBtn = document.getElementById('guardarNotificaciones');
        if (guardarNotifBtn) {
            guardarNotifBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.guardarNotificaciones();
            });
        }
        
        // Botones seguridad
        const cambiarPassBtn = document.getElementById('cambiarContrasena');
        if (cambiarPassBtn) {
            cambiarPassBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.cambiarContrasena();
            });
        }
        
        const dosFactoresBtn = document.getElementById('dosFactores');
        if (dosFactoresBtn) {
            dosFactoresBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.configurarDosFactores();
            });
        }
        
        const dispositivosBtn = document.getElementById('dispositivosConectadosBtn');
        if (dispositivosBtn) {
            dispositivosBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.verDispositivosConectados();
            });
        }
        
        // Botones adicionales
        const recargarDIANBtn = document.getElementById('recargarDatosDIAN');
        if (recargarDIANBtn) {
            recargarDIANBtn.addEventListener('click', (e) => {
                e.preventDefault();
                FacturaExpress.utils.showToast('Datos recargados desde DIAN', 'info');
                this.renderConfiguracion();
            });
        }
        
        const subirCertificadoBtn = document.getElementById('subirCertificado');
        if (subirCertificadoBtn) {
            subirCertificadoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                FacturaExpress.utils.showToast('Seleccione el archivo del certificado (.p12)', 'info');
            });
        }
        
        const verResolucionBtn = document.getElementById('verResolucion');
        if (verResolucionBtn) {
            verResolucionBtn.addEventListener('click', (e) => {
                e.preventDefault();
                FacturaExpress.utils.showDialog({
                    title: 'Resolución DIAN',
                    message: '<strong>No. Resolución:</strong> 18764000001<br><strong>Vigencia:</strong> 01/01/2026 - 31/12/2026<br><strong>Tipo:</strong> Facturación Electrónica',
                    type: 'info',
                    confirmText: 'Cerrar'
                });
            });
        }
        
        const adminUsuariosBtn = document.getElementById('administrarUsuarios');
        if (adminUsuariosBtn) {
            adminUsuariosBtn.addEventListener('click', (e) => {
                e.preventDefault();
                FacturaExpress.utils.showToast('Módulo de administración de usuarios (Próximamente)', 'info');
            });
        }
        
        const gestionarRolesBtn = document.getElementById('gestionarRolesPermisos');
        if (gestionarRolesBtn) {
            gestionarRolesBtn.addEventListener('click', (e) => {
                e.preventDefault();
                FacturaExpress.utils.showToast('Gestión de roles y permisos (Próximamente)', 'info');
            });
        }
        
        const verActividadBtn = document.getElementById('verActividadReciente');
        if (verActividadBtn) {
            verActividadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                FacturaExpress.utils.showToast('Mostrando actividad de los últimos 7 días', 'info');
            });
        }
        
        // Gestión de roles en perfiles
        document.querySelectorAll('.gestionarRol').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const rol = btn.dataset.rol;
                const nombres = { admin: 'Administradores', vendedor: 'Vendedores', contador: 'Contadores' };
                FacturaExpress.utils.showToast(`Gestionando permisos para: ${nombres[rol]}`, 'info');
            });
        });
    }
};

// Inicializar si estamos en la página de configuración
if (document.getElementById('configuracionModule')) {
    document.addEventListener('DOMContentLoaded', () => {
        ConfiguracionModule.init();
    });
}