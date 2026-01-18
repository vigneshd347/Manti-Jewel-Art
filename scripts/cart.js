// cart.js - Handles Shopping Cart Logic

// Initialize Cart from LocalStorage
let cart = JSON.parse(localStorage.getItem('manti_cart')) || [];

function updateCartCount() {
    const countEl = document.getElementById('cart-count');
    if(countEl) countEl.textContent = cart.length;
}

// Add to Cart
async function addToCart(productId) {
    // Check if already in cart
    const existing = cart.find(item => item.id === productId);
    if(existing) {
        alert("Product already in cart!");
        return;
    }

    // Fetch product details (we need price/title to save)
    const { data: product, error } = await supabase.from('products').select('*').eq('id', productId).single();
    
    if(error || !product) {
        alert("Error fetching product details.");
        return;
    }

    cart.push({
        id: product.id,
        title: product.title,
        price: product.price,
        image_url: product.image_url
    });

    saveCart();
    alert("Added to Cart!");
    updateCartCount();
}

// Remove from Cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    renderCart(); // Refresh cart page if open
    updateCartCount();
}

function saveCart() {
    localStorage.setItem('manti_cart', JSON.stringify(cart));
}

// Initial Run
updateCartCount();
