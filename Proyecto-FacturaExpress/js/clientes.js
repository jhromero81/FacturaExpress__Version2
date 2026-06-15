/* ============================================
   FACTURAEXPRESS - CLIENTES MODULE
   Gestión de clientes y directorio
   ============================================ */

const ClientesModule = {
    // Estado del módulo
    state: {
        clientes: [],
        filtro: '',
        clienteEditando: null
    },
    
    // Inicializar módulo
    init: function() {
        this.loadData();
        this.checkSelectedClient();
        this.renderClientes();
        this.setupEventListeners();
    },
    
    // Datos de ejemplo
    clientesEjemplo: [
        { id: 1, identificacion: '101020201', nombre: 'Maria Fernanda Gomez', email: 'm.gomez@mail.com', telefono: '3001234567', direccion: 'Calle 1 #2-3, Bogotá' },
        { id: 2, identificacion: '101020202', nombre: 'Carlos Rodriguez', email: 'c.rod@mail.com', telefono: '3112345678', direccion: 'Carrera 4 #5-6, Medellín' },
        { id: 3, identificacion: '101020203', nombre: 'Juan Perez', email: 'j.perez@mail.com', telefono: '3203456789', direccion: 'Avenida 7 #8-9, Cali' },
        { id: 4, identificacion: '101020204', nombre: 'Luis Hernandez', email: 'l.hernandez@mail.com', telefono: '3154567890', direccion: 'Calle 10 #11-12, Barranquilla' },
        { id: 5, identificacion: '101020205', nombre: 'Ana Martinez', email: 'ana.martinez@mail.com', telefono: '3015678901', direccion: 'Carrera 13 #14-15, Cartagena' }
    ],
    
    // Cargar clientes desde localStorage
    loadData: function() {
        this.state.clientes = FacturaExpress.DataManager.loadOrGenerate(
            'clientes',
            () => [...this.clientesEjemplo]
        );
    },
    
    // Alias para compatibilidad
    loadClientes: function() {
        this.loadData();
    },
    
    // Guardar clientes en localStorage
    saveClientes: function() {
        FacturaExpress.storage.set('clientes', this.state.clientes);
    },
    
    // Renderizar tarjetas de clientes
    renderClientes: function() {
        const container = document.getElementById('clientesGrid');
        if (!container) return;
        
        const clientesFiltrados = this.filtrarClientes();
        
        if (clientesFiltrados.length === 0) {
            container.innerHTML = `
                <div class="col s12">
                    <div class="center-align empty-state" style="padding: 60px 20px;">
                        <i class="material-icons" style="font-size: 64px;">person_outline</i>
                        <p>No se encontraron clientes</p>
                        <a class="btn btn-teal" onclick="document.getElementById('modalOverlay').classList.add('open')">
                            <i class="material-icons left">person_add</i>Agregar Cliente
                        </a>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        clientesFiltrados.forEach(cliente => {
            const card = document.createElement('div');
            card.className = 'col s12 m6 l4';
            card.style.marginBottom = '18px';
            card.dataset.id = cliente.id;
            card.innerHTML = `
                <div class="client-card">
                    <div class="d-flex justify-between align-center" style="align-items:flex-start;">
                        <i class="material-icons client-card-icon">account_circle</i>
                        <span class="client-id-tag">ID: ${cliente.identificacion}</span>
                    </div>
                    <div class="client-name">${this.escapeHtml(cliente.nombre)}</div>
                    <div class="client-email">${this.escapeHtml(cliente.email || 'Sin email')}</div>
                    <div class="client-actions">
                        <a class="btn-flat ver-perfil text-dark fw-700 p-0" data-id="${cliente.id}">Ver Perfil</a>
                        <a class="btn-flat nueva-venta text-accent fw-700 p-0" data-id="${cliente.id}" data-nombre="${this.escapeHtml(cliente.nombre)}">Nueva Venta</a>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
        
        this.setupClientButtons();
    },
    
    // Escapar HTML para prevenir XSS
    escapeHtml: function(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // Configurar botones de clientes - Usa event delegation
    setupClientButtons: function() {
        FacturaExpress.EventManager.delegate('#clientesGrid', '.ver-perfil', 'click', this.handleVerPerfil, this);
        FacturaExpress.EventManager.delegate('#clientesGrid', '.nueva-venta', 'click', this.handleNuevaVenta, this);
    },

    handleVerPerfil: function(e, target) {
        const id = parseInt(target.dataset.id);
        if (id) this.verPerfilCliente(id);
    },

    handleNuevaVenta: function(e, target) {
        const id = parseInt(target.dataset.id);
        const nombre = target.dataset.nombre;
        if (id && nombre) this.iniciarVentaConCliente(id, nombre);
    },
    
    // Filtrar clientes por búsqueda
    filtrarClientes: function() {
        if (!this.state.filtro) return this.state.clientes;
        
        const termino = this.state.filtro.toLowerCase();
        return this.state.clientes.filter(cliente =>
            cliente.nombre.toLowerCase().includes(termino) ||
            cliente.identificacion.includes(termino) ||
            (cliente.email && cliente.email.toLowerCase().includes(termino))
        );
    },
    
    // Ver perfil de cliente
    verPerfilCliente: function(id) {
        const cliente = this.state.clientes.find(c => c.id === id);
        if (!cliente) return;
        
        const lines = [
            `<strong>ID:</strong> ${cliente.identificacion}`,
            `<strong>Nombre:</strong> ${cliente.nombre}`,
            `<strong>Email:</strong> ${cliente.email || 'No registrado'}`,
            `<strong>Teléfono:</strong> ${cliente.telefono || 'No registrado'}`,
            `<strong>Dirección:</strong> ${cliente.direccion || 'No registrada'}`
        ];

        FacturaExpress.utils.showDialog({
            title: 'Información del Cliente',
            message: lines.join('<br>'),
            type: 'info',
            confirmText: 'Cerrar'
        });
    },
    
    // Verificar si hay un cliente seleccionado desde otra pantalla
    checkSelectedClient: function() {
        const seleccionado = FacturaExpress.storage.get('cliente_seleccionado');
        if (seleccionado) {
            this.state.filtro = seleccionado.nombre;
            const searchInput = document.getElementById('bCliente');
            if (searchInput) searchInput.value = seleccionado.nombre;
            // Limpiar para que no persista en recargas futuras
            FacturaExpress.storage.remove('cliente_seleccionado');
        }
    },

    // Iniciar venta con cliente seleccionado
    iniciarVentaConCliente: function(id, nombre) {
        // Guardar cliente seleccionado para la venta
        FacturaExpress.storage.set('cliente_seleccionado', { id, nombre });
        FacturaExpress.utils.showToast(`Cliente seleccionado: ${nombre}`, 'success');
        window.location.href = 'ventas.html';
    },
    
    // Agregar nuevo cliente
    agregarCliente: function(datos) {
        // Validar datos obligatorios
        if (!datos.identificacion || !datos.nombre) {
            FacturaExpress.utils.showToast('ID y Nombre son obligatorios', 'error');
            return false;
        }

        // Validar formatos usando utilidades globales
        if (datos.email && !FacturaExpress.utils.validateEmail(datos.email)) {
            FacturaExpress.utils.showToast('Formato de email inválido', 'error');
            return false;
        }

        if (datos.telefono && !FacturaExpress.utils.validatePhone(datos.telefono)) {
            FacturaExpress.utils.showToast('Formato de teléfono inválido', 'error');
            return false;
        }
        
        // Verificar si ya existe
        const existe = this.state.clientes.some(c => c.identificacion === datos.identificacion);
        if (existe) {
            FacturaExpress.utils.showToast('Ya existe un cliente con esta identificación', 'error');
            return false;
        }
        
        const nuevoCliente = {
            id: Date.now(),
            identificacion: datos.identificacion,
            nombre: datos.nombre,
            email: datos.email || '',
            telefono: datos.telefono || '',
            direccion: datos.direccion || '',
            fechaRegistro: new Date().toISOString()
        };
        
        this.state.clientes.push(nuevoCliente);
        this.saveClientes();
        this.renderClientes();
        
        FacturaExpress.utils.showToast(`Cliente ${nuevoCliente.nombre} agregado`, 'success');
        return true;
    },
    
    // Editar cliente
    editarCliente: function(id, datos) {
        const index = this.state.clientes.findIndex(c => c.id === id);
        if (index === -1) return false;
        
        this.state.clientes[index] = {
            ...this.state.clientes[index],
            ...datos
        };
        
        this.saveClientes();
        this.renderClientes();
        FacturaExpress.utils.showToast('Cliente actualizado', 'success');
        return true;
    },
    
    // Eliminar cliente
    eliminarCliente: async function(id) {
        const cliente = this.state.clientes.find(c => c.id === id);
        if (!cliente) return;
        
        const confirmed = await FacturaExpress.utils.showConfirm(
            `¿Eliminar a <strong>${cliente.nombre}</strong>?`
        );
        if (!confirmed) return;

        this.state.clientes = this.state.clientes.filter(c => c.id !== id);
        this.saveClientes();
        this.renderClientes();
        FacturaExpress.utils.showToast('Cliente eliminado', 'info');
    },
    
    // Configurar event listeners
    setupEventListeners: function() {
        // Búsqueda de clientes
        const searchInput = document.getElementById('bCliente');
        if (searchInput) {
            const debouncedSearch = FacturaExpress.utils.debounce((value) => {
                this.state.filtro = value;
                this.renderClientes();
            }, 300);
            
            searchInput.addEventListener('input', (e) => {
                debouncedSearch(e.target.value);
            });
        }
        
        // Modal de nuevo cliente
        const modal = document.getElementById('modalOverlay');
        const guardarBtn = document.querySelector('#modalOverlay .btn-teal');
        
        if (guardarBtn) {
            guardarBtn.addEventListener('click', () => {
                const identificacion = document.getElementById('mId')?.value;
                const nombre = document.getElementById('mNombre')?.value;
                const email = document.getElementById('mEmail')?.value;
                const telefono = document.getElementById('mTel')?.value;
                
                if (this.agregarCliente({ identificacion, nombre, email, telefono })) {
                    // Limpiar formulario
                    document.getElementById('mId').value = '';
                    document.getElementById('mNombre').value = '';
                    document.getElementById('mEmail').value = '';
                    document.getElementById('mTel').value = '';
                    // Cerrar modal
                    if (modal) modal.classList.remove('open');
                }
            });
        }
        
        // Cerrar modal con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
                modal.classList.remove('open');
            }
        });
    }
};

// Inicializar si estamos en la página de clientes
if (document.getElementById('clientesGrid')) {
    document.addEventListener('DOMContentLoaded', () => {
        ClientesModule.init();
    });
}