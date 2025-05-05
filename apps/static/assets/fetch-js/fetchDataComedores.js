/**
 * OBTIENE LA LISTA DE COMEDORES DE UN CLIENTE EN ESPECÍFICO.
 * 
 * @param {string} clientId - ID del cliente propietario de los comedores.
 * @returns {Promise<Object>} - Datos de los comedores.
 * @throws {Error} - Error al obtener comedores.
 */
async function getAllComedores(clientId = 'all') {
    try {
        const response = await fetch(`/get_all_comedores?&client-id=${clientId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al obtener comedores');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error.message);
        throw new Error(error.message || 'Error al obtener comedores');
    }
}
/**
 * OBTIENE LA LISTA DE COMEDORES CON PAGINACION Y FILTRO.
 * 
 * @param {number} page - Número de la página a obtener.
 * @param {string} filter - Filtro a aplicar en la búsqueda de comedores.
 * @returns {Promise<Object>} - Datos de los comedores.
 * @throws {Error} - Error al obtener comedores.
 */
async function getComedores(page = 1, filter = 'all', in_charge = 'all') {
    try {
        const response = await fetch(`/get_comedores?page=${page}&filter=${filter}&in_charge=${in_charge}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al obtener comedores');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error.message);
        throw new Error(error.message || 'Error al obtener comedores');
    }
}

/**
 * OBTIENE LOS DATOS DE UN COMEDOR ESPECÍFICO POR SU ID.
 *
 * @param {number} id - ID del comedor a obtener.
 * @returns {Promise<Object>} - Datos del comedor.
 * @throws {Error} - Error al obtener comedor.
 */
async function getComedor(id) {
    try {
        const response = await fetch(`/get_comedor?dining_room_id=${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al obtener comedor');
        }

        const data = await response.json();          
        return data;
    } catch (error) {
        console.error('Error:', error.message);
        throw new Error(error.message || 'Error al obtener comedor');
    }
}

/**
 * CREA UN NUEVO COMEDOR CON LOS DATOS PROPORCIONADOS.
 * 
 * @param {Object} data - Datos del comedor a crear.
 * @returns {Promise<Object>} - Resultado de la creación del comedor.
 * @throws {Error} - Error al crear comedor.
 */
async function createComedor(data) {
    const response = await fetch('/create_comedor', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
        // Devuelve el mensaje de error del backend
        return { success: false, message: result.message || 'Error al crear comedor' };
    }

    return { success: true, data: result };
}

/**
 * ACTUALIZA UN COMEDOR EXISTENTE CON LOS DATOS PROPORCIONADOS.
 * 
 * @param {Object} data - Datos del comedor a actualizar.
 * @throws {Error} - Error al actualizar comedor.
 */
async function updateComedor(data) {
    const response = await fetch('/update_comedor', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
        // Devuelve el mensaje de error del backend
        return { success: false, message: result.message || 'Error al actualizar comedor' };
    }

    return { success: true, data: result };
}


/**
 * OBTIENE LA LISTA DE ENCARGADOS.
 * 
 * @returns {Promise<Array>} - Lista de encargados.
 * @throws {Error} - Error al obtener encargados.
 */
async function getEncargados() {
    try {
        const response = await fetch('/get_encargados', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });        

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al obtener encargados');
        }        

        const data = await response.json();        

        return data.encargados;
    } catch (error) {
        console.error('Error:', error.message);
        throw new Error(error.message || 'Error al obtener encargados');
    }
}

async function getEncargadosFiltro() {
    try {
        const response = await fetch('/get_in_charge_filter', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });        

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al obtener encargados');
        }        

        const data = await response.json();        
        console.log(data)
        return data.in_charge;
    } catch (error) {
        console.error('Error:', error.message);
        throw new Error(error.message || 'Error al obtener encargados');
    }
}

/**
 * OBTIENE LA LISTA DE CLIENTES CON COMEDORES.
 * 
 * @returns {Promise<Object>} - Datos de los clientes con comedores.
 * @throws {Error} - Error al obtener clientes con comedores.
 */
async function getClientesComedores() {
    try {
        const response = await fetch('/get_clientes_comedores', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al obtener clientes con comedores');
        }

        const data = await response.json();                  

        return data;
    } catch (error) {
        console.error('Error:', error.message);
        throw new Error(error.message || 'Error al obtener clientes con comedores');
    }

}


/**
 * OBTIENE LA LISTA DE COMEDORES DE UN CLIENTE.
 * 
 * @returns {Promise<Object>} - Datos de comedores de un cliente.
 * @throws {Error} - Error al obtener los comedores de un cliente.
 */
async function getComedoresClientes(id) {
    try {
        const response = await fetch(`/get_comedores_clientes?client_id=${id}`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al obtener los comedores de un cliente');
        }

        const data = await response.json();                  

        return data;
    } catch (error) {
        console.error('Error:', error.message);
        throw new Error(error.message || 'Error al obtener los comedores de un cliente');
    }
}