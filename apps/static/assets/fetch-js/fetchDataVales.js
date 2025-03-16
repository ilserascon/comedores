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