async function mostrarComedorInfo() {
    try {
        const data = await getInformacionComedoresEntradas();
        if (data && data.data && data.data.length > 0) {
            const comedorInfo = data.data[0];
            document.getElementById('cliente').textContent = `Cliente: ${comedorInfo.client_company}`;
            document.getElementById('comedor').textContent = comedorInfo.dining_room_name;
        }
    } catch (error) {
        console.error('Error al mostrar la información del comedor:', error.message);
    }
}

document.addEventListener('DOMContentLoaded', mostrarComedorInfo);