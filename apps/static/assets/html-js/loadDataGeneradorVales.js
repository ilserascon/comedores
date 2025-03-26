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

function getLoader(content, loaderId){
  return `
    <div id="${loaderId}" class="mt-4">
      <span class="loader"></span>
      <span>  ${content}</span>    
    </div>
  `
}

function loadPerpetualVouchersTable(vouchers, email, lotId){
  const secondCard = document.getElementById('second-card')
  secondCard.innerHTML = `
        <div class="table-responsive">
          <table class="table align-items-center table-flush">
            <thead class="thead-light">
              <tr>
                <th scope="col" class="sort" data-sort="folio">Folio del vale</th>
                <th scope="col" class="sort" data-sort="employee">Nombre del empleado</th>
                <th scope="col" class="sort" data-sort="qr">Código QR</th>
                <th scope="col" class="sort"></th>
              </tr>
            </thead>
            <tbody class="list" id="perpetual-vouchers-table-body">
              <!-- Aquí se llenarán los datos dinámicamente -->
            </tbody>
          </table>
        </div>
        <div class="d-flex p-2 justify-content-end mt-3">
          <div class="input-group mr-3" style="max-width: 400px;">
            <input id="email-input-perpetual" class="form-control mr-3" type="email" placeholder="example@email.com" />
            <button class="btn btn-primary" id="send-email-button">
              <i class="fas fa-envelope"></i> Enviar por email
            </button>
          </div>
          <button class="btn btn-secondary " id="download-pdf-button">
            <i class="fas fa-download"></i> Descargar PDF
          </button>
        </div>
  `

  const tableBody = document.getElementById('perpetual-vouchers-table-body')
  const emailInput = document.getElementById('email-input-perpetual')
  const sendEmailButton = document.getElementById('send-email-button')
  const downloadPdfButton = document.getElementById('download-pdf-button')
  

  emailInput.value = email

  sendEmailButton.addEventListener('click', (e) => {
    e.preventDefault()
    const email = emailInput.value

    sendLotFileToEmail(lotId, email)
    .then(data => {
      showToast(data.message, 'success')
    })
    .catch(err => {
      showToast(err.message, 'danger')
    })
      
  })

  downloadPdfButton.addEventListener('click', (e) => {
    e.preventDefault()
    getLotPdf(lotId)
      .then(data => {
        const a = document.createElement('a')
        a.download = `LOT-${lotId}.pdf`
        a.href = data.pdf
        a.click()
        showToast(data.message || 'PDF descargado', 'success')
      })
      .catch(err => {
        showToast(err.message, 'danger')
      })
  })

    

  vouchers.forEach((voucher) => {
    const row = document.createElement('tr')
    const folio = document.createElement('td')
    const employee = document.createElement('td')
    const employeeInput = document.createElement('input')
    employeeInput.classList.add('form-control')
    const buttonTd = document.createElement('td')
    
    employeeInput.placeholder = 'Escribe el nombre del empleado'
    const qr = document.createElement('td')
    const saveButton = document.createElement('button')
    saveButton.classList.add('btn', 'btn-primary', 'rounded-pill')
    saveButton.innerText = 'Guardar'
    saveButton.disabled = true

    employeeInput.addEventListener('input', () => {
      saveButton.disabled = false
    })
    
    folio.textContent = voucher.folio
    qr.innerHTML = `<a href="#" id="generate-voucher-${voucher.id}"><i class="fa fa-qrcode"></i></a>`

    const handleGenerateQR = (e) => {
      e.preventDefault()
      loader = getLoader('Generando QR', `loader-qr-${voucher.id}`)
      qr.innerHTML = loader
      

      generatePerpetualVoucherQR(voucher.id)
      .then(data => {
        showToast(data.message, 'success')
        qr.removeEventListener('click', handleGenerateQR)
        qr.innerHTML = `<a href="${data.filepath}" target="blank" id="generate-voucher-${voucher.id}">Mostrar QR</a>`
      })
      .catch(err => {
        showToast(err.message, 'danger')
        qr.innerHTML = `<a href="#" id="generate-voucher-${voucher.id}"><i class="fa fa-qrcode"></i></a>`
      })      
    }
    
    const handleSaveData = () => {
      const loaderId = 'saving-perpetual-voucher-loader'
      const loader = getLoader('Guardando', loaderId)

      buttonTd.innerHTML = loader
      
      changeVoucherEmployee(voucher.id, employeeInput.value)
    
      .then(data => {
          qr.innerHTML = `<a href="#" id="generate-voucher-${voucher.id}"><i class="fa fa-qrcode"></i></a>`
          qr.removeEventListener('click', handleGenerateQR)
          qr.addEventListener('click', handleGenerateQR)
          saveButton.disabled = true
          showToast(data.message, 'success')
      })
      .catch(err => {
        showToast(err.message, 'danger')
      })
      .finally(() => {
        buttonTd.removeChild(document.getElementById(loaderId))
        buttonTd.appendChild(saveButton)
      })

    }

    saveButton.addEventListener('click', handleSaveData)
    qr.addEventListener('click', handleGenerateQR)

    tableBody.appendChild(row)
    row.appendChild(folio)
    row.appendChild(employee)
    row.appendChild(qr)
    row.appendChild(buttonTd)
    buttonTd.appendChild(saveButton)
    employee.appendChild(employeeInput)

  })
  secondCard.classList.add('show')
}


function loadFillPerpetualVouchersCard(){
  const secondCard = document.getElementById('second-card')
  secondCard.innerHTML = `
    <div class="card-header">
      <h4>Llena los nombres de vales perpetuos</h4>
    </div>  
      <div class="card-body">
        <form id="fill-perpetual-vouchers-form" >
        </form>   
    </div>>`

    const fillPerpetualVouchersForm = document.getElementById('fill-perpetual-vouchers-form')
    
    fillPerpetualVouchersForm.addEventListener('submit', (e) => {
      e.preventDefault()
    
      
      
    })
  
  secondCard.classList.add('show')
}

function loadSendEmailCard(lotId){
  const secondCard = document.getElementById('second-card')
  secondCard.innerHTML = `
    <div class="card-header">
      <h4>Envío por correo electrónico</h4>
    </div>  
    <div id="send-email" class="card-body">
        <div class="mb-4">
          <a target="blank" id="download-link" href=""><i class='ni ni-single-copy-04 text-blue'></i> Ver PDF </a>
        </div>
        <form id="send-email-form">
          <div class="form-group">
            <label for="receiver-email">Correo electrónico</label>
            <input name="receiver-email" id="receiver-email" class="form-control" type="email" placeholder="example@email.com" required style="max-width: 100ch"/>
            <div class="invalid-feedback">No es un correo electrónico válido</div>
          </div>  
          <button type="submit" class="btn btn-primary rounded-pill" >Enviar</button>
        </form>   
    </div>`
  
  secondCard.classList.add('show')

  const loader = getLoader('Enviando correo electrónico', 'loader-email')

  const sendEmailForm = document.getElementById('send-email-form')

  
  sendEmailForm.addEventListener('submit', (e) => {
      e.preventDefault()

      const email = document.getElementById('receiver-email').value

      sendEmailForm.innerHTML += loader
      sendLotFileToEmail(lotId,email)
        .then(data => {
            showToast(data.message || 'Correo electrónico enviado', 'success')
            hideCard()
        })
        .catch(err => {
          showToast(err.message, 'danger')
        })
        .finally(() => {
          sendEmailForm.removeChild(document.getElementById('loader-email'))
        })

    
  })

}

function hideCard(){
  const secondCard = document.getElementById('second-card')
  secondCard.classList.remove('show')
  secondCard.innerHTML = ''
}



function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  const header = type === 'success' ? 'Éxito' : type === 'info' ? 'Aviso' : 'Error';
  // Set the toast classes with Bootstrap
  toast.className = `toast align-items-center text-white bg-${type} border-0 shadow-sm p-2 px-3 m-1`;
  toast.role = 'alert';
  toast.ariaLive = 'assertive';
  toast.ariaAtomic = 'true';
  toast.style.zIndex = '1000';

  // Set the toast content (including a header, body, and close button)
  toast.innerHTML = `
      <div class="toast-header bg-${type} text-white d-flex align-items-center justify-content-between p-1 px-1 shadow-sm">
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
  
  getComedoresClientes(clientId).then(
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
    showToast(`La cantidad no puede ser mayor a ${maxQuantity}`, 'danger')
    return false;
  }


  if (!clientField) {
    showToast('No se tienen clientes registrados', 'danger');
    return false;
  }

  if (!diningRoomField) {
    showToast('No se tienen comedores registrados', 'danger');
    return false;
  }

  return true

}


generateUniqueVouchersForm.addEventListener('submit', (e) => {
  e.preventDefault()

  // Validate if the quantity field is a positive integer and doesn't use the Euler constant
  const data = Object.fromEntries(new FormData(e.target).entries())

  const quantity = Number(data['unique-quantity-field'])
  const uniqueClient = Number(data['unique-client-field'])
  const uniqueDiningRoom = Number(data['unique-dinningroom-field'])

  if (!validateFields(9999, quantity, uniqueClient, uniqueDiningRoom)) return;

  const loader = getLoader('Generando vales', 'loader-unique-vouchers')

  generateUniqueVouchersForm.innerHTML += loader

  
  generateUniqueVoucher(Number(uniqueClientField.value), Number(uniqueDiningRoomField.value), Number(quantity), "UNICO")
  .then(data => {

    loadSendEmailCard(data.lot_id)

    const pdfFile = data.pdf

    let anchor = document.querySelector('a#download-link')

    //Generate an anchor element and add it to the container

    anchor.href = `/static/pdfs${pdfFile}`
    showToast(data.message, 'success')
    
    if (data.email) {
      const input = document.getElementById('receiver-email')
      input.value = data.email
    }

  })
  .catch(err => {
    showToast(err.message, 'danger')
  })
  .finally(() => {
    generateUniqueVouchersForm.removeChild(document.getElementById('loader-unique-vouchers'))
  })
})


generatePerpetualVouchersForm.addEventListener('submit', (e) => {
  e.preventDefault()

  const data = Object.fromEntries(new FormData(e.target).entries())

  const quantity = Number(data['perpetual-quantity-field'])
  const perpetualClient = Number(data['perpetual-client-field'])
  const perpetualDiningRoom = Number(data['perpetual-dinningroom-field'])
    
  if (!validateFields(99, quantity, perpetualClientField, perpetualDiningRoomField)) return;
  
 
  const loader = getLoader('Generando vales', 'loader-perpetual-vouchers')

  generatePerpetualVouchersForm.innerHTML += loader

  generatePerpetualVoucher(perpetualClient, perpetualDiningRoom, quantity)
    .then(data => {
      showToast(data.message, 'success')
      loadPerpetualVouchersTable(data.vouchers, data.email, data.lot)
    })
    .catch(err => {
      showToast(err.message, 'danger')
    })
    .finally(() => {
      generatePerpetualVouchersForm.removeChild(document.getElementById('loader-perpetual-vouchers'))
    })

  


})


voucherGeneratorTabs.addEventListener('click', () => {
  hideCard()
})