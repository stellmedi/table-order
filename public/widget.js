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
    .tf-widget-tabs {
      display: flex;
      border-bottom: 1px solid #eee;
      background: #f8f8f8;
    }
    .tf-widget-tab {
      flex: 1;
      padding: 12px;
      border: none;
      background: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: #666;
      transition: all 0.2s;
    }
    .tf-widget-tab.active {
      color: ${config.buttonColor};
      border-bottom: 2px solid ${config.buttonColor};
      background: white;
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
    /* Category Tiles */
    .tf-widget-categories {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .tf-widget-category-tile {
      background: linear-gradient(135deg, ${config.buttonColor}22 0%, ${config.buttonColor}11 100%);
      border: 1px solid ${config.buttonColor}33;
      border-radius: 12px;
      padding: 20px 16px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
    }
    .tf-widget-category-tile:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border-color: ${config.buttonColor};
    }
    .tf-widget-category-name {
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
    }
    .tf-widget-category-count {
      font-size: 12px;
      color: #666;
    }
    .tf-widget-back-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: none;
      border: none;
      cursor: pointer;
      color: ${config.buttonColor};
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 16px;
      padding: 0;
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
    .tf-widget-item-options {
      font-size: 11px;
      color: #888;
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
    .tf-widget-order-type {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    .tf-widget-order-type-btn {
      flex: 1;
      padding: 10px;
      border: 2px solid #ddd;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .tf-widget-order-type-btn.active {
      border-color: ${config.buttonColor};
      background: ${config.buttonColor}11;
      color: ${config.buttonColor};
    }
    .tf-widget-order-type-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .tf-widget-customer-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;
    }
    .tf-widget-input {
      padding: 10px 14px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
      width: 100%;
      box-sizing: border-box;
    }
    .tf-widget-input:focus {
      outline: none;
      border-color: ${config.buttonColor};
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
    .tf-widget-total-row.discount {
      color: #22c55e;
    }
    .tf-widget-total-row.tax {
      color: #666;
      font-size: 13px;
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
      margin: 0 0 12px;
    }
    .tf-widget-success-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 20px;
    }
    .tf-widget-download-btn {
      padding: 12px 20px;
      background: #333;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
    }
    .tf-widget-error {
      background: #fee2e2;
      color: #b91c1c;
      padding: 10px 14px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
    }
    .tf-widget-zone-error {
      background: #fef3c7;
      color: #92400e;
      padding: 10px 14px;
      border-radius: 8px;
      margin-bottom: 12px;
      font-size: 13px;
    }
    .tf-widget-zone-info {
      background: #d1fae5;
      color: #065f46;
      padding: 10px 14px;
      border-radius: 8px;
      margin-bottom: 12px;
      font-size: 13px;
    }
    /* Booking Form */
    .tf-widget-booking-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .tf-widget-form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .tf-widget-form-group label {
      font-size: 13px;
      font-weight: 500;
      color: #333;
    }
    .tf-widget-select {
      padding: 10px 14px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
      background: white;
      cursor: pointer;
    }
    .tf-widget-select:focus {
      outline: none;
      border-color: ${config.buttonColor};
    }
    @media (max-width: 500px) {
      .tf-widget-modal {
        max-width: 100%;
      }
      .tf-widget-categories {
        grid-template-columns: 1fr;
      }
    }
  `;
  document.head.appendChild(styles);

  // State
  let restaurant = null;
  let menus = [];
  let discounts = [];
  let settings = null;
  let taxes = [];
  let tables = [];
  let cart = {};
  let cartItems = []; // items with variations/addons
  let couponCode = '';
  let appliedDiscount = null;
  let isOpen = false;
  let isLoading = true;
  let orderPlaced = false;
  let orderDetails = null;
  let bookingPlaced = false;
  let bookingDetails = null;
  let error = null;
  let activeTab = 'order'; // 'order' | 'booking'
  let selectedCategory = null; // for category tile navigation
  let orderType = 'pickup'; // 'dine-in' | 'pickup' | 'delivery'
  let customerName = '';
  let customerPhone = '';
  let deliveryAddress = '';
  let deliveryPinCode = '';
  let selectedZone = null;
  // Booking form state
  let bookingTableId = '';
  let bookingDate = '';
  let bookingTime = '';
  let bookingName = '';
  let bookingPhone = '';

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
  const apiUrl = `https://hannairmzwhlurkwydph.supabase.co/functions/v1`;

  async function fetchRestaurant() {
    try {
      const res = await fetch(`${apiUrl}/public-restaurant?slug=${encodeURIComponent(config.slug)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      restaurant = data.restaurant;
      menus = data.menus || [];
      discounts = data.discounts || [];
      settings = data.settings || null;
      taxes = data.taxes || [];
      tables = data.tables || [];
      isLoading = false;
      
      // Set default order type based on settings
      if (settings) {
        if (settings.pickup_enabled) orderType = 'pickup';
        else if (settings.delivery_enabled) orderType = 'delivery';
        else orderType = 'dine-in';
      }
      
      render();
    } catch (err) {
      error = err.message;
      isLoading = false;
      render();
    }
  }

  async function placeOrder() {
    const items = [];
    
    // Simple cart items
    Object.entries(cart).forEach(([id, qty]) => {
      if (qty > 0) {
        items.push({
          menu_item_id: id,
          quantity: qty
        });
      }
    });
    
    // Items with variations/addons
    cartItems.forEach(item => {
      items.push({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        variation_id: item.variation_id,
        addon_ids: item.addon_ids
      });
    });

    if (items.length === 0) return;

    // Calculate delivery fee
    let deliveryFee = 0;
    if (orderType === 'delivery') {
      deliveryFee = selectedZone ? selectedZone.fee : (settings?.delivery_charge || 0);
    }

    try {
      const res = await fetch(`${apiUrl}/public-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          items,
          coupon_code: couponCode || undefined,
          customer_name: customerName || undefined,
          customer_phone: customerPhone || undefined,
          order_type: orderType,
          delivery_address: orderType === 'delivery' ? `${deliveryAddress} - ${deliveryPinCode}` : undefined,
          delivery_fee: deliveryFee,
          source: 'widget'
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      orderPlaced = true;
      orderDetails = data;
      cart = {};
      cartItems = [];
      couponCode = '';
      updateBadge();
      render();
    } catch (err) {
      error = err.message;
      render();
    }
  }

  async function placeBooking() {
    if (!bookingTableId || !bookingDate || !bookingTime || !bookingName || !bookingPhone) {
      error = 'Please fill in all booking details';
      render();
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/public-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          table_id: bookingTableId,
          customer_name: bookingName,
          customer_phone: bookingPhone,
          booking_date: bookingDate,
          booking_time: bookingTime
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      bookingPlaced = true;
      bookingDetails = data.booking;
      bookingTableId = '';
      bookingDate = '';
      bookingTime = '';
      bookingName = '';
      bookingPhone = '';
      error = null;
      render();
    } catch (err) {
      error = err.message;
      render();
    }
  }

  function getCartTotal() {
    let subtotal = 0;
    
    // Simple cart items
    menus.forEach(menu => {
      (menu.menu_items || []).forEach(item => {
        if (cart[item.id]) {
          subtotal += parseFloat(item.price) * cart[item.id];
        }
      });
    });
    
    // Items with variations/addons
    cartItems.forEach(item => {
      subtotal += item.total * item.quantity;
    });
    
    return subtotal;
  }

  function calculateDiscount(subtotal) {
    if (!couponCode) return 0;
    const discount = discounts.find(d => d.coupon_code && d.coupon_code.toUpperCase() === couponCode.toUpperCase());
    if (!discount) return 0;
    appliedDiscount = discount;
    if (discount.value_type === 'percentage') {
      return (subtotal * parseFloat(discount.value)) / 100;
    }
    return Math.min(parseFloat(discount.value), subtotal);
  }

  function calculateTaxes(afterDiscount) {
    if (!taxes || taxes.length === 0 || settings?.tax_included_in_price) return [];
    return taxes.map(tax => ({
      name: tax.name,
      rate: parseFloat(tax.rate),
      amount: afterDiscount * (parseFloat(tax.rate) / 100)
    }));
  }

  function getDeliveryFee() {
    if (orderType !== 'delivery') return 0;
    if (selectedZone) return selectedZone.fee;
    return settings?.delivery_charge || 0;
  }

  function validateDeliveryZone() {
    if (!deliveryPinCode || !settings?.delivery_zones || settings.delivery_zones.length === 0) {
      selectedZone = null;
      return true; // No zone validation required
    }
    
    // Check if pin code matches any zone
    const zones = settings.delivery_zones;
    for (const zone of zones) {
      if (zone.pin_codes && zone.pin_codes.includes(deliveryPinCode)) {
        selectedZone = zone;
        return true;
      }
    }
    
    // If zones exist but pin code doesn't match any, check if zones have pin codes
    const hasZonesWithPinCodes = zones.some(z => z.pin_codes && z.pin_codes.length > 0);
    if (hasZonesWithPinCodes) {
      selectedZone = null;
      return false;
    }
    
    // No pin code based zones, use default
    selectedZone = null;
    return true;
  }

  function updateBadge() {
    const simpleCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
    const complexCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const count = simpleCount + complexCount;
    const badge = button.querySelector('.tf-widget-badge');
    if (count > 0) {
      badge.style.display = 'inline';
      badge.textContent = count;
    } else {
      badge.style.display = 'none';
    }
  }

  function downloadReceipt() {
    if (!orderDetails) return;
    
    const receiptWindow = window.open('', '_blank');
    const subtotal = orderDetails.subtotal || 0;
    const discount = orderDetails.discount_applied || 0;
    const taxAmount = orderDetails.tax_amount || 0;
    const deliveryFee = orderDetails.delivery_fee || 0;
    const total = orderDetails.total || 0;
    const taxBreakdown = orderDetails.tax_breakdown || [];
    
    const itemsHtml = (orderDetails.items || []).map(item => `
      <tr>
        <td style="padding: 8px 0;">${item.quantity}x ${item.name}</td>
        <td style="padding: 8px 0; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');
    
    const taxHtml = taxBreakdown.map(tax => `
      <tr>
        <td style="padding: 4px 0; color: #666;">${tax.name} (${tax.rate}%)</td>
        <td style="padding: 4px 0; text-align: right; color: #666;">$${tax.amount.toFixed(2)}</td>
      </tr>
    `).join('');
    
    receiptWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order Receipt - ${restaurant.name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 400px; margin: 0 auto; }
          h1 { font-size: 24px; margin-bottom: 8px; }
          .meta { color: #666; font-size: 14px; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; }
          .total-row { font-weight: bold; font-size: 18px; border-top: 2px solid #333; }
          .discount { color: #22c55e; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>${restaurant.name}</h1>
        <p class="meta">
          Order #${orderDetails.order_number || ''}<br>
          ${new Date().toLocaleString()}<br>
          ${orderDetails.order_type === 'delivery' ? 'Delivery' : orderDetails.order_type === 'dine-in' ? 'Dine-in' : 'Pickup'}
        </p>
        
        <table>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <hr style="margin: 16px 0; border: none; border-top: 1px solid #eee;">
        
        <table>
          <tr>
            <td>Subtotal</td>
            <td style="text-align: right;">$${subtotal.toFixed(2)}</td>
          </tr>
          ${discount > 0 ? `
          <tr class="discount">
            <td>Discount</td>
            <td style="text-align: right;">-$${discount.toFixed(2)}</td>
          </tr>
          ` : ''}
          ${taxHtml}
          ${deliveryFee > 0 ? `
          <tr>
            <td>Delivery Fee</td>
            <td style="text-align: right;">$${deliveryFee.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr class="total-row">
            <td style="padding-top: 12px;">Total</td>
            <td style="padding-top: 12px; text-align: right;">$${total.toFixed(2)}</td>
          </tr>
        </table>
        
        <p style="text-align: center; margin-top: 32px; color: #666; font-size: 14px;">
          Thank you for your order!
        </p>
        
        <button onclick="window.print()" style="width: 100%; padding: 12px; margin-top: 20px; background: #333; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
          Print Receipt
        </button>
      </body>
      </html>
    `);
    receiptWindow.document.close();
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
      attachCloseHandler();
      return;
    }
    
    if (error && !restaurant) {
      modal.innerHTML = `
        <div class="tf-widget-header">
          <h2>Error</h2>
          <button class="tf-widget-close">&times;</button>
        </div>
        <div class="tf-widget-content">
          <div class="tf-widget-error">${error}</div>
        </div>
      `;
      attachCloseHandler();
      return;
    }

    // Order success screen
    if (orderPlaced) {
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
            <p style="font-size: 13px;">
              ${orderType === 'delivery' ? 'Your order will be delivered soon!' : orderType === 'dine-in' ? 'Your order will be served at your table.' : 'Please pick up your order when ready.'}
            </p>
            <div class="tf-widget-success-actions">
              <button class="tf-widget-download-btn" id="tf-download-receipt">Download Receipt</button>
              <button class="tf-widget-order-btn" id="tf-new-order">Place Another Order</button>
            </div>
          </div>
        </div>
      `;
      attachCloseHandler();
      modal.querySelector('#tf-download-receipt')?.addEventListener('click', downloadReceipt);
      modal.querySelector('#tf-new-order')?.addEventListener('click', () => {
        orderPlaced = false;
        orderDetails = null;
        error = null;
        render();
      });
      return;
    }

    // Booking success screen
    if (bookingPlaced) {
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
            <h3>Booking Confirmed!</h3>
            <p>Table: ${bookingDetails?.table_name || ''}</p>
            <p>${bookingDetails?.booking_date || ''} at ${bookingDetails?.booking_time || ''}</p>
            <p style="font-size: 13px;">Status: Pending confirmation</p>
            <div class="tf-widget-success-actions">
              <button class="tf-widget-order-btn" id="tf-new-booking">Book Another Table</button>
            </div>
          </div>
        </div>
      `;
      attachCloseHandler();
      modal.querySelector('#tf-new-booking')?.addEventListener('click', () => {
        bookingPlaced = false;
        bookingDetails = null;
        error = null;
        render();
      });
      return;
    }

    // Main UI with tabs
    const hasTables = tables && tables.length > 0;
    const tabsHtml = hasTables ? `
      <div class="tf-widget-tabs">
        <button class="tf-widget-tab ${activeTab === 'order' ? 'active' : ''}" data-tab="order">Order Food</button>
        <button class="tf-widget-tab ${activeTab === 'booking' ? 'active' : ''}" data-tab="booking">Book Table</button>
      </div>
    ` : '';

    if (activeTab === 'booking' && hasTables) {
      renderBookingTab(tabsHtml);
      return;
    }

    // Order tab
    const subtotal = getCartTotal();
    const discount = calculateDiscount(subtotal);
    const afterDiscount = Math.max(0, subtotal - discount);
    const taxBreakdown = calculateTaxes(afterDiscount);
    const totalTax = taxBreakdown.reduce((sum, t) => sum + t.amount, 0);
    const deliveryFee = getDeliveryFee();
    const total = afterDiscount + totalTax + deliveryFee;
    const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0) + cartItems.reduce((sum, i) => sum + i.quantity, 0);

    const isDeliveryValid = orderType !== 'delivery' || validateDeliveryZone();
    const minOrderMet = !settings?.minimum_order_value || subtotal >= settings.minimum_order_value;

    let contentHtml = '';
    
    if (selectedCategory) {
      // Show items in selected category
      const menu = menus.find(m => m.id === selectedCategory);
      if (menu) {
        contentHtml = `
          <button class="tf-widget-back-btn" id="tf-back-categories">
            ← Back to categories
          </button>
          <div class="tf-widget-menu-title">${menu.name}</div>
        `;
        (menu.menu_items || []).forEach(item => {
          const qty = cart[item.id] || 0;
          const hasOptions = (item.variations && item.variations.length > 0) || (item.addons && item.addons.length > 0);
          contentHtml += `
            <div class="tf-widget-item">
              <div class="tf-widget-item-info">
                <div class="tf-widget-item-name">${item.name}</div>
                ${hasOptions ? '<div class="tf-widget-item-options">Options available</div>' : ''}
                <div class="tf-widget-item-price">$${parseFloat(item.price).toFixed(2)}</div>
              </div>
              <div class="tf-widget-item-actions">
                ${qty > 0 && !hasOptions ? `
                  <button class="tf-widget-qty-btn" data-action="remove" data-id="${item.id}">−</button>
                  <span class="tf-widget-qty">${qty}</span>
                  <button class="tf-widget-qty-btn" data-action="add" data-id="${item.id}">+</button>
                ` : `
                  <button class="tf-widget-add-btn" data-action="add" data-id="${item.id}" ${hasOptions ? 'data-has-options="true"' : ''}>Add</button>
                `}
              </div>
            </div>
          `;
        });
      }
    } else {
      // Show category tiles
      contentHtml = '<div class="tf-widget-categories">';
      menus.forEach(menu => {
        const itemCount = (menu.menu_items || []).length;
        if (itemCount > 0) {
          contentHtml += `
            <div class="tf-widget-category-tile" data-category="${menu.id}">
              <div class="tf-widget-category-name">${menu.name}</div>
              <div class="tf-widget-category-count">${itemCount} item${itemCount !== 1 ? 's' : ''}</div>
            </div>
          `;
        }
      });
      contentHtml += '</div>';
      
      if (menus.length === 0 || menus.every(m => (m.menu_items || []).length === 0)) {
        contentHtml = '<p style="text-align: center; color: #666;">No menu items available.</p>';
      }
    }

    // Order type buttons
    const pickupEnabled = settings?.pickup_enabled !== false;
    const deliveryEnabled = settings?.delivery_enabled === true;
    
    let orderTypeHtml = '<div class="tf-widget-order-type">';
    orderTypeHtml += `
      <button class="tf-widget-order-type-btn ${orderType === 'dine-in' ? 'active' : ''}" data-order-type="dine-in">
        <span>🍽️</span>
        <span>Dine-in</span>
      </button>
    `;
    if (pickupEnabled) {
      orderTypeHtml += `
        <button class="tf-widget-order-type-btn ${orderType === 'pickup' ? 'active' : ''}" data-order-type="pickup">
          <span>🛍️</span>
          <span>Pickup</span>
        </button>
      `;
    }
    if (deliveryEnabled) {
      orderTypeHtml += `
        <button class="tf-widget-order-type-btn ${orderType === 'delivery' ? 'active' : ''}" data-order-type="delivery">
          <span>🚚</span>
          <span>Delivery</span>
        </button>
      `;
    }
    orderTypeHtml += '</div>';

    // Customer info and delivery address
    let customerHtml = `
      <div class="tf-widget-customer-info">
        <input type="text" class="tf-widget-input" id="tf-customer-name" placeholder="Your name" value="${customerName}">
        <input type="tel" class="tf-widget-input" id="tf-customer-phone" placeholder="Phone number" value="${customerPhone}">
    `;
    
    if (orderType === 'delivery') {
      customerHtml += `
        <input type="text" class="tf-widget-input" id="tf-delivery-address" placeholder="Delivery address" value="${deliveryAddress}">
        <input type="text" class="tf-widget-input" id="tf-delivery-pincode" placeholder="Pin code" value="${deliveryPinCode}">
      `;
      
      if (deliveryPinCode && !isDeliveryValid) {
        customerHtml += `<div class="tf-widget-zone-error">Delivery not available for this pin code</div>`;
      } else if (selectedZone) {
        customerHtml += `<div class="tf-widget-zone-info">Delivery to ${selectedZone.name} - Fee: $${selectedZone.fee.toFixed(2)}</div>`;
      }
    }
    customerHtml += '</div>';

    // Tax breakdown
    let taxHtml = '';
    taxBreakdown.forEach(tax => {
      taxHtml += `
        <div class="tf-widget-total-row tax">
          <span>${tax.name} (${tax.rate}%)</span>
          <span>$${tax.amount.toFixed(2)}</span>
        </div>
      `;
    });

    const canPlaceOrder = cartCount > 0 && isDeliveryValid && minOrderMet;

    modal.innerHTML = `
      <div class="tf-widget-header">
        <h2>${restaurant.name}</h2>
        <button class="tf-widget-close">&times;</button>
      </div>
      ${tabsHtml}
      <div class="tf-widget-content">
        ${error ? `<div class="tf-widget-error">${error}</div>` : ''}
        ${contentHtml}
      </div>
      <div class="tf-widget-footer">
        ${orderTypeHtml}
        ${customerHtml}
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
            <div class="tf-widget-total-row discount">
              <span>Discount</span>
              <span>-$${discount.toFixed(2)}</span>
            </div>
          ` : ''}
          ${taxHtml}
          ${deliveryFee > 0 ? `
            <div class="tf-widget-total-row">
              <span>Delivery Fee</span>
              <span>$${deliveryFee.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="tf-widget-total-row grand">
            <span>Total</span>
            <span>$${total.toFixed(2)}</span>
          </div>
        </div>
        ${!minOrderMet && subtotal > 0 ? `<p style="font-size: 12px; color: #b91c1c; margin-bottom: 8px;">Minimum order: $${settings.minimum_order_value.toFixed(2)}</p>` : ''}
        <button class="tf-widget-order-btn" id="tf-place-order" ${!canPlaceOrder ? 'disabled' : ''}>
          Place Order ${cartCount > 0 ? `(${cartCount} items)` : ''}
        </button>
      </div>
    `;

    attachEventListeners();
  }

  function renderBookingTab(tabsHtml) {
    const today = new Date().toISOString().split('T')[0];
    
    let tablesHtml = '<option value="">Select a table</option>';
    tables.forEach(table => {
      tablesHtml += `<option value="${table.id}" ${bookingTableId === table.id ? 'selected' : ''}>${table.name_or_number} (seats ${table.capacity})</option>`;
    });

    // Generate time slots
    let timeSlotsHtml = '<option value="">Select a time</option>';
    for (let h = 10; h <= 21; h++) {
      for (let m = 0; m < 60; m += 30) {
        const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        timeSlotsHtml += `<option value="${time}" ${bookingTime === time ? 'selected' : ''}>${time}</option>`;
      }
    }

    modal.innerHTML = `
      <div class="tf-widget-header">
        <h2>${restaurant.name}</h2>
        <button class="tf-widget-close">&times;</button>
      </div>
      ${tabsHtml}
      <div class="tf-widget-content">
        ${error ? `<div class="tf-widget-error">${error}</div>` : ''}
        <div class="tf-widget-booking-form">
          <div class="tf-widget-form-group">
            <label>Select Table</label>
            <select class="tf-widget-select" id="tf-booking-table">${tablesHtml}</select>
          </div>
          <div class="tf-widget-form-group">
            <label>Date</label>
            <input type="date" class="tf-widget-input" id="tf-booking-date" min="${today}" value="${bookingDate}">
          </div>
          <div class="tf-widget-form-group">
            <label>Time</label>
            <select class="tf-widget-select" id="tf-booking-time">${timeSlotsHtml}</select>
          </div>
          <div class="tf-widget-form-group">
            <label>Your Name</label>
            <input type="text" class="tf-widget-input" id="tf-booking-name" placeholder="Enter your name" value="${bookingName}">
          </div>
          <div class="tf-widget-form-group">
            <label>Phone Number</label>
            <input type="tel" class="tf-widget-input" id="tf-booking-phone" placeholder="Enter phone number" value="${bookingPhone}">
          </div>
        </div>
      </div>
      <div class="tf-widget-footer">
        <button class="tf-widget-order-btn" id="tf-place-booking">Book Table</button>
      </div>
    `;

    attachCloseHandler();
    attachTabHandlers();

    // Booking form handlers
    modal.querySelector('#tf-booking-table')?.addEventListener('change', (e) => {
      bookingTableId = e.target.value;
    });
    modal.querySelector('#tf-booking-date')?.addEventListener('change', (e) => {
      bookingDate = e.target.value;
    });
    modal.querySelector('#tf-booking-time')?.addEventListener('change', (e) => {
      bookingTime = e.target.value;
    });
    modal.querySelector('#tf-booking-name')?.addEventListener('input', (e) => {
      bookingName = e.target.value;
    });
    modal.querySelector('#tf-booking-phone')?.addEventListener('input', (e) => {
      bookingPhone = e.target.value;
    });
    modal.querySelector('#tf-place-booking')?.addEventListener('click', placeBooking);
  }

  function attachCloseHandler() {
    modal.querySelector('.tf-widget-close')?.addEventListener('click', closeWidget);
  }

  function attachTabHandlers() {
    modal.querySelectorAll('.tf-widget-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeTab = tab.getAttribute('data-tab');
        error = null;
        render();
      });
    });
  }

  function attachEventListeners() {
    attachCloseHandler();
    attachTabHandlers();

    // Category tile clicks
    modal.querySelectorAll('.tf-widget-category-tile').forEach(tile => {
      tile.addEventListener('click', () => {
        selectedCategory = tile.getAttribute('data-category');
        render();
      });
    });

    // Back to categories
    modal.querySelector('#tf-back-categories')?.addEventListener('click', () => {
      selectedCategory = null;
      render();
    });
    
    // Add/remove items
    modal.querySelectorAll('[data-action="add"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const hasOptions = btn.getAttribute('data-has-options') === 'true';
        
        if (hasOptions) {
          // For items with options, just add simple for now (full modal would need more work)
          // In a real implementation, you'd show a modal for options
        }
        
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

    // Order type buttons
    modal.querySelectorAll('.tf-widget-order-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        orderType = btn.getAttribute('data-order-type');
        selectedZone = null;
        render();
      });
    });

    // Customer info inputs
    modal.querySelector('#tf-customer-name')?.addEventListener('input', (e) => {
      customerName = e.target.value;
    });
    modal.querySelector('#tf-customer-phone')?.addEventListener('input', (e) => {
      customerPhone = e.target.value;
    });
    modal.querySelector('#tf-delivery-address')?.addEventListener('input', (e) => {
      deliveryAddress = e.target.value;
    });
    modal.querySelector('#tf-delivery-pincode')?.addEventListener('input', (e) => {
      deliveryPinCode = e.target.value;
      validateDeliveryZone();
      render();
    });

    // Coupon
    const couponInput = modal.querySelector('#tf-coupon-input');
    couponInput?.addEventListener('input', (e) => {
      couponCode = e.target.value;
    });

    modal.querySelector('#tf-apply-coupon')?.addEventListener('click', () => {
      appliedDiscount = null;
      error = null;
      if (couponCode) {
        const found = discounts.find(d => d.coupon_code && d.coupon_code.toUpperCase() === couponCode.toUpperCase());
        if (!found) {
          error = 'Invalid coupon code';
        }
      }
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
    bookingPlaced = false;
    bookingDetails = null;
    error = null;
    selectedCategory = null;
    render();
  };

  // Event listeners
  button.addEventListener('click', openWidget);
  overlay.addEventListener('click', closeWidget);

  // Initialize
  fetchRestaurant();
})();
