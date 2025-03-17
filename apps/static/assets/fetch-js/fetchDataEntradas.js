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

async function validarValeUnico(folio) {
    try {
        const response = await fetch(`/validar_vale_unico`, {
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