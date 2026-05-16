/* ============================================
   FACTURAEXPRESS - VENTAS MODULE
   Gestión de ventas y carrito de compras
   ============================================ */

const VentasModule = {
    // Estado del módulo
    state: {
        carrito: [],
        productos: [],
        clienteActual: {
            id: '1010202030',
            nombre: 'Maria G. Perez',
            email: 'maria.perez@email.com',
            telefono: '3001234567'
        },
        subtotal: 0,
        iva: 0,
        total: 0,
        metodoPago: 'efectivo'
    },
    
    // Productos disponibles
    productosCatalogo: [
        { id: 1, codigo: 'PROD001', nombre: 'Insumo Industrial X', precio: 85000, iva: 19, stock: 50 },
        { id: 2, codigo: 'PROD002', nombre: 'Insumo Industrial Y', precio: 120000, iva: 19, stock: 35 },
        { id: 3, codigo: 'PROD003', nombre: 'Material Premium Z', precio: 250000, iva: 19, stock: 20 },
        { id: 4, codigo: 'PROD004', nombre: 'Componente Electrónico A', precio: 45000, iva: 19, stock: 100 },
        { id: 5, codigo: 'PROD005', nombre: 'Herramienta Especial B', precio: 189000, iva: 19, stock: 15 }
    ],
    
    // Inicializar módulo
    init: function() {
        this.loadData();
        this.setupEventListeners();
        this.updateResumenPago();
        this.cargarCliente();
    },
    
    // Cargar datos
    loadData: function() {
        this.loadProductos();
    },
    
    // Cargar productos desde localStorage o usar catálogo
    loadProductos: function() {
        const savedProductos = FacturaExpress.storage.get('productos');
        if (savedProductos && savedProductos.length) {
            this.productosCatalogo = savedProductos;
        } else {
            FacturaExpress.storage.set('productos', this.productosCatalogo);
        }
        this.renderProductosTabla();
    },
    
    // Renderizar productos en la tabla
    renderProductosTabla: function() {
        const tbody = document.querySelector('#productosTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        this.productosCatalogo.forEach(producto => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td><strong>${producto.nombre}</strong></td>
                <td>
                    <div class="qty-ctrl">
                        <button class="qty-btn disminuir" data-id="${producto.id}">−</button>
                        <span class="qty-val" id="qty-${producto.id}">0</span>
                        <button class="qty-btn aumentar" data-id="${producto.id}">+</button>
                    </div>
                </td>
                <td style="font-family:'Space Mono',monospace;">${FacturaExpress.utils.formatMoney(producto.precio)}</td>
                <td style="font-family:'Space Mono',monospace;font-weight:700;" id="subtotal-${producto.id}">$0</td>
                <td><a class="btn-flat eliminar-producto" data-id="${producto.id}" style="color:#e74c3c;padding:0 4px;"><i class="material-icons">delete_outline</i></a></td>
            `;
        });
        
        this.setupProductButtons();
    },
    
    // Configurar botones de productos - Refactorizado con EventManager
    setupProductButtons: function() {
        FacturaExpress.EventManager.attachHandlers(this, [
            { selector: '.aumentar', handler: this.handleAumentar },
            { selector: '.disminuir', handler: this.handleDisminuir },
            { selector: '.eliminar-producto', handler: this.handleEliminar }
        ]);
    },
    
    // Manejar aumentar cantidad
    handleAumentar: function(e) {
        const productoId = parseInt(e.target.dataset.id);
        this.agregarAlCarrito(productoId);
    },
    
    // Manejar disminuir cantidad
    handleDisminuir: function(e) {
        const productoId = parseInt(e.target.dataset.id);
        this.quitarDelCarrito(productoId);
    },
    
    // Manejar eliminar producto
    handleEliminar: function(e) {
        const productoId = parseInt(e.target.closest('.eliminar-producto')?.dataset.id);
        if (productoId) {
            this.eliminarProductoCompleto(productoId);
        }
    },
    
    // Agregar producto al carrito
    agregarAlCarrito: function(productoId) {
        const producto = this.productosCatalogo.find(p => p.id === productoId);
        if (!producto) return;
        
        const itemExistente = this.state.carrito.find(item => item.id === productoId);
        
        if (itemExistente) {
            if (itemExistente.cantidad < producto.stock) {
                itemExistente.cantidad++;
            } else {
                FacturaExpress.utils.showToast('Stock insuficiente', 'warning');
                return;
            }
        } else {
            this.state.carrito.push({
                ...producto,
                cantidad: 1
            });
        }
        
        this.actualizarUIProducto(productoId);
        this.updateResumenPago();
        FacturaExpress.utils.showToast(`${producto.nombre} agregado`, 'success');
    },
    
    // Quitar uno del carrito
    quitarDelCarrito: function(productoId) {
        const item = this.state.carrito.find(item => item.id === productoId);
        
        if (item) {
            if (item.cantidad > 1) {
                item.cantidad--;
            } else {
                this.state.carrito = this.state.carrito.filter(i => i.id !== productoId);
            }
            this.actualizarUIProducto(productoId);
            this.updateResumenPago();
        }
    },
    
    // Eliminar producto completamente del carrito
    eliminarProductoCompleto: function(productoId) {
        this.state.carrito = this.state.carrito.filter(i => i.id !== productoId);
        this.actualizarUIProducto(productoId);
        this.updateResumenPago();
        FacturaExpress.utils.showToast('Producto eliminado', 'info');
    },
    
    // Actualizar UI de un producto específico
    actualizarUIProducto: function(productoId) {
        const item = this.state.carrito.find(i => i.id === productoId);
        const cantidad = item?.cantidad || 0;
        const subtotal = item ? item.precio * item.cantidad : 0;
        
        const qtySpan = document.getElementById(`qty-${productoId}`);
        const subtotalSpan = document.getElementById(`subtotal-${productoId}`);
        
        if (qtySpan) qtySpan.textContent = cantidad;
        if (subtotalSpan) subtotalSpan.textContent = FacturaExpress.utils.formatMoney(subtotal);
    },
    
    // Actualizar resumen de pago
    updateResumenPago: function() {
        let sumaSubtotales = 0;
        let totalIva = 0;
        
        this.state.carrito.forEach(item => {
            // El subtotal de la línea es Precio x Cantidad (Base Imponible)
            const baseItem = item.precio * item.cantidad;
            // Aplicar fórmula: Valor base * 0.19
            const ivaItem = baseItem * 0.19;

            sumaSubtotales += baseItem;
            totalIva += ivaItem;
        });
        
        const totalFinal = sumaSubtotales + totalIva;
        
        this.state.subtotal = sumaSubtotales;
        this.state.iva = totalIva;
        this.state.total = totalFinal;
        
        // Actualizar UI
        const subtotalElem = document.querySelector('.payment-panel .pay-row:nth-of-type(1) .pay-val');
        const ivaElem = document.querySelector('.payment-panel .pay-row:nth-of-type(2) .pay-val');
        const totalElem = document.querySelector('.total-val');
        
        if (subtotalElem) subtotalElem.textContent = FacturaExpress.utils.formatMoney(this.state.subtotal);
        if (ivaElem) ivaElem.textContent = FacturaExpress.utils.formatMoney(totalIva);
        if (totalElem) totalElem.textContent = FacturaExpress.utils.formatMoney(totalFinal);
    },
    
    // Cargar cliente actual
    cargarCliente: function() {
        const clienteIdInput = document.getElementById('cId');
        const clienteNombreInput = document.getElementById('cNombre');
        
        if (clienteIdInput) clienteIdInput.value = this.state.clienteActual.id;
        if (clienteNombreInput) clienteNombreInput.value = this.state.clienteActual.nombre;
    },
    
    // Cambiar cliente
    cambiarCliente: function() {
        const nuevoId = prompt('Ingrese el ID del cliente:');
        if (nuevoId) {
            // Buscar cliente en localStorage
            const clientes = FacturaExpress.storage.get('clientes', []);
            const cliente = clientes.find(c => c.identificacion === nuevoId);
            
            if (cliente) {
                this.state.clienteActual = {
                    id: cliente.identificacion,
                    nombre: cliente.nombre,
                    email: cliente.email,
                    telefono: cliente.telefono
                };
                this.cargarCliente();
                FacturaExpress.utils.showToast(`Cliente cambiado: ${cliente.nombre}`, 'success');
            } else {
                FacturaExpress.utils.showToast('Cliente no encontrado', 'error');
            }
        }
    },
    
    // Finalizar venta
    finalizarVenta: function() {
        if (this.state.carrito.length === 0) {
            FacturaExpress.utils.showToast('El carrito está vacío', 'error');
            return;
        }
        
        const factura = {
            numero: FacturaExpress.utils.generateInvoiceNumber(),
            fecha: new Date().toISOString(),
            cliente: this.state.clienteActual,
            items: this.state.carrito.map(item => {
                const lineBase = item.precio * item.cantidad;
                return {
                    id: item.id,
                    nombre: item.nombre,
                    cantidad: item.cantidad,
                    precio: item.precio,
                    iva: lineBase * 0.19,
                    subtotal: lineBase
                };
            }),
            subtotal: this.state.subtotal,
            iva: this.state.iva,
            total: this.state.total,
            monto: this.state.total, // Necesario para compatibilidad con facturacion.js y reportes.js
            metodoPago: this.state.metodoPago,
            estado: 'enviado' // Usar un estado válido según facturacion.js
        };
        
        // Guardar factura
        const facturas = FacturaExpress.storage.get('facturas', []);
        facturas.unshift(factura);
        FacturaExpress.storage.set('facturas', facturas);
        
        // Limpiar carrito
        this.state.carrito = [];
        this.productosCatalogo.forEach(p => this.actualizarUIProducto(p.id));
        this.updateResumenPago();
        
        FacturaExpress.utils.showToast(`Venta finalizada - Factura ${factura.numero}`, 'success');
        
        // Preguntar si desea imprimir
        setTimeout(() => {
            if (confirm('¿Desea ver el detalle de la factura?')) {
                window.location.href = 'facturacion.html';
            }
        }, 500);
    },
    
    // Buscar producto
    buscarProducto: function(termino) {
        if (!termino || termino.length < 2) return;
        
        const resultados = this.productosCatalogo.filter(p =>
            p.nombre.toLowerCase().includes(termino.toLowerCase()) ||
            p.codigo.toLowerCase().includes(termino.toLowerCase())
        );
        
        if (resultados.length === 1) {
            this.agregarAlCarrito(resultados[0].id);
        } else if (resultados.length > 1) {
            // Mostrar opciones
            const nombres = resultados.map(p => p.nombre).join('\n');
            FacturaExpress.utils.showToast(`Múltiples resultados:\n${nombres}`, 'info');
        }
    },
    
    // Configurar event listeners
    setupEventListeners: function() {
        // Botón finalizar venta
        const finalizarBtn = document.querySelector('.btn-finalizar');
        if (finalizarBtn) {
            finalizarBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.finalizarVenta();
            });
        }
        
        // Botón cambiar cliente
        const cambiarClienteBtn = document.querySelector('.btn-teal');
        if (cambiarClienteBtn && cambiarClienteBtn.textContent.includes('Cambiar Cliente')) {
            cambiarClienteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.cambiarCliente();
            });
        }
        
        // Botón agregar producto
        const agregarBtn = document.querySelector('.btn-dark');
        if (agregarBtn && agregarBtn.textContent.includes('Agregar')) {
            agregarBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const inputProducto = document.getElementById('prod');
                if (inputProducto && inputProducto.value) {
                    this.buscarProducto(inputProducto.value);
                    inputProducto.value = '';
                }
            });
        }
        
        // Input de búsqueda con Enter
        const searchInput = document.getElementById('prod');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.buscarProducto(searchInput.value);
                    searchInput.value = '';
                }
            });
        }
        
        // Método de pago
        const metodoPagoSelect = document.getElementById('metodoPago');
        if (metodoPagoSelect) {
            metodoPagoSelect.addEventListener('change', (e) => {
                this.state.metodoPago = e.target.value;
            });
        }
    }
};

// Inicializar si estamos en la página de ventas
if (document.querySelector('.payment-panel')) {
    document.addEventListener('DOMContentLoaded', () => {
        VentasModule.init();
    });
}