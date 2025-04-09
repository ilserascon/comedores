document.addEventListener('DOMContentLoaded', function() {
    const clientTableBody = document.getElementById('clientTableBody');
    const createClientBtn = document.getElementById('createClientBtn');
    const editClientModal = new bootstrap.Modal(document.getElementById('editClientModal'));
    const createClientForm = document.getElementById('createClientForm');
    const editClientForm = document.getElementById('editClientForm');
    const editClientIdInput = document.getElementById('edit_clientId');
    const createCompanyInput = document.getElementById('create_company');
    const createNameInput = document.getElementById('create_name');
    const createLastnameInput = document.getElementById('create_lastname');
    const createSecondLastnameInput = document.getElementById('create_second_lastname');
    const createEmailInput = document.getElementById('create_email');
    const createPhoneInput = document.getElementById('create_phone');
    const createAddressInput = document.getElementById('create_address');
    const createRfcInput = document.getElementById('create_rfc');
    const createStatusInput = document.getElementById('create_status');
    const editCompanyInput = document.getElementById('edit_company');
    const editNameInput = document.getElementById('edit_name');
    const editLastnameInput = document.getElementById('edit_lastname');
    const editSecondLastnameInput = document.getElementById('edit_second_lastname');
    const editEmailInput = document.getElementById('edit_email');
    const editPhoneInput = document.getElementById('edit_phone');
    const editRfcInput = document.getElementById('edit_rfc');
    const editAddressInput = document.getElementById('edit_address');
    const editStatusInput = document.getElementById('edit_status');
    const pagination = document.getElementById('pagination');

    // Function to show toast
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        const header = type === 'success' ? 'Éxito' : type === 'info' ? 'Aviso' : 'Error';
        // Set the toast classes with Bootstrap
        toast.className = `toast align-items-center text-white bg-${type} border-0 shadow-sm p-2 px-3 m-1`;
        toast.role = 'alert';
        toast.ariaLive = 'assertive';
        toast.ariaAtomic = 'true';
        toast.style.zIndex = '1';
    
        // Set the toast content (including a header, body, and close button)
        toast.innerHTML = `
            <div class="toast-header bg-${type} text-white d-flex align-items-center justify-content-between p-1 px-1 shadow-sm">
                <strong class="me-auto">${header}</strong>
                <button type="button" class="btn-close btn-close-white right-1" data-bs-dismiss="toast" aria-label="Close"></button>
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

    // Populate clients
    async function populateClients(page = 1, search = '') {
        const data = await fetchClients(page, search);
        if(data.clients.length === 0) {
            clientTableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">No se encontraron clientes</td>
                </tr>
            `;
            pagination.innerHTML = '';
            return;
        }else{
        clientTableBody.innerHTML = data.clients.map(client => `
            <tr>
                <td>${client.company}</td>
                <td>${client.name}</td>
                <td>${client.lastname}</td>
                <td>${client.second_lastname ? client.second_lastname : 'N/A'}</td>
                <td>${client.email}</td>
                <td>${client.phone}</td>
                <td>${client.rfc}</td>
                <td>${client.status ? 'Activo' : 'Inactivo'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editClient(${client.id})">Editar</button>
                </td>
            </tr>
        `).join('');
        }
        pagination.innerHTML = createPagination(data.page, data.pages);
    }

    let isFetching = false;

    function createPagination(currentPage, totalPages) {
        const maxPagesToShow = 5; // Show current, 2 before, and 2 after
        let paginationHTML = '';
    
        // Calculate the start and end pages
        const startPage = Math.max(1, currentPage - 2); // 2 pages before the current
        const endPage = Math.min(totalPages, currentPage + 2); // 2 pages after the current
    
        // Add "Previous" button
        if (currentPage > 1) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="javascript:void(0);" page-number="${currentPage - 1}">
                        <i class="fas fa-angle-left"></i>
                    </a>
                </li>`;
        }
    
        // Add page links
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}" style="z-index: 0;">
                    <a class="page-link" href="javascript:void(0);" page-number="${i}">${i}</a>
                </li>`;
        }
    
        // Add "Next" button
        if (currentPage < totalPages) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="javascript:void(0);" page-number="${currentPage + 1}">
                        <i class="fas fa-angle-right"></i>
                    </a>
                </li>`;
        }
    
        pagination.innerHTML = paginationHTML; // Set the inner HTML once
    
        // Add a single event listener to the pagination element
        pagination.addEventListener('click', async function(event) {
            if (event.target.tagName === 'A' && !isFetching) {
                const pageNumber = parseInt(event.target.getAttribute('page-number'), 10);
                if (!isNaN(pageNumber)) {
                    isFetching = true;
                    await populateClients(pageNumber); // Ensure to await the function call
                    isFetching = false;
                }
            }
        });
    
        return paginationHTML; // This return is optional now
    }

    createClientBtn.addEventListener('click', async function() {
        createClientForm.reset();
    });

    // Create client
    createClientForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const data = {
            company: createCompanyInput.value,
            name: createNameInput.value,
            lastname: createLastnameInput.value,
            second_lastname: createSecondLastnameInput.value,
            email: createEmailInput.value,
            phone: createPhoneInput.value,
            rfc: createRfcInput.value.toUpperCase(),
            address: createAddressInput.value,
            status: createStatusInput.value === 'true'
        };

        const result = await saveClient(null, data);
        if (result.message) {
            $('#createClientModal').modal('toggle')
            populateClients();
            showToast('Cliente creado correctamente', 'success');
        } else {
            showToast(result.error || 'Error al crear cliente', 'danger');
        }
    });

    // Edit client
    editClientForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const clientId = editClientIdInput.value;
        const originalData = await fetchClientDetails(clientId);
        const formData = {
            company: editCompanyInput.value,
            name: editNameInput.value,
            lastname: editLastnameInput.value,
            second_lastname: editSecondLastnameInput.value,
            email: editEmailInput.value,
            phone: editPhoneInput.value,
            rfc: editRfcInput.value.toUpperCase(),
            address: editAddressInput.value,
            status: editStatusInput.value === 'true'
        };

        // Validate form data
        if (validateClientData(formData)) {
            showToast(validateClientData(formData).error, 'danger');
            return;
        }

        // Check if form data has changed
        if (!hasFormChanged(originalData, formData)) {
            showToast('No hay cambios para guardar', 'info');
            return;
        }

        const result = await saveClient(clientId, formData);
        if (result.message) {
            editClientModal.hide()
            populateClients();
            showToast('Cliente actualizado correctamente', 'success');
        } else {
            showToast(result.error || 'Error al actualizar cliente', 'danger');
        }
    });

    function validateClientData(data) {
        if (data.company.length < 2) {
            return { error: 'El nombre de la compañía debe tener al menos 2 caracteres' };
        }
        
        if (data.company.length > 50) {
            return { error: 'El nombre de la compañía debe tener máximo 50 caracteres' };
        }
    
        if (data.name.length < 2 || data.lastname.length < 2 || data.second_lastname.length < 2) {
            return { error: 'El nombre y los apellidos deben tener al menos 2 caracteres' };
        }
        
        if (data.rfc.length < 12 || data.rfc.length > 13) {
            return { error: 'El RFC debe tener 12 o 13 caracteres' };
        }
        
        if (data.phone.length != 10) {
            return { error: 'El teléfono debe tener 10 caracteres' };
        }
        
        if (data.address.length < 5) {
            return { error: 'La dirección debe tener al menos 5 caracteres' };
        }
        
        if (data.address.length > 100) {
            return { error: 'La dirección debe tener máximo 100 caracteres' };
        }
        
        if (!data.email.includes('@') || !data.email.includes('.')) {
            return { error: 'Correo electrónico inválido' };
        }
    
        return null; // No errors
    }

    // Function to check if any value has changed
    function hasFormChanged(originalData, formData) {
        return Object.keys(formData).some(key => formData[key] !== originalData[key]);
    }

    // Edit client function
    window.editClient = async function(clientId) {
        const client = await fetchClientDetails(clientId);
        if (client) {
            editClientIdInput.value = client.id;
            editCompanyInput.value = client.company;
            editNameInput.value = client.name;
            editLastnameInput.value = client.lastname;
            editSecondLastnameInput.value = client.second_lastname;
            editEmailInput.value = client.email;
            editPhoneInput.value = client.phone;
            editRfcInput.value = client.rfc;
            editAddressInput.value = client.address;
            editStatusInput.value = client.status;
            editClientModal.show();
        } else {
            showToast('Error al cargar los datos del cliente', 'danger');
        }
    };

    // Initialize
    populateClients();

    // Close modal on button click
    document.querySelectorAll('.btn-close').forEach(button => {
        button.addEventListener('click', function() {
            editClientModal.hide();
        });
    });

    // Search clients
    const searchClientInput = document.getElementById('searchClientInput');

    searchClientInput.addEventListener('input', function() {
        const searchValue = this.value.trim();
        if (searchValue) {
            fetchClients(1, searchValue).then(data => {
                if(data.clients.length === 0) {
                    clientTableBody.innerHTML = `
                        <tr>
                            <td colspan="9" class="text-center">No se encontraron clientes</td>
                        </tr>
                    `;
                    pagination.innerHTML = '';
                    return;
                } else {
                    clientTableBody.innerHTML = data.clients.map(client => `
                        <tr>
                            <td>${client.company}</td>
                            <td>${client.name}</td>
                            <td>${client.lastname}</td>
                            <td>${client.second_lastname ? client.second_lastname : 'N/A'}</td>
                            <td>${client.email}</td>
                            <td>${client.phone}</td>
                            <td>${client.rfc}</td>
                            <td>${client.status ? 'Activo' : 'Inactivo'}</td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="editClient(${client.id})">Editar</button>
                            </td>
                        </tr>
                    `).join('');
                }
                pagination.innerHTML = '';
            });
        } else {
            populateClients();
        }
    });
});