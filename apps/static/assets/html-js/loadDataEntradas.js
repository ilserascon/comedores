document.addEventListener('DOMContentLoaded', function() {
    
    async function validarEntrada() {
        const codigoEmpleado = document.getElementById('employeeCode').value;
        const folio = document.getElementById('voucherFolio').value;

        if (codigoEmpleado && !folio) {
            await validarEmpleadoEntrada(codigoEmpleado);
        } else if (folio && !codigoEmpleado) {
            await validarValeEntrada(folio);
        } else {                        
            showToast('Por favor, ingrese solo el código de empleado o el folio del vale.', 'danger');
            document.getElementById('employeeCode').value = '';
            document.getElementById('voucherFolio').value = '';
        }
    }

    async function validarEmpleadoEntrada(codigoEmpleado) {
        const empleadoData = await validarEmpleado(codigoEmpleado);
        if (empleadoData) {
            showToast(empleadoData.message, empleadoData.status);
            if (empleadoData.status === 'success') {
                // Limpiar el campo de código de empleado
                document.getElementById('employeeCode').value = '';
            }
        }
    }

    async function validarValeEntrada(folio) {
        const data = await validarVale(folio);
        if (data) {
            showToast(data.message, data.status);
            if (data.status === 'success') {
                // Limpiar el campo de folio del vale
                document.getElementById('voucherFolio').value = '';
            }
        }
    }

    async function mostrarComedorInfo() {
        try {
            const response = await fetch('/entradas_view');
            const data = await response.json();
            const cardContent = document.getElementById('cardContent');
            
            if (data.has_dining_room) {
                cardContent.innerHTML = `
                    <!-- Header Section -->
                    <div class="card-header bg-transparent d-flex justify-content-between">
                        <h3 class="mb-0" id="cliente">Cliente: ${data.dining_room.client_company}</h3>
                        <span id="comedor">${data.dining_room.name}</span>
                    </div>

                    <!-- Main Section -->
                    <div class="card-body">
                        <h4 class="text-center mb-3">Registrar entrada</h4>
                        <div class="form-group">
                            <label for="employeeCode">Código de Empleado</label>
                            <input type="text" class="form-control" id="employeeCode" placeholder="Ingrese código de empleado">
                        </div>
                        <div class="form-group">
                            <label for="voucherFolio">Folio del Vale</label>
                            <input type="text" class="form-control" id="voucherFolio" placeholder="Ingrese folio del vale">
                        </div>
                    </div>

                    <!-- Footer Section -->
                    <div class="card-footer bg-transparent d-flex justify-content-end">
                        <button type="button" class="btn btn-primary" id="btnValidarEntrada">Validar</button>
                    </div>
                `;
                
                const btnValidarEntrada = document.getElementById('btnValidarEntrada');
                if (btnValidarEntrada) {
                    btnValidarEntrada.addEventListener('click', validarEntrada);
                }
            } else {
                cardContent.innerHTML = `
                    <div class="card-body d-flex justify-content-center align-items-center rounded">
                        <h4 class="text-center mb-0">No tienes asignado un comedor</h4>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error al mostrar la información del comedor:', error.message);
        }
    }
    
    mostrarComedorInfo();
});

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