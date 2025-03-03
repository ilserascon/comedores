async function getEmpleados() {
    try {
        const response = await fetch(`/get_empleados`, {
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