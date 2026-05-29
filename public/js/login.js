document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const errorArea = document.getElementById('error-area');
    const tabButtons = document.querySelectorAll('.tab-btn');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const tab = btn.dataset.tab;
            if (tab === 'login') {
                loginForm.classList.add('active');
                registerForm.classList.remove('active');
            } else {
                loginForm.classList.remove('active');
                registerForm.classList.add('active');
            }
            hideError();
        });
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            if (res.ok) {
                window.location.href = '/bmi';
            } else {
                showError(data.errors);
            }
        } catch (err) {
            showError(['通信エラーが発生しました']);
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            if (res.ok) {
                window.location.href = '/bmi';
            } else {
                showError(data.errors);
            }
        } catch (err) {
            showError(['通信エラーが発生しました']);
        }
    });

    function showError(errors) {
        errorArea.style.display = 'block';
        errorArea.innerHTML = errors.map(e => `<p>${e}</p>`).join('');
    }

    function hideError() {
        errorArea.style.display = 'none';
        errorArea.innerHTML = '';
    }

    // Check if already logged in
    fetch('/api/me').then(res => {
        if (res.ok) {
            window.location.href = '/bmi';
        }
    });
});
