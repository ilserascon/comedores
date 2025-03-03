document.addEventListener('DOMContentLoaded', loadEmpleados);

async function loadEmpleados() {
    try {
        const empleados = await getEmpleados();
        const empleadosTableBody = document.getElementById('empleadosTableBody');
        empleadosTableBody.innerHTML = '';

        empleados.forEach(empleado => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${empleado.employeed_code}</td>
                <td>${empleado.name}</td>
                <td>${empleado.lastname}</td>
                <td>${empleado.second_lastname}</td>
                <td>${empleado.email}</td>
                <td>${empleado.phone}</td>
                <td>${empleado.client__company}</td>
                <td>${empleado.payroll__description}</td>
                <td>
                    <span class="badge badge-dot mr-4">
                        <i class="${empleado.status ? 'bg-success' : 'bg-danger'}"></i>
                        <span class="status">${empleado.status ? 'Activo' : 'Inactivo'}</span>
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="openEditModal(${empleado.id})">Editar</button>                    
                </td>
            `;

            empleadosTableBody.appendChild(row);
        });
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

        document.getElementById('editarEmpleadoId').value = empleado.id;
        document.getElementById('editarEmployeeCode').value = empleado.employeed_code;
        document.getElementById('editarEmployeeName').value = empleado.name;
        document.getElementById('editarEmployeeLastname').value = empleado.lastname;
        document.getElementById('editarEmployeeSecondLastname').value = empleado.second_lastname;
        document.getElementById('editarEmployeeEmail').value = empleado.email;
        document.getElementById('editarEmployeePhone').value = empleado.phone;

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
        if (!input.value.trim() || input.value === '--------') {
            input.classList.add('is-invalid');
            setTimeout(() => {
                input.classList.remove('is-invalid');
            }, 4000);
            isValid = false;
        } else {
            input.classList.remove('is-invalid');
        }
    });

    return isValid;
}

async function actualizarEmpleado() {
    if (!validateForm('editarEmpleadoForm')) {
        return;
    }

    try {
        const empleadoId = document.getElementById('editarEmpleadoId').value;
        const employeed_code = document.getElementById('editarEmployeeCode').value;
        const name = document.getElementById('editarEmployeeName').value;
        const lastname = document.getElementById('editarEmployeeLastname').value;
        const second_lastname = document.getElementById('editarEmployeeSecondLastname').value;
        const email = document.getElementById('editarEmployeeEmail').value;
        const phone = document.getElementById('editarEmployeePhone').value;
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
                email,
                phone,
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
        loadEmpleados();
    } catch (error) {
        console.error('Error al actualizar empleado:', error.message);
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
        const email = document.getElementById('crearEmployeeEmail').value;
        const phone = document.getElementById('crearEmployeePhone').value;
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
                email,
                phone,
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
    } catch (error) {
        console.error('Error al crear empleado:', error.message);
    }
}

document.getElementById('guardarEmpleadoBtn').addEventListener('click', crearEmpleado);
document.getElementById('crear-comedor-btn').addEventListener('click', openCreateModal);
document.getElementById('actualizarEmpleadoBtn').addEventListener('click', actualizarEmpleado);