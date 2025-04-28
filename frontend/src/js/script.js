document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    setupNavLinks();
    setupSearchAndMenu();

    // Call updateBookList if we're on the home page
    const productsContainer = document.querySelector('.products-container');
    if (productsContainer) {
        updateBookList();
    }

    const uploadForm = document.getElementById('uploadForm');

    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(uploadForm);

            try {
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    credentials: 'include', // Include credentials in the request
                    body: formData  // FormData automatically sets the correct Content-Type
                });

                if (res.ok) {
                    alert('Book uploaded successfully!');
                    uploadForm.reset();
                    // Optionally redirect to home page or books page
                    window.location.href = '/pages/home.html';
                } else {
                    const errorData = await res.json();
                    alert(errorData.error || 'Failed to upload book.');
                }
            } catch (err) {
                console.error('Error uploading book:', err);
                alert('Error uploading book.');
            }
        });
    }

    // Load the initial page content


    // Add event listener for the logout button
    const logoutButton = document.querySelector('#logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const response = await fetch('/api/auth/logout', {
                    method: 'POST',
                });

                if (response.ok) {
                    alert('Logout successful!');
                    // Update the navbar to reflect the logged-out state
                    updateNavbarForLoggedOutUser();
                    // Redirect to the home page
                    window.location.href = '/';
                } else {
                    alert('Failed to log out. Please try again.');
                }
            } catch (error) {
                console.error('Error during logout:', error);
                alert('An error occurred during logout.');
            }
        });
    }

    // Smooth scroll for Home link
    const homeLink = document.querySelector('#navbar a[href="/src/pages/home.html"]');
    if (homeLink) {
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/src/pages/home.html';
        });
    }
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
        const response = await fetch('/api/auth/status', {
            credentials: 'include' // Include credentials in the request
        });
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
        ? ['Home', 'About', 'Cart', 'Upload', 'Logout']
        : ['Home', 'About', 'Login', 'Register'];

    navbar.innerHTML = links.map(link => {
        if (link === 'Home') {
            return `<a href="home.html">${link}</a>`;
        } else if (link === 'Logout') {
            return `<a href="#" id="logout-link">${link}</a>`;
        }
        return `<a href="${link.toLowerCase()}.html">${link}</a>`;
    }).join('');

    // Add event listener for the logout link
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const response = await fetch('/api/auth/logout', { method: 'POST' });
                if (response.ok) {
                    alert('Logout successful!');
                    updateNavbar(false); // Update navbar to logged-out state
                    window.location.href = 'home.html'; // Redirect to home page
                } else {
                    alert('Failed to log out. Please try again.');
                }
            } catch (error) {
                console.error('Error during logout:', error);
                alert('An error occurred during logout.');
            }
        });
    }

    // Add smooth scroll for the home link
    const homeLink = document.getElementById('home-link');
    if (homeLink) {
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelector('#home').scrollIntoView({ behavior: 'smooth' });
        });
    }
}

async function loadPage(page) {
    const content = document.getElementById('page-content');
    if (!content) return;

    try {
        switch (page) {
            case 'home':
            case 'register':
            case 'about':
            case 'login':
            case 'cart':
            case 'upload':
                const response = await fetch(`/src/pages/${page}.html`);
                if (!response.ok) throw new Error(`Failed to load ${page}.html`);
                content.innerHTML = await response.text();
                if (page === 'register') setupRegisterForm();
                if (page === 'login') setupLoginForm();
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
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include', // Include credentials in the request
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

// Function to update the navbar for logged-out users
function updateNavbarForLoggedOutUser() {
    const navbar = document.querySelector('.navbar ul');
    navbar.innerHTML = `
        <li><a href="/">Home</a></li>
        <li><a href="/pages/login.html">Login</a></li>
        <li><a href="/pages/register.html">Register</a></li>
    `;
}

async function updateBookList() {
    const productsContainer = document.querySelector('.products-container');
    if (!productsContainer) return;

    try {
        const response = await fetch('/api/books');
        const books = await response.json();

        productsContainer.innerHTML = '';

        if (books.length === 0) {
            productsContainer.innerHTML = '<p>No books available at the moment.</p>';
        } else {
            books.forEach(book => {
                const bookBox = document.createElement('div');
                bookBox.classList.add('box');

                // Important change here: Use book.book_image directly (it’s now a public URL)
                const bookHTML = `
                    <div class="product">
                        <img src="${book.book_image}" alt="${book.book_name}" style="max-width:100%; height:auto;">
                        <h3>${book.book_name}</h3>
                        <div class="content">
                            <span>Price: $${book.price}</span>
                            <a href="/book/${book.id}" target="_blank">Buy</a>
                        </div>
                    </div>
                `;

                bookBox.innerHTML = bookHTML;
                productsContainer.appendChild(bookBox);
            });
        }
    } catch (error) {
        console.error('Error fetching books:', error);
        productsContainer.innerHTML = '<p>Failed to load books. Please try again later.</p>';
    }
}