const clientField = document.getElementById('client-field')
const dinningRoomField = document.getElementById('dinningroom-field')
const generateBtn = document.getElementById('generate-btn')
const quantityField = document.getElementById('quantity-field')
const generateUniqueVouchersForm = document.getElementById('generate-unique-vouchers')

function triggerInvalidMessage(message){
  alert(message)
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
      triggerInvalidMessage('No clients found.')
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
    triggerInvalidMessage('Please enter a valid positive integer for quantity without using the Euler constant.');
    return;
  }


  if (!clientField.value) {
    triggerInvalidMessage('Please select a client.');
    return
  }

  if (!dinningRoomField.value) {
    triggerInvalidMessage('Please select a dining room.');
    return
  }

  generateUniqueVoucher(Number(clientField.value), Number(dinningRoomField.value), Number(quantity)).then(data => {
    console.log(data)
  })

})



