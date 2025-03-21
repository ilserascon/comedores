document.addEventListener('DOMContentLoaded', () => {
  const lotTableBody = document.getElementById('lotTableBody');
  const pagination = document.getElementById('pagination');
  const searchLotInput = document.getElementById('searchLotInput');
  const filterVoucherType = document.getElementById('filterVoucherType');

  let isFetching = false;

  async function loadLots(page = 1, lotId = '', voucherType = '') {
    if (isFetching) return;
    isFetching = true;

    try {
      const url = `/get_voucher_lots/?page=${page}&lot_id=${lotId}&voucher_type=${voucherType}`;
      const response = await fetch(url);
      const data = await response.json();

      lotTableBody.innerHTML = '';
      pagination.innerHTML = '';

      // Render table rows
      data.lots.forEach(lot => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${lot.id}</td>
          <td>${lot.voucher_type}</td>
          <td>${lot.quantity}</td>
          <td>${lot.client}</td>
          <td>${lot.dining_room}</td>
          <td>${lot.email}</td>
          <td>${lot.created_at}</td>
          <td>${lot.created_by}</td>
          <td><a href="/lot_details.html?lot_id=${lot.id}" class="btn btn-primary btn-sm">Ver Detalles</a></td>
        `;
        lotTableBody.appendChild(row);
      });

      // Create pagination
      createPagination(page, data.pages);
    } catch (error) {
      showToast('Error al cargar los lotes', 'danger');
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

    // Add a single event listener to the pagination element
    pagination.addEventListener('click', async function (event) {
      if (event.target.tagName === 'A' && !isFetching) {
        const pageNumber = parseInt(event.target.getAttribute('page-number'), 10);
        await loadLots(pageNumber, searchLotInput.value, filterVoucherType.value);
      }
    });
  }

  // Event listeners for filters
  searchLotInput.addEventListener('input', () => loadLots(1, searchLotInput.value, filterVoucherType.value));
  filterVoucherType.addEventListener('change', () => loadLots(1, searchLotInput.value, filterVoucherType.value));

  // Initial load
  loadLots();
});