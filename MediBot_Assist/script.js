const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');
const signupForm = document.getElementById('signupForm');
const signinForm = document.getElementById('signinForm');

// Toggle between Sign Up and Sign In forms
registerBtn.addEventListener('click', () => {
    container.classList.add("active");
});

loginBtn.addEventListener('click', () => {
    container.classList.remove("active");
});

// Sign Up Logic
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    if (email === "" || password === "" || name === "") {
        alert("Please fill in all fields.");
        return;
    }

    // Save user data to localStorage
    localStorage.setItem('userName', name);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userPassword', password);

    alert('Signup successful! Please sign in.');
    container.classList.remove("active"); // Switch to Sign In form
});

// Sign In Logic
signinForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('signinEmail').value;
    const password = document.getElementById('signinPassword').value;

    // Retrieve user data from localStorage
    const storedEmail = localStorage.getItem('userEmail');
    const storedPassword = localStorage.getItem('userPassword');

    if (email === storedEmail && password === storedPassword) {
        alert('Sign in successful! Redirecting...');
        window.location.href = 'http://localhost:8501/'; // Redirect to main dashboard
    } else {
        alert('Invalid email or password. Please sign up first.');
    }
});

// Gmail Login for Sign Up
document.getElementById('gmailSignup').addEventListener('click', function (event) {
    event.preventDefault();
    window.location.href = "https://accounts.google.com/ServiceLogin?service=mail";
});

// Gmail Login for Sign In
document.getElementById('gmailSignin').addEventListener('click', function (event) {
    event.preventDefault();
    window.location.href = "https://accounts.google.com/ServiceLogin?service=mail";
});
