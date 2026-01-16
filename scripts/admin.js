// Accordion Logic
function toggleAccordion(header) {
    const item = header.parentElement;
    // Close others
    document.querySelectorAll('.accordion-item').forEach(i => {
        if (i !== item) i.classList.remove('active');
    });
    item.classList.toggle('active');
}

// Global handlers
let triggerEdit;
let triggerDelete;

document.addEventListener('DOMContentLoaded', async () => {

    // --- 1. CONFIGURATION ---
    if (!window.supabaseConfig) {
        alert('Critical Error: Configuration not loaded.');
        return;
    }

    if (typeof supabase === 'undefined') {
        alert('Critical Error: Supabase Library Failed to Load.');
        return;
    }

    const { createClient } = supabase;
    const client = createClient(window.supabaseConfig.url, window.supabaseConfig.key);

    // --- 2. AUTH CHECK (SECURE) ---
    const { data: { session } } = await client.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    // Fix: Logout listener attached securely
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            logoutBtn.textContent = 'Signing out...';
            logoutBtn.disabled = true;
            await client.auth.signOut();
            window.location.href = 'login.html';
        });
    }

    // --- 3. DASHBOARD LOGIC ---
    initDashboard();

    const form = document.getElementById('rates-form');
    const statusMsg = document.getElementById('status-message');

    async function initDashboard() {
        showStatus('Fetching current rates...', 'neutral');
        const { data, error } = await client.from('rates').select('*');

        if (error) {
            showStatus(`Error Fetching: ${error.message}`, 'error');
            return;
        }

        if (data) {
            data.forEach(rate => {
                // Robust Normalization for Input IDs
                const normalized = rate.metal_type.toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/_/g, '-');

                const input = document.getElementById(`input-${rate.metal_type}`) ||
                    document.getElementById(`input-${normalized}`);

                if (input) {
                    input.value = rate.price;
                } else {
                    console.warn(`No input field found for: ${rate.metal_type}`);
                }
            });
            showStatus('', 'neutral'); // Clear loading msg
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        showStatus('Updating Database...', 'neutral');

        // Values to update
        const updates = [
            { key: 'gold_24k', val: document.getElementById('input-gold-24k').value },
            { key: 'gold_22k', val: document.getElementById('input-gold-22k').value },
            { key: 'silver', val: document.getElementById('input-silver').value }
        ];

        let hasError = false;

        for (const item of updates) {
            // Try to match 'Gold 24k' (exact) OR 'gold_24k' (schema standard)
            const { error } = await client
                .from('rates')
                .update({ price: item.val })
                .ilike('metal_type', item.key.replace(/_/g, '%')); // "gold%24k" matches "Gold 24k" and "gold_24k"

            if (error) {
                console.error(error);
                hasError = true;
                showStatus(`Update Failed: ${error.message}`, 'error');
            }
        }

        if (!hasError) {
            showStatus('Rates Updated Successfully!', 'success');
            setTimeout(() => showStatus('', 'neutral'), 3000);
        }
    });

    // --- 4. PRODUCT CALCULATION LOGIC ---
    const prodMetal = document.getElementById('prod-metal');
    const prodWeight = document.getElementById('prod-weight');
    const prodMC = document.getElementById('prod-mc');
    const prodPrice = document.getElementById('prod-price');

    function calculatePrice() {
        if (!prodPrice) return;

        const metal = prodMetal.value;
        const breakdownEl = document.getElementById('price-breakdown');

        if (metal === 'manual') {
            prodPrice.readOnly = false;
            prodPrice.style.background = 'rgba(255,255,255,0.05)';
            prodPrice.style.cursor = 'text';
            if (breakdownEl) breakdownEl.style.display = 'none';
            return;
        }

        // If utilizing live rate
        prodPrice.readOnly = true;
        prodPrice.style.background = 'rgba(0,0,0,0.3)';
        prodPrice.style.cursor = 'not-allowed';
        if (breakdownEl) breakdownEl.style.display = 'block';

        // Get Live Rate from the inputs on the left
        const rateId = `input-${metal.replace('_', '-')}`; // e.g. input-gold-24k
        const liveRate = parseFloat(document.getElementById(rateId)?.value) || 0;

        const weight = parseFloat(prodWeight.value) || 0;
        const mc = parseFloat(prodMC.value) || 0;

        // FORMULA: (Rate * Weight) + MC + 3% GST
        const metalCost = liveRate * weight;
        const baseTotal = metalCost + mc;
        const gst = baseTotal * 0.03; // 3%
        const finalTotal = baseTotal + gst;

        prodPrice.value = Math.round(finalTotal);

        // Update Breakdown
        if (breakdownEl) {
            document.getElementById('bd-metal').textContent = `₹${Math.round(metalCost).toLocaleString()}`;
            document.getElementById('bd-mc').textContent = `₹${Math.round(mc).toLocaleString()}`;
            document.getElementById('bd-gst').textContent = `₹${Math.round(gst).toLocaleString()}`;
        }
    }

    if (prodMetal && prodWeight && prodMC) {
        [prodMetal, prodWeight, prodMC].forEach(el => {
            el.addEventListener('input', calculatePrice);
            el.addEventListener('change', calculatePrice);
        });
    }

    // --- 5. PRODUCT UPLOAD & UPDATE LOGIC ---
    const prodForm = document.getElementById('product-form');
    const prodStatus = document.getElementById('prod-status');
    let editingProductId = null; // Track if editing
    let allProducts = []; // Store globally for access

    // Function to fetch and render products
    async function fetchProducts() {
        const list = document.getElementById('product-list');
        const { data, error } = await client.from('products').select('*').order('created_at', { ascending: false });

        if (error) {
            list.innerHTML = `<p style="color:red">Error: ${error.message}</p>`;
            return;
        }

        allProducts = data || []; // Update global store

        if (allProducts.length === 0) {
            list.innerHTML = '<p style="text-align:center; color:#888;">No products found.</p>';
            return;
        }

        list.innerHTML = allProducts.map(p => `
            <div class="admin-prod-card">
                <img src="${p.image_url}" class="admin-prod-img">
                <div class="admin-prod-title" title="${p.title}">${p.title}</div>
                <div class="admin-prod-price">₹ ${p.price > 0 ? p.price : 'On Request'}</div>
                <div>
                    <button class="action-btn edit-btn" type="button" onclick="triggerEdit('${p.id}')">Edit</button>
                    <button class="action-btn delete-btn" type="button" onclick="triggerDelete('${p.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    // Assign global handlers
    window.triggerEdit = (id) => {
        const product = allProducts.find(p => p.id === id);
        if (product) loadForEdit(product);
    };

    window.triggerDelete = (id) => deleteProduct(id);

    function loadForEdit(product) {
        console.log('Editing:', product);
        editingProductId = product.id;

        // Open the Upload Accordion
        const uploadAccordion = prodForm.closest('.accordion-item');
        if (uploadAccordion) {
            // If the accordion is not active, find the header and click it.
            if (!uploadAccordion.classList.contains('active')) {
                const header = uploadAccordion.querySelector('.accordion-header');
                if (header) header.click(); // Programmatic click to use the toggle logic
            }
        }

        document.getElementById('prod-title').value = product.title;
        document.getElementById('prod-desc').value = product.description;
        document.getElementById('prod-metal').value = product.metal_type || 'manual';
        document.getElementById('prod-weight').value = product.weight || '';
        document.getElementById('prod-mc').value = product.making_charges || '';
        document.getElementById('prod-size').value = product.size || '';

        calculatePrice();

        prodForm.querySelector('button[type="submit"]').textContent = 'Update Product';
        prodForm.scrollIntoView({ behavior: 'smooth' });
        showProdStatus(`Editing: ${product.title}`, 'neutral');
    }

    async function deleteProduct(id) {
        if (!confirm('Are you sure you want to delete this product?')) return;

        const { error } = await client.from('products').delete().eq('id', id);
        if (error) {
            alert('Delete failed: ' + error.message);
        } else {
            fetchProducts();
        }
    }

    // Initial Fetch
    fetchProducts();

    prodForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showProdStatus(editingProductId ? 'Updating Product...' : 'Uploading Image...', 'neutral');

        const fileFile = document.getElementById('prod-image').files[0];
        const title = document.getElementById('prod-title').value;
        const desc = document.getElementById('prod-desc').value;
        const price = document.getElementById('prod-price').value || 0;

        // Extra fields
        const metal = document.getElementById('prod-metal').value;
        const weight = parseFloat(document.getElementById('prod-weight').value) || 0;
        const mc = parseFloat(document.getElementById('prod-mc').value) || 0;
        const size = document.getElementById('prod-size').value;

        // Validate Image only for NEW products
        if (!editingProductId && !fileFile) {
            showProdStatus('Please select an image', 'error');
            return;
        }

        try {
            let publicUrl = null;

            // 1. Upload Image (Only if selected)
            if (fileFile) {
                const fileName = `${Date.now()}_${fileFile.name.replace(/\s/g, '_')}`;
                const { data: uploadData, error: uploadError } = await client
                    .storage
                    .from('product-images')
                    .upload(fileName, fileFile);

                if (uploadError) throw uploadError;

                const { data: urlData } = client.storage.from('product-images').getPublicUrl(fileName);
                publicUrl = urlData.publicUrl;
            }

            const payload = {
                title: title,
                description: desc,
                price: parseFloat(price),
                metal_type: metal,
                weight: weight,
                making_charges: mc,
                size: size
            };

            if (publicUrl) payload.image_url = publicUrl;

            let dbError;

            if (editingProductId) {
                // UPDATE Existing
                const { error } = await client.from('products').update(payload).eq('id', editingProductId);
                dbError = error;
            } else {
                // INSERT New
                if (!publicUrl) throw new Error("Image required for new products");
                const { error } = await client.from('products').insert([payload]);
                dbError = error;
            }

            if (dbError) throw dbError;

            // Reset
            showProdStatus(editingProductId ? 'Product Updated!' : 'Product Uploaded!', 'success');
            prodForm.reset();
            editingProductId = null;
            prodForm.querySelector('button[type="submit"]').textContent = 'Upload to Gallery';
            setTimeout(() => showProdStatus('', 'neutral'), 3000);

            // Refresh List
            fetchProducts();

        } catch (err) {
            console.error(err);
            showProdStatus(`Action Failed: ${err.message}`, 'error');
        }
    });

    function showProdStatus(msg, type) {
        if (!msg) {
            prodStatus.style.display = 'none';
            return;
        }
        prodStatus.textContent = msg;
        prodStatus.className = 'status-msg';
        if (type === 'success') prodStatus.classList.add('success');
        if (type === 'error') prodStatus.classList.add('error');
        if (type === 'neutral') {
            prodStatus.style.display = 'block';
            prodStatus.style.color = '#fff';
            prodStatus.style.background = 'rgba(255,255,255,0.1)';
        }
    }

    function showStatus(msg, type) {
        if (!msg) {
            statusMsg.style.display = 'none';
            return;
        }
        statusMsg.textContent = msg;
        statusMsg.className = 'status-msg'; // reset
        if (type === 'success') statusMsg.classList.add('success');
        if (type === 'error') statusMsg.classList.add('error');
        if (type === 'neutral') {
            statusMsg.style.display = 'block';
            statusMsg.style.color = '#fff';
            statusMsg.style.background = 'rgba(255,255,255,0.1)';
        }
    }
});
