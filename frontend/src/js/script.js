document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    setupNavLinks();
    setupSearchAndMenu();
});

function setupSearchAndMenu() {
    let search = document.querySelector('.search-box');
    let navbar = document.querySelector('.navbar');
    let header = document.querySelector('header');

    document.querySelector('#search-icon').onclick = () => {
        search.classList.toggle('active');
        navbar.classList.remove('active');
    };

    document.querySelector('#menu-icon').onclick = () => {
        navbar.classList.toggle('active');
        search.classList.remove('active');
    };

    window.onscroll = () => {
        navbar.classList.remove('active');
        search.classList.remove('active');
        header.classList.toggle('shadow', window.scrollY > 0);
    };
}

async function checkLoginStatus() {
    const response = await fetch('/api/auth/status');
    const data = await response.json();
    updateNavbar(data.isLoggedIn);
}

function updateNavbar(isLoggedIn) {
    const navbar = document.getElementById('navbar');
    const links = isLoggedIn
        ? ['Home', 'About', 'Books', 'Cart', 'Upload', 'Logout']
        : ['Home', 'About', 'Books', 'Register'];
    
    navbar.innerHTML = links.map(link => 
        `<a href="#" onclick="loadPage('${link.toLowerCase()}')">${link}</a>`
    ).join('');
}

async function loadPage(page) {
    const content = document.getElementById('page-content');
    
    try {
        switch(page) {
            case 'home':
            case 'about':
            case 'books':
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
                loadPage('login');
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
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            if (response.ok) {
                alert('Registration successful! Please login.');
                loadPage('login');
            } else {
                const error = await response.text();
                alert(`Registration failed: ${error}`);
            }
        });
    }
}

function setupLoginForm() {
    const form = document.getElementById('login-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            if (response.ok) {
                checkLoginStatus();
                loadPage('home');
            } else {
                alert('Login failed');
            }
        });
    }
}

function setupNavLinks() {
    document.querySelectorAll('#navbar a').forEach(link => {
        link.addEventListener('click', (e) => e.preventDefault());
    });
}