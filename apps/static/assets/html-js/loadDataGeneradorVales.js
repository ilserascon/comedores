const uniqueClientField = document.getElementById('unique-client-field')
const uniqueDiningRoomField = document.getElementById('unique-dinningroom-field')
const uniqueQuantityField = document.getElementById('unique-quantity-field')
const generateUniqueVouchersForm = document.getElementById('generate-unique-vouchers')

const perpetualClientField = document.getElementById('perpetual-client-field')
const perpetualDiningRoomField = document.getElementById('perpetual-dinningroom-field')
const perpetualQuantityField = document.getElementById('perpetual-quantity-field')
const generatePerpetualVouchersForm = document.getElementById('generate-perpetual-vouchers')

const fillPerpetualVouchersForm = document.getElementById('fill-perpetual-vouchers-form')
const fillPerpetualVouchersCard = document.getElementById('fill-perpetual-vouchers-card')
const voucherGeneratorTabs = document.getElementById('voucher-generator-tabs')

const submitPerpetualVouchers = document.createElement('button')
submitPerpetualVouchers.type = 'submit'
submitPerpetualVouchers.innerText = 'Generar'
submitPerpetualVouchers.classList.add('btn','btn-primary','rounded-pill', 'mt-3')




const loader = document.createElement('span')
loader.className = 'loader'

const loaderDiv = document.createElement('div')
loaderDiv.appendChild(loader)
loaderDiv.innerHTML += '  Generando vales'

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  const header = type === 'success' ? 'Éxito' : type === 'info' ? 'Aviso' : 'Error';
  // Set the toast classes with Bootstrap
  toast.className = `toast align-items-center text-white bg-${type} border-0 rounded-pill shadow-sm p-2 px-3 m-1`;
  toast.role = 'alert';
  toast.ariaLive = 'assertive';
  toast.ariaAtomic = 'true';
  toast.style.zIndex = '1000';

  // Set the toast content (including a header, body, and close button)
  toast.innerHTML = `
      <div class="toast-header bg-${type} text-white d-flex align-items-center justify-content-between p-1 px-1 rounded-pill shadow-sm">
          <strong class="me-auto">${header}</strong>
          <button type="button" class="btn-close btn-close-white bg-transparent border border-0 right-1" data-bs-dismiss="toast" aria-label="Close">
          <i class="fas fa-times"></i>
          </button>
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

        uniqueDiningRoomField.appendChild(option)
        perpetualDiningRoomField.appendChild(option.cloneNode(true))

        if (uniqueDiningRoomField.children.length > 0) {
          uniqueDiningRoomField.children[0].selected = true
        }

      })

    }
  )

}

getClientes().then(data => {
    data.clientes.forEach(client => {
      console.log(client)
      if (!client.status) return;

      const option = document.createElement('option')
      option.value = client.id
      option.textContent = client.company
      uniqueClientField.appendChild(option)
      perpetualClientField.appendChild(option.cloneNode(true))
    })

    if (uniqueClientField.children.length > 0) {
      uniqueClientField.children[0].selected = true
      perpetualClientField.children[0].selected = true
      populateDinningRoomField(uniqueClientField.children[0].value)
    } else {
      showToast('No se tienen clientes registrados.', 'danger')
    }
}).catch(err => {
  showToast(err.message, 'danger')
})


uniqueClientField.addEventListener('change', () => {
  uniqueDiningRoomField.innerHTML = ''
  perpetualDiningRoomField.innerHTML = ''
  populateDinningRoomField(uniqueClientField.value)

})

function validateFields(maxQuantity, quantity, clientField, diningRoomField){

  if (!Number.isInteger(quantity) || quantity <= 0 ) {
    showToast('La cantidad debe ser un número entero positivo', 'danger');
    return false;
  }

  if (quantity > maxQuantity) {
    showToast('La cantidad no puede ser mayor a 999', 'danger')
    return false;
  }


  if (!clientField.value) {
    showToast('No se tienen clientes registrados', 'danger');
    return false;
  }

  if (!diningRoomField.value) {
    showToast('No se tienen comedores registrados', 'danger');
    return false;
  }

  return true

}


generateUniqueVouchersForm.addEventListener('submit', (e) => {
  e.preventDefault()

  // Validate if the quantity field is a positive integer and doesn't use the Euler constant
  
  const quantity = Number(uniqueQuantityField.value)
  if (!validateFields(999, quantity, uniqueClientField, uniqueDiningRoomField)) return;
  
  generateUniqueVouchersForm.appendChild(loaderDiv)
  generateUniqueVoucher(Number(uniqueClientField.value), Number(uniqueDiningRoomField.value), Number(quantity))
  .then(data => {
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
  .catch(err => {
    showToast(err.message, 'danger')
  })
  .finally(() => {
    generateUniqueVouchersForm.removeChild(loaderDiv)
  })
})


function generatePerpetualVoucherField(number){
  const field = document.createElement('div')
  const input = document.createElement('input')
  const label = document.createElement('label')
  field.id = `field-voucer-${number}`
  input.classList.add('form-control')
  input.type = 'text'
  input.id = `perpetual-voucher-${number}`
  input.name = `perpetual-voucher-${number}`
  input.required = true

  label.htmlFor = `perpetual-voucher-${number}`
  label.textContent = `Vale ${number}`

  field.appendChild(label)
  field.appendChild(input)

  field.style.maxWidth = '50ch'

  return field

}


generatePerpetualVouchersForm.addEventListener('submit', (e) => {
  e.preventDefault()
  fillPerpetualVouchersForm.innerHTML = ''
  
  const quantity = Number(perpetualQuantityField.value);

  if (!validateFields(99, quantity, perpetualClientField, perpetualDiningRoomField)) return;


  fillPerpetualVouchersCard.classList.add('show')
  const formContent = document.createElement('div')
  formContent.classList.add('responsive')
 

  for (let i = 1; i <= quantity; i++) {
    const field = generatePerpetualVoucherField(i)
    formContent.appendChild(field)
  }
  fillPerpetualVouchersForm.appendChild(formContent)
  fillPerpetualVouchersForm.appendChild(submitPerpetualVouchers)

})


fillPerpetualVouchersForm.addEventListener('submit', (e) => {
  e.preventDefault()

  const formData = new FormData(e.target)
  const obj = Object.fromEntries(formData.entries())
  const values = Object.values(obj)

  const isInValid = values.reduce((isInvalid, val, index) => {
    const input = document.getElementById(`perpetual-voucher-${index + 1}`)

    
    if (val.length < 5) {

      if (input.parentNode.children.length == 3) return true;

      const invalidFeedback = document.createElement('div')
      invalidFeedback.classList.add('invalid-feeedback')
      invalidFeedback.style.color = 'var(--danger)'
      input.classList.add('is-invalid')
      invalidFeedback.innerText = 'El nombre del vale debe tener al menos 5 caracteres'
      input.parentNode.appendChild(invalidFeedback)
      return true;
    } else {
      input.classList.remove('is-invalid')
      if (input.parentNode.children.length == 3) {
        input.parentNode.removeChild(input.parentNode.children[2])
      }

      return isInvalid || false;
    }
  }, false)

  if (isInValid) return

  const quantity = Number(perpetualQuantityField.value);
  const perpetualClient = Number(perpetualClientField.value)
  const perpetualDiningRoom = Number(perpetualDiningRoomField.value)

  if (!validateFields(99, quantity, perpetualClientField, perpetualDiningRoomField)) return;

  generatePerpetualVoucher(perpetualClient, perpetualDiningRoom, quantity, values)
  .then(data => {
    showToast(data.message, 'success')
    fillPerpetualVouchersForm.innerHTML = ''
    fillPerpetualVouchersCard.classList.remove('show')
  })
  .catch(err => {
    showToast(err.message, 'danger')
  })
})

voucherGeneratorTabs.addEventListener('click', () => {
  fillPerpetualVouchersForm.innerHTML = ''
  fillPerpetualVouchersCard.classList.remove('show')
})