document.addEventListener('DOMContentLoaded', loadEmpleados);

let originalEmpleadoData = {};
let currentPage = 1;

async function loadEmpleados(page = currentPage, pageSize = 10, searchQuery = '') {
    try {
        const response = await fetch(`/get_empleados?page=${page}&page_size=${pageSize}&search=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) {
            throw new Error('Error al cargar empleados');
        }
        const data = await response.json();
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

async function openEditModal(empleadoId) {
    try {
        const [empleado, clientes, tiposNomina] = await Promise.all([
            getEmpleado(empleadoId),
            getClientes(),
            getTiposNomina()
        ]);

        originalEmpleadoData = {
            employeed_code: empleado.employeed_code,
            name: empleado.name,
            lastname: empleado.lastname,
            second_lastname: empleado.second_lastname,
            client_id: empleado.client.id,
            payroll_id: empleado.payroll.id,
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

        document.getElementById('editarEmployeeStatus').value = empleado.status ? '1' : '0';

        $('#editarEmpleadoModal').modal('show');
    } catch (error) {
        console.error('Error al abrir el modal de edición:', error.message);
    }
}

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

function isFormModified() {
    const employeed_code = document.getElementById('editarEmployeeCode').value;
    const name = document.getElementById('editarEmployeeName').value;
    const lastname = document.getElementById('editarEmployeeLastname').value;
    const second_lastname = document.getElementById('editarEmployeeSecondLastname').value;
    const client_id = document.getElementById('editarEmployeeClient').value;
    const payroll_id = document.getElementById('editarEmployeePayroll').value;
    const status = document.getElementById('editarEmployeeStatus').value;

    return (
        employeed_code !== originalEmpleadoData.employeed_code ||
        name !== originalEmpleadoData.name ||
        lastname !== originalEmpleadoData.lastname ||
        second_lastname !== originalEmpleadoData.second_lastname ||
        client_id !== originalEmpleadoData.client_id.toString() ||
        payroll_id !== originalEmpleadoData.payroll_id.toString() ||
        status !== originalEmpleadoData.status
    );
}

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
        const status = document.getElementById('editarEmployeeStatus').value;

        const response = await fetch(`/update_empleado`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: empleadoId,
                employeed_code,
                name,
                lastname,
                second_lastname,
                client_id,
                payroll_id,
                status
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al actualizar empleado');
        }

        const data = await response.json();
        console.log(data.message);
        $('#editarEmpleadoModal').modal('hide');
        loadEmpleados(currentPage);  // Usar la página actual
        showToast('Empleado actualizado correctamente', 'success');
    } catch (error) {
        console.error('Error al actualizar empleado:', error.message);
        showToast('Error al actualizar empleado', 'danger');
    }
}

async function openCreateModal() {
    try {
        const [clientes, tiposNomina] = await Promise.all([
            getClientes(),
            getTiposNomina()
        ]);

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

        $('#crearEmpleadoModal').modal('show');
    } catch (error) {
        console.error('Error al abrir el modal de creación:', error.message);
    }
}

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
        const status = document.getElementById('crearEmployeeStatus').value;

        const response = await fetch(`/create_empleado`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                employeed_code,
                name,
                lastname,
                second_lastname,                
                client_id,
                payroll_id,
                status
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al crear empleado');
        }

        const data = await response.json();
        console.log(data.message);
        $('#crearEmpleadoModal').modal('hide');
        loadEmpleados();
        showToast('Empleado creado correctamente', 'success');
    } catch (error) {
        console.error('Error al crear empleado:', error.message);
    }
}


function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const header = type === 'success' ? 'Éxito' : type === 'info' ? 'Aviso' : 'Error';
    // Set the toast classes with Bootstrap
    toast.className = `toast align-items-center text-white bg-${type} border-0 shadow-sm p-2 px-3 m-1`;
    toast.role = 'alert';
    toast.ariaLive = 'assertive';
    toast.ariaAtomic = 'true';
    toast.style.zIndex = '1';
    toast.style.opacity = '1'; // Make the toast solid

    // Set the toast content (including a header, body, and close button)
    toast.innerHTML = `
        <div class="toast-header bg-${type} text-white d-flex align-items-center justify-content-between p-1 px-1 shadow-sm">
            <strong class="me-auto">${header}</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body p-1 px-1">
            ${message}
        </div>
    `;

    // Append the toast to the container
    const toastContainer = document.getElementById('toastContainer');
    toastContainer.appendChild(toast);

    // Initialize and show the toast with Bootstrap's Toast component
    const bsToast = new bootstrap.Toast(toast, { delay: 4000 });
    bsToast.show();

    // Verificar que se cerró el toast sin usar addEventListener con hidden.bs.toast
    setTimeout(() => {
        toast.remove(); // Remove the toast manually after the delay
    }, 4000); // Time in milliseconds, should match the delay

    // Close the toast when the close button is clicked
    toast.querySelector('.btn-close').addEventListener('click', function() {
        toast.remove();
        bsToast.hide();
    });
}

// Función para procesar el archivo Excel
document.getElementById('cargarEmpleadosBtn').addEventListener('click', async function() {
    const fileInput = document.getElementById('archivoExcel');
    const file = fileInput.files[0];

    if (!file) {
        showToast('Por favor, seleccione un archivo Excel', 'danger');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        try {
            const response = await fetch('/upload_empleados', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(jsonData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al cargar empleados');
            }

            const data = await response.json();
            console.log(data.message);
            $('#cargarEmpleadosModal').modal('hide');
            loadEmpleados();
            showToast('Empleados cargados correctamente', 'success');
        } catch (error) {
            console.error('Error al cargar empleados:', error.message);
            showToast('Error al cargar empleados', 'danger');
        }
    };

    reader.readAsArrayBuffer(file);
});


document.getElementById('guardarEmpleadoBtn').addEventListener('click', crearEmpleado);
document.getElementById('actualizarEmpleadoBtn').addEventListener('click', actualizarEmpleado);
document.getElementById('searchUserInput').addEventListener('input', function() {
    const searchQuery = this.value;
    loadEmpleados(1, 10, searchQuery); // Reiniciar a la primera página al buscar
});