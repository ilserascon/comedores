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
      const maxPagesToShow = 5; // Show current, 2 before, and 2 after
      let paginationHTML = '';
  
      // Calculate the start and end pages
      const startPage = Math.max(1, currentPage - 2); // 2 pages before the current
      const endPage = Math.min(totalPages, currentPage + 2); // 2 pages after the current
  
      // Add "Previous" button
      if (currentPage > 1) {
          paginationHTML += `
              <li class="page-item">
                  <a class="page-link" href="javascript:void(0);" page-number="${currentPage - 1}">
                      <i class="fas fa-angle-left"></i>
                  </a>
              </li>`;
      }
  
      // Add page links
      for (let i = startPage; i <= endPage; i++) {
          paginationHTML += `
              <li class="page-item ${i === currentPage ? 'active' : ''}" style="z-index: 0;">
                  <a class="page-link" href="javascript:void(0);" page-number="${i}">${i}</a>
              </li>`;
      }
  
      // Add "Next" button
      if (currentPage < totalPages) {
          paginationHTML += `
              <li class="page-item">
                  <a class="page-link" href="javascript:void(0);" page-number="${currentPage + 1}">
                      <i class="fas fa-angle-right"></i>
                  </a>
              </li>`;
      }
  
      pagination.innerHTML = paginationHTML;

      console.log(pagination)
  
      // Add a single event listener to the pagination element
      pagination.addEventListener('click', async function (event) {
        console.log(event)
        console.log(event.target)
          if (event.target.tagName === 'A' && !isFetching) {
              const pageNumber = parseInt(event.target.getAttribute('page-number'), 10);
              if (!isNaN(pageNumber)) {
                  // isFetching = true;
                  console.log(pageNumber)
                  await loadLots(pageNumber, searchLotInput.value, filterVoucherType.value);
                  isFetching = false;
              }
          }
      });
  }

  // Event listeners for filters
  searchLotInput.addEventListener('input', () => loadLots(1, searchLotInput.value, filterVoucherType.value));
  filterVoucherType.addEventListener('change', () => loadLots(1, searchLotInput.value, filterVoucherType.value));

  // Initial load
  loadLots();
});