let originalEmpleadoData = {};
let currentPage = 1;

/**
 * CARGA LA LISTA DE EMPLEADOS DESDE EL SERVIDOR Y ACTUALIZA LA TABLA DE EMPLEADOS.
 * 
 * @param {number} [page=currentPage] - El número de página a obtener.
 * @param {number} [pageSize=10] - El número de empleados por página.
 * @param {string} [searchQuery=''] - La consulta de búsqueda para filtrar empleados.
 * @returns {Promise<void>} - Una promesa que se resuelve cuando los empleados se han cargado y la tabla se ha actualizado.
 * @throws {Error} - Lanza un error si la operación de fetch falla.
 */
async function loadEmpleados(page = currentPage, pageSize = 10, searchQuery = '') {
    try {
        const filterValue = document.getElementById('filterEmployeeSelect').value;
        const data = await getEmpleados(page, pageSize, searchQuery, filterValue);
        const empleados = data.empleados;
        const empleadosTableBody = document.getElementById('empleadosTableBody');
        empleadosTableBody.innerHTML = '';

        empleados.forEach(empleado => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td class="text-center">${empleado.employeed_code}</td>
                <td>${empleado.name}</td>
                <td>${empleado.lastname}</td>
                <td>${empleado.second_lastname}</td>                
                <td>${empleado.client__company}</td>
                <td>${empleado.dining_room_name}</td>
                <td>${empleado.payroll__description}</td>
                <td>
                    <span class="badge badge-dot mr-4">
                        <i class="${empleado.status ? 'bg-success' : 'bg-danger'}"></i>
                        <span class="status">${empleado.status ? 'Activo' : 'Inactivo'}</span>
                    </span>
                </td>
                <td class="text-center">
                    <button class="btn btn-sm btn-primary" onclick="openEditModal(${empleado.id})">Editar</button>                    
                </td>
            `;

            empleadosTableBody.appendChild(row);
        });

        // Actualizar la paginación
        const pagination = document.querySelector('.pagination');
        pagination.innerHTML = '';

        const totalPages = data.total_pages;
        const currentPageGroup = Math.ceil(data.current_page / 5);
        const startPage = (currentPageGroup - 1) * 5 + 1;
        const endPage = Math.min(currentPageGroup * 5, totalPages);

        if (startPage > 1) {
            const prevGroupPage = document.createElement('li');
            prevGroupPage.className = 'page-item';
            prevGroupPage.innerHTML = `<a class="page-link" href="#" onclick="loadEmpleados(${startPage - 1}, ${pageSize}, '${searchQuery}')"><i class="fas fa-arrow-left"></i></a>`;
            pagination.appendChild(prevGroupPage);
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageItem = document.createElement('li');
            pageItem.className = `page-item ${i === data.current_page ? 'active' : ''}`;
            pageItem.innerHTML = `<a class="page-link" href="#" onclick="loadEmpleados(${i}, ${pageSize}, '${searchQuery}')">${i}</a>`;
            pagination.appendChild(pageItem);
        }

        if (endPage < totalPages) {
            const nextGroupPage = document.createElement('li');
            nextGroupPage.className = 'page-item';
            nextGroupPage.innerHTML = `<a class="page-link" href="#" onclick="loadEmpleados(${endPage + 1}, ${pageSize}, '${searchQuery}')"><i class="fas fa-arrow-right"></i></a>`;
            pagination.appendChild(nextGroupPage);
        }

        // Actualizar la variable global de la página actual
        currentPage = data.current_page;
    } catch (error) {
        console.error('Error al cargar empleados:', error.message);
    }
}

/**
 * CARGA LA LISTA DE CLIENTES DESDE EL SERVIDOR Y ACTUALIZA EL SELECT DE CLIENTES.
 * 
 * @returns {Promise<void>} - Una promesa que se resuelve cuando los clientes se han cargado y el select se ha actualizado.
 * @throws {Error} - Lanza un error si la operación de fetch falla.
 */
async function loadClientes() {
    try {
        const response = await getClientes();
        const clientes = response.clientes;
        const selectCliente = document.getElementById('selectCliente');
        selectCliente.innerHTML = '<option value="" disabled selected>Seleccione un cliente</option>';
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.text = cliente.company;
            selectCliente.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar clientes:', error.message);
    }
}


/**
 * ABRE EL MODAL DE EDICIÓN DE EMPLEADO Y CARGA LOS DATOS DEL EMPLEADO SELECCIONADO.
 * 
 * @param {number} empleadoId - El ID del empleado a editar.
 * @returns {Promise<void>} - Una promesa que se resuelve cuando los datos del empleado se han cargado y el modal se ha abierto.
 * @throws {Error} - Lanza un error si la operación de fetch falla.
 */
async function openEditModal(empleadoId) {
    try {
        const empleado = await getEmpleado(empleadoId);
        const responseClientes = await getClientes();
        const tiposNomina = await getTiposNomina();
        const responseComedores = await getComedoresClientes(empleado.client.id); // Pasar el ID del cliente actual

        const clientes = responseClientes.clientes;  // Acceder a la propiedad 'clientes'
        const comedores = responseComedores.comedores;  // Acceder a la propiedad 'comedores'        
        
        originalEmpleadoData = {
            employeed_code: empleado.employeed_code,
            name: empleado.name,
            lastname: empleado.lastname,
            second_lastname: empleado.second_lastname,
            client_id: empleado.client.id,
            payroll_id: empleado.payroll.id,
            dining_room_id: empleado.dining_room.id, // Añadir el id del comedor
            status: empleado.status ? '1' : '0'
        };

        document.getElementById('editarEmpleadoId').value = empleado.id;
        document.getElementById('editarEmployeeCode').value = empleado.employeed_code;
        document.getElementById('editarEmployeeName').value = empleado.name;
        document.getElementById('editarEmployeeLastname').value = empleado.lastname;
        document.getElementById('editarEmployeeSecondLastname').value = empleado.second_lastname;

        const clientSelect = document.getElementById('editarEmployeeClient');
        clientSelect.innerHTML = '<option value="" disabled selected>--------</option>';
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.text = cliente.company;
            if (cliente.id === empleado.client.id) {
                option.selected = true;
            }
            clientSelect.appendChild(option);
        });

        const payrollSelect = document.getElementById('editarEmployeePayroll');        
        payrollSelect.innerHTML = '<option value="" disabled selected>--------</option>';
        tiposNomina.forEach(tipoNomina => {
            const option = document.createElement('option');
            option.value = tipoNomina.id;
            option.text = tipoNomina.description;
            if (tipoNomina.id === empleado.payroll.id) {
                option.selected = true;
            }
            payrollSelect.appendChild(option);
        });

        const diningRoomSelect = document.getElementById('editarDinningRoomClient');
        diningRoomSelect.innerHTML = '<option value="" disabled selected>--------</option>';
        comedores.forEach(comedor => {
            const option = document.createElement('option');
            option.value = comedor.id;
            option.text = comedor.name;
            if (comedor.id === empleado.dining_room.id) {
                option.selected = true;
            }
            diningRoomSelect.appendChild(option);
        });

        // Agregar evento para cargar comedores cuando se seleccione un cliente
        clientSelect.addEventListener('change', async function() {
            const clientId = this.value;
            const responseComedores = await getComedoresClientes(clientId);
            const comedores = responseComedores.comedores;
            diningRoomSelect.innerHTML = '<option value="" disabled selected>--------</option>';
            comedores.forEach(comedor => {
                const option = document.createElement('option');
                option.value = comedor.id;
                option.text = comedor.name;
                if (comedor.id === empleado.dining_room.id) {
                    option.selected = true;
                }
                diningRoomSelect.appendChild(option);
            });
        });

        document.getElementById('editarEmployeeStatus').value = empleado.status ? '1' : '0';

        $('#editarEmpleadoModal').modal('show');
    } catch (error) {
        console.error('Error al abrir el modal de edición:', error.message);
    }
}


/**
 * VALIDA LOS CAMPOS DE UN FORMULARIO.
 * 
 * @param {string} formId - El ID del formulario a validar.
 * @returns {boolean} - Retorna true si el formulario es válido, de lo contrario false.
 */
function validateForm(formId) {
    const form = document.getElementById(formId);
    let isValid = true;

    form.querySelectorAll('input, select').forEach(input => {
        // Excluir el campo de apellido materno de la validación obligatoria
        if (input.id !== 'crearEmployeeSecondLastname' && input.id !== 'editarEmployeeSecondLastname') {
            if (!input.value.trim() || input.value === '--------') {
                input.classList.add('is-invalid');
                setTimeout(() => {
                    input.classList.remove('is-invalid');
                }, 4000);
                isValid = false;
            } else {
                input.classList.remove('is-invalid');
            }
        }
    });

    return isValid;
}


/**
 * VERIFICA SI EL FORMULARIO DE EDICIÓN DE EMPLEADO HA SIDO MODIFICADO.
 * 
 * @returns {boolean} - Retorna true si el formulario ha sido modificado, de lo contrario false.
 */
function isFormModified() {
    const employeed_code = document.getElementById('editarEmployeeCode').value;
    const name = document.getElementById('editarEmployeeName').value;
    const lastname = document.getElementById('editarEmployeeLastname').value;
    const second_lastname = document.getElementById('editarEmployeeSecondLastname').value;
    const client_id = document.getElementById('editarEmployeeClient').value;
    const payroll_id = document.getElementById('editarEmployeePayroll').value;
    const dining_room_id = document.getElementById('editarDinningRoomClient').value;
    const status = document.getElementById('editarEmployeeStatus').value;

    return (
        employeed_code !== originalEmpleadoData.employeed_code ||
        name !== originalEmpleadoData.name ||
        lastname !== originalEmpleadoData.lastname ||
        second_lastname !== originalEmpleadoData.second_lastname ||
        client_id !== originalEmpleadoData.client_id.toString() ||
        payroll_id !== originalEmpleadoData.payroll_id.toString() ||
        dining_room_id !== originalEmpleadoData.dining_room_id.toString() || // Verificar si el comedor ha cambiado
        status !== originalEmpleadoData.status
    );
}


/**
 * ACTUALIZA UN EMPLEADO DESPUÉS DE VALIDAR EL FORMULARIO Y VERIFICAR SI SE HAN REALIZADO CAMBIOS.
 * 
 * @returns {void}
 */
async function actualizarEmpleado() {
    if (!validateForm('editarEmpleadoForm')) {
        return;
    }

    if (!isFormModified()) {
        showToast('No se han realizado cambios', 'info');
        return;
    }

    try {
        const empleadoId = document.getElementById('editarEmpleadoId').value;
        const employeed_code = document.getElementById('editarEmployeeCode').value;
        const name = document.getElementById('editarEmployeeName').value;
        const lastname = document.getElementById('editarEmployeeLastname').value;
        const second_lastname = document.getElementById('editarEmployeeSecondLastname').value;
        const client_id = document.getElementById('editarEmployeeClient').value;
        const payroll_id = document.getElementById('editarEmployeePayroll').value;
        const dining_room_id = document.getElementById('editarDinningRoomClient').value;
        const status = document.getElementById('editarEmployeeStatus').value;
        
        const data = await updateEmpleado(empleadoId, employeed_code, name, lastname, second_lastname, client_id, payroll_id, dining_room_id, status);
        $('#editarEmpleadoModal').modal('hide');
        loadEmpleados(currentPage);  // Usar la página actual
        showToast(data.message, data.status);
    } catch (error) {
        console.error('Error al actualizar empleado:', error.message);
        showToast('Error al actualizar empleado', 'danger');
    }
}


/**
 * ABRE EL MODAL DE CREACIÓN DE EMPLEADO Y CARGA LOS DATOS NECESARIOS.
 * 
 * @returns {Promise<void>} - Una promesa que se resuelve cuando los datos necesarios se han cargado y el modal se ha abierto.
 * @throws {Error} - Lanza un error si la operación de fetch falla.
 */
async function openCreateModal() {
    try {
        resetCreateModalFields();

        const [responseClientes, tiposNomina] = await Promise.all([
            getClientes(),
            getTiposNomina()
        ]);

        const clientes = responseClientes.clientes;
        const clientSelect = document.getElementById('crearEmployeeClient');
        clientSelect.innerHTML = '<option value="" disabled selected>--------</option>';
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.text = cliente.company;
            clientSelect.appendChild(option);
        });

        const payrollSelect = document.getElementById('crearEmployeePayroll');
        payrollSelect.innerHTML = '<option value="" disabled selected>--------</option>';
        tiposNomina.forEach(tipoNomina => {
            const option = document.createElement('option');
            option.value = tipoNomina.id;
            option.text = tipoNomina.description;
            payrollSelect.appendChild(option);
        });

        // Agregar evento para cargar comedores cuando se seleccione un cliente
        clientSelect.addEventListener('change', async function() {
            const clientId = this.value;
            const responseComedores = await getComedoresClientes(clientId);
            const comedores = responseComedores.comedores;
            const diningRoomSelect = document.getElementById('crearDinningRoomClient');
            diningRoomSelect.innerHTML = '<option value="" disabled selected>--------</option>';
            comedores.forEach(comedor => {
                const option = document.createElement('option');
                option.value = comedor.id;
                option.text = comedor.name;
                diningRoomSelect.appendChild(option);
            });
        });

        $('#crearEmpleadoModal').modal('show');
    } catch (error) {
        console.error('Error al abrir el modal de creación:', error.message);
    }
}

function resetCreateModalFields() {
    document.getElementById('crearEmployeeCode').value = '';
    document.getElementById('crearEmployeeName').value = '';
    document.getElementById('crearEmployeeLastname').value = '';
    document.getElementById('crearEmployeeSecondLastname').value = '';
    document.getElementById('crearEmployeeClient').value = '';
    document.getElementById('crearEmployeePayroll').value = '';
    document.getElementById('crearDinningRoomClient').innerHTML = '<option value="" disabled selected>--------</option>';
    document.getElementById('crearEmployeeStatus').value = '1';
}

function resetCargarEmpleadosModalFields() {
    document.getElementById('selectCliente').value = '';
    document.getElementById('selectComedor').innerHTML = '<option value="" disabled selected>--------</option>';
    document.getElementById('selectComedor').disabled = true;
    document.getElementById('archivoExcel').value = '';
}


/**
 * CREA UN NUEVO EMPLEADO EN EL SERVIDOR.
 * 
 * @returns {Promise<void>} - Una promesa que se resuelve cuando el empleado ha sido creado.
 * @throws {Error} - Lanza un error si la operación de fetch falla.
 */
async function crearEmpleado() {
    if (!validateForm('crearEmpleadoForm')) {
        return;
    }

    try {
        const employeed_code = document.getElementById('crearEmployeeCode').value;
        const name = document.getElementById('crearEmployeeName').value;
        const lastname = document.getElementById('crearEmployeeLastname').value;
        const second_lastname = document.getElementById('crearEmployeeSecondLastname').value;
        const client_id = document.getElementById('crearEmployeeClient').value;
        const payroll_id = document.getElementById('crearEmployeePayroll').value;
        const dining_room_id = document.getElementById('crearDinningRoomClient').value;
        const status = document.getElementById('crearEmployeeStatus').value;

        const data = await createEmpleado(employeed_code, name, lastname, second_lastname, client_id, payroll_id, dining_room_id, status);        
        $('#crearEmpleadoModal').modal('hide');
        loadEmpleados();
        showToast(data.message, data.status);
    } catch (error) {
        console.error('Error al crear empleado:', error.message);
    }
}

async function llenarSelectClientes() {
    try {
        const response = await getClientes();
        const clientes = response.clientes;
        const filterEmployeeSelect = document.getElementById('filterEmployeeSelect');

        // Limpiar las opciones existentes
        filterEmployeeSelect.innerHTML = '<option value="all">Todos</option>';

        // Agregar las nuevas opciones
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.textContent = cliente.company;
            filterEmployeeSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error al llenar el select de clientes:', error.message);
    }
}

async function llenarSelectComedoresClientes(clienteId) {
    try {
        const response = await getComedoresClientes(clienteId);
        const comedoresClientes = response.comedores;        
        const selectComedoresCliente = document.getElementById('selectComedor');

        // Limpiar las opciones existentes
        selectComedoresCliente.innerHTML = '<option value="" disabled selected>--------</option>';

        // Agregar las nuevas opciones
        comedoresClientes.forEach(comedorCliente => {
            const option = document.createElement('option');
            option.value = comedorCliente.id;
            option.textContent = comedorCliente.name;
            selectComedoresCliente.appendChild(option);
        });
    } catch (error) {
        console.error('Error al llenar el select de los comedores de un cliente:', error.message);
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
 * CARGA LOS EMPLEADOS DESDE UN ARCHIVO EXCEL AL SERVIDOR.
 * 
 */
function validarCampos(selectCliente, selectComedor, file) {
    if (!selectCliente.value) {
        showToast('Por favor, seleccione un cliente', 'danger');
        return false;
    }

    if (!selectComedor.value) {
        showToast('Por favor, seleccione un comedor', 'danger');
        return false;
    }

    if (!file) {
        showToast('Por favor, seleccione un archivo Excel', 'danger');
        return false;
    }

    return true;
}

function manejarSelectComedor(selectCliente, selectComedor) {
    selectCliente.addEventListener('change', async function() {
        if (selectCliente.value) {
            selectComedor.disabled = false;
            const responseComedores = await getComedoresClientes(selectCliente.value);
            const comedores = responseComedores.comedores;
            selectComedor.innerHTML = '<option value="" disabled selected>--------</option>';
            comedores.forEach(comedor => {
                const option = document.createElement('option');
                option.value = comedor.id;
                option.text = comedor.name;
                selectComedor.appendChild(option);
            });
        } else {
            selectComedor.disabled = true;
        }
    });
}

async function manejarCargaEmpleados(file, selectCliente, selectComedor) {
    const loader = document.getElementById('modalLoader');
    const modalBody = document.querySelector('#cargarEmpleadosModal .modal-body');
    const cargarBtn = document.getElementById('cargarEmpleadosBtn');

    // Mostrar el loader y deshabilitar el botón
    loader.style.display = 'block';
    modalBody.style.opacity = '0.5';
    cargarBtn.disabled = true;

    const reader = new FileReader();
    reader.onload = async function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        try {
            const data = await uploadEmpleados(selectCliente, selectComedor, jsonData);
            $('#cargarEmpleadosModal').modal('hide');
            loadEmpleados();

            for (let key in data.message) {
                showToast(data.message[key][0], data.message[key][1]);
            }
        } catch (error) {
            console.error('Error al cargar empleados:', error.message);
            showToast('Error al cargar empleados', 'danger');
        } finally {
            // Ocultar el loader y habilitar el botón
            loader.style.display = 'none';
            modalBody.style.opacity = '1';
            cargarBtn.disabled = false;
        }
    };

    reader.readAsArrayBuffer(file);
}

document.addEventListener('DOMContentLoaded', function() {
    const selectCliente = document.getElementById('selectCliente');
    const selectComedor = document.getElementById('selectComedor');

    // Llamar a manejarSelectComedor cuando se cargue el DOM
    manejarSelectComedor(selectCliente, selectComedor);

    document.getElementById('cargarEmpleadosBtn').addEventListener('click', async function() {
        const fileInput = document.getElementById('archivoExcel');
        const file = fileInput.files[0];
    
        if (!validarCampos(selectCliente, selectComedor, file)) {
            return;
        }
    
        await manejarCargaEmpleados(file, selectCliente.value, selectComedor.value);
        resetCargarEmpleadosModalFields();
    });

    $('#cargarEmpleadosModal').on('hidden.bs.modal', function () {
        resetCargarEmpleadosModalFields(); // Reiniciar los campos del modal de carga de empleados al cerrar
    });

    document.getElementById('guardarEmpleadoBtn').addEventListener('click', crearEmpleado);
    document.getElementById('actualizarEmpleadoBtn').addEventListener('click', actualizarEmpleado);
    document.getElementById('searchUserInput').addEventListener('input', function() {
        const searchQuery = this.value;
        loadEmpleados(1, 10, searchQuery); // Reiniciar a la primera página al buscar
    });

    document.getElementById('filterEmployeeSelect').addEventListener('change', function() {
        loadEmpleados(1, 10, document.getElementById('searchUserInput').value);
    });

    llenarSelectClientes();
    loadEmpleados();
    loadClientes();
});