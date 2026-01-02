(function() {
  'use strict';

  // Find the script tag to get configuration
  const scriptTag = document.currentScript || document.querySelector('script[data-restaurant-slug]');
  if (!scriptTag) {
    console.error('TableFlow Widget: Missing script tag with data-restaurant-slug');
    return;
  }

  const config = {
    slug: scriptTag.getAttribute('data-restaurant-slug'),
    buttonColor: scriptTag.getAttribute('data-button-color') || '#E07A5F',
    buttonPosition: scriptTag.getAttribute('data-button-position') || 'bottom-right',
    buttonText: scriptTag.getAttribute('data-button-text') || 'Order Now',
    apiBase: scriptTag.src.replace('/widget.js', '')
  };

  if (!config.slug) {
    console.error('TableFlow Widget: data-restaurant-slug is required');
    return;
  }

  // Inject styles
  const styles = document.createElement('style');
  styles.textContent = `
    .tf-widget-button {
      position: fixed;
      ${config.buttonPosition === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
      bottom: 20px;
      background: ${config.buttonColor};
      color: white;
      border: none;
      padding: 14px 24px;
      border-radius: 50px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .tf-widget-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 25px rgba(0,0,0,0.25);
    }
    .tf-widget-button svg {
      width: 20px;
      height: 20px;
    }
    .tf-widget-badge {
      background: white;
      color: ${config.buttonColor};
      font-size: 12px;
      font-weight: bold;
      padding: 2px 6px;
      border-radius: 10px;
      margin-left: 4px;
    }
    .tf-widget-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 9999999;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s, visibility 0.3s;
    }
    .tf-widget-overlay.open {
      opacity: 1;
      visibility: visible;
    }
    .tf-widget-modal {
      position: fixed;
      top: 0;
      right: -450px;
      width: 100%;
      max-width: 450px;
      height: 100%;
      background: white;
      z-index: 10000000;
      transition: right 0.3s ease;
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
    }
    .tf-widget-modal.open {
      right: 0;
    }
    .tf-widget-header {
      padding: 20px;
      background: ${config.buttonColor};
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .tf-widget-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
    .tf-widget-close {
      background: none;
      border: none;
      color: white;
      font-size: 28px;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }
    .tf-widget-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      min-height: 0;
    }
    .tf-widget-loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }
    .tf-widget-menu-section {
      margin-bottom: 24px;
    }
    .tf-widget-menu-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #333;
    }
    .tf-widget-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #eee;
      word-break: break-word;
    }
    .tf-widget-item-info {
      flex: 1;
    }
    .tf-widget-item-name {
      font-weight: 500;
      color: #333;
      margin-bottom: 4px;
    }
    .tf-widget-item-desc {
      font-size: 13px;
      color: #666;
      margin-bottom: 4px;
    }
    .tf-widget-item-price {
      font-weight: 600;
      color: ${config.buttonColor};
    }
    .tf-widget-item-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .tf-widget-qty-btn {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 1px solid #ddd;
      background: white;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .tf-widget-qty-btn:hover {
      background: #f5f5f5;
    }
    .tf-widget-qty {
      min-width: 24px;
      text-align: center;
      font-weight: 600;
    }
    .tf-widget-add-btn {
      background: ${config.buttonColor};
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 20px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }
    .tf-widget-add-btn:hover {
      opacity: 0.9;
    }
    .tf-widget-footer {
      padding: 20px;
      background: #f8f8f8;
      border-top: 1px solid #eee;
      flex-shrink: 0;
    }
    .tf-widget-coupon {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    .tf-widget-coupon input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
    }
    .tf-widget-coupon button {
      padding: 10px 16px;
      background: #333;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
    }
    .tf-widget-totals {
      margin-bottom: 16px;
    }
    .tf-widget-total-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 14px;
    }
    .tf-widget-total-row.grand {
      font-size: 18px;
      font-weight: 600;
      padding-top: 8px;
      border-top: 1px solid #ddd;
      margin-top: 8px;
    }
    .tf-widget-order-btn {
      width: 100%;
      padding: 14px;
      background: ${config.buttonColor};
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
    }
    .tf-widget-order-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .tf-widget-order-btn:hover:not(:disabled) {
      opacity: 0.9;
    }
    .tf-widget-success {
      text-align: center;
      padding: 40px 20px;
    }
    .tf-widget-success-icon {
      width: 80px;
      height: 80px;
      background: #4CAF50;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }
    .tf-widget-success-icon svg {
      width: 40px;
      height: 40px;
      color: white;
    }
    .tf-widget-success h3 {
      margin: 0 0 10px;
      font-size: 24px;
    }
    .tf-widget-success p {
      color: #666;
      margin: 0 0 20px;
    }
    .tf-widget-error {
      background: #fee2e2;
      color: #b91c1c;
      padding: 10px 14px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
    }
    @media (max-width: 500px) {
      .tf-widget-modal {
        max-width: 100%;
      }
    }
  `;
  document.head.appendChild(styles);

  // State
  let restaurant = null;
  let menus = [];
  let discounts = [];
  let cart = {};
  let couponCode = '';
  let appliedDiscount = null;
  let isOpen = false;
  let isLoading = true;
  let orderPlaced = false;
  let orderDetails = null;
  let error = null;

  // Create elements
  const button = document.createElement('button');
  button.className = 'tf-widget-button';
  button.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="m1 1 4 4 2.5 13h13l2-8H5.5"/>
    </svg>
    ${config.buttonText}
    <span class="tf-widget-badge" style="display:none">0</span>
  `;
  document.body.appendChild(button);

  const overlay = document.createElement('div');
  overlay.className = 'tf-widget-overlay';
  document.body.appendChild(overlay);

  const modal = document.createElement('div');
  modal.className = 'tf-widget-modal';
  document.body.appendChild(modal);

  // API calls
  const apiUrl = config.apiBase.includes('localhost') 
    ? `https://hannairmzwhlurkwydph.supabase.co/functions/v1`
    : `https://hannairmzwhlurkwydph.supabase.co/functions/v1`;

  async function fetchRestaurant() {
    try {
      const res = await fetch(`${apiUrl}/public-restaurant?slug=${encodeURIComponent(config.slug)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      restaurant = data.restaurant;
      menus = data.menus || [];
      discounts = data.discounts || [];
      isLoading = false;
      render();
    } catch (err) {
      error = err.message;
      isLoading = false;
      render();
    }
  }

  async function placeOrder() {
    const items = Object.entries(cart).map(([id, qty]) => ({
      menu_item_id: id,
      quantity: qty
    }));

    if (items.length === 0) return;

    try {
      const res = await fetch(`${apiUrl}/public-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          items,
          coupon_code: couponCode || undefined,
          source: 'widget'
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      orderPlaced = true;
      orderDetails = data;
      cart = {};
      couponCode = '';
      updateBadge();
      render();
    } catch (err) {
      error = err.message;
      render();
    }
  }

  function getCartTotal() {
    let subtotal = 0;
    menus.forEach(menu => {
      (menu.menu_items || []).forEach(item => {
        if (cart[item.id]) {
          subtotal += parseFloat(item.price) * cart[item.id];
        }
      });
    });
    return subtotal;
  }

  function calculateDiscount(subtotal) {
    if (!couponCode) return 0;
    const discount = discounts.find(d => d.coupon_code === couponCode.toUpperCase());
    if (!discount) return 0;
    appliedDiscount = discount;
    if (discount.value_type === 'percentage') {
      return (subtotal * parseFloat(discount.value)) / 100;
    }
    return parseFloat(discount.value);
  }

  function updateBadge() {
    const count = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
    const badge = button.querySelector('.tf-widget-badge');
    if (count > 0) {
      badge.style.display = 'inline';
      badge.textContent = count;
    } else {
      badge.style.display = 'none';
    }
  }

  function render() {
    if (isLoading) {
      modal.innerHTML = `
        <div class="tf-widget-header">
          <h2>Loading...</h2>
          <button class="tf-widget-close">&times;</button>
        </div>
        <div class="tf-widget-content">
          <div class="tf-widget-loading">Loading menu...</div>
        </div>
      `;
    } else if (error && !restaurant) {
      modal.innerHTML = `
        <div class="tf-widget-header">
          <h2>Error</h2>
          <button class="tf-widget-close">&times;</button>
        </div>
        <div class="tf-widget-content">
          <div class="tf-widget-error">${error}</div>
        </div>
      `;
    } else if (orderPlaced) {
      modal.innerHTML = `
        <div class="tf-widget-header">
          <h2>${restaurant.name}</h2>
          <button class="tf-widget-close">&times;</button>
        </div>
        <div class="tf-widget-content">
          <div class="tf-widget-success">
            <div class="tf-widget-success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
            </div>
            <h3>Order Placed!</h3>
            <p>Order #${orderDetails?.order_number || ''}</p>
            <p>Total: $${(orderDetails?.total || 0).toFixed(2)}</p>
            <button class="tf-widget-order-btn" onclick="window.tfWidgetNewOrder()">Place Another Order</button>
          </div>
        </div>
      `;
    } else {
      const subtotal = getCartTotal();
      const discount = calculateDiscount(subtotal);
      const total = Math.max(0, subtotal - discount);
      const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

      let menuHtml = '';
      menus.forEach(menu => {
        if (!menu.menu_items || menu.menu_items.length === 0) return;
        menuHtml += `<div class="tf-widget-menu-section">
          <div class="tf-widget-menu-title">${menu.name}</div>`;
        menu.menu_items.forEach(item => {
          const qty = cart[item.id] || 0;
          menuHtml += `
            <div class="tf-widget-item">
              <div class="tf-widget-item-info">
                <div class="tf-widget-item-name">${item.name}</div>
                ${item.description ? `<div class="tf-widget-item-desc">${item.description}</div>` : ''}
                <div class="tf-widget-item-price">$${parseFloat(item.price).toFixed(2)}</div>
              </div>
              <div class="tf-widget-item-actions">
                ${qty > 0 ? `
                  <button class="tf-widget-qty-btn" data-action="remove" data-id="${item.id}">−</button>
                  <span class="tf-widget-qty">${qty}</span>
                  <button class="tf-widget-qty-btn" data-action="add" data-id="${item.id}">+</button>
                ` : `
                  <button class="tf-widget-add-btn" data-action="add" data-id="${item.id}">Add</button>
                `}
              </div>
            </div>
          `;
        });
        menuHtml += '</div>';
      });

      modal.innerHTML = `
        <div class="tf-widget-header">
          <h2>${restaurant.name}</h2>
          <button class="tf-widget-close">&times;</button>
        </div>
        <div class="tf-widget-content">
          ${error ? `<div class="tf-widget-error">${error}</div>` : ''}
          ${menuHtml || '<p>No menu items available.</p>'}
        </div>
        <div class="tf-widget-footer">
          <div class="tf-widget-coupon">
            <input type="text" placeholder="Coupon code" value="${couponCode}" id="tf-coupon-input">
            <button id="tf-apply-coupon">Apply</button>
          </div>
          <div class="tf-widget-totals">
            <div class="tf-widget-total-row">
              <span>Subtotal</span>
              <span>$${subtotal.toFixed(2)}</span>
            </div>
            ${discount > 0 ? `
              <div class="tf-widget-total-row" style="color: green">
                <span>Discount</span>
                <span>-$${discount.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="tf-widget-total-row grand">
              <span>Total</span>
              <span>$${total.toFixed(2)}</span>
            </div>
          </div>
          <button class="tf-widget-order-btn" id="tf-place-order" ${cartCount === 0 ? 'disabled' : ''}>
            Place Order ${cartCount > 0 ? `(${cartCount} items)` : ''}
          </button>
        </div>
      `;
    }

    // Attach event listeners
    modal.querySelector('.tf-widget-close')?.addEventListener('click', closeWidget);
    
    modal.querySelectorAll('[data-action="add"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        cart[id] = (cart[id] || 0) + 1;
        error = null;
        updateBadge();
        render();
      });
    });

    modal.querySelectorAll('[data-action="remove"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (cart[id] > 1) {
          cart[id]--;
        } else {
          delete cart[id];
        }
        error = null;
        updateBadge();
        render();
      });
    });

    const couponInput = modal.querySelector('#tf-coupon-input');
    couponInput?.addEventListener('input', (e) => {
      couponCode = e.target.value;
    });

    modal.querySelector('#tf-apply-coupon')?.addEventListener('click', () => {
      appliedDiscount = null;
      render();
    });

    modal.querySelector('#tf-place-order')?.addEventListener('click', placeOrder);
  }

  function openWidget() {
    isOpen = true;
    overlay.classList.add('open');
    modal.classList.add('open');
    if (!restaurant && isLoading) {
      fetchRestaurant();
    }
  }

  function closeWidget() {
    isOpen = false;
    overlay.classList.remove('open');
    modal.classList.remove('open');
  }

  window.tfWidgetNewOrder = function() {
    orderPlaced = false;
    orderDetails = null;
    error = null;
    render();
  };

  // Event listeners
  button.addEventListener('click', openWidget);
  overlay.addEventListener('click', closeWidget);

  // Initialize
  fetchRestaurant();
})();
