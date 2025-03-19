// Fetch and populate clients
async function fetchClients(page = 1, search = '') {
    try {
        const response = await fetch(`/client_list?page=${page}&search=${encodeURIComponent(search)}`);
        const data = await response.json();
        return data;
    } catch (error) {
        return { clients: [], page: 1, pages: 1 };
    }
}

// Create or update client
async function saveClient(clientId, data) {
    const url = clientId ? `/client_detail/${clientId}` : '/client_list';
    const method = clientId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            return result;
        } else {
            return result; // Return the error result to show in the toast
        }
    } catch (error) {
        return { error: 'Network error' }; // Return a network error to show in the toast
    }
}

// Fetch client details
async function fetchClientDetails(clientId) {
    try {
        const response = await fetch(`/client_detail/${clientId}`);
        const client = await response.json();
        return client;
    } catch (error) {
        return null;
    }
}

// Helper function to get CSRF token from cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

/**
 * OBTIENE UNA LISTA DE CLIENTES DEL SERVIDOR.
 * 
 * @returns {Promise<Array>} - Una promesa que se resuelve con un array de clientes.
 * @throws {Error} - Lanza un error si la operación de fetch falla.
 */
async function getClientes() {
    try {
        const response = await fetch(`/get_clientes`, {        
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al obtener clientes');
        }

        const data = await response.json();        

        return data;
    } catch (error) {
        throw new Error(error.message || 'Error al obtener clientes');
    }
}