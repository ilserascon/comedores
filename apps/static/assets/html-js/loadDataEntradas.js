document.addEventListener('DOMContentLoaded', function() {
    
    async function validarEntrada() {
        const codigoEmpleado = document.getElementById('employeeCode').value;
        const folio = document.getElementById('voucherFolio').value;

        showModal('Por favor, espere...', 'loading', 3)
        if (codigoEmpleado && !folio) {
            await validarEmpleadoEntrada(codigoEmpleado);
        } else if (folio && !codigoEmpleado) {
            await validarValeEntrada(folio);
        } else {                        
            showModal('Por favor, ingrese solo el código de empleado o el folio del vale.', 'danger', 3);
            document.getElementById('employeeCode').value = '';
            document.getElementById('voucherFolio').value = '';
        }
    }

    async function validarEmpleadoEntrada(codigoEmpleado) {
        const empleadoData = await validarEmpleado(codigoEmpleado);        
        if (empleadoData) {
            showModal(empleadoData.message, empleadoData.status, 3);
            if (empleadoData.status === 'success') {
                // Limpiar el campo de código de empleado
                document.getElementById('employeeCode').value = '';
            }
        }
    }
    
    async function validarValeEntrada(folio) {
        const data = await validarVale(folio);        
        if (data) {
            showModal(data.message, data.status, 3);
            if (data.status === 'success') {
                // Limpiar el campo de folio del vale
                document.getElementById('voucherFolio').value = '';
            }
        }
    }

    async function mostrarComedorInfo() {
        try {
            const data = await getUsuarioEntrada();
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
                        <button type="button" data-toggle="modal" data-target="#entry-message" class="btn btn-primary" id="btnValidarEntrada">Validar</button>
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
            showToast('Error al cargar la información del comedor', 'danger');
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

function getLoader(loaderId){
    return `
      <div id="${loaderId}" class="mt-4">
        <span class="loader"></span>
      </div>
    `
  }

const modalElement = document.getElementById('entry-message')

/**
 * MUESTRA UN MODAL DE BOOTSTRAP.
 * 
 * @param {string} title - El título del modal.
 * @param {string} message - El mensaje a mostrar en el modal.
 * @param {string} [type='success'] - El tipo de modal ('success', 'info', 'danger', 'loading').
 * @param {number} [duration=0] - La duración en milisegundos para que el modal se cierre automáticamente. Si es 0, no se cierra automáticamente.
 */
function showModal(message, type = 'success', duration = 0) {    

    switch (type) {
        case 'loading':
            const loader = getLoader('loader')
            modalElement.innerHTML = `
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-gray-dark">
                            <h5 class="modal-title text-white">Cargando...
                            </h5>
                        </div>
                        <div class="modal-body">
                            ${loader}
                        </div>
                    </div>
                </div>
            `
        break;

        case 'success':
            modalElement.innerHTML = `
                                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-green">
                            <h5 class="modal-title text-white">Entrada registrada
                            </h5>
                        </div>
                        <div class="modal-body">
                            ${message}
                        </div>
                    </div>
                </div>
            `
            break;    

        case 'danger':
            modalElement.innerHTML = `
                                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-danger">
                            <h5 class="modal-title text-white">Error
                            </h5>
                        </div>
                        <div class="modal-body">
                            ${message}
                        </div>
                    </div>
                </div>
            `
            break;
        
        case 'info':
            modalElement.innerHTML = `
                                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-info">
                            <h5 class="modal-title text-white">Información
                            </h5>
                        </div>
                        <div class="modal-body">
                            ${message}
                        </div>
                    </div>
                </div>
            `

    }

    if (duration > 0) {
        setTimeout(() => {
            closeModal()

        }, duration * 1000)
    }


    
}

function closeModal(){
    modalElement.innerHTML = ''
    const backdrop = document.querySelector('.modal-backdrop')

    if (backdrop) {
        backdrop.remove()
    }
}

