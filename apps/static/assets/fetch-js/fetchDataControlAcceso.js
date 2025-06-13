async function fetchControlAcceso(filters) {
    const queryString = new URLSearchParams(filters).toString();
    const response = await fetch(`/api/control_accesos?${queryString}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response.json();
}
