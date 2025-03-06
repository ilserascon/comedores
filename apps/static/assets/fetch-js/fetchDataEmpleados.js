/**
 * OBTIENE UNA LISTA PAGINADA DE EMPLEADOS DEL SERVIDOR.
 * 
 * @param {number} [page=1] - El número de página a obtener.
 * @param {number} [pageSize=10] - El número de empleados por página.
 * @param {string} [searchQuery=''] - La consulta de búsqueda para filtrar empleados.
 * @returns {Promise<Object>} - Una promesa que se resuelve con los datos que contienen empleados e información de paginación.
 * @throws {Error} - Lanza un error si la operación de fetch falla.
 */
async function getEmpleados(page = 1, pageSize = 10, searchQuery = '') {
    try {
        const response = await fetch(`/get_empleados?page=${page}&page_size=${pageSize}&search=${encodeURIComponent(searchQuery)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al obtener empleados');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error.message);
        throw new Error(error.message || 'Error al obtener empleados');
    }
}


/**
 * OBTIENE LOS DETALLES DE UN EMPLEADO ESPECÍFICO DEL SERVIDOR.
 * 
 * @param {number} empleadoId - El ID del empleado a obtener.
 * @returns {Promise<Object>} - Una promesa que se resuelve con los datos del empleado.
 * @throws {Error} - Lanza un error si la operación de fetch falla.
 */
async function getEmpleado(empleadoId) {
    try {
        const response = await fetch(`/get_empleado?empleado_id=${empleadoId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al obtener empleado');
        }

        const data = await response.json();        
        return data;
    } catch (error) {
        console.error('Error:', error.message);
        throw new Error(error.message || 'Error al obtener empleado');
    }
}


/**
 * CREA UN NUEVO EMPLEADO EN EL SERVIDOR.
 * 
 * @param {string} employeed_code - El código del empleado.
 * @param {string} name - El nombre del empleado.
 * @param {string} lastname - El apellido paterno del empleado.
 * @param {string} second_lastname - El apellido materno del empleado.
 * @param {number} client_id - El ID del cliente asociado con el empleado.
 * @param {number} payroll_id - El ID del tipo de nómina asociado con el empleado.
 * @param {string} status - El estado del empleado.
 * @returns {Promise<Object>} - Una promesa que se resuelve con los datos del empleado creado.
 * @throws {Error} - Lanza un error si la operación de fetch falla.
 */
async function createEmpleado(employeed_code, name, lastname, second_lastname, client_id, payroll_id, status) {
    const response = await fetch(`/create_empleado`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            employeed_code,
            name,
            lastname,
            second_lastname,
            client_id,
            payroll_id,
            status
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear empleado');
    }

    return await response.json();
}


/**
 * ACTUALIZA UN EMPLEADO EN EL SERVIDOR.
 * 
 * @param {number} empleadoId - El ID del empleado a actualizar.
 * @param {string} employeed_code - El código del empleado.
 * @param {string} name - El nombre del empleado.
 * @param {string} lastname - El apellido paterno del empleado.
 * @param {string} second_lastname - El apellido materno del empleado.
 * @param {number} client_id - El ID del cliente asociado con el empleado.
 * @param {number} payroll_id - El ID del tipo de nómina asociado con el empleado.
 * @param {string} status - El estado del empleado.
 * @returns {Promise<Object>} - Una promesa que se resuelve con los datos del empleado actualizado.
 * @throws {Error} - Lanza un error si la operación de fetch falla.
 */
async function updateEmpleado(empleadoId, employeed_code, name, lastname, second_lastname, client_id, payroll_id, status) {
    const response = await fetch(`/update_empleado`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: empleadoId,
            employeed_code,
            name,
            lastname,
            second_lastname,
            client_id,
            payroll_id,
            status
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar empleado');
    }

    return await response.json();
}


/**
 * CARGA LOS EMPLEADOS DESDE UN ARCHIVO EXCEL AL SERVIDOR.
 * 
 * @param {number} clienteId - El ID del cliente asociado con los empleados.
 * @param {Array} empleados - La lista de empleados a cargar.
 * @returns {Promise<Object>} - Una promesa que se resuelve con los datos de la respuesta del servidor.
 * @throws {Error} - Lanza un error si la operación de fetch falla.
 */
async function uploadEmpleados(clienteId, empleados) {
    const response = await fetch('/upload_empleados', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cliente_id: clienteId, empleados: empleados })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar empleados');
    }

    return await response.json();
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
        return data.clientes; // Accede al array de clientes
    } catch (error) {
        console.error('Error:', error.message);
        throw new Error(error.message || 'Error al obtener clientes');
    }
}

/**
 * OBTIENE UNA LISTA DE TIPOS DE NÓMINA DEL SERVIDOR.
 * 
 * @returns {Promise<Array>} - Una promesa que se resuelve con un array de tipos de nómina.
 * @throws {Error} - Lanza un error si la operación de fetch falla.
 */
async function getTiposNomina() {
    try {
        const response = await fetch(`/get_tipos_nomina`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al obtener tipos de nómina');
        }

        const data = await response.json();
        return data.tipos_nomina; // Accede al array de tipos_nomina
    } catch (error) {
        console.error('Error:', error.message);
        throw new Error(error.message || 'Error al obtener tipos de nómina');
    }
}