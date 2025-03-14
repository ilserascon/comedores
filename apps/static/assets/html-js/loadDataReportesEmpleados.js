document.addEventListener('DOMContentLoaded', function() {
    const btnCleanFilters = document.getElementById('dropFiltersBtn');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const generalReportsTableBody = document.getElementById('generalReportsTableBody');
    const summaryReportsTableBody = document.getElementById('summaryReportsTableBody');
    const detailEntriesTableBody = document.getElementById('detailEntriesTableBody');
    const viewDetailsModal = new bootstrap.Modal(document.getElementById('viewDetailsModal'));
    const paginationGeneral = document.getElementById('pagination-general');
    const paginationResumen = document.getElementById('pagination-resumen');
    const paginationDetalle = document.getElementById('pagination-detalle');

    // Function to show toast
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        const header = type === 'success' ? 'Éxito' : type === 'info' ? 'Aviso' : 'Error';
        toast.className = `toast align-items-center text-white bg-${type} border-0 rounded-pill shadow-sm p-2 px-3 m-1`;
        toast.role = 'alert';
        toast.ariaLive = 'assertive';
        toast.ariaAtomic = 'true';
        toast.style.zIndex = '1';
    
        toast.innerHTML = `
            <div class="toast-header bg-${type} text-white d-flex align-items-center justify-content-between p-1 px-1 rounded-pill shadow-sm">
                <strong class="me-auto">${header}</strong>
                <button type="button" class="btn-close btn-close-white right-1" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body p-1 px-1">
                ${message}
            </div>
        `;
    
        const toastContainer = document.getElementById('toastContainer');
        toastContainer.appendChild(toast);
    
        const bsToast = new bootstrap.Toast(toast, { delay: 4000 });
        bsToast.show();
    
        setTimeout(() => {
            toast.remove();
        }, 4000);
    
        toast.querySelector('.btn-close').addEventListener('click', function() {
            toast.remove();
            bsToast.hide();
        });
    }

    // Populate clients and dining rooms
    async function populateFilters() {
        const clients = await fetchClientsEmployeeReports({});
        const diningRooms = await fetchDinerEmployeeReports({});
        
        const filterClient = document.getElementById('filterClient');
        const filterDiningRoom = document.getElementById('filterDiningRoom');

        if (clients.clients.length === 0) {
            filterClient.innerHTML = `<option value="">Todos</option> <option value="" disabled>No hay clientes disponibles</option>`;
        } else {
            filterClient.innerHTML = `<option value="">Todos</option>` + clients.clients.map(client => `<option value="${client.employee_client_diner__client_diner__client__id}">${client.employee_client_diner__client_diner__client__company}</option>`).join('');
        }

        if (diningRooms.diners.length === 0) {
            filterDiningRoom.innerHTML = `<option value="">Todos</option> <option value="" disabled>No hay comedores disponibles</option>`;
        } else {
            filterDiningRoom.innerHTML = `<option value="">Todos</option>` + diningRooms.diners.map(diner => `<option value="${diner.employee_client_diner__client_diner__dining_room__id}">${diner.employee_client_diner__client_diner__dining_room__name}</option>`).join('');
        }
    }

    // Fetch and display general reports
    async function fetchAndDisplayGeneralReports(filters) {
        const data = await fetchEmployeeReportGeneral({ ...filters });
        if (data.entry_employee.length === 0) {
            generalReportsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">No se encontraron registros</td>
                </tr>
            `;
        } else {
            generalReportsTableBody.innerHTML = data.entry_employee.map(entry => `
                <tr>
                    <td>${entry.client_company}</td>
                    <td>${entry.client_name} ${entry.client_lastname} ${entry.client_second_lastname}</td>
                    <td>${entry.dining_room_name}</td>
                    <td>${entry.employee_code}</td>
                    <td>${entry.employee_name} ${entry.employee_lastname} ${entry.employee_second_lastname}</td>
                    <td>
                        <span class="badge badge-dot mr-4">
                            <i class="${entry.employee_status ? 'bg-success' : 'bg-danger'}"></i>
                            <span class="status">${entry.employee_status ? 'Activo' : 'Inactivo'}</span>
                        </span>
                    </td>
                    <td>${formateDate(entry.entry_created_at)}</td>
                </tr>
            `).join('');
        }
        paginationGeneral.innerHTML = createPagination(data.page, data.pages, fetchAndDisplayGeneralReports, filters, 'pagination-general');
    }

    // Fetch and display summary reports
    async function fetchAndDisplaySummaryReports(filters) {
        const data = await fetchEmployeeReportSummary({ ...filters });
        if (data.employee_report_summary.length === 0) {
            summaryReportsTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">No se encontraron registros</td>
                </tr>
            `;
        } else {
            summaryReportsTableBody.innerHTML = data.employee_report_summary.map(entry => `
                <tr>
                    <td>${entry.client_company}</td>
                    <td>${entry.client_name} ${entry.client_lastname} ${entry.client_second_lastname}</td>
                    <td>${entry.dining_room_name}</td>
                    <td>${entry.employee_code}</td>
                    <td>${entry.employee_name} ${entry.employee_lastname} ${entry.employee_second_lastname}</td>
                    <td>
                        <span class="badge badge-dot mr-4">
                            <i class="${entry.employee_status ? 'bg-success' : 'bg-danger'}"></i>
                            <span class="status">${entry.employee_status ? 'Activo' : 'Inactivo'}</span>
                        </span>
                    </td>
                    <td>${entry.entry_count}</td>
                    <td><button class="btn btn-sm btn-primary" onclick="viewEmployeeDetails(${JSON.stringify({ employeeId: entry.employee_id, dinerId: entry.dining_room_id, ...filters }).replace(/"/g, '&quot;')})">Ver detalles</button></td>
                </tr>
            `).join('');
        }
        paginationResumen.innerHTML = createPagination(data.page, data.pages, fetchAndDisplaySummaryReports, filters, 'pagination-resumen');
    }

    // Fetch and display employee details
    async function viewEmployeeDetails(filters) {
        const data = await fetchEmployeeReportSummaryDetails({ ...filters });   
        document.getElementById('detail_code').value = data.employee_detail.employee_code;
        document.getElementById('detail_first_name').value = data.employee_detail.employee_name;
        document.getElementById('detail_last_name').value = data.employee_detail.employee_lastname;
        document.getElementById('detail_second_last_name').value = data.employee_detail.employee_second_lastname;
        document.getElementById('detail_status').value = data.employee_detail.employee_status ? 'Activo' : 'Inactivo';
        document.getElementById('detail_entries').value = data.employee_detail.entry_count;

        if (data.employee_entries.length === 0) {
            detailEntriesTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">No se encontraron registros</td>
                </tr>
            `;
        } else {
            detailEntriesTableBody.innerHTML = data.employee_entries.map(entry => `
                <tr>
                    <td>${entry.client_company}</td>
                    <td>${entry.client_name} ${entry.client_lastname} ${entry.client_second_lastname}</td>
                    <td>${entry.dining_room_name}</td>
                    <td>${formateDate(entry.entry_created_at)}</td>
                </tr>
            `).join('');
        }

        paginationDetalle.innerHTML = createPagination(data.page, data.pages, viewEmployeeDetails, filters, 'pagination-detalle');
        viewDetailsModal.show();
    }

    // Assign viewEmployeeDetails to window object to make it globally accessible
    window.viewEmployeeDetails = viewEmployeeDetails;
    
    let isFetching = false; // Variable para controlar si se está haciendo una solicitud

    function createPagination(currentPage, totalPages, fetchFunction, filters, paginationId = 'pagination-general') {
        let paginationHTML = '';
        const pagination = document.getElementById(paginationId);
        const maxPagesToShow = 5;
        const halfPagesToShow = Math.floor(maxPagesToShow / 2);
        let startPage = Math.max(1, currentPage - halfPagesToShow);
        let endPage = Math.min(totalPages, currentPage + halfPagesToShow);
    
        // Ajustar el rango de páginas cuando se está cerca del principio o final
        if (currentPage <= halfPagesToShow) {
            endPage = Math.min(totalPages, maxPagesToShow);
        } else if (currentPage + halfPagesToShow >= totalPages) {
            startPage = Math.max(1, totalPages - maxPagesToShow + 1);
        }
    
        // Agregar el botón de "Anterior"
        if (currentPage > 1) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="javascript:void(0);" page-number="${currentPage - 1}">
                        <i class="fas fa-angle-left"></i>
                        <span class="sr-only">Previous</span>
                    </a>
                </li>`;
        }
    
        // Agregar los botones de número de página
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}" style="z-index: 0;">
                    <a class="page-link" href="javascript:void(0);" page-number="${i}">${i}</a>
                </li>`;
        }
    
        // Agregar el botón de "Siguiente"
        if (currentPage < totalPages) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="javascript:void(0);" page-number="${currentPage + 1}">
                        <i class="fas fa-angle-right"></i>
                        <span class="sr-only">Next</span>
                    </a>
                </li>`;
        }
    
        pagination.innerHTML = paginationHTML;
    
        const handlePaginationClick = async function(event) {
            if (event.target.tagName === 'A' && !isFetching) {
                const pageNumber = event.target.getAttribute('page-number');
                
                // Marcar que estamos en una solicitud para evitar duplicados
                isFetching = true;
                
                // Hacer la solicitud para obtener los datos de la página
                await fetchFunction({ ...filters, page: pageNumber });
    
                // Marcar que la solicitud ha terminado
                isFetching = false;
            }
        };
    
        // Asegurarse de que no haya múltiples listeners
        pagination.removeEventListener('click', handlePaginationClick);
        pagination.addEventListener('click', handlePaginationClick);
    
        return paginationHTML;
    }
    


    function formateDate(date){
        // Formatear fecha a dd/mm/yyyy y hora a hh:mm
        const dateObj = new Date(date);
        const day = dateObj.getDate();
        const month = dateObj.getMonth() + 1;
        const year = dateObj.getFullYear();
        const hours = dateObj.getHours();
        const minutes = dateObj.getMinutes();
        const seconds = dateObj.getSeconds();
        return `${day < 10 ? '0' + day : day}/${month < 10 ? '0' + month : month
        }/${year} - ${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
    }

    // Apply filters and fetch reports
    applyFiltersBtn.addEventListener('click', function() {
        const filters = {
            filterClient: document.getElementById('filterClient').value,
            filterDiningRoom: document.getElementById('filterDiningRoom').value,
            filterEmployeeNumber: document.getElementById('filterEmployeeNumber').value,
            filterStatus: document.getElementById('filterStatus').value,
            filterStartDate: document.getElementById('filterStartDate').value,
            filterEndDate: document.getElementById('filterEndDate').value
        };

        fetchAndDisplayGeneralReports(filters);
        fetchAndDisplaySummaryReports(filters);
    });

    // Cerrar modal con esc o picando afuera
    viewDetailsModal._element.addEventListener('hidden.bs.modal', function() {
        paginationDetalle.innerHTML = '';
    });

    // Clear filters
    btnCleanFilters.addEventListener('click', function() {
        document.getElementById('filterClient').value = '';
        document.getElementById('filterDiningRoom').value = '';
        document.getElementById('filterEmployeeNumber').value = '';
        document.getElementById('filterStatus').value = '';
        document.getElementById('filterStartDate').value = '';
        document.getElementById('filterEndDate').value = '';
        fetchAndDisplayGeneralReports({});
        fetchAndDisplaySummaryReports({});
    });

    // Initial population of filters and reports
    populateFilters();
    fetchAndDisplayGeneralReports({});
    fetchAndDisplaySummaryReports({});
});