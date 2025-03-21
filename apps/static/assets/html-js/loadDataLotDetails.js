document.addEventListener('DOMContentLoaded', () => {
  const voucherTableBody = document.getElementById('voucherTableBody');
  const pagination = document.getElementById('pagination');
  const urlParams = new URLSearchParams(window.location.search);
  const lotId = urlParams.get('lot_id');
  const filterFolioInput = document.getElementById('filterFolioInput'); // Input de filtro por folio

  const employeeHeader = document.getElementById('employeeHeader');
  const actionsHeader = document.getElementById('actionsHeader');
  const lotActions = document.getElementById('lotActions');
  const downloadVouchersBtn = document.getElementById('downloadVouchersBtn');
  const resendEmailBtn = document.getElementById('resendEmailBtn');
  const emailInput = document.getElementById('emailResend');

  let isFetching = false;

  // Actualizar el filtro para que llame a loadVouchers con el valor del folio
  filterFolioInput.addEventListener('input', () => {
    const folio = filterFolioInput.value.trim(); // Obtener el valor del filtro de folio
    loadVouchers(1, folio);  // Llamar a loadVouchers con el folio filtrado
  });
  
  async function loadVouchers(page = 1, folio = '') {
    if (isFetching) return;
    isFetching = true;

    try {
      const data = await fetchVouchersByLot(page, lotId, folio);
      voucherTableBody.innerHTML = '';
      pagination.innerHTML = '';

      const isUnique = data.vouchers.every(voucher => voucher.voucher_type === 'UNICO');

      const hasPerpetual = data.vouchers.some(voucher => voucher.voucher_type === 'PERPETUO');

      const titleElement = document.getElementById('titulo');
      titleElement.textContent = isUnique ? 'Lote de Vales Únicos' : 'Lote de Vales Perpetuos';

      employeeHeader.style.display = hasPerpetual ? '' : 'none';
      actionsHeader.style.display = hasPerpetual ? '' : 'none';

      const email = data.vouchers.some(voucher => voucher.email) ? data.vouchers[0].email : '';
      emailInput.value = email;

      data.vouchers.forEach(voucher => {
        const row = createVoucherRow(voucher);
        voucherTableBody.appendChild(row);
      });

      createPagination(page, data.pages);
    } catch (error) {
      showToast('Error al cargar los vales', 'danger');
    } finally {
      isFetching = false;
    }
  }

  function createVoucherRow(voucher) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${voucher.folio}</td>
      <td>${voucher.client}</td>
      <td>${voucher.dining_room}</td>
      ${voucher.voucher_type === 'PERPETUO' ? `<td><input type="text" id="employeeName-${voucher.folio}" class="form-control w-auto" placeholder="Asigna un Nombre" aria-label="Nombre Empleado" value='${voucher.employee || ''}' oninput="handleEmployeeNameChange('${voucher.folio}', '${voucher.employee || ''}')"></td>` : ''}
      <td>
        <span class="badge badge-dot mr-4">
          <i class="${voucher.status ? 'bg-success' : 'bg-danger'}"></i>
          <span class="status">${voucher.status ? 'Activo' : 'Inactivo'}</span>
        </span>
      </td>
      ${voucher.voucher_type === 'PERPETUO'
        ? `<td>
            <button id='changeEmployeeBtn-${voucher.folio}' onclick="changeEmployeeName(${voucher.id}, '${voucher.folio}')" class="btn btn-primary btn-sm" disabled>Cambiar Nombre</button>
            <button id='changeStatusBtn-${voucher.folio}' onclick="changeVoucherStatusBtn(${voucher.id}, ${voucher.status})" class="btn btn-primary btn-sm">${voucher.status ? 'Deshabilitar' : 'Habilitar'}</button>
            <button onclick="handlePerpetualVoucher('${voucher.folio}')" class="btn btn-primary btn-sm">Descargar Vale</button>
          </td>`
        : ''
      }
    `;
    return row;
  }

  window.changeVoucherStatusBtn = async function (voucher_id, status) {
      try {
          if(status === 0) {
            status = false;
          } else {
            status = true;
          }
          const response = await changeVoucherStatus(voucher_id, !status);
          if (response.message) {
              showToast(`Vale ${status ? 'deshabilitado' : 'habilitado'} exitosamente`, 'success');
              // Actualizar la tabla de vales
              loadVouchers();

          } else {
              showToast(response.error || 'Error al cambiar el estado del vale', 'danger');
          }
      } catch (error) {
          showToast(error.message || 'Error al cambiar el estado del vale', 'danger');
      }
  };

  window.changeEmployeeName = async function (voucher_id, folio) {
    try {
      const inputField = document.getElementById(`employeeName-${folio}`);
      const response = await changeVoucherEmployee(voucher_id, inputField.value);

      if (response.message) {
        showToast('Nombre de empleado actualizado exitosamente', 'success');
        const changeButton = document.getElementById(`changeEmployeeBtn-${folio}`);
        changeButton.disabled = true;
      } else {
        showToast(response.error || 'Error al actualizar el nombre del empleado', 'danger');
      }
    } catch (error) {
      showToast(error.message || 'Error al cambiar el nombre del empleado', 'danger');
    }
  }

  window.handleEmployeeNameChange = function (folio, originalName) {
    const inputField = document.getElementById(`employeeName-${folio}`);
    const changeButton = document.getElementById(`changeEmployeeBtn-${folio}`);

    // Habilitar el botón si el valor del campo es diferente al original
    changeButton.disabled = inputField.value.trim() === originalName.trim();
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

    pagination.addEventListener('click', async function (event) {
      if (event.target.tagName === 'A' && !isFetching) {
        const pageNumber = parseInt(event.target.getAttribute('page-number'), 10);
        await loadVouchers(pageNumber);
      }
    });
  }

  downloadVouchersBtn.addEventListener('click', async () => {
    try {
      const data = await getLotPdf(lotId);
      const a = document.createElement('a');
      a.href = data.pdf;
      a.download = `LOT-${lotId}.pdf`;
      a.click();
    } catch (error) {
      showToast('Error al descargar los vales', 'danger');
    }
  }); 

  window.handlePerpetualVoucher = async function (voucherFolio) {
    try {
      const data = await fetchPerpetualVoucher(voucherFolio);
      const a = document.createElement('a');
      a.href = data.pdf;
      a.download = `qr_${voucherFolio}.pdf`;
      a.click();
    } catch (error) {
      showToast('Error al descargar el vale perpetuo', 'danger');
    }
  }

  resendEmailBtn.addEventListener('click', async () => {
    try {
      await sendLotEmail(parseInt(lotId), emailInput.value);
      showToast('Correo enviado exitosamente', 'success');
    } catch (error) {
      showToast('Error al enviar el correo', 'danger');
    }
  });

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const header = type === 'success' ? 'Éxito' : type === 'info' ? 'Aviso' : 'Error';
    toast.className = `toast align-items-center text-white bg-${type} border-0 shadow-sm p-2 px-3 m-1`;
    toast.role = 'alert';
    toast.ariaLive = 'assertive';
    toast.ariaAtomic = 'true';
    toast.style.zIndex = '1';

    toast.innerHTML = `
      <div class="toast-header bg-${type} text-white d-flex align-items-center justify-content-between p-1 px-1 shadow-sm">
        <strong class="me-auto">${header}</strong>
        <button type="button" class="btn-close btn-close-white right-1" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body p-1 px-1">
        ${message}
      </div>
    `;

    const toastContainer = document.getElementById('toastContainer');
    toastContainer.appendChild(toast);

    const bsToast = new bootstrap.Toast(toast, { delay: 4000 });
    bsToast.show();

    setTimeout(() => {
      toast.remove();
    }, 4000);

    toast.querySelector('.btn-close').addEventListener('click', function () {
      toast.remove();
      bsToast.hide();
    });
  }

  loadVouchers();
});

