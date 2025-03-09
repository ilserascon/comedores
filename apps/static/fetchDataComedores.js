async function getComedores(page = 1, filter = 'all') {
    try {
        const response = await fetch(`/get_comedores?page=${page}&filter=${filter}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al obtener comedores');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error.message);
        throw new Error(error.message || 'Error al obtener comedores');
    }
}

async function getComedor(id) {
    try {
        const response = await fetch(`/get_comedor?dining_room_id=${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al obtener comedor');
        }

        const data = await response.json();        
        return data;
    } catch (error) {
        console.error('Error:', error.message);
        throw new Error(error.message || 'Error al obtener comedor');
    }
}

async function createComedor(data) {
    try {
        const response = await fetch('/create_comedor', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al crear comedor');
        }

        const result = await response.json();

        // Mostrar mensaje de éxito
        showToast('Comedor creado exitosamente', 'success');

        // Llenar el select de clientes con comedores para actualizarlo dinamicamente
        await llenarSelectClientesComedores('filterComedorSelect');

        // Mantener el valor actual del filtro seleccionado
        document.getElementById('filterComedorSelect').value = currentFilter;

        // Actualizar la tabla con el nuevo comedor y mantener la página actual y el filtro aplicado
        await actualizarTablaComedores(currentPage, currentFilter);

        // Cerrar el modal de creación
        $('#crearComedorModal').modal('hide');
    } catch (error) {
        console.error('Error:', error.message);
        showToast('Error al crear comedor', 'danger');
    }
}

// Obtener los datos del comedor a editar y mostrar el modal de edición
async function editarComedor(id) {
  try {
      const response = await fetch(`/get_comedor?dining_room_id=${id}`, {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json'
          }
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al obtener comedor');
      }

      const comedor = await response.json();
      

      // Llenar el formulario del modal con los datos del comedor
      document.getElementById('editarComedorName').value = comedor.name;
      document.getElementById('editarComedorDescription').value = comedor.description;
      document.getElementById('editarComedorStatus').value = comedor.status ? '1' : '0';
      document.getElementById('editarComedorId').value = comedor.dining_room_id;
      document.getElementById('editarComedorClient').value = comedor.client_id;

      // Llenar el select de encargados
      await llenarSelectEncargados('editarComedorInCharge');
      document.getElementById('editarComedorInCharge').value = comedor.in_charge.id;

      // Mostrar el modal de edición
      $('#editarComedorModal').modal('show');
  } catch (error) {
      console.error('Error:', error.message);
  }
}

async function updateComedor(data) {
    try {
        // Obtener los valores originales del comedor
        const originalComedor = await getComedor(data.dining_room_id);

        // Verificar si los valores han cambiado
        const hasChanged = (
            data.name !== originalComedor.name ||
            data.description !== originalComedor.description ||
            data.client !== originalComedor.client_id.toString() ||
            data.inCharge !== originalComedor.in_charge.id.toString() ||
            data.status !== (originalComedor.status ? '1' : '0')
        );
        
        const response = await fetch('/update_comedor', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al actualizar comedor');
        }
        
        if (!hasChanged) {
            // Mostrar mensaje informativo si no se han realizado cambios
            showToast('No se han realizado cambios', 'info');            
        } else {
            // Mostrar mensaje de éxito si se han realizado cambios
            showToast('Comedor actualizado exitosamente', 'success');
        }

        // Llenar el select de clientes con comedores para actualizarlo dinamicamente
        await llenarSelectClientesComedores('filterComedorSelect');

        // Mantener el valor actual del filtro seleccionado
        document.getElementById('filterComedorSelect').value = currentFilter;

        // Actualizar la tabla con el comedor actualizado y mantener la página actual y el filtro aplicado
        await actualizarTablaComedores(currentPage, currentFilter);

        // Cerrar el modal de edición
        $('#editarComedorModal').modal('hide');
    } catch (error) {
        console.error('Error:', error.message);
        showToast('Error al actualizar comedor', 'danger');
    }
}

let currentPage = 1; // Variable global para almacenar el número de página actual
let currentFilter = 'all'; // Variable global para almacenar el filtro actual

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
                    ${comedor.description}
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
                    <button class="btn btn-sm btn-primary" onclick="editarComedor(${comedor.id})">Editar</button>
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

async function getEncargados() {
    try {
        const response = await fetch('/get_encargados', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });        

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al obtener encargados');
        }        

        const data = await response.json();        

        return data.encargados;
    } catch (error) {
        console.error('Error:', error.message);
        throw new Error(error.message || 'Error al obtener encargados');
    }
}

// Obtiene todos los clientes
async function getClientes() {
    try {
        const response = await fetch('/get_clientes', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al obtener clientes');
        }

        const data = await response.json();        

        return data;
    } catch (error) {
        console.error('Error:', error.message);
        throw new Error(error.message || 'Error al obtener clientes');
    }
}

// Obtiene los clientes que tienen comedores
async function getClientesComedores() {
    try {
        const response = await fetch('/get_clientes_comedores', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al obtener clientes con comedores');
        }

        const data = await response.json();                  

        return data;
    } catch (error) {
        console.error('Error:', error.message);
        throw new Error(error.message || 'Error al obtener clientes con comedores');
    }

}

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