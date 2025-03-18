// Fetch for get_unique_reports
async function fetchUniqueReports(filters) {
    const queryString = new URLSearchParams(filters).toString();
    const response = await fetch(`/get_unique_reports?${queryString}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response.json();
}

// Fetch for get_clients_unique_reports
async function fetchClientsUniqueReports(filters) {
    const queryString = new URLSearchParams(filters).toString();
    const response = await fetch(`/get_clients_unique_reports?${queryString}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response.json();
}

// Fetch for get_diners_unique_reports
async function fetchDinersUniqueReports(filters) {
    const queryString = new URLSearchParams(filters).toString();
    const response = await fetch(`/get_diners_unique_reports?${queryString}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response.json();
}

// Fetch for export_excel_unique_reports
async function fetchExportExcelUniqueReport(filters) {
    const queryString = new URLSearchParams(filters).toString();
    const response = await fetch(`/export_excel_unique_reports?${queryString}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (response.ok) {
        return response;
    } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar el archivo Excel');
    }
}