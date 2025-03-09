let currentPage = 1; // Variable global para almacenar el número de página actual
let currentFilter = 'all'; // Variable global para almacenar el filtro actual


/**
 * ACTUALIZA LA TABLA DE COMEDORES CON PAGINACIÓN Y FILTRO.
 * 
 * @param {number} page - Número de la página a obtener.
 * @param {string} filter - Filtro a aplicar en la búsqueda de comedores.
 * @throws {Error} - Error al actualizar la tabla de comedores.
 */
async function actualizarTablaComedores(page = 1, filter = 'all') {
    try {
        const data = await getComedores(page, filter);
        const tbody = document.querySelector('.list');
        tbody.innerHTML = '';

        data.dining_rooms.forEach(comedor => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <th scope="row">
                    <div class="media align-items-center pl-3">
                        <div class="media-body">
                            <span class="name mb-0 text-sm font-weight-bold">${comedor.name}</span>
                        </div>
                    </div>
                </th>
                <td class="budget text-muted">
                    ${comedor.location}
                </td>
                <td class="text-muted">
                    ${comedor.company}
                </td>
                <td class="text-muted">
                    ${comedor.in_charge_first_name} ${comedor.in_charge_last_name}
                </td>
                <td>
                    <span class="badge badge-dot mr-4">
                        <i class="${comedor.status ? 'bg-success' : 'bg-danger'}"></i>
                        <span class="status">${comedor.status ? 'Activo' : 'Inactivo'}</span>
                    </span>
                </td>
                <td class="text-right d-flex justify-content-center">
                    <button class="btn btn-sm btn-primary" onclick="openEditModal(${comedor.id})">Editar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Actualizar la paginación
        const pagination = document.querySelector('.pagination');
        pagination.innerHTML = '';

        const maxPagesToShow = 5;
        const startPage = Math.floor((data.page_number - 1) / maxPagesToShow) * maxPagesToShow + 1;
        const endPage = Math.min(startPage + maxPagesToShow - 1, data.num_pages);

        if (data.has_previous) {
            const prevPage = document.createElement('li');
            prevPage.classList.add('page-item');
            prevPage.innerHTML = `
                <a class="page-link" href="#" onclick="actualizarTablaComedores(${data.page_number - 1}, '${filter}')">
                    <i class="fas fa-angle-left"></i>
                    <span class="sr-only">Previous</span>
                </a>
            `;
            pagination.appendChild(prevPage);
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageItem = document.createElement('li');
            pageItem.classList.add('page-item');
            if (i === data.page_number) {
                pageItem.classList.add('active');
            }
            pageItem.innerHTML = `
                <a class="page-link" href="#" onclick="actualizarTablaComedores(${i}, '${filter}')">${i}</a>
            `;
            pagination.appendChild(pageItem);
        }

        if (data.has_next) {
            const nextPage = document.createElement('li');
            nextPage.classList.add('page-item');
            nextPage.innerHTML = `
                <a class="page-link" href="#" onclick="actualizarTablaComedores(${data.page_number + 1}, '${filter}')">
                    <i class="fas fa-angle-right"></i>
                    <span class="sr-only">Next</span>
                </a>
            `;
            pagination.appendChild(nextPage);
        }        
    } catch (error) {
        console.error('Error al actualizar la tabla de comedores:', error);
    }
}


/**
 * ABRE EL MODAL DE EDICIÓN DE UN COMEDOR Y LLENA LOS CAMPOS CON LOS DATOS DEL COMEDOR SELECCIONADO.
 * 
 * @param {number} id - ID del comedor a editar.
 * @throws {Error} - Error al actualizar la tabla de comedores.
 */
async function openEditModal(id) {
    try {
        const comedor = await getComedor(id);

        document.getElementById('editarComedorName').value = comedor.name;
        document.getElementById('editarComedorLocation').value = comedor.location;
        document.getElementById('editarComedorClient').value = comedor.company;
        document.getElementById('editarComedorStatus').value = comedor.status ? '1' : '0';
        document.getElementById('editarComedorId').value = comedor.dining_room_id;
        document.getElementById('editarComedorClient').value = comedor.client_id;

        await llenarSelectClientes('editarComedorClient');
        document.getElementById('editarComedorClient').value = comedor.client_id;

        await llenarSelectEncargados('editarComedorInCharge');
        document.getElementById('editarComedorInCharge').value = comedor.in_charge.id;

        $('#editarComedorModal').modal('show');
    } catch (error) {
        console.error('Error:', error.message);
    }
}


/**
 * CREA UN NUEVO COMEDOR CON LOS DATOS PROPORCIONADOS Y ACTUALIZA LA INFORMACION DE LA TABLA.
 * 
 * @throws {Error} - Error al crear comedor.
 */
async function crearComedor() {
    if (!validarCampos('comedorName', 'comedorLocation', 'selectCliente', 'comedorInCharge')) {
        return;
    }

    const name = document.getElementById('comedorName').value.trim();
    const location = document.getElementById('comedorLocation').value.trim();
    const client = document.getElementById('selectCliente').value;
    const inCharge = document.getElementById('comedorInCharge').value;
    const status = document.getElementById('comedorStatus').value;

    const data = {
        name,
        location,
        client,
        in_charge: inCharge,
        status
    };

    try {
        const result = await createComedor(data);
        console.log("Comedor insertado exitosamente", result);

        // Mostrar mensaje de éxito
        showToast('Comedor creado exitosamente', 'success');        

        // Llenar el select de clientes con comedores para actualizarlo dinámicamente
        await llenarSelectClientesComedores('filterComedorSelect');        

        // Mantener el valor actual del filtro seleccionado
        document.getElementById('filterComedorSelect').value = currentFilter;

        // Cerrar el modal de creación
        $('#crearComedorModal').modal('hide');

        // Actualizar la tabla con el nuevo comedor y mantener la página actual y el filtro aplicado
        await actualizarTablaComedores(currentPage, currentFilter);                
        console.log('Tabla de comedores actualizada');
    } catch (error) {
        console.error('Error:', error.message);
        showToast('Error al crear comedor', 'danger');
    }

    resetCrearComedorForm(); // Resetear el formulario al cerrar el modal
}


/**
 * ACTUALIZA UN COMEDOR EXISTENTE CON LOS DATOS PROPORCIONADOS Y ACTUALIZA LA INFORMACIÓN DE LA TABLA.
 * 
 * @throws {Error} - Error al actualizar comedor.
 */
async function actualizarComedor() {
    if (!validarCampos('editarComedorName', 'editarComedorLocation', 'editarComedorClient', 'editarComedorInCharge')) {        
        return;
    }

    const id = document.getElementById('editarComedorId').value;
    const name = document.getElementById('editarComedorName').value.trim();
    const location = document.getElementById('editarComedorLocation').value.trim();
    const client = document.getElementById('editarComedorClient').value;
    const inCharge = document.getElementById('editarComedorInCharge').value;
    const status = document.getElementById('editarComedorStatus').value;

    const data = {
        dining_room_id: id,
        name,
        location,
        client,
        inCharge,
        status
    };

    try {
        const originalComedor = await getComedor(data.dining_room_id);

        const hasChanged = (
            data.name !== originalComedor.name ||
            data.location !== originalComedor.location ||
            data.client !== originalComedor.client_id.toString() ||
            data.inCharge !== originalComedor.in_charge.id.toString() ||
            data.status !== (originalComedor.status ? '1' : '0')
        );

        await updateComedor(data);

        if (!hasChanged) {
            showToast('No se han realizado cambios', 'info');
            return;
        } else {
            showToast('Comedor actualizado exitosamente', 'success');
        }

        await llenarSelectClientesComedores('filterComedorSelect');
        document.getElementById('filterComedorSelect').value = currentFilter;
        await actualizarTablaComedores(currentPage, currentFilter);
        $('#editarComedorModal').modal('hide');
    } catch (error) {
        console.error('Error:', error.message);
        showToast('Error al actualizar comedor', 'danger');
    }
}


/**
 * LLENA UN SELECT CON LA LISTA DE ENCARGADOS.
 * 
 * @param {string} selectId - ID del select a llenar.
 * @throws {Error} - Error al obtener encargados.
 */
async function llenarSelectEncargados(selectId) {
    const select = document.getElementById(selectId);
    const encargados = await getEncargados();
    select.innerHTML = ''; // Limpiar opciones anteriores    

    // Agregar opción por defecto "-------"
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-------';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);

    encargados.forEach(encargado => {
        const option = document.createElement('option');
        option.value = encargado.id;
        option.textContent = `${encargado.first_name} ${encargado.last_name}`;
        select.appendChild(option);
    });
}


/**
 * LLENA UN SELECT CON LA LISTA DE CLIENTES.
 * 
 * @param {string} selectId - ID del select a llenar.
 * @throws {Error} - Error al obtener clientes.
 */
async function llenarSelectClientes(selectId) {
    try {
        const data = await getClientes();
        const clientes = data.clientes;
        const select = document.getElementById(selectId);
        select.innerHTML = '';

        // Agregar opción por defecto "-------"
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-------';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        select.appendChild(defaultOption);

        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id; // Acceder a 'id' en lugar de 'client__id'
            option.textContent = cliente.company; // Acceder a 'company' en lugar de 'client__company'
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error al llenar el select de clientes:', error.message);
    }
}


/**
 * LLENA UN SELECT CON LA LISTA DE CLIENTES QUE TIENEN COMEDORES.
 * 
 * @param {string} selectId - ID del select a llenar.
 * @throws {Error} - Error al obtener clientes con comedores.
 */
async function llenarSelectClientesComedores(selectId) {
    try {
        const data = await getClientesComedores();
        const clientes = data.clientes;
        const select = document.getElementById(selectId);
        select.innerHTML = ''; // Limpiar opciones anteriores

        // Agregar opción por defecto "Todos"
        const optionTodos = document.createElement('option');
        optionTodos.value = 'all';
        optionTodos.textContent = 'Todos';
        select.appendChild(optionTodos);

        // Agregar opciones obtenidas de la consulta
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.textContent = cliente.company;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error al llenar el select de clientes con comedores:', error.message);
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


/**
 * VALIDA LOS CAMPOS DEL FORMULARIO DE COMEDOR.
 * @param {string} nameId - ID del campo de nombre.
 * @param {string} locationId - ID del campo de descripción.
 * @param {string} clientId - ID del campo de cliente.
 * @param {string} inChargeId - ID del campo de encargado.
 * @returns {boolean} - TRUE SI TODOS LOS CAMPOS SON VÁLIDOS, FALSE EN CASO CONTRARIO.
 */
function validarCampos(nameId, locationId, clientId, inChargeId) {
    const name = document.getElementById(nameId).value.trim();
    const location = document.getElementById(locationId).value.trim();
    const client = document.getElementById(clientId).value;
    const inCharge = document.getElementById(inChargeId).value;

    let isValid = true;

    if (!name) {
        const nameField = document.getElementById(nameId);
        nameField.classList.add('is-invalid');
        setTimeout(() => {
            nameField.classList.remove('is-invalid');
        }, 4000);
        isValid = false;
    } else {
        document.getElementById(nameId).classList.remove('is-invalid');
    }

    if (!location) {
        const locationField = document.getElementById(locationId);
        locationField.classList.add('is-invalid');
        setTimeout(() => {
            locationField.classList.remove('is-invalid');
        }, 4000);
        isValid = false;
    } else {
        document.getElementById(locationId).classList.remove('is-invalid');
    }

    if (!client) {
        const clientField = document.getElementById(clientId);
        clientField.classList.add('is-invalid');
        setTimeout(() => {
            clientField.classList.remove('is-invalid');
        }, 4000);
        isValid = false;
    } else {
        document.getElementById(clientId).classList.remove('is-invalid');
    }

    if (!inCharge) {
        const inChargeField = document.getElementById(inChargeId);
        inChargeField.classList.add('is-invalid');
        setTimeout(() => {
            inChargeField.classList.remove('is-invalid');
        }, 4000);
        isValid = false;
    } else {
        document.getElementById(inChargeId).classList.remove('is-invalid');
    }

    return isValid;
}


/**
 * RESETEA EL FORMULARIO DE CREACIÓN DE COMEDOR A SUS VALORES POR DEFECTO
 * ELIMINANDO LAS CLASES DE VALIDACIÓN.
 */
function resetCrearComedorForm() {        
    // Eliminar la clase 'is-invalid' de los campos del formulario
    document.getElementById('comedorName').classList.remove('is-invalid');        
    document.getElementById('comedorLocation').classList.remove('is-invalid');
    document.getElementById('selectCliente').classList.remove('is-invalid');
    document.getElementById('comedorInCharge').classList.remove('is-invalid');
    
    // Resetear el formulario a sus valores por defecto
    document.getElementById('crearComedorForm').reset();

    // Resetear los selects
    document.getElementById('selectCliente').selectedIndex = 0;
    document.getElementById('comedorInCharge').selectedIndex = 0;
}



// =========================== EVENTOS =========================== //
document.getElementById('guardarComedorBtn').addEventListener('click', crearComedor);
document.getElementById('actualizarComedorBtn').addEventListener('click', actualizarComedor);

// ACTUALIZA LA TABLA DE COMEDORES CUANDO SE CAMBIA EL FILTRO EN EL SELECT
document.getElementById('filterComedorSelect').addEventListener('change', async function() {
    currentFilter = this.value;
    await actualizarTablaComedores(1, currentFilter);
});

// RESETEA EL FORMULARIO DE CREACIÓN DE COMEDOR
document.querySelectorAll('#cerrarComedorBtn, #cerrarComedorBtn2').forEach(button => {
    button.addEventListener('click', function() {
        resetCrearComedorForm(); // Resetear el formulario al cerrar el modal
    });
});

/**
 * LLENAR LOS SELECTS DE ENCARGADOS AL CARGAR LA PAGINA.
 * SE EJECUTA CUANDO EL DOM HA SIDO COMPLETAMENTE CARGADO.
 */
document.addEventListener("DOMContentLoaded", async function() {
    await llenarSelectClientesComedores('filterComedorSelect'); // Llenar el select de clientes con comedores primero
    await actualizarTablaComedores();
    await llenarSelectEncargados('comedorInCharge');
    await llenarSelectEncargados('editarComedorInCharge');
    await llenarSelectClientes('selectCliente');
    await llenarSelectClientes('editarComedorClient');
});