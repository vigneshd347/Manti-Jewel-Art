// orders.js - Logic for Admin to View Orders

async function fetchOrders() {
    const list = document.getElementById('orders-list');
    list.innerHTML = '<p style="text-align:center; color:#ccc;">Fetching...</p>';

    const { data: orders, error } = await client
        .from('orders')
        .select(`
            *,
            order_items (
                product_id,
                quantity,
                price
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        list.innerHTML = `<p style="color:red">Error: ${error.message}</p>`;
        return;
    }

    if (!orders || orders.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#888;">No orders found.</p>';
        return;
    }

    list.innerHTML = orders.map(order => `
        <div class="order-card" style="background:rgba(255,255,255,0.05); padding:1rem; border-radius:8px; margin-bottom:1rem; border:1px solid rgba(255,255,255,0.1);">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                <strong style="color:var(--color-accent-gold);">#${order.id.slice(0, 8)}</strong>
                <span class="badge ${order.status === 'pending' ? 'bg-yellow' : 'bg-green'}" style="padding:2px 8px; border-radius:4px; font-size:0.8rem; background:${order.status === 'pending' ? '#eab308' : '#22c55e'}; color:black;">${order.status.toUpperCase()}</span>
            </div>
            <div style="font-size:0.9rem; color:#ddd; margin-bottom:0.5rem;">
                <div><i class="fas fa-user"></i> ${order.customer_name} | <i class="fas fa-phone"></i> ${order.customer_phone}</div>
                <div><i class="fas fa-map-marker-alt"></i> ${order.shipping_address}</div>
            </div>
            <div style="font-weight:bold; margin-bottom:0.5rem;">Total: ₹ ${order.total_amount}</div>
            
            <div style="font-size:0.85rem; color:#aaa; border-top:1px solid rgba(255,255,255,0.1); padding-top:0.5rem;">
                Items: ${order.order_items.length} (Check DB for details)
            </div>
            
            <div style="margin-top:0.5rem;">
                 ${order.status === 'pending' ? `<button onclick="markShipped('${order.id}')" class="btn-sm btn-primary">Mark as Shipped</button>` : ''}
            </div>
        </div>
    `).join('');
}

async function markShipped(orderId) {
    if (!confirm("Mark this order as Shipped?")) return;

    const { error } = await client
        .from('orders')
        .update({ status: 'shipped' })
        .eq('id', orderId);

    if (error) alert("Error: " + error.message);
    else fetchOrders();
}

// Make globally available
window.fetchOrders = fetchOrders;
window.markShipped = markShipped;
