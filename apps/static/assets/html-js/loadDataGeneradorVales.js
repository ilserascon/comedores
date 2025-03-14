const clientField = document.getElementById('client-field')
const dinningRoomField = document.getElementById('dinningroom-field')
const generateBtn = document.getElementById('generate-btn')
const quantityField = document.getElementById('quantity-field')
const generateUniqueVouchersForm = document.getElementById('generate-unique-vouchers')


function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  const header = type === 'success' ? 'Éxito' : type === 'info' ? 'Aviso' : 'Error';
  // Set the toast classes with Bootstrap
  toast.className = `toast align-items-center text-white bg-${type} border-0 rounded-pill shadow-sm p-2 px-3 m-1`;
  toast.role = 'alert';
  toast.ariaLive = 'assertive';
  toast.ariaAtomic = 'true';
  toast.style.zIndex = '1';

  // Set the toast content (including a header, body, and close button)
  toast.innerHTML = `
      <div class="toast-header bg-${type} text-white d-flex align-items-center justify-content-between p-1 px-1 rounded-pill shadow-sm">
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


function populateDinningRoomField(clientId){
  
  getAllComedores(clientId).then(
    data => {
      data.comedores.forEach(comedor => {
        const option = document.createElement('option')
        option.value = comedor.id
        option.textContent = comedor.name

        dinningRoomField.appendChild(option)

        if (dinningRoomField.children.length > 0) {
          dinningRoomField.children[0].selected = true
        }

      })

    }
  )

}

getClientes().then(data => {
    data.clientes.forEach(client => {
      const option = document.createElement('option')
      option.value = client.id
      option.textContent = client.company
      clientField.appendChild(option)
    })

    if (clientField.children.length > 0) {
      clientField.children[0].selected = true
      populateDinningRoomField(clientField.children[0].value)
    } else {
      showToast('No se tienen clientes registrados.')
    }
})

clientField.addEventListener('change', () => {
  dinningRoomField.innerHTML = ''
  populateDinningRoomField(clientField.value)

})



generateUniqueVouchersForm.addEventListener('submit', (e) => {
  e.preventDefault()
  // Validate if the quantity field is a positive integer and doesn't use the Euler constant
  const quantity = quantityField.value;
  if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0 || quantity.includes('e')) {
    showToast('Ingresa un número entero positivo', 'error');
    return;
  }


  if (!clientField.value) {
    triggerInvalidMessage('No se tienen clientes registrados', 'error');
    return
  }

  if (!dinningRoomField.value) {
    triggerInvalidMessage('No se tienen comedores registrados', 'error');
    return
  }

  generateUniqueVoucher(Number(clientField.value), Number(dinningRoomField.value), Number(quantity)).then(data => {
    const pdfFile = data.pdf

    let anchor = document.querySelector('a#download-link')
    if (anchor) {
      anchor.remove()
    }
    //Generate an anchor element and add it to the container
    anchor = document.createElement('a')
    anchor.id = 'download-link'
    anchor.href = `/static/pdfs${pdfFile}`
    anchor.innerHTML= "<i class='ni ni-single-copy-04 text-blue'></i> Ver PDF "

    generateUniqueVouchersForm.appendChild(anchor)
    showToast(data.message, 'success')
  })

})



