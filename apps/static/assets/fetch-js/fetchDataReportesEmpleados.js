// Fetch for get_employee_report_general
async function fetchEmployeeReportGeneral(filters) {
    const queryString = new URLSearchParams(filters).toString();
    const response = await fetch(`/get_employee_report_general?${queryString}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response.json();
}

// Fetch for get_clients_employee_reports
async function fetchClientsEmployeeReports(filters) {
    const queryString = new URLSearchParams(filters).toString();
    const response = await fetch(`/get_clients_employee_reports?${queryString}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response.json();
}

// Fetch for get_diner_employee_reports
async function fetchDinerEmployeeReports(filters) {
    const queryString = new URLSearchParams(filters).toString();
    const response = await fetch(`/get_diner_employee_reports?${queryString}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response.json();
}

// Fetch for get_employee_report_summary
async function fetchEmployeeReportSummary(filters) {
    const queryString = new URLSearchParams(filters).toString();
    const response = await fetch(`/get_employee_report_summary?${queryString}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response.json();
}

// Fetch for get_employee_report_summary_details
async function fetchEmployeeReportSummaryDetails(filters) {
    const queryString = new URLSearchParams(filters).toString();
    const response = await fetch(`/get_employee_report_summary_details?${queryString}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    return response.json();
}