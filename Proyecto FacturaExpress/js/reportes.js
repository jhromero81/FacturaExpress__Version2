/* ============================================
   FACTURAEXPRESS - REPORTES MODULE
   Estadísticas y reportes del sistema
   ============================================ */

const ReportesModule = {
    // Estado del módulo
    state: {
        facturas: [],
        clientes: [],
        productos: [],
        periodoActual: 'semanal',
        estadisticas: {
            ventasMes: 0,
            totalFacturas: 0,
            clientesNuevos: 0,
            productosVendidos: 0,
            ventasPorDia: [],
            topProductos: []
        }
    },
    
    // Inicializar módulo
    init: function() {
        this.loadData();
        this.calcularEstadisticas();
        this.renderEstadisticas();
        this.setupEventListeners();
    },
    
    // Cargar datos desde localStorage
    loadData: function() {
        this.state.facturas = FacturaExpress.DataManager.loadOrGenerate(
            'facturas',
            () => FacturaExpress.SampleData.generarFacturasEjemplo(45)
        );
        this.state.clientes = FacturaExpress.storage.get('clientes', []);
        this.state.productos = FacturaExpress.storage.get('productos', []);
    },
    
    // Generar datos de ejemplo (delegado a core.js)
    generarDatosEjemplo: function() {
        this.state.facturas = FacturaExpress.SampleData.generarFacturasEjemplo(45);
        FacturaExpress.storage.set('facturas', this.state.facturas);
    },
    
    // Calcular todas las estadísticas
    calcularEstadisticas: function() {
        const ahora = new Date();
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        
        // Ventas del mes
        const facturasMes = this.state.facturas.filter(f => new Date(f.fecha) >= inicioMes);
        this.state.estadisticas.ventasMes = facturasMes.reduce((sum, f) => sum + f.total, 0);
        
        // Total facturas
        this.state.estadisticas.totalFacturas = this.state.facturas.length;
        
        // Clientes nuevos (últimos 30 días)
        const hace30Dias = new Date(ahora.setDate(ahora.getDate() - 30));
        this.state.estadisticas.clientesNuevos = this.state.clientes.filter(c => 
            c.fechaRegistro && new Date(c.fechaRegistro) >= hace30Dias
        ).length;
        
        // Productos vendidos
        let totalProductos = 0;
        this.state.facturas.forEach(f => {
            f.items.forEach(item => {
                totalProductos += item.cantidad;
            });
        });
        this.state.estadisticas.productosVendidos = totalProductos;
        
        // Top productos
        this.calcularTopProductos();
        
        // Ventas por día (últimos 7 días)
        this.calcularVentasPorDia();
    },
    
    // Calcular top productos más vendidos
    calcularTopProductos: function() {
        const productosVendidos = {};
        
        this.state.facturas.forEach(factura => {
            factura.items.forEach(item => {
                if (!productosVendidos[item.nombre]) {
                    productosVendidos[item.nombre] = { cantidad: 0, total: 0 };
                }
                productosVendidos[item.nombre].cantidad += item.cantidad;
                productosVendidos[item.nombre].total += item.precio * item.cantidad;
            });
        });
        
        this.state.estadisticas.topProductos = Object.entries(productosVendidos)
            .map(([nombre, data]) => ({ nombre, ...data }))
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 5);
    },
    
    // Calcular ventas por día (últimos 7 días) - Delegado a CalculationUtils
    calcularVentasPorDia: function() {
        this.state.estadisticas.ventasPorDia = FacturaExpress.CalculationUtils.calculateDailySalesData(
            this.state.facturas,
            7
        );
    },
    
    // Renderizar estadísticas en la UI
    renderEstadisticas: function() {
        this.updateKPIs();
        this.updateTopProductos();
        this.updateMetaVentas();
    },
    
    // Actualizar KPIs
    updateKPIs: function() {
        const ventasMesElem = document.querySelector('.rk-val');
        if (ventasMesElem) {
            const kpiValues = document.querySelectorAll('.rk-val');
            if (kpiValues.length >= 4) {
                kpiValues[0].textContent = FacturaExpress.utils.formatMoney(this.state.estadisticas.ventasMes);
                kpiValues[1].textContent = this.state.estadisticas.totalFacturas;
                kpiValues[2].textContent = this.state.estadisticas.clientesNuevos;
                kpiValues[3].textContent = this.state.estadisticas.productosVendidos;
            }
        }
    },
    
    // Actualizar lista de top productos
    updateTopProductos: function() {
        const container = document.querySelector('.content-card ul');
        if (!container) return;
        
        if (this.state.estadisticas.topProductos.length === 0) {
            container.innerHTML = '<li style="padding: 20px; text-align: center; color: #90a4ae;">No hay datos disponibles</li>';
            return;
        }
        
        container.innerHTML = this.state.estadisticas.topProductos.map((producto, index) => `
            <li style="display:flex;justify-content:space-between;padding:9px 0;${index < 2 ? 'border-bottom:1px solid #eceff1;' : ''}">
                <span style="font-weight:600;font-size:13px;">${this.truncarTexto(producto.nombre, 25)}</span>
                <span style="color:#1abc9c;font-family:Space Mono,monospace;font-size:12px;">${producto.cantidad} vendidos</span>
            </li>
        `).join('');
    },
    
    // Actualizar barra de meta de ventas
    updateMetaVentas: function() {
        const metaMensual = 6400000;
        const porcentaje = FacturaExpress.utils.calculatePercentage(this.state.estadisticas.ventasMes, metaMensual);
        const faltante = metaMensual - this.state.estadisticas.ventasMes;
        
        const porcentajeElem = document.querySelector('.progress + div span:first-child');
        const barraProgress = document.querySelector('.progress .determinate');
        const faltanteElem = document.querySelector('.progress + div span:last-child strong');
        
        if (porcentajeElem) {
            porcentajeElem.textContent = `${FacturaExpress.utils.formatMoney(this.state.estadisticas.ventasMes)} / ${FacturaExpress.utils.formatMoney(metaMensual)}`;
        }
        
        if (barraProgress) {
            barraProgress.style.width = `${Math.min(porcentaje, 100)}%`;
        }
        
        const porcentajeTexto = document.querySelector('.progress + div span:first-child + span');
        if (porcentajeTexto) {
            porcentajeTexto.textContent = `${porcentaje}%`;
        }
        
        if (faltanteElem && faltante > 0) {
            faltanteElem.textContent = FacturaExpress.utils.formatMoney(faltante);
        }
    },
    
    // Truncar texto
    truncarTexto: function(texto, maxLength) {
        if (!texto) return '';
        return texto.length > maxLength ? texto.substring(0, maxLength) + '...' : texto;
    },
    
    // Cambiar período (semanal/mensual/trimestral/anual)
    cambiarPeriodo: function(periodo) {
        this.state.periodoActual = periodo;
        this.calcularEstadisticas();
        this.renderEstadisticas();
        FacturaExpress.utils.showToast(`Período cambiado a ${periodo}`, 'info');
    },
    
    // Exportar reporte a PDF (simulación)
    exportarReporte: function() {
        FacturaExpress.utils.showToast('Generando reporte PDF...', 'info');
        setTimeout(() => {
            FacturaExpress.utils.showToast('Reporte exportado exitosamente', 'success');
        }, 1500);
    },
    
    // Configurar event listeners
    setupEventListeners: function() {
        // Botones de período
        const periodButtons = document.querySelectorAll('.tab-btn');
        periodButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const periodo = btn.textContent.toLowerCase();
                periodButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.cambiarPeriodo(periodo);
            });
        });
        
        // Botón exportar
        const exportBtn = document.querySelector('.btn-dark');
        if (exportBtn && exportBtn.textContent.includes('Exportar')) {
            exportBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportarReporte();
            });
        }
    }
};

// Inicializar si estamos en la página de reportes
if (document.querySelector('.report-kpi')) {
    document.addEventListener('DOMContentLoaded', () => {
        ReportesModule.init();
    });
}