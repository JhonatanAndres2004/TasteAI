import {UserManager} from './authManager.js';

//Initialize UserManager instance
export const userManager = new UserManager();

const signInButton = document.getElementById('sendFormSignIn');
const signUpButton = document.getElementById('sendFormSignUp');

signInButton.addEventListener('click', async (event) => {
    event.preventDefault();
    const email = document.getElementById('signInEmail').value;
    const password = document.getElementById('signInPassword').value;

    if (!email || !password) {
        showNotification("Please fill in all fields", "error");
        return;
    }

    try {
        await signIn(email, password);
    } catch (error) {
        console.error('Sign-in error:', error);
    }
}
);

signUpButton.addEventListener('click', async (event) => {
    event.preventDefault();
    const params = {
        name: document.getElementById('signUpName').value,
        email: document.getElementById('signUpEmail').value,
        password: document.getElementById('signUpPassword').value,
        age: document.getElementById('signUpAge').value,
        sex: document.getElementById('signUpSex').value,
    };

    if (!params.name || !params.email || !params.password || !params.age || !params.sex) {
        showNotification("Please fill in all fields", "error");
        return;
    }

    try {
        await signUp(params);
    } catch (error) {
        console.error('Sign-up error:', error);
    }
}
);

export async function signUp(params) {
    try {
        const response = await fetch('http://localhost:8000/signUp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });
        
        if (!response.ok) {
            showNotification("Network response was not ok", "error");
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        let Authorized = await response.json();
        console.log("Response from signUp:", Authorized);
        if (Authorized.status === 201) {
            setTimeout(() => {
                window.location.href = "/static/index.html";
            }, 1500);
            showNotification("Account created successfully!", "success");
            showNotification("Please sign in to continue", "success");
            userManager.setUser(Authorized.user); // Set user data in UserManager
        } else {
            showNotification(Authorized.error || "Sign up failed", "error");
        }
    }
    catch (error) {
        console.error('Error during sign-up:', error);
    }
}

export async function signIn(signInEmail, signInPassword) {
    try {
        const response = await fetch('http://localhost:8000/signIn', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: signInEmail,
                password: signInPassword
            })
        });
        
        if (!response.ok) {
            showNotification("Network response was not ok", "error");

            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        let Authorized = await response.json();
        userManager.setUser(Authorized.user); // Set user data in UserManager
        
        if (Authorized.status === 200) {
            showNotification("Sign in successful!", "success");
            setTimeout(() => {
                window.location.href = "/static/homePage.html";
            }, 1000);
        } else {
            showNotification(Authorized.error || "Sign in failed", "error");
        }
    }
    catch (error) {
        console.error('Error during sign-in:', error);
    }
}


function showNotification(message, type) {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'rgba(0, 159, 226, 0.9)' : 'rgba(242, 43, 41, 0.9)'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.9rem;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}
