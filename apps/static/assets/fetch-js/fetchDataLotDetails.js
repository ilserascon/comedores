  // Modificar el fetchVouchersByLot para aceptar el folio como parámetro
  async function fetchVouchersByLot(page, lotId, folio) {
    const url = new URL('/get_vouchers_by_lot/', window.location.origin);
    url.searchParams.set('page', page);
    url.searchParams.set('lot_id', lotId);
    if (folio) {
      url.searchParams.set('folio', folio);  // Añadir el filtro de folio si está presente
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('Error al cargar los vales');
    return await response.json();
  }

  async function fetchPerpetualVoucher(voucherFolio) {
    const response = await fetch(`/search_pdf_qr_perpetual_voucher_and_generate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voucher_folio: voucherFolio })
    });
    if (!response.ok) throw new Error('Error al descargar los vales');
    return await response.json();
  }

  async function sendLotEmail(lotId, email) {
    const response = await sendLotFileToEmail(lotId, email);
    return response;
  }

  async function changeVoucherStatus(voucherId, status) {
    try {
        const response = await fetch(`/change_voucher_status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                voucher_id: voucherId,
                status: status
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al cambiar el estado del vale');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        throw new Error(error.message || 'Error al cambiar el estado del vale');
    }
  }
