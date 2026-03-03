// js/return-page.js - Gestión profesional de devoluciones (con API real)

window.InitManager.register('ReturnPage', function () {
  console.log('Inicializando página de devoluciones');

  loadEligibleOrders();
  setupReturnEvents();

}, []);


// ===============================
// VARIABLES
// ===============================
let selectedOrderId = null;
let selectedProductId = null;


// ===============================
// OBTENER PEDIDOS DESDE API
// ===============================
async function loadEligibleOrders() {
  const container = document.getElementById('returnsContainer');
  if (!container) return;

  const token = localStorage.getItem(window.TOKEN_KEY || 'svl_token');

  if (!token) {
    container.innerHTML = `
      <p>Debes iniciar sesión para ver tus pedidos.</p>
    `;
    return;
  }

  try {
      const response = await fetch(`${window.API_URL}/orders/eligible-for-return`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener pedidos');
    }

    const orders = await response.json();

    if (!orders.length) {
      container.innerHTML = `
        <p>No tienes pedidos disponibles para devolución.</p>
      `;
      return;
    }

    renderOrders(orders);

  } catch (error) {
    console.error(error);
    container.innerHTML = `
      <p>Error cargando pedidos.</p>
    `;
  }
}


// ===============================
// RENDER PEDIDOS
// ===============================
function renderOrders(orders) {
  const container = document.getElementById('returnsContainer');

  container.innerHTML = `
    <div class="returns-orders">
      ${orders.map(order => `
        <div class="order-card" data-order-id="${order.id}">
          <h3>Pedido ${order.id}</h3>
          <p><strong>Fecha:</strong> ${order.date}</p>

          <div class="order-items">
            ${order.items.map(item => `
              <label>
                <input type="radio"
                  name="returnItem-${order.id}"
                  value="${item.id}"
                  onchange="selectProduct('${order.id}', '${item.id}')">
                ${item.name}
              </label>
            `).join('')}
          </div>

          <button onclick="startReturnProcess('${order.id}')">
            Iniciar devolución
          </button>
        </div>
      `).join('')}
    </div>
  `;
}


// ===============================
// SELECCIÓN
// ===============================
window.selectProduct = function (orderId, productId) {
  selectedOrderId = orderId;
  selectedProductId = productId;
};


// ===============================
// MOSTRAR FORMULARIO
// ===============================
window.startReturnProcess = function (orderId) {
  if (!selectedProductId) {
    alert('Selecciona un producto.');
    return;
  }

  const formContainer = document.getElementById('returnFormContainer');
  if (formContainer) formContainer.style.display = 'block';
  const ordersDiv = document.querySelector('.returns-orders');
  if (ordersDiv) ordersDiv.style.display = 'none';
};


// ===============================
// CANCELAR
// ===============================
window.cancelReturn = function () {
  const formContainer = document.getElementById('returnFormContainer');
  if (formContainer) formContainer.style.display = 'none';
  const ordersDiv = document.querySelector('.returns-orders');
  if (ordersDiv) ordersDiv.style.display = 'block';

  selectedOrderId = null;
  selectedProductId = null;
};


// ===============================
// EVENTOS
// ===============================
function setupReturnEvents() {
  const form = document.getElementById('returnForm');

  if (form) {
    form.addEventListener('submit', handleReturnSubmit);
  }
}


// ===============================
// ENVIAR DEVOLUCIÓN A API
// ===============================
async function handleReturnSubmit(e) {
  e.preventDefault();

  const token = localStorage.getItem(window.TOKEN_KEY || 'svl_token');

  if (!token) {
    alert('Sesión expirada.');
    return;
  }

  const formData = new FormData(e.target);

  const payload = {
    orderId: selectedOrderId,
    productId: selectedProductId,
    reason: formData.get('returnReason'),
    type: formData.get('returnType'),
    comments: document.getElementById('returnComments')?.value || ''
  };

  try {
    const response = await fetch(`${window.API_URL}/returns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error al enviar devolución');
    }

    showReturnStatus(data.message || 'Solicitud enviada correctamente', 'success');

  } catch (error) {
    console.error(error);
    showReturnStatus(error.message, 'error');
  }
}


// ===============================
// MENSAJE VISUAL
// ===============================
function showReturnStatus(message, type) {
  const form = document.getElementById('returnForm');
  if (!form) return;

  const status = document.createElement('div');
  status.className = `return-status ${type}`;
  status.textContent = message;

  form.appendChild(status);

  setTimeout(() => status.remove(), 4000);
}
