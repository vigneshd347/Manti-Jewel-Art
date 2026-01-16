// --- 2. HELPERS ---
function setStatus(msg, color) {
    // Optional: Creates a visible banner if it doesn't exist
    let el = document.getElementById('conn-status');
    if (!el) {
        document.body.insertAdjacentHTML('afterbegin', '<div id="conn-status" style="position:fixed; top:0; left:0; width:100%; padding:8px; text-align:center; color:white; font-weight:bold; z-index:9999; display:none;"></div>');
        el = document.getElementById('conn-status');
    }
    // Only show errors/warnings
    if (color === 'red' || color === 'purple') {
        el.style.display = 'block';
        el.style.backgroundColor = color === 'red' ? '#ef4444' : '#8b5cf6';
        el.textContent = msg;
    }
}

function updateRateUI(rate) {
    // Robust normalization: "Gold 24K" -> "gold-24k"
    const normalized = rate.metal_type.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/_/g, '-');

    let element = document.getElementById(`price-${rate.metal_type}`) ||
        document.getElementById(`price-${normalized}`);

    if (element) {
        const formattedPrice = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(rate.price);

        // Flash effect
        if (element.textContent !== formattedPrice && element.textContent !== 'Loading...') {
            const card = element.closest('.rate-card');
            if (card) {
                card.style.borderColor = '#fbbf24';
                setTimeout(() => card.style.borderColor = '', 1000);
            }
        }
        element.textContent = formattedPrice;
    }
}

// --- 3. INIT ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log('App Initializing...');

    // UI Scripts
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

    // Supabase Init
    if (!window.supabaseConfig) {
        setStatus('Critical Error: Configuration not loaded.', 'red');
        return;
    }

    if (typeof supabase === 'undefined') {
        setStatus('Critical Error: Supabase Script Failed to Load.', 'red');
        return;
    }

    const { createClient } = supabase;
    const client = createClient(window.supabaseConfig.url, window.supabaseConfig.key);

    // Fetch Data
    try {
        const { data, error } = await client.from('rates').select('*');

        if (error) {
            console.error(error);
            setStatus(`Connection Error: ${error.message}`, 'red');
            return;
        }

        if (!data || data.length === 0) {
            setStatus('Connected, but Database is Empty.', 'purple');
            return;
        }

        data.forEach(rate => updateRateUI(rate));

        // Realtime
        client.channel('rates').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rates' }, payload => {
            updateRateUI(payload.new);
        }).subscribe();

    } catch (err) {
        console.error(err);
        setStatus(`Unexpected Error: ${err.message}`, 'red');
    }
});
