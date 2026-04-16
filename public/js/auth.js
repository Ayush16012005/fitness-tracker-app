const API_URL = '/api';

class AuthService {
    static async signup(email, password, fullName) {
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, fullName })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    }

    static async login(email, password) {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok || data.error) throw new Error(data.error || 'Login failed');
        
        if (data.data && data.data.access_token) {
            localStorage.setItem('supabase_token', data.data.access_token);
            if (data.data.user && data.data.user.id) {
                localStorage.setItem('user_id', data.data.user.id);
            }
            localStorage.setItem('user_email', email);
        } else if (data.error) {
            throw new Error(data.error);
        } else {
            throw new Error('Login failed - no token received');
        }
        return data;
    }

    static async logout() {
        localStorage.removeItem('supabase_token');
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_id');
        window.location.replace('/login');
    }

    static isLoggedIn() {
        return !!localStorage.getItem('supabase_token');
    }

    static getToken() {
        return localStorage.getItem('supabase_token');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginInfoEl = document.getElementById('login-info');
    const params = new URLSearchParams(window.location.search);
    if (loginInfoEl && params.get('registered') === '1') {
        loginInfoEl.textContent = 'Signup successful. Please confirm your email, then log in.';
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorEl = document.getElementById('login-error');
            const btn = document.getElementById('login-btn');
            
            if (btn) btn.disabled = true;
            if (errorEl) errorEl.textContent = '';
            
            try {
                const result = await AuthService.login(email, password);
                window.location.href = '/dashboard';
            } catch (err) {
                if (errorEl) {
                    const msg = (err.message || '').toLowerCase().includes('email not confirmed')
                        ? 'Please confirm your email first, then log in.'
                        : err.message || 'Login failed. Check your credentials.';
                    errorEl.textContent = msg;
                }
            } finally {
                if (btn) btn.disabled = false;
            }
        });
    }

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('fullname').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const errorEl = document.getElementById('signup-error');
            const btn = document.getElementById('signup-btn');
            
            if (password !== confirmPassword) {
                if (errorEl) errorEl.textContent = 'Passwords do not match';
                return;
            }
            
            if (btn) btn.disabled = true;
            if (errorEl) errorEl.textContent = '';
            
            try {
                await AuthService.signup(email, password, fullName);
                window.location.href = '/login?registered=1';
            } catch (err) {
                if (errorEl) errorEl.textContent = err.message || 'Signup failed';
            } finally {
                if (btn) btn.disabled = false;
            }
        });
    }

    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('toggle-password');
    if (passwordInput && togglePasswordBtn) {
        const icon = togglePasswordBtn.querySelector('.material-symbols-outlined') || togglePasswordBtn;
        togglePasswordBtn.addEventListener('click', () => {
            const show = passwordInput.type === 'password';
            passwordInput.type = show ? 'text' : 'password';
            if (icon) icon.textContent = show ? 'visibility_off' : 'visibility';
        });
    }
    const confirmPasswordInput = document.getElementById('confirm-password');
    const confirmToggleBtn = document.getElementById('toggle-confirm-password');
    if (!confirmToggleBtn && confirmPasswordInput) {
        const confirmWrapper = confirmPasswordInput.parentElement;
        if (confirmWrapper) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.id = 'toggle-confirm-password';
            btn.className = 'absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white';
            btn.innerHTML = '<span class="material-symbols-outlined">visibility</span>';
            confirmWrapper.style.position = 'relative';
            confirmWrapper.appendChild(btn);
            btn.addEventListener('click', () => {
                const show = confirmPasswordInput.type === 'password';
                confirmPasswordInput.type = show ? 'text' : 'password';
                btn.querySelector('.material-symbols-outlined').textContent = show ? 'visibility_off' : 'visibility';
            });
        }
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            AuthService.logout();
        });
    }
});
