document.addEventListener('DOMContentLoaded', async () => {
    // --- CONFIG ---
    if (!window.supabaseConfig) {
        document.getElementById('gallery-container').innerHTML = '<p style="color:red;text-align:center;">Error: Config not loaded.</p>';
        return;
    }

    if (typeof supabase === 'undefined') {
        document.getElementById('gallery-container').innerHTML = '<p style="color:red;text-align:center;">Error: Supabase not loaded.</p>';
        return;
    }

    const { createClient } = supabase;
    const client = createClient(window.supabaseConfig.url, window.supabaseConfig.key);
    const container = document.getElementById('gallery-container');

    // --- FETCH ---
    try {
        const { data, error } = await client
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<p class="loading-spinner">No products found. Check back soon!</p>';
            return;
        }

        // Render
        container.innerHTML = data.map(product => {
            const priceDisplay = product.price > 0
                ? `₹ ${product.price.toLocaleString('en-IN')}`
                : 'Price on Request';

            return `
                <div class="product-card glass-card">
                    <div class="product-img-wrapper">
                        <img src="${product.image_url}" alt="${product.title}" loading="lazy">
                    </div>
                    <div class="product-info">
                        <h3 class="product-title">${product.title}</h3>
                        
                        <div style="display:flex; gap:0.5rem; margin-bottom:0.5rem; flex-wrap:wrap;">
                            ${product.weight ? `<span style="background:rgba(255,255,255,0.1); padding:2px 8px; border-radius:4px; font-size:0.8rem;">${product.weight}g</span>` : ''}
                            ${product.size ? `<span style="background:rgba(255,255,255,0.1); padding:2px 8px; border-radius:4px; font-size:0.8rem;">${product.size}</span>` : ''}
                        </div>

                        <p class="product-desc">${product.description || ''}</p>
                        <div class="product-price">${priceDisplay}</div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error(err);
        container.innerHTML = `<p style="color:red;text-align:center;">Failed to load gallery: ${err.message}</p>`;
    }

    // Mobile Menu
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = mobileToggle.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });
    }
});
