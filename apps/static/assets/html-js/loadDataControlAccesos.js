document.addEventListener('DOMContentLoaded', function() {
    const btnCleanFilters = document.getElementById('BtnLimpiarFiltros');
    const applyFiltersBtn = document.getElementById('BtnFiltros');
    const tableBody = document.getElementById('TableBody');
    const tableHead = document.getElementById('TableHead');
    const filterForm = document.getElementById('filterForm')


    async function fetchAndDisplayControlAcceso(filters) {
        const data = await fetchControlAcceso({ ...filters });

        if (data.totales || data.totales.length != 0) {
            tableHead.innerHTML = data.totales.map(total => `
                <tr><th>Total Vales: ${total.vales}</th></tr>
                <tr><th>Total Empleados: ${total.empleados}</th></tr>
                <tr><th>Total Servicios: ${total.vales + total.empleados}</th></tr>
            `).join('');
        }

        if (!data.datos || data.datos.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="2" class="text-center">No se encontraron registros</td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = data.datos.map(entry => `
                <tr>
                    <td>${entry.empresa}</td>
                    <td>${entry.entradas}</td>
                </tr>
            `).join('');
        }
    }
    

    // Apply filters and fetch reports
    applyFiltersBtn.addEventListener('click', function() {
        filters = {
            filterDate: document.getElementById('filterDate').value
        };

        fetchAndDisplayControlAcceso(filters);
    });
    
    document.getElementById('exportExcelButton').addEventListener('click', async function() {
        /*const filters = {
            filterClient: document.getElementById('filterClient').value,
            filterDiningRoom: document.getElementById('filterDiningRoom').value,
            filterVoucherNumber: document.getElementById('filterVoucherNumber').value,
            filterLotNumber : document.getElementById('filterLotNumber').value,
            filterStatus: document.getElementById('filterStatus').value,
            filterStartDate: document.getElementById('filterStartDate').value,
            filterEndDate: document.getElementById('filterEndDate').value
        };
        try {
            const response = await fetchExportExcelUniqueReport(filters);
            if(response.status === 200) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'reporte_unico.xlsx';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                showToast('Ocurrió un error al exportar el reporte', 'danger');
            }
        } catch (error) {
            showToast(error.message, 'danger');
        }*/
    });

    // Clear filters
    btnCleanFilters.addEventListener('click', function() {
        document.getElementById('filterDate').value = '';
        fetchAndDisplayControlAcceso({});
    });

    fetchAndDisplayControlAcceso({});
});