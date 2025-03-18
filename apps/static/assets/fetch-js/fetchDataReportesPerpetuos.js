// Fetch for get_perpetual_reports
async function fetchPerpetualReports(filters) {
    const queryString = new URLSearchParams(filters).toString();
    const response = await fetch(`/get_perpetual_reports?${queryString}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response.json();
}

// Fetch for get_clients_perpetual_reports
async function fetchClientsPerpetualReports(filters) {
    const queryString = new URLSearchParams(filters).toString();
    const response = await fetch(`/get_clients_perpetual_reports?${queryString}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response.json();
}

// Fetch for get_diners_perpetual_reports
async function fetchDinersPerpetualReports(filters) {
    const queryString = new URLSearchParams(filters).toString();
    const response = await fetch(`/get_diners_perpetual_reports?${queryString}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response.json();
}

// Fetch for get_perpetual_report_summary
async function fetchPerpetualReportSummary(filters) {
    const queryString = new URLSearchParams(filters).toString();
    const response = await fetch(`/get_perpetual_report_summary?${queryString}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response.json();
}

// Fetch for get_perpetual_report_summary_details
async function fetchPerpetualReportSummaryDetails(filters) {
    const queryString = new URLSearchParams(filters).toString();
    const response = await fetch(`/get_perpetual_report_summary_details?${queryString}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response.json();
}

// Fetch for export_excel_perpetuo_report
async function fetchExportExcelPerpetuoReport(filters) {
    const queryString = new URLSearchParams(filters).toString();
    const response = await fetch(`/export_excel_perpetuo_report?${queryString}`, {
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