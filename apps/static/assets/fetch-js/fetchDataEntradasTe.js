async function getInformacionComedoresEntradas() {
    try {
        const response = await fetch(`/get_informacion_comedor_entradas`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al obtener la informacion del comedor');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error.message);
        throw new Error(error.message || 'Error al obtener la informacion del comedor');
    }
}

async function getUsuarioEntrada() {
    try {
        const response = await fetch('/entradas_view');
        if (!response.ok) {
            throw new Error(`Error al obtener la información del comedor asignado al usuario: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error en fetchComedorInfo:', error.message);
        throw error;
    }
}

async function validarEmpleadoTe(codigoEmpleado) {
    try {
        const response = await fetch('/validar_empleado_te', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ employeed_code: codigoEmpleado }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error.message);
        return null;
    }
}

async function fetchLastEntries(lastEntries) {
    try {
        const response = await fetch(`/get_last_entries?last_entries=${lastEntries}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error.message);
        return null;
    }
}