/* ============================================
   FACTURAEXPRESS - DASHBOARD MODULE
   Panel principal con estadísticas y gráficos
   ============================================ */

const DashboardModule = {
    // Estado del módulo
    state: {
        estadisticas: {
            ventasDia: 1240000,
            facturasEmitidas: 45,
            pendientesDIAN: 0,
            ticketPromedio: 27500,
            variacionVentas: 12,
            variacionFacturas: 5,
            variacionTicket: -2
        },
        ultimasTransacciones: [],
        ventasSemanales: [850000, 920000, 1100000, 980000, 1240000, 1350000, 1180000],
        diasSemana: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    },
    
    // Inicializar módulo
    init: function() {
        this.loadData();
        this.actualizarEstadisticas();
        this.cargarUltimasTransacciones();
        this.setupEventListeners();
        this.iniciarActualizacionAutomatica();
    },
    
    // Cargar datos desde localStorage
    loadData: function() {
        const facturas = FacturaExpress.DataManager.loadOrGenerate(
            'facturas',
            () => FacturaExpress.SampleData.generarFacturasEjemplo(25)
        );
        
        if (facturas.length > 0) {
            this.calcularEstadisticasReales(facturas);
        }
    },
    
    // Calcular estadísticas reales desde las facturas
    calcularEstadisticasReales: function(facturas) {
        const hoy = new Date();
        const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        
        // Ventas del día
        const facturasHoy = facturas.filter(f => new Date(f.fecha) >= inicioHoy);
        const ventasDia = facturasHoy.reduce((sum, f) => sum + f.total, 0);
        
        // Facturas emitidas hoy
        const facturasEmitidas = facturasHoy.length;
        
        // Ticket promedio del día
        const ticketPromedio = facturasHoy.length > 0 ? ventasDia / facturasHoy.length : 0;
        
        // Calcular variaciones (simulado con datos reales)
        const ayer = new Date(hoy);
        ayer.setDate(hoy.getDate() - 1);
        const inicioAyer = new Date(ayer.getFullYear(), ayer.getMonth(), ayer.getDate());
        
        const facturasAyer = facturas.filter(f => {
            const fechaFactura = new Date(f.fecha);
            return fechaFactura >= inicioAyer && fechaFactura < inicioHoy;
        });
        
        const ventasAyer = facturasAyer.reduce((sum, f) => sum + f.total, 0);
        const facturasAyerCount = facturasAyer.length;
        
        const variacionVentas = ventasAyer > 0 ? Math.round(((ventasDia - ventasAyer) / ventasAyer) * 100) : 0;
        const variacionFacturas = facturasAyerCount > 0 ? Math.round(((facturasEmitidas - facturasAyerCount) / facturasAyerCount) * 100) : 0;
        
        // Actualizar estado
        this.state.estadisticas = {
            ventasDia: ventasDia,
            facturasEmitidas: facturasEmitidas,
            pendientesDIAN: 0,
            ticketPromedio: ticketPromedio,
            variacionVentas: variacionVentas,
            variacionFacturas: variacionFacturas,
            variacionTicket: -2 // Simulado
        };
        
        // Calcular ventas semanales reales
        this.calcularVentasSemanales(facturas);
    },
    
    calcularVentasSemanales: function(facturas) {
        const data = FacturaExpress.CalculationUtils.calculateDailySalesData(facturas, 7);
        this.state.ventasSemanales = data.map(d => d.monto);
    },
    
    // Actualizar estadísticas en la UI
    actualizarEstadisticas: function() {
        const stats = this.state.estadisticas;
        
        // Actualizar valores
        const ventasDiaElem = document.querySelector('.stat-card:first-child .stat-value');
        const facturasElem = document.querySelector('.stat-card:nth-child(2) .stat-value');
        const pendientesElem = document.querySelector('.stat-card:nth-child(3) .stat-value');
        const ticketElem = document.querySelector('.stat-card:nth-child(4) .stat-value');
        
        if (ventasDiaElem) ventasDiaElem.textContent = FacturaExpress.utils.formatMoney(stats.ventasDia);
        if (facturasElem) facturasElem.textContent = stats.facturasEmitidas;
        if (pendientesElem) pendientesElem.textContent = stats.pendientesDIAN;
        if (ticketElem) ticketElem.textContent = FacturaExpress.utils.formatMoney(stats.ticketPromedio);
        
        // Actualizar variaciones
        const variaciones = document.querySelectorAll('.stat-change');
        if (variaciones.length >= 3) {
            // Variación ventas
            variaciones[0].innerHTML = `<i class="material-icons card-title-icon">${stats.variacionVentas >= 0 ? 'arrow_upward' : 'arrow_downward'}</i> ${Math.abs(stats.variacionVentas)}% vs ayer`;
            variaciones[0].className = `stat-change ${stats.variacionVentas >= 0 ? 'change-up' : 'change-down'}`;
            
            // Variación facturas
            variaciones[1].innerHTML = `<i class="material-icons card-title-icon">${stats.variacionFacturas >= 0 ? 'arrow_upward' : 'arrow_downward'}</i> ${Math.abs(stats.variacionFacturas)}% vs ayer`;
            variaciones[1].className = `stat-change ${stats.variacionFacturas >= 0 ? 'change-up' : 'change-down'}`;
        }
        
        // Actualizar gráfico
        this.actualizarGrafico();
    },
    
    // Actualizar gráfico de ventas semanales
    actualizarGrafico: function() {
        const svg = document.querySelector('.fx-content svg');
        if (!svg) return;
        
        const maxVenta = Math.max(...this.state.ventasSemanales, 1);
        const alturaMaxima = 140; // Altura máxima de las barras
        const anchoBarra = 45;
        const inicioX = 35;
        
        // Limpiar barras existentes (excepto las de texto y ejes)
        const barrasExistentes = svg.querySelectorAll('rect.barra-venta');
        barrasExistentes.forEach(barra => barra.remove());
        
        // Dibujar nuevas barras
        this.state.ventasSemanales.forEach((venta, index) => {
            const altura = (venta / maxVenta) * alturaMaxima;
            const y = 160 - altura;
            const x = inicioX + (index * 75);
            
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', y);
            rect.setAttribute('width', anchoBarra);
            rect.setAttribute('height', altura);
            rect.setAttribute('rx', '6');
            rect.setAttribute('fill', '#1abc9c');
            rect.setAttribute('opacity', '0.85');
            rect.setAttribute('class', 'barra-venta');
            
            svg.appendChild(rect);
        });
    },
    
    // Cargar últimas transacciones
    cargarUltimasTransacciones: function() {
        const facturas = FacturaExpress.storage.get('facturas', []);
        
        // Ordenar por fecha descendente y tomar las 4 más recientes
        const ultimas = [...facturas]
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .slice(0, 4);
        
        if (ultimas.length === 0) {
            // Datos de ejemplo si no hay facturas
            this.state.ultimasTransacciones = [
                { numero: 'FAC-00124', fecha: new Date(), monto: 45000, tiempo: 'Hace 15 min' },
                { numero: 'FAC-00123', fecha: new Date(), monto: 12500, tiempo: 'Hace 15 min' },
                { numero: 'FAC-00122', fecha: new Date(), monto: 89000, tiempo: 'Hace 16 min' },
                { numero: 'FAC-00121', fecha: new Date(), monto: 156000, tiempo: 'Hace 17 min' }
            ];
        } else {
            this.state.ultimasTransacciones = ultimas.map(f => ({
                numero: f.numero,
                fecha: new Date(f.fecha),
                monto: f.total,
                tiempo: this.calcularTiempoRelativo(new Date(f.fecha))
            }));
        }
        
        this.renderUltimasTransacciones();
    },
    
    // Calcular tiempo relativo (hace X minutos/horas)
    calcularTiempoRelativo: function(fecha) {
        const ahora = new Date();
        const diffMs = ahora - fecha;
        const diffMin = Math.floor(diffMs / 60000);
        
        if (diffMin < 1) return 'Hace unos segundos';
        if (diffMin === 1) return 'Hace 1 minuto';
        if (diffMin < 60) return `Hace ${diffMin} minutos`;
        
        const diffHoras = Math.floor(diffMin / 60);
        if (diffHoras === 1) return 'Hace 1 hora';
        if (diffHoras < 24) return `Hace ${diffHoras} horas`;
        
        const diffDias = Math.floor(diffHoras / 24);
        if (diffDias === 1) return 'Ayer';
        return `Hace ${diffDias} días`;
    },
    
    // Renderizar lista de últimas transacciones
    renderUltimasTransacciones: function() {
        const txnList = document.querySelector('.txn-list');
        if (!txnList) return;
        
        txnList.innerHTML = '';
        
        this.state.ultimasTransacciones.forEach(txn => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="txn-icon-box"><i class="material-icons card-title-icon">receipt</i></div>
                <div><div class="txn-num">${txn.numero}</div><div class="txn-time">${txn.tiempo}</div></div>
                <div class="txn-amount">${FacturaExpress.utils.formatMoney(txn.monto)}</div>
            `;
            txnList.appendChild(li);
        });
        
        // Si no hay suficientes, agregar algunos de ejemplo
        if (this.state.ultimasTransacciones.length < 4) {
            const ejemplos = [
                { numero: 'FAC-00120', tiempo: 'Hace 2 horas', monto: 234000 },
                { numero: 'FAC-00119', tiempo: 'Hace 3 horas', monto: 67000 }
            ];
            
            ejemplos.slice(0, 4 - this.state.ultimasTransacciones.length).forEach(ej => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="txn-icon-box"><i class="material-icons card-title-icon">receipt</i></div>
                    <div><div class="txn-num">${ej.numero}</div><div class="txn-time">${ej.tiempo}</div></div>
                    <div class="txn-amount">${FacturaExpress.utils.formatMoney(ej.monto)}</div>
                `;
                txnList.appendChild(li);
            });
        }
    },
    
    // Actualizar datos automáticamente cada 30 segundos
    iniciarActualizacionAutomatica: function() {
        setInterval(() => {
            this.loadData();
            this.actualizarEstadisticas();
            this.cargarUltimasTransacciones();
        }, 30000); // Actualizar cada 30 segundos
    },
    
    // Configurar event listeners
    setupEventListeners: function() {
        // Botón de refrescar (si existe)
        const refreshBtn = document.querySelector('.fx-topbar-title + .btn-flat');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.refrescarDatos();
            });
        }
    },
    
    // Refrescar datos manualmente
    refrescarDatos: function() {
        FacturaExpress.utils.showToast('Actualizando datos...', 'info');
        this.loadData();
        this.actualizarEstadisticas();
        this.cargarUltimasTransacciones();
        FacturaExpress.utils.showToast('Datos actualizados', 'success');
    }
};

// Inicializar si estamos en el dashboard
FacturaExpress.ModuleManager.createModule('Dashboard', DashboardModule);

if (document.querySelector('.stat-card')) {
    document.addEventListener('DOMContentLoaded', () => DashboardModule.init());
}