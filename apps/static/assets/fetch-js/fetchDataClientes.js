/**
 * OBTIENE UNA LISTA DE CLIENTES DEL SERVIDOR.
 * 
 * @returns {Promise<Array>} - Una promesa que se resuelve con un array de clientes.
 * @throws {Error} - Lanza un error si la operación de fetch falla.
 */
async function getClientes() {
    try {
        const response = await fetch('/get_clientes', {
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
        console.error('Error:', error.message);
        throw new Error(error.message || 'Error al obtener clientes');
    }
}