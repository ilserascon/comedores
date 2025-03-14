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