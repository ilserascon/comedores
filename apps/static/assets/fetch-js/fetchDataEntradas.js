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

async function validarVale(folio) {
    try {
        const response = await fetch(`/validar_vale`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ folio })
        });

        if (!response.ok) {
            const errorData = await response.json();
            showToast(errorData.message, errorData.status);
            console.log('Error:', errorData.message);            
        }

        const data = await response.json();
        return data;
    } catch (error) {        
        console.error('Error:', error.message);        
    }
}

async function validarEmpleado(codigoEmpleado) {
    try {
        const response = await fetch('/validar_empleado', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ employeed_code: codigoEmpleado }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            showToast(errorData.message, errorData.status);
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error.message);
        return null;
    }
}