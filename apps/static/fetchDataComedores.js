async function getComedores() {
  try {
      const response = await fetch(`/get_comedores`, {
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
        const response = await fetch(`/get_comedor/${id}`, {
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
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al crear comedor');
      }

      const result = await response.json();
      console.log('Comedor creado:', result);

      // Actualizar la tabla con el nuevo comedor
      await actualizarTablaComedores();

      // Cerrar el modal de creación
      $('#crearComedorModal').modal('hide');
  } catch (error) {
      console.error('Error:', error.message);
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

      const result = await response.json();
      console.log('Comedor actualizado:', result);      

      // Cerrar el modal de edición
      $('#editarComedorModal').modal('hide');

      // Actualizar la tabla con los datos actualizados
      await actualizarTablaComedores();
  } catch (error) {
      console.error('Error:', error.message);
  }
}

async function actualizarTablaComedores() {
  try {
      const comedores = await getComedores();

      // Limpiar la tabla existente
      const tbody = document.querySelector('.list');
      tbody.innerHTML = '';

      // Llenar la tabla con los datos actualizados
      comedores.dining_rooms.forEach(comedor => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
              <th scope="row">
                  <div class="media align-items-center">
                      <a href="#" class="avatar rounded-circle mr-3">
                          <img alt="Image placeholder" src="/static/assets/img/theme/vue.jpg">
                      </a>
                      <div class="media-body">
                          <span class="name mb-0 text-sm">${comedor.name}</span>
                      </div>
                  </div>
              </th>
              <td class="budget">
                  ${comedor.description}
              </td>
              <td>
                  ${comedor.in_charge_first_name} ${comedor.in_charge_last_name}
              </td>
              <td>
                  <span class="badge badge-dot mr-4">
                      <i class="${comedor.status ? 'bg-success' : 'bg-danger'}"></i>
                      <span class="status">${comedor.status ? 'Activo' : 'Inactivo'}</span>
                  </span>
              </td>
              <td class="text-right d-flex justify-content-center">
                  <button class="btn btn-sm btn-primary" onclick="editarComedor(${comedor.dining_room_id})">Editar</button>
              </td>
          `;
          tbody.appendChild(tr);
      });
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

        console.log('Encargados:', data)

        return data.encargados;
    } catch (error) {
        console.error('Error:', error.message);
        throw new Error(error.message || 'Error al obtener encargados');
    }
}

async function llenarSelectEncargados(selectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = ''; // Limpiar opciones anteriores
    const encargados = await getEncargados();
    encargados.forEach(encargado => {
        const option = document.createElement('option');
        option.value = encargado.id;
        option.textContent = `${encargado.first_name} ${encargado.last_name}`;
        select.appendChild(option);
    });
}