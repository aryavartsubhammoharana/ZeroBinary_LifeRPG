let currentMode = 'login';
const baseUrl = '';
let isUsernameAvailable = false;
let usernameDebounceTimer = null;

function updatePasswordMatchStatus() {
    const p1 = document.getElementById('reg-password').value;
    const p2 = document.getElementById('reg-confirm-password').value;
    const indicator = document.getElementById('bitwise-indicator');
    if (!indicator) return;

    if (!p1 && !p2) {
        indicator.textContent = '';
        indicator.className = 'bitwise-status';
        return;
    }

    if (!p2) {
        indicator.textContent = 'Enter confirmation password';
        indicator.className = 'bitwise-status';
        return;
    }

    if (p1 === p2) {
        indicator.textContent = '✓ Passwords match';
        indicator.className = 'bitwise-status match';
    } else {
        indicator.textContent = '✗ Passwords do not match';
        indicator.className = 'bitwise-status mismatch';
    }
}

async function checkUsernameAvailability() {
    const usernameInput = document.getElementById('reg-username');
    const indicator = document.getElementById('username-indicator');
    if (!usernameInput || !indicator) return;

    const username = usernameInput.value.trim();
    if (!username) {
        indicator.textContent = '';
        indicator.className = 'username-status';
        isUsernameAvailable = false;
        return;
    }

    indicator.textContent = 'Checking availability...';
    indicator.className = 'username-status';

    try {
        const res = await fetch(`${baseUrl}/check-username?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        if (data.available) {
            indicator.textContent = '✓ Username is available';
            indicator.className = 'username-status available';
            isUsernameAvailable = true;
        } else {
            indicator.textContent = '✗ Username already taken';
            indicator.className = 'username-status taken';
            isUsernameAvailable = false;
        }
    } catch (err) {
        indicator.textContent = '';
        isUsernameAvailable = false;
    }
}

function switchTab(mode) {
    currentMode = mode;

    document.querySelectorAll('.tabs button').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`button[onclick="switchTab('${mode}')"]`).classList.add('active');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (mode === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    }

    document.getElementById('login-error').textContent = '';
    document.getElementById('reg-error').textContent = '';

    const bitwiseIndicator = document.getElementById('bitwise-indicator');
    if (bitwiseIndicator) {
        bitwiseIndicator.textContent = '';
        bitwiseIndicator.className = 'bitwise-status';
    }

    const usernameIndicator = document.getElementById('username-indicator');
    if (usernameIndicator) {
        usernameIndicator.textContent = '';
        usernameIndicator.className = 'username-status';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    const errorEl = document.getElementById('reg-error');

    errorEl.textContent = '';

    await checkUsernameAvailability();
    if (!isUsernameAvailable) {
        errorEl.textContent = 'Username already taken or invalid!';
        return;
    }

    if (password !== confirmPassword) {
        errorEl.textContent = 'Passwords do not match!';
        return;
    }

    try {
        const res = await fetch(`${baseUrl}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                email: email,
                username: username,
                password: password,
                confirm_password: confirmPassword
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Registration failed');

        alert('Registration successful! Please login.');
        document.getElementById('register-form').reset();
        updatePasswordMatchStatus();

        const usernameIndicator = document.getElementById('username-indicator');
        if (usernameIndicator) {
            usernameIndicator.textContent = '';
            usernameIndicator.className = 'username-status';
        }

        switchTab('login');
        document.getElementById('login-identifier').value = email;
    } catch (err) {
        errorEl.textContent = err.message;
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const identifier = document.getElementById('login-identifier').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    errorEl.textContent = '';

    try {
        const formData = new URLSearchParams();
        formData.append('username', identifier);
        formData.append('password', password);

        const res = await fetch(`${baseUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Login failed');

        checkAuth();
    } catch (err) {
        errorEl.textContent = err.message;
    }
}

async function tryRefresh() {
    const res = await fetch(`${baseUrl}/refresh`, { method: 'POST' });
    return res.ok;
}

async function fetchWithRefresh(url, options = {}) {
    let res = await fetch(url, options);
    if (res.status === 401) {
        const refreshed = await tryRefresh();
        if (refreshed) {
            res = await fetch(url, options);
        }
    }
    return res;
}

async function checkAuth() {
    try {
        let res = await fetch(`${baseUrl}/me`);
        if (res.status === 401) {
            const refreshed = await tryRefresh();
            if (refreshed) {
                res = await fetch(`${baseUrl}/me`);
            }
        }
        if (res.ok) {
            const user = await res.json();
            showApp(user);
            fetchItems();
        } else {
            showAuth();
        }
    } catch (err) {
        showAuth();
    }
}

function showAuth() {
    document.getElementById('auth-container').classList.remove('hidden');
    document.getElementById('app-container').classList.add('hidden');
}

function showApp(user) {
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    document.getElementById('user-display').textContent = user.name || user.username || user.email;
    document.getElementById('user-details').textContent = `@${user.username} • ${user.email}`;
}

async function logout() {
    try {
        await fetch(`${baseUrl}/logout`, { method: 'POST' });
    } catch (err) {}
    showAuth();
    document.getElementById('login-form').reset();
    document.getElementById('register-form').reset();
    updatePasswordMatchStatus();

    const usernameIndicator = document.getElementById('username-indicator');
    if (usernameIndicator) {
        usernameIndicator.textContent = '';
        usernameIndicator.className = 'username-status';
    }

    document.getElementById('items-list').innerHTML = '';
}

async function fetchItems() {
    try {
        const res = await fetchWithRefresh(`${baseUrl}/items`);
        if (!res.ok) return;
        const items = await res.json();

        const list = document.getElementById('items-list');
        list.innerHTML = '';
        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.title;
            list.appendChild(li);
        });
    } catch (err) {}
}

async function createItem(e) {
    e.preventDefault();
    const titleInput = document.getElementById('item-title');

    try {
        const res = await fetchWithRefresh(`${baseUrl}/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: titleInput.value })
        });

        if (res.ok) {
            titleInput.value = '';
            fetchItems();
        }
    } catch (err) {}
}

const p1Input = document.getElementById('reg-password');
const p2Input = document.getElementById('reg-confirm-password');
if (p1Input && p2Input) {
    p1Input.addEventListener('input', updatePasswordMatchStatus);
    p2Input.addEventListener('input', updatePasswordMatchStatus);
}

const usernameInput = document.getElementById('reg-username');
if (usernameInput) {
    usernameInput.addEventListener('blur', checkUsernameAvailability);
    usernameInput.addEventListener('change', checkUsernameAvailability);
    usernameInput.addEventListener('input', () => {
        clearTimeout(usernameDebounceTimer);
        usernameDebounceTimer = setTimeout(checkUsernameAvailability, 500);
    });
}

checkAuth();
