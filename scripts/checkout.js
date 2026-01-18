document.addEventListener('DOMContentLoaded', async () => {
    // Load Cart
    const cart = JSON.parse(localStorage.getItem('manti_cart')) || [];
    const total = cart.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

    // Redirect if empty
    if (cart.length === 0) {
        window.location.href = 'cart.html';
        return;
    }

    // Render Summary
    document.getElementById('order-items').innerHTML = cart.map(item => `
        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-size:0.9rem;">
            <span>${item.title}</span>
            <span>₹ ${item.price}</span>
        </div>
    `).join('');
    document.getElementById('order-total').textContent = `₹ ${total}`;

    // Handle Form Submit
    document.getElementById('checkout-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        const address = document.getElementById('address').value;

        // Save Order to Supabase
        const { data: order, error: orderError } = await supabase.from('orders').insert([{
            customer_name: name,
            customer_email: 'manual_order@example.com', // Placeholder
            customer_phone: phone,
            shipping_address: address,
            total_amount: total,
            status: 'pending',
            payment_status: 'manual_verification_pending'
        }]).select().single();

        if (orderError) {
            alert('Order Failed: ' + orderError.message);
            console.error(orderError);
            return;
        }

        // Save Order Items
        const orderItems = cart.map(item => ({
            order_id: order.id,
            product_id: item.id,
            quantity: 1,
            price: item.price
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

        if (itemsError) {
            console.error('Error saving items:', itemsError);
        }

        // Clear Cart & Success
        localStorage.removeItem('manti_cart');
        alert('Order Placed Successfully! We will contact you shortly.');
        window.location.href = 'index.html';
    });
});
