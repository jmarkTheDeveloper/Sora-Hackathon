// ---------------- AUTHENTICATION VIEW HANDLERS ----------------

function switchAuthView(view) {
    const loginView = document.getElementById('login-view');
    const signupView = document.getElementById('signup-view');
    
    if (view === 'login') {
        signupView.classList.remove('active');
        setTimeout(() => {
            signupView.style.display = 'none';
            loginView.style.display = 'flex';
            setTimeout(() => loginView.classList.add('active'), 50);
        }, 400);
    } else {
        loginView.classList.remove('active');
        setTimeout(() => {
            loginView.style.display = 'none';
            signupView.style.display = 'flex';
            setTimeout(() => signupView.classList.add('active'), 50);
        }, 400);
    }
}

function togglePasswordVisibility(fieldId, btnEl) {
    const pwInput = document.getElementById(fieldId);
    const icon = btnEl.querySelector('i');
    
    if (pwInput.type === 'password') {
        pwInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        pwInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// ---------------- LOGIN & SIGNUP FORMS ----------------

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    const loginRemember = document.getElementById('login-remember');
    const loginHeaderText = document.getElementById('login-header-text');
    const signupHeaderText = document.getElementById('signup-header-text');

    // Reset header style on input typing
    const resetHeaderStyle = (headerEl, defaultText) => {
        headerEl.innerText = defaultText;
        headerEl.style.color = '';
        headerEl.style.fontSize = '';
    };

    loginEmailInput.addEventListener('input', () => resetHeaderStyle(loginHeaderText, 'Unlock Your\nFinancial Clarity'));
    loginPasswordInput.addEventListener('input', () => resetHeaderStyle(loginHeaderText, 'Unlock Your\nFinancial Clarity'));

    // Load credentials if "Remember Info" is stored
    const remembered = localStorage.getItem('sora_remembered');
    if (remembered) {
        try {
            const parsed = JSON.parse(remembered);
            loginEmailInput.value = parsed.email || '';
            loginPasswordInput.value = parsed.password || '';
            loginRemember.checked = true;
        } catch (e) {
            localStorage.removeItem('sora_remembered');
        }
    }

    // Handle Login Submit
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = loginEmailInput.value.trim();
        const password = loginPasswordInput.value.trim();
        
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: json = JSON.stringify({ email, password })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                loginHeaderText.innerText = data.error || "Invalid email or password.";
                loginHeaderText.style.color = 'var(--danger-color)';
                loginHeaderText.style.fontSize = '18px';
                return;
            }
            
            // Handle Remember Preference
            if (loginRemember.checked) {
                localStorage.setItem('sora_remembered', JSON.stringify({ email, password }));
            } else {
                localStorage.removeItem('sora_remembered');
            }
            
            // Set session and transition
            localStorage.setItem('sora_session_user', JSON.stringify(data));
            enterDashboard(data);
            
        } catch (err) {
            console.error("Login request failed:", err);
            loginHeaderText.innerText = "Error connecting to server.";
            loginHeaderText.style.color = 'var(--danger-color)';
            loginHeaderText.style.fontSize = '18px';
        }
    });

    // Handle Signup Submit
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const firstName = document.getElementById('signup-firstname').value.trim();
        const lastName = document.getElementById('signup-lastname').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value.trim();
        
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, email, password })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                signupHeaderText.innerText = data.error || "Failed to create account.";
                signupHeaderText.style.color = 'var(--danger-color)';
                signupHeaderText.style.fontSize = '18px';
                return;
            }
            
            // Auto-login new user
            localStorage.setItem('sora_session_user', JSON.stringify(data));
            enterDashboard(data);
            
        } catch (err) {
            console.error("Signup request failed:", err);
            signupHeaderText.innerText = "Error connecting to server.";
            signupHeaderText.style.color = 'var(--danger-color)';
            signupHeaderText.style.fontSize = '18px';
        }
    });
});
