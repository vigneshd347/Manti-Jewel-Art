if (typeof supabase === 'undefined') {
    document.body.innerHTML = '<h3 style="color:white;text-align:center">Error: Supabase failed to load.</h3>';
} else {
    if (!window.supabaseConfig) {
        document.body.innerHTML = '<h3 style="color:white;text-align:center">Error: Config failed to load.</h3>';
    } else {
        const client = supabase.createClient(window.supabaseConfig.url, window.supabaseConfig.key);

        // Redirect if already logged in
        client.auth.getSession().then(({ data: { session } }) => {
            if (session) window.location.href = 'admin.html';
        });

        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const errorEl = document.getElementById('error-msg');
                const btn = e.target.querySelector('button');

                btn.textContent = 'Signing in...';
                btn.disabled = true;
                errorEl.style.display = 'none';

                const { data, error } = await client.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (error) {
                    errorEl.textContent = error.message;
                    errorEl.style.display = 'block';
                    btn.textContent = 'Sign In';
                    btn.disabled = false;
                } else {
                    window.location.href = 'admin.html';
                }
            });
        }
    }
}
