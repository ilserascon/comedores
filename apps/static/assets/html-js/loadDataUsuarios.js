document.addEventListener('DOMContentLoaded', function() {
    const userTableBody = document.getElementById('userTableBody');
    const createUserBtn = document.getElementById('createUserBtn');
    const createUserModal = new bootstrap.Modal(document.getElementById('createUserModal'));
    const editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));
    const createUserForm = document.getElementById('createUserForm');
    const editUserForm = document.getElementById('editUserForm');
    const editUserIdInput = document.getElementById('edit_userId');
    const createUsernameInput = document.getElementById('create_username');
    const createFirstNameInput = document.getElementById('create_first_name');
    const createLastNameInput = document.getElementById('create_last_name');
    const createSecondLastNameInput = document.getElementById('create_second_last_name');
    const createEmailInput = document.getElementById('create_email');
    const createPasswordInput = document.getElementById('create_password');
    const createRoleInput = document.getElementById('create_role');
    const createStatusInput = document.getElementById('create_status');
    const createDiningRoomInput = document.getElementById('create_dining_room');
    const editUsernameInput = document.getElementById('edit_username');
    const editFirstNameInput = document.getElementById('edit_first_name');
    const editLastNameInput = document.getElementById('edit_last_name');
    const editSecondLastNameInput = document.getElementById('edit_second_last_name');
    const editEmailInput = document.getElementById('edit_email');
    const editPasswordInput = document.getElementById('edit_password');
    const editRoleInput = document.getElementById('edit_role');
    const editStatusInput = document.getElementById('edit_status');
    const editDiningRoomInput = document.getElementById('edit_dining_room');
    const pagination = document.getElementById('pagination');
    const roleFilter = document.getElementById('roleFilter');
    const searchUserInput = document.getElementById('searchUserInput');

    // Function to show toast
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        const header = type === 'success' ? 'Éxito' : type === 'info' ? 'Aviso' : 'Error';
        toast.className = `toast align-items-center text-white bg-${type} border-0 rounded-pill shadow-sm p-2 px-3 m-1`;
        toast.role = 'alert';
        toast.ariaLive = 'assertive';
        toast.ariaAtomic = 'true';
        toast.style.zIndex = '1';
    
        toast.innerHTML = `
            <div class="toast-header bg-${type} text-white d-flex align-items-center justify-content-between p-1 px-1 rounded-pill shadow-sm">
                <strong class="me-auto">${header}</strong>
                <button type="button" class="btn-close btn-close-white right-1" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body p-1 px-1">
                ${message}
            </div>
        `;
    
        const toastContainer = document.getElementById('toastContainer');
        toastContainer.appendChild(toast);
    
        const bsToast = new bootstrap.Toast(toast, { delay: 4000 });
        bsToast.show();
    
        setTimeout(() => {
            toast.remove();
        }, 4000);
    
        toast.querySelector('.btn-close').addEventListener('click', function() {
            toast.remove();
            bsToast.hide();
        });
    }

    // Populate roles
    async function populateRoles() {
        const roles = await fetchRoles();
        createRoleInput.innerHTML = roles.map(role => `<option value="${role.id}">${role.name}</option>`).join('');
        editRoleInput.innerHTML = roles.map(role => `<option value="${role.id}">${role.name}</option>`).join('');
        roleFilter.innerHTML = `<option value="">Todos los roles</option>` + roles.map(role => `<option value="${role.id}">${role.name}</option>`).join('');
    }

    // Populate dining rooms without in charge
    async function populateDiningRooms() {
        const diners = await fetchDinersWithoutInCharge();
        if (diners.length === 0) {
            createDiningRoomInput.innerHTML = `<option value="" disabled hidden>No hay comedores disponibles</option>`;
            editDiningRoomInput.innerHTML = `<option value="" disabled hidden>No hay comedores disponibles</option>`;
        } else {
            createDiningRoomInput.innerHTML = `<option value="no">Sin Asignar</option>` + diners.map(diner => `<option value="${diner.id}">${diner.name}</option>`).join('');
            editDiningRoomInput.innerHTML = `<option value="no">Sin Asignar</option>` + diners.map(diner => `<option value="${diner.id}">${diner.name}</option>`).join('');
        }
    }

    // Populate users
    async function populateUsers(page = 1, search = '', role = '') {
        const data = await fetchUsers(page, search, role);
        if(data.users.length === 0) {
            userTableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">No se encontraron usuarios</td>
                </tr>
            `;
            pagination.innerHTML = '';
            return;
        } else {
            userTableBody.innerHTML = data.users.map(user => `
                <tr>
                    <td>${user.username ? user.username : 'N/A'}</td>
                    <td>${user.first_name ? user.first_name : 'N/A'}</td>
                    <td>${user.last_name ? user.last_name : 'N/A'}</td>
                    <td>${user.second_last_name ? user.second_last_name : 'N/A'}</td>
                    <td>${user.email}</td>
                    <td>${user.role__name}</td>
                    <td>${user.dining_room_in_charge__name ? user.dining_room_in_charge__name : 'Sin asignar'}</td>
                    <td>
                        <span class="badge badge-dot mr-4">
                            <i class="${user.status ? 'bg-success' : 'bg-danger'}"></i>
                            <span class="status">${user.status ? 'Activo' : 'Inactivo'}</span>
                        </span>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="editUser(${user.id})">Editar</button>
                    </td>
                </tr>
            `).join('');
        }
        pagination.innerHTML = createPagination(data.page, data.pages);
    }

    // Create pagination links
    function createPagination(currentPage, totalPages) {
        let paginationHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += 
                `<li class="page-item ${i === currentPage ? 'active' : ''}" style="z-index: 0;">
                    <a class="page-link" href="javascript:void(0);" page-number="${i}">${i}</a>
                </li>`;
        }
        pagination.innerHTML = paginationHTML;

        pagination.addEventListener('click', async function(event) {
            if (event.target.tagName === 'A') {
                const pageNumber = event.target.getAttribute('page-number');
                await populateUsers(pageNumber, searchUserInput.value, roleFilter.value);
            }
        });
        
        return paginationHTML;
    }

    // Create user
    createUserForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const data = {
            username: createUsernameInput.value,
            first_name: createFirstNameInput.value,
            last_name: createLastNameInput.value,
            second_last_name: createSecondLastNameInput.value,
            email: createEmailInput.value,
            password: createPasswordInput.value,
            role_id: createRoleInput.value,
            status: createStatusInput.value === 'true',
            dining_room_id: createRoleInput.value == 1 ? null : createDiningRoomInput.value // No asignar comedor si es Administrador
        };

        if (!validateFormData(data)) {
            return;
        }

        const result = await saveUser(null, data);
        if (result.message) {
            createUserModal.hide();
            populateUsers();
            showToast('Usuario creado correctamente', 'success');
        } else {
            showToast(result.error || 'Error al crear usuario', 'danger');
        }
    });

    const enablePasswordEditCheckbox = document.getElementById('enablePasswordEdit');

    enablePasswordEditCheckbox.addEventListener('change', function() {
        editPasswordInput.disabled = !this.checked;
        if (!this.checked) {
            editPasswordInput.value = '';
        }
    });

    // Edit user
    editUserForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const userId = editUserIdInput.value;
        const originalData = await fetchUserDetails(userId);
        const formData = {
            username: editUsernameInput.value,
            first_name: editFirstNameInput.value,
            last_name: editLastNameInput.value,
            second_last_name: editSecondLastNameInput.value,
            email: editEmailInput.value,
            password: editPasswordInput.disabled ? null : editPasswordInput.value,
            role_id: editRoleInput.value,
            role__name: editRoleInput.options[editRoleInput.selectedIndex].text,
            status: editStatusInput.value === 'true',
            dining_room_in_charge: editRoleInput.value == "no" ? "no" : (editDiningRoomInput.value === 'no' ? "no" : editDiningRoomInput.value) // No asignar comedor si es Administrador
        };

        if (!validateFormData(formData)) {
            return;
        }
        
        if (!hasFormChanged(originalData, formData)) {
            showToast('No hay cambios para guardar', 'info');
            return;
        }

        formData.dining_room_in_charge = editDiningRoomInput.value;
        const result = await saveUser(userId, formData);
        if (result.message) {
            editUserModal.hide();
            populateUsers();
            showToast('Usuario actualizado correctamente', 'success');
        } else {
            showToast(result.error || 'Error al actualizar al Usuario', 'danger');
        }
    });

    function hasFormChanged(originalData, formData) {
        // Check if any field has changed
        formData['dining_room_in_charge'] = formData['dining_room_in_charge'] === 'no' ? null : formData['dining_room_in_charge'];
        return Object.keys(formData).some(key => {
            if (key in originalData) {
                return originalData[key] != formData[key];
            } else if (key === 'password' && formData[key] != null) {
                return true; // If password is set, treat it as a change
            }else {
                return false;
            }
        });
    }
    

    function validateFormData(data) {
        if (data.username.length < 5) {
            showToast('El nombre de usuario debe tener al menos 5 caracteres', 'danger');
            return false;
        }

        if (data.first_name.length < 2 || data.last_name.length < 2 || data.second_last_name.length < 2) {
            showToast('El nombre, apellido paterno y apellido materno deben tener al menos 2 caracteres', 'danger');
            return false;
        }

        if (!data.email.includes('@') || !data.email.includes('.')) {
            showToast('Correo electrónico inválido', 'danger');
            return false;
        }

        if (data.password && (data.password.length < 8 || !/\d/.test(data.password) || !/[a-zA-Z]/.test(data.password))) {
            showToast('La contraseña debe tener al menos 8 caracteres, una letra y un número', 'danger');
            return false;
        }

        return true;
    }

    window.editUser = async function(userId) {
        const user = await fetchUserDetails(userId);
        if (user.dining_room_in_charge__name) {
            editDiningRoomInput.innerHTML = `<option value="${user.dining_room_in_charge}">${user.dining_room_in_charge__name}</option><option value="no">Sin Asignar</option>`;
        } else {
            populateDiningRooms();
        }
        if (user) {
            editUserIdInput.value = user.id;
            editUsernameInput.value = user.username;
            editFirstNameInput.value = user.first_name;
            editLastNameInput.value = user.last_name;
            editSecondLastNameInput.value = user.second_last_name;
            editEmailInput.value = user.email;
            editRoleInput.value = user.role;
            editStatusInput.value = user.status;
            editDiningRoomInput.value = user.dining_room_in_charge ? user.dining_room_in_charge : 'no';
            editUserModal.show();
            handleRoleStatusChange(editRoleInput, editDiningRoomInput, editStatusInput);
        }
    };

    function handleRoleStatusChange(roleInput, diningRoomInput, statusInput) {
        if (roleInput.value == 1 || statusInput.value == 'false') {
            diningRoomInput.value = 'no';
            diningRoomInput.disabled = true;
        } else {
            diningRoomInput.disabled = false;
        }
    }

    populateRoles();
    populateDiningRooms();
    populateUsers();

    createUserBtn.addEventListener('click', function() {
        createUserForm.reset();
        createUserModal.show();
        handleRoleStatusChange(createRoleInput, createDiningRoomInput, createStatusInput);
    });

    document.querySelectorAll('.btn-close').forEach(button => {
        button.addEventListener('click', function() {
            createUserModal.hide();
            editUserModal.hide();
        });
    });

    searchUserInput.addEventListener('input', function() {
        const searchValue = this.value.trim();
        populateUsers(1, searchValue, roleFilter.value);
    });

    roleFilter.addEventListener('change', function() {
        const roleValue = this.value;
        populateUsers(1, searchUserInput.value, roleValue);
    });

    const toggleCreatePassword = document.getElementById('toggleCreatePassword');
    toggleCreatePassword.addEventListener('mousedown', function() {
        createPasswordInput.type = 'text';
    });
    toggleCreatePassword.addEventListener('mouseup', function() {
        createPasswordInput.type = 'password';
    });
    toggleCreatePassword.addEventListener('mouseout', function() {
        createPasswordInput.type = 'password';
    });

    const toggleEditPassword = document.getElementById('toggleEditPassword');
    toggleEditPassword.addEventListener('mousedown', function() {
        editPasswordInput.type = 'text';
    });
    toggleEditPassword.addEventListener('mouseup', function() {
        editPasswordInput.type = 'password';
    });
    toggleEditPassword.addEventListener('mouseout', function() {
        editPasswordInput.type = 'password';
    });

    enablePasswordEditCheckbox.addEventListener('change', function() {
        editPasswordInput.disabled = !this.checked;
    });

    // Disable dining room selection if role is Admin
    createRoleInput.addEventListener('change', function() {
        handleRoleStatusChange(createRoleInput, createDiningRoomInput, createStatusInput);
    });

    editRoleInput.addEventListener('change', function() {
        handleRoleStatusChange(editRoleInput, editDiningRoomInput, editStatusInput);
        if(editRoleInput.value == 1){
            editDiningRoomInput.value = 'no';
        }
    });

    createStatusInput.addEventListener('change', function() {
        handleRoleStatusChange(createRoleInput, createDiningRoomInput, createStatusInput);
    });

    editStatusInput.addEventListener('change', function() {
        handleRoleStatusChange(editRoleInput, editDiningRoomInput, editStatusInput);
    });
});