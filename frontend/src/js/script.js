document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    setupNavLinks();
    setupSearchAndMenu();
});

function setupSearchAndMenu() {
    let search = document.querySelector('.search-box');
    let navbar = document.querySelector('.navbar');
    let header = document.querySelector('header');

    if (document.querySelector('#search-icon')) {
        document.querySelector('#search-icon').onclick = () => {
            search.classList.toggle('active');
            navbar.classList.remove('active');
        };
    }

    if (document.querySelector('#menu-icon')) {
        document.querySelector('#menu-icon').onclick = () => {
            navbar.classList.toggle('active');
            search.classList.remove('active');
        };
    }

    window.onscroll = () => {
        if (navbar && search) {
            navbar.classList.remove('active');
            search.classList.remove('active');
        }
        if (header) {
            header.classList.toggle('shadow', window.scrollY > 0);
        }
    };
}

async function checkLoginStatus() {
    try {
        const response = await fetch('/api/auth/status');
        const data = await response.json();
        updateNavbar(data.isLoggedIn);
    } catch (error) {
        console.error('Error checking login status:', error);
    }
}

function updateNavbar(isLoggedIn) {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    const links = isLoggedIn
        ? ['Home', 'Cart', 'Upload', 'Logout']
        : ['Home', 'Login', 'Register'];
    
    navbar.innerHTML = links.map(link => 
        `<a href="${link.toLowerCase()}.html" onclick="loadPage('${link.toLowerCase()}')">${link}</a>`
    ).join('');
}

async function loadPage(page) {
    const content = document.getElementById('page-content');
    if (!content) return;
    
    try {
        switch(page) {
            case 'home':
            case 'register':
            case 'login':
            case 'cart':
            case 'upload':
                const response = await fetch(`/src/pages/${page}.html`);
                if (!response.ok) throw new Error(`Failed to load ${page}.html`);
                content.innerHTML = await response.text();
                if (page === 'register') setupRegisterForm();
                if (page === 'login') setupLoginForm();
                break;
            case 'logout':
                await fetch('/api/auth/logout', { method: 'POST' });
                checkLoginStatus();
                loadPage('home');
                break;
            default:
                content.innerHTML = '<h2>Page Not Found</h2><p>Sorry, this page does not exist.</p>';
        }
    } catch (error) {
        console.error('Error loading page:', error);
        content.innerHTML = '<h2>Error</h2><p>Failed to load the page.</p>';
    }
}

function setupRegisterForm() {
    const form = document.getElementById('register-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const mobile = document.getElementById('mobile').value;
            const email = document.getElementById('email').value;
            
            try {
                const response = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password, mobile, email })
                });
                
                const data = await response.json();
                if (response.ok) {
                    alert('Registration successful! Please login.');
                    loadPage('login');
                } else {
                    alert(`Registration failed: ${data.message}`);
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert('Registration failed: An error occurred');
            }
        });
    }
}

function setupLoginForm() {
    const form = document.getElementById('login-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                if (response.ok) {
                    checkLoginStatus();
                    loadPage('home');
                } else {
                    alert(`Login failed: ${data.message}`);
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('Login failed: An error occurred');
            }
        });
    }
}

function setupNavLinks() {
    document.querySelectorAll('#navbar a').forEach(link => {
        link.addEventListener('click', (e) => e.preventDefault());
    });
}