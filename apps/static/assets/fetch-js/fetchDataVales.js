async function generateUniqueVoucher(clientId, diningRoomId, quantity) {
  try {
      const response = await fetch(`/generate_unique_voucher`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            client_id: clientId,
            dining_room_id: diningRoomId,
            quantity: quantity
          })
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al generar vales únicos');
      }

      const data = await response.json();
      return data;
  } catch (error) {
      console.error('Error:', error.message);
      throw new Error(error.message || 'Error al generar vales únicos');
  }
}

async function generatePerpetualVoucher(clientId, diningRoomId, quantity, employees) {
    try {
        const response = await fetch(`/generate_perpetual_voucher`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              client_id: clientId,
              dining_room_id: diningRoomId,
              quantity: quantity,
              employees: employees
            })
        });
  
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al generar vales perpetuos');
        }
  
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error.message);
        throw new Error(error.message || 'Error al generar vales perpetuos');
    }
}

async function sendLotFileToEmail(lotId, email) {
    try {
        const response = await fetch(`/send_lot_file_email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              lot_id: lotId,
              email: email
            })
        });
  
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al enviar el archivo de lote por correo electrónico');
        }
  
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error.message);
        throw new Error(error.message || 'Error al enviar el archivo de lote por correo electrónico');
    }
}

async function generatePerpetualVoucherQR(voucherId) {
    try {
        const response = await fetch(`/generate_perpetual_voucher_qr`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                voucher_id: voucherId
            })
        });
  
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al generar QR');
        }
  
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error.message);
        throw new Error(error.message || 'Error al generar QR');
    }
}