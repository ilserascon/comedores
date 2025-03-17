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

async function validarVale() {
    const folio = document.getElementById('voucherFolio').value;
    
    const data = await validarValeUnico(folio);
    if (data) {        
        showToast(data.message, data.status);
        if (data.status === 'success') {
            // Limpiar los campos de código de empleado y folio del vale
            document.getElementById('employeeCode').value = '';
            document.getElementById('voucherFolio').value = '';
        }        
    }
}


/**
 * MUESTRA UNA NOTIFICACIÓN TIPO TOAST.
 * 
 * @param {string} message - El mensaje a mostrar en el toast.
 * @param {string} [type='success'] - El tipo de toast ('success', 'info', 'danger').
 */
function showToast(message, type = 'success') {    
    const toast = document.createElement('div');
    const header = type === 'success' ? 'Éxito' : type === 'info' ? 'Aviso' : 'Error';
    
    // Clases de diseño con Bootstrap
    toast.className = `toast align-items-center text-white bg-${type} border-0 shadow-sm p-2 px-3 m-1`;
    toast.role = 'alert';
    toast.ariaLive = 'assertive';
    toast.ariaAtomic = 'true';
    toast.style.zIndex = '1';
    toast.style.opacity = '1';

    // Contenido del toast
    toast.innerHTML = `
        <div class="toast-header bg-${type} text-white d-flex align-items-center justify-content-between p-1 px-1 shadow-sm">
            <strong class="me-auto">${header}</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body p-1 px-1">
            ${message}
        </div>
    `;

    // Inicializar y mostrar el toast con el componente Toast de Bootstrap
    const toastContainer = document.getElementById('toastContainer');
    toastContainer.appendChild(toast);    
    const bsToast = new bootstrap.Toast(toast, { delay: 4000 });
    bsToast.show();

    // Eliminar el toast después de 4 segundos
    setTimeout(() => {
        toast.remove();
    }, 4000);

    // Cerrar el toast al hacer clic en el botón de cerrar
    toast.querySelector('.btn-close').addEventListener('click', function() {
        toast.remove();
        bsToast.hide();
    });
}


document.addEventListener('DOMContentLoaded', mostrarComedorInfo);
document.getElementById('btnValidarVale').addEventListener('click', validarVale);