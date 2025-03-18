document.addEventListener('DOMContentLoaded', () => {
  const voucherTableBody = document.getElementById('voucherTableBody');
  const pagination = document.getElementById('pagination');
  const urlParams = new URLSearchParams(window.location.search);
  const lotId = urlParams.get('lot_id');

  const employeeHeader = document.getElementById('employeeHeader');
  const actionsHeader = document.getElementById('actionsHeader');
  const uniqueLotActions = document.getElementById('uniqueLotActions');
  const downloadVouchersBtn = document.getElementById('downloadVouchersBtn');
  const resendEmailBtn = document.getElementById('resendEmailBtn');

  let isFetching = false;

  async function loadVouchers(page = 1) {
    if (isFetching) return;
    isFetching = true;

    try {
      const response = await fetch(`/get_vouchers_by_lot/?page=${page}&lot_id=${lotId}`);
      const data = await response.json();

      voucherTableBody.innerHTML = '';
      pagination.innerHTML = '';

      // Determinar si el lote es único
      const isUnique = data.vouchers.every(voucher => voucher.voucher_type === 'UNICO');

      // Mostrar u ocultar los botones para lotes únicos
      uniqueLotActions.style.display = isUnique ? 'block' : 'none';

      // Determinar si hay vales perpetuos
      const hasPerpetual = data.vouchers.some(voucher => voucher.voucher_type === 'PERPETUO');

      // Mostrar u ocultar las columnas según el tipo de vale
      employeeHeader.style.display = hasPerpetual ? '' : 'none';
      actionsHeader.style.display = hasPerpetual ? '' : 'none';

      data.vouchers.forEach(voucher => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${voucher.folio}</td>
          <td>${voucher.client}</td>
          <td>${voucher.dining_room}</td>
          ${voucher.voucher_type === 'PERPETUO' ? `<td>${voucher.employee || 'N/A'}</td>` : ''}
          <td>
            <span class="badge badge-dot mr-4">
                <i class="${voucher.status ? 'bg-success' : 'bg-danger'}"></i>
                <span class="status">${voucher.status ? 'Activo' : 'Inactivo'}</span>
            </span>
          </td>
          ${
            voucher.voucher_type === 'PERPETUO'
              ? `<td><a href="/generate_perpetual_voucher_qr/${voucher.id}" class="btn btn-primary btn-sm">Descargar QR</a></td>`
              : ''
          }
        `;
        voucherTableBody.appendChild(row);
      });

      createPagination(page, data.pages);
    } catch (error) {
      console.error('Error al cargar los vales:', error);
    } finally {
      isFetching = false;
    }
  }

  function createPagination(currentPage, totalPages) {
    let paginationHTML = '';
    for (let i = 1; i <= totalPages; i++) {
      paginationHTML += `
        <li class="page-item ${i === currentPage ? 'active' : ''}" style="z-index: 0;">
          <a class="page-link" href="javascript:void(0);" page-number="${i}">${i}</a>
        </li>`;
    }
    pagination.innerHTML = paginationHTML;

    // Agregar un único event listener al contenedor de paginación
    pagination.addEventListener('click', async function (event) {
      if (event.target.tagName === 'A' && !isFetching) {
        const pageNumber = parseInt(event.target.getAttribute('page-number'), 10);
        await loadVouchers(pageNumber);
      }
    });
  }

  // Funcionalidad para descargar vales
  downloadVouchersBtn.addEventListener('click', async () => {
    try {
      const response = await fetch(`/download_vouchers_pdf/?lot_id=${lotId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vales_lote_${lotId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Error al descargar los vales');
      }
    } catch (error) {
      console.error('Error al descargar los vales:', error);
    }
  });

  // Funcionalidad para volver a enviar por correo
  resendEmailBtn.addEventListener('click', async () => {
    try {
      const response = await fetch(`/resend_vouchers_email/?lot_id=${lotId}`, { method: 'POST' });
      if (response.ok) {
        alert('Correo enviado exitosamente');
      } else {
        console.error('Error al enviar el correo');
      }
    } catch (error) {
      console.error('Error al enviar el correo:', error);
    }
  });

  loadVouchers();
});