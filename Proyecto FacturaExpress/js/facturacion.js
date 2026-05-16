/* ============================================
   FACTURAEXPRESS - FACTURACION MODULE
   Historial y gestión de facturas electrónicas
   ============================================ */

const FacturacionModule = {
    // Estado del módulo
    state: {
        facturas: [],
        facturasFiltradas: [],
        filtroBusqueda: '',
        filtroEstado: 'todos',
        paginaActual: 1,
        itemsPorPagina: 10,
        totalPaginas: 1
    },
    
    // Estados posibles de factura
    estadosFactura: {
        enviado: { texto: 'Enviado', icono: 'check_circle', color: '#1abc9c' },
        pendiente: { texto: 'Pendiente', icono: 'schedule', color: '#f39c12' },
        rechazado: { texto: 'Rechazado', icono: 'error', color: '#e74c3c' },
        procesando: { texto: 'Procesando', icono: 'autorenew', color: '#3498db' }
    },
    
    // Inicializar módulo
    init: function() {
        this.loadData();
        this.setupEventListeners();
        this.render();
    },
    
    // Cargar facturas desde localStorage o generar ejemplos
    loadData: function() {
        this.state.facturas = FacturaExpress.DataManager.loadOrGenerate(
            'facturas',
            () => FacturaExpress.SampleData.generarFacturasEjemplo(25)
        );
        this.aplicarFiltros();
    },
    
    // Alias para compatibilidad
    loadFacturas: function() {
        this.loadData();
    },
    
    // Alias para render
    render: function() {
        this.renderFacturas();
    },
    
    // Aplicar filtros de búsqueda
    aplicarFiltros: function() {
        let filtradas = [...this.state.facturas];
        
        // Filtro por búsqueda (número de factura o cliente)
        if (this.state.filtroBusqueda) {
            const busqueda = this.state.filtroBusqueda.toLowerCase();
            filtradas = filtradas.filter(f => 
                f.numero.toLowerCase().includes(busqueda) ||
                f.cliente.toLowerCase().includes(busqueda) ||
                f.clienteIdentificacion.includes(busqueda)
            );
        }
        
        // Filtro por estado
        if (this.state.filtroEstado !== 'todos') {
            filtradas = filtradas.filter(f => f.estado === this.state.filtroEstado);
        }
        
        this.state.facturasFiltradas = filtradas;
        this.state.totalPaginas = Math.ceil(filtradas.length / this.state.itemsPorPagina);
        
        // Asegurar que la página actual sea válida
        if (this.state.paginaActual > this.state.totalPaginas && this.state.totalPaginas > 0) {
            this.state.paginaActual = this.state.totalPaginas;
        }
        if (this.state.paginaActual < 1) this.state.paginaActual = 1;
    },
    
    // Renderizar tabla de facturas
    renderFacturas: function() {
        const tbody = document.querySelector('table tbody');
        if (!tbody) return;
        
        const inicio = (this.state.paginaActual - 1) * this.state.itemsPorPagina;
        const fin = inicio + this.state.itemsPorPagina;
        const facturasPagina = this.state.facturasFiltradas.slice(inicio, fin);
        
        if (facturasPagina.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <i class="material-icons" style="font-size: 48px; color: #90a4ae;">receipt</i>
                        <p style="margin-top: 16px; color: #90a4ae;">No se encontraron facturas</p>
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = facturasPagina.map(factura => {
                const estadoInfo = this.estadosFactura[factura.estado] || this.estadosFactura.enviado;
                const fechaFormateada = FacturaExpress.utils.formatDate(factura.fecha);
                
                return `
                    <tr>
                        <td><strong>${factura.numero}</strong></td>
                        <td>${fechaFormateada}</td>
                        <td>
                            ${factura.cliente}<br>
                            <small style="color:#90a4ae;">${factura.clienteIdentificacion}</small>
                        </td>
                        <td>
                            <span class="badge-status" style="background: ${estadoInfo.color}15; color: ${estadoInfo.color};">
                                <i class="material-icons" style="font-size: 12px; vertical-align: middle;">${estadoInfo.icono}</i>
                                ${estadoInfo.texto}
                            </span>
                        </td>
                        <td style="font-family:'Space Mono',monospace; font-weight:700;">
                            ${FacturaExpress.utils.formatMoney(factura.monto)}
                        </td>
                        <td>
                            <a class="btn-flat btn-small ver-pdf" data-numero="${factura.numero}" style="color:#546e7a;">
                                <i class="material-icons tiny">picture_as_pdf</i> PDF
                            </a>
                            <a class="btn-flat btn-small descargar-xml" data-numero="${factura.numero}" style="color:#1abc9c;">
                                <i class="material-icons tiny">download</i> XML
                            </a>
                        </td>
                    </tr>
                `;
            }).join('');
        }
        
        this.renderPaginacion();
        this.setupFacturaButtons();
    },
    
    // Renderizar controles de paginación
    renderPaginacion: function() {
        const paginacionContainer = document.querySelector('.content-card > div:last-child');
        if (!paginacionContainer) return;
        
        if (this.state.totalPaginas <= 1) {
            paginacionContainer.style.display = 'none';
            return;
        }
        
        paginacionContainer.style.display = 'flex';
        
        const paginaSpan = paginacionContainer.querySelector('span');
        if (paginaSpan) {
            paginaSpan.innerHTML = `Página <strong>${this.state.paginaActual}</strong> de ${this.state.totalPaginas}`;
        }
        
        const prevBtn = paginacionContainer.querySelector('a:first-child');
        const nextBtn = paginacionContainer.querySelector('a:last-child');
        
        if (prevBtn) {
            prevBtn.style.color = this.state.paginaActual === 1 ? '#90a4ae' : '#1abc9c';
            prevBtn.style.cursor = this.state.paginaActual === 1 ? 'not-allowed' : 'pointer';
        }
        
        if (nextBtn) {
            nextBtn.style.color = this.state.paginaActual === this.state.totalPaginas ? '#90a4ae' : '#1abc9c';
            nextBtn.style.cursor = this.state.paginaActual === this.state.totalPaginas ? 'not-allowed' : 'pointer';
        }
    },
    
    // Configurar botones de factura
    setupFacturaButtons: function() {
        // Botones Ver PDF
        document.querySelectorAll('.ver-pdf').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const numero = btn.dataset.numero;
                this.verPDF(numero);
            });
        });
        
        // Botones Descargar XML
        document.querySelectorAll('.descargar-xml').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const numero = btn.dataset.numero;
                this.descargarXML(numero);
            });
        });
    },
    
    // Ver factura en PDF
    verPDF: function(numeroFactura) {
        const factura = this.state.facturas.find(f => f.numero === numeroFactura);
        if (!factura) return;
        
        // Simular generación de PDF
        FacturaExpress.utils.showToast(`Generando PDF de factura ${numeroFactura}...`, 'info');
        
        setTimeout(() => {
            const contenidoPDF = this.generarContenidoFactura(factura);
            const ventana = window.open();
            ventana.document.write(contenidoPDF);
            ventana.document.close();
        }, 500);
    },
    
    // Descargar XML
    descargarXML: function(numeroFactura) {
        const factura = this.state.facturas.find(f => f.numero === numeroFactura);
        if (!factura) return;
        
        FacturaExpress.utils.showToast(`Generando XML de factura ${numeroFactura}...`, 'info');
        
        setTimeout(() => {
            const xml = this.generarXMLFactura(factura);
            const blob = new Blob([xml], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${factura.numero}.xml`;
            a.click();
            URL.revokeObjectURL(url);
            FacturaExpress.utils.showToast(`XML de ${factura.numero} descargado`, 'success');
        }, 500);
    },
    
    // Generar contenido HTML para vista previa de factura
    generarContenidoFactura: function(factura) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Factura ${factura.numero}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .empresa { font-size: 24px; font-weight: bold; color: #1abc9c; }
                    .factura-num { font-size: 18px; margin-top: 10px; }
                    .info { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    th { background: #1abc9c; color: white; }
                    .resumen-final { margin-top: 20px; text-align: right; }
                    .resumen-item { margin-bottom: 5px; font-size: 14px; }
                    .total { font-size: 18px; font-weight: bold; color: #1abc9c; margin-top: 10px; }
                    .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #999; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="empresa">FACTURAEXPRESS</div>
                    <div class="factura-num">FACTURA DE VENTA ELECTRÓNICA</div>
                    <div><strong>${factura.numero}</strong></div>
                </div>
                
                <div class="info">
                    <div><strong>Fecha de emisión:</strong> ${FacturaExpress.utils.formatDate(factura.fecha, 'dd/mm/yyyy hh:mm')}</div>
                    <div><strong>Cliente:</strong> ${factura.cliente}</div>
                    <div><strong>NIT/CC:</strong> ${factura.clienteIdentificacion}</div>
                    <div><strong>Estado DIAN:</strong> ${this.estadosFactura[factura.estado]?.texto || 'Enviado'}</div>
                </div>
                
                <table>
                    <thead>
                        <tr><th>Cantidad</th><th>Producto</th><th>Valor Unitario</th><th>Total</th></tr>
                    </thead>
                    <tbody>
                        ${factura.items.map(item => `
                            <tr>
                                <td>${item.cantidad}</td>
                                <td>${item.nombre}</td>
                                <td>${FacturaExpress.utils.formatMoney(item.precio)}</td>
                                <td>${FacturaExpress.utils.formatMoney(item.precio * item.cantidad)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="resumen-final">
                    <div class="resumen-item">Subtotal: ${FacturaExpress.utils.formatMoney(factura.subtotal || (factura.monto / 1.19))}</div>
                    <div class="resumen-item">IVA (19%): ${FacturaExpress.utils.formatMoney(factura.iva || (factura.monto - (factura.monto / 1.19)))}</div>
                    <div class="total">TOTAL A PAGAR: ${FacturaExpress.utils.formatMoney(factura.monto)}</div>
                </div>
                
                <div class="footer">
                    <p>Factura generada por FacturaExpress - Cumple con la normatividad DIAN</p>
                    <p>Código de verificación: ${Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
                </div>
            </body>
            </html>
        `;
    },
    
    // Generar XML de factura (formato DIAN simplificado)
    generarXMLFactura: function(factura) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="http://www.dian.gov.co/contratos/facturaelectronica/v1">
    <Identification>
        <ID>${factura.numero}</ID>
        <IssueDate>${new Date(factura.fecha).toISOString()}</IssueDate>
        <InvoiceTypeCode>01</InvoiceTypeCode>
    </Identification>
    <AccountingSupplierParty>
        <Party>
            <PartyIdentification>
                <ID>9001234567</ID>
            </PartyIdentification>
            <PartyName>
                <Name>Industrias Metalúrgicas S.A.S</Name>
            </PartyName>
        </Party>
    </AccountingSupplierParty>
    <AccountingCustomerParty>
        <Party>
            <PartyIdentification>
                <ID>${factura.clienteIdentificacion}</ID>
            </PartyIdentification>
            <PartyName>
                <Name>${factura.cliente}</Name>
            </PartyName>
        </Party>
    </AccountingCustomerParty>
    <LegalMonetaryTotal>
        <PayableAmount currencyCode="COP">${factura.monto}</PayableAmount>
    </LegalMonetaryTotal>
    <InvoiceLine>
        ${factura.items.map(item => `
        <LineItem>
            <Quantity unitCode="NIU">${item.cantidad}</Quantity>
            <PriceAmount>${item.precio}</PriceAmount>
            <LineExtensionAmount>${item.precio * item.cantidad}</LineExtensionAmount>
            <Item>
                <Description>${item.nombre}</Description>
            </Item>
        </LineItem>
        `).join('')}
    </InvoiceLine>
</Invoice>`;
    },
    
    // Exportar reporte completo
    exportarReporte: function() {
        FacturaExpress.utils.showToast('Generando reporte de facturación...', 'info');
        
        setTimeout(() => {
            const csv = this.generarCSV();
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte_facturas_${FacturaExpress.utils.formatDate(new Date())}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            FacturaExpress.utils.showToast('Reporte exportado exitosamente', 'success');
        }, 1000);
    },
    
    // Generar CSV para exportar
    generarCSV: function() {
        const headers = ['Número Factura', 'Fecha', 'Cliente', 'Identificación', 'Estado', 'Monto'];
        const rows = this.state.facturasFiltradas.map(f => [
            f.numero,
            FacturaExpress.utils.formatDate(f.fecha),
            f.cliente,
            f.clienteIdentificacion,
            this.estadosFactura[f.estado]?.texto || 'Enviado',
            f.monto
        ]);
        
        const csvContent = [headers, ...rows]
            .map(row => row.join(','))
            .join('\n');
        
        return csvContent;
    },
    
    // Configurar event listeners
    setupEventListeners: function() {
        // Búsqueda
        const searchInput = document.getElementById('bFac');
        if (searchInput) {
            const debouncedSearch = FacturaExpress.utils.debounce((value) => {
                this.state.filtroBusqueda = value;
                this.state.paginaActual = 1;
                this.aplicarFiltros();
                this.renderFacturas();
            }, 300);
            
            searchInput.addEventListener('input', (e) => {
                debouncedSearch(e.target.value);
            });
        }
        
        // Botón filtros
        const filtrosBtn = document.querySelector('.btn-flat:first-child');
        if (filtrosBtn && filtrosBtn.textContent.includes('Filtros')) {
            filtrosBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.mostrarDialogoFiltros();
            });
        }
        
        // Botón exportar
        const exportarBtn = document.querySelector('.btn-dark');
        if (exportarBtn && exportarBtn.textContent.includes('Exportar')) {
            exportarBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportarReporte();
            });
        }
        
        // Botones de paginación
        const paginacionContainer = document.querySelector('.content-card > div:last-child');
        if (paginacionContainer) {
            const prevBtn = paginacionContainer.querySelector('a:first-child');
            const nextBtn = paginacionContainer.querySelector('a:last-child');
            
            if (prevBtn) {
                prevBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (this.state.paginaActual > 1) {
                        this.state.paginaActual--;
                        this.renderFacturas();
                    }
                });
            }
            
            if (nextBtn) {
                nextBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (this.state.paginaActual < this.state.totalPaginas) {
                        this.state.paginaActual++;
                        this.renderFacturas();
                    }
                });
            }
        }
    },
    
    // Mostrar diálogo de filtros
    mostrarDialogoFiltros: function() {
        const estados = ['todos', 'enviado', 'pendiente', 'procesando', 'rechazado'];
        const estadoActual = this.state.filtroEstado;
        
        const seleccion = prompt(
            'Seleccione filtro de estado:\n' +
            '1. Todos\n' +
            '2. Enviados\n' +
            '3. Pendientes\n' +
            '4. Procesando\n' +
            '5. Rechazados\n\n' +
            `Estado actual: ${estadoActual === 'todos' ? 'Todos' : this.estadosFactura[estadoActual]?.texto || 'Todos'}`
        );
        
        const opciones = { '1': 'todos', '2': 'enviado', '3': 'pendiente', '4': 'procesando', '5': 'rechazado' };
        
        if (opciones[seleccion]) {
            this.state.filtroEstado = opciones[seleccion];
            this.state.paginaActual = 1;
            this.aplicarFiltros();
            this.renderFacturas();
            FacturaExpress.utils.showToast(`Filtro aplicado: ${opciones[seleccion] === 'todos' ? 'Todos' : this.estadosFactura[opciones[seleccion]]?.texto}`, 'success');
        } else if (seleccion) {
            FacturaExpress.utils.showToast('Opción inválida', 'error');
        }
    }
};

// Inicializar si estamos en la página de facturación
if (document.querySelector('table th:first-child')) {
    document.addEventListener('DOMContentLoaded', () => {
        FacturacionModule.init();
    });
}