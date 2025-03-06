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