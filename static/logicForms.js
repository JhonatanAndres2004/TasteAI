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

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.container = document.getElementById('particles');
        this.particleSize = 48;
        this.minDistance = 60; // Minimum distance between particles
        this.foodImages = [
            'icons8-cherry-48.png',
            'icons8-jelly-48.png',
            'icons8-cheese-48.png',
            'icons8-apple-fruit-48.png',
            'icons8-peeled-banana-48.png',
            'icons8-octopus-48.png',
            'icons8-fish-food-48.png',
            'icons8-pear-48.png',
            'icons8-carrot-48.png',
            'icons8-nut-48.png',
            'icons8-calories-48.png',
            'icons8-poultry-leg-48.png',
            'icons8-beef-48.png',
            'icons8-ketchup-48.png',
            'icons8-salt-shaker-48.png',
            'icons8-sugar-cube-48.png',
            'icons8-egg-48.png',
            'icons8-milk-carton-48.png',
            'icons8-hamburger-48.png'
        ];
        this.activeImages = new Set();
        this.startSpawning();
    }

    startSpawning() {
        const spawn = () => {
            this.spawnParticle();
            // Next spawn in 200ms to 900ms
            const nextIn = Math.random() * 700 + 200;
            setTimeout(spawn, nextIn);
        };
        spawn();
    }

    findNonOverlappingPosition() {
        const maxAttempts = 50;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const x = Math.random() * 90 + '%';
            const y = Math.random() * 80 + 10 + '%';
            
            // Check if this position overlaps with any existing particle
            let overlaps = false;
            for (const particle of this.particles) {
                const particleRect = particle.getBoundingClientRect();
                const containerRect = this.container.getBoundingClientRect();
                
                // Convert percentage to pixels for comparison
                const newX = parseFloat(x) * containerRect.width / 100;
                const newY = parseFloat(y) * containerRect.height / 100;
                
                const distance = Math.sqrt(
                    Math.pow(newX - (particleRect.left - containerRect.left + this.particleSize/2), 2) +
                    Math.pow(newY - (particleRect.top - containerRect.top + this.particleSize/2), 2)
                );
                
                if (distance < this.minDistance) {
                    overlaps = true;
                    break;
                }
            }
            
            if (!overlaps) {
                return { x, y };
            }
            
            attempts++;
        }
        
        // If we can't find a non-overlapping position, return a random one
        return {
            x: Math.random() * 90 + '%',
            y: Math.random() * 80 + 10 + '%'
        };
    }

    spawnParticle() {
        // Only allow images not currently active
        const available = this.foodImages.filter(img => !this.activeImages.has(img));
        if (available.length === 0) return; // All images are active, skip this spawn
        const choice = available[Math.floor(Math.random() * available.length)];
        this.activeImages.add(choice);

        const particle = document.createElement('div');
        particle.className = 'particle';

        const img = document.createElement('img');
        img.src = `./foodLogos/${choice}`;
        img.alt = 'food particle';
        img.style.width = this.particleSize + 'px';
        img.style.height = this.particleSize + 'px';
        img.style.display = 'block';

        particle.appendChild(img);

        // Find non-overlapping position
        const position = this.findNonOverlappingPosition();
        particle.style.left = position.x;
        particle.style.top = position.y;

        this.container.appendChild(particle);
        this.particles.push(particle);

        // Fade in
        setTimeout(() => {
            particle.classList.add('fade-in');
        }, 10);

        // After 3s, start fade out
        setTimeout(() => {
            particle.classList.remove('fade-in');
            particle.classList.add('fade-out');
            // After 1s, remove
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
                this.particles = this.particles.filter(p => p !== particle);
                this.activeImages.delete(choice);
            }, 1000);
        }, 3000);
    }
}

class AuthForm {
    constructor() {
        this.form = document.getElementById('authForm');
        this.isLoginMode = true;
        this.loginFields = document.querySelector('.login-fields');
        this.signupFields = document.querySelector('.signup-fields');
        this.signInBtn = document.getElementById('sendFormSignIn');
        this.signUpBtn = document.getElementById('sendFormSignUp');
        this.formSubtitle = document.querySelector('.form-subtitle');
        this.authLink = document.querySelector('.auth-link');
        this.authText = document.querySelector('.auth-text');
        this.toggleLink = document.querySelector('.toggle-form');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.addInputAnimations();
    }

    setupEventListeners() {

        // Toggle form mode
        this.toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleFormMode();
        });

        // Input focus effects
        const allInputs = this.form.querySelectorAll('input, select');
        allInputs.forEach(input => {
            input.addEventListener('focus', (e) => {
                this.addFocusEffect(e.target);
            });

            input.addEventListener('blur', (e) => {
                this.removeFocusEffect(e.target);
            });
        });
    }

    addInputAnimations() {
        const allInputs = this.form.querySelectorAll('input, select');
        allInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                if (e.target.value.length > 0) {
                    e.target.parentElement.classList.add('has-value');
                } else {
                    e.target.parentElement.classList.remove('has-value');
                }
            });
        });
    }

    addFocusEffect(input) {
        const wrapper = input.parentElement;
        wrapper.style.transform = 'scale(1.02)';
        wrapper.style.transition = 'transform 0.3s ease';
    }

    removeFocusEffect(input) {
        const wrapper = input.parentElement;
        wrapper.style.transform = 'scale(1)';
    }

    toggleFormMode() {
        const glassForm = document.querySelector('.glass-form');
        
        // Add transition class
        glassForm.classList.add('form-transition');
        
        // Toggle mode
        this.isLoginMode = !this.isLoginMode;
        
        if (this.isLoginMode) {
            // Switch to login mode
            this.switchToLogin();
        } else {
            // Switch to signup mode
            this.switchToSignup();
        }
        
        // Remove transition class after animation
        setTimeout(() => {
            glassForm.classList.remove('form-transition');
        }, 500);
    }

    switchToLogin() {
        // Update form fields
        this.loginFields.style.display = 'block';
        this.signupFields.style.display = 'none';
        
        // Show sign-in button, hide sign-up button
        this.signInBtn.style.display = 'flex';
        this.signUpBtn.style.display = 'none';
        
        // Update subtitle
        this.formSubtitle.textContent = 'Sign in to your account';
        
        // Update link text
        this.authText.innerHTML = 'Don\'t have an account? <a href="#" class="toggle-form">Sign up</a>';
        
        // Re-bind toggle event
        this.toggleLink = document.querySelector('.toggle-form');
        this.toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleFormMode();
        });
        
        // Clear signup fields
        this.clearSignupFields();
    }

    switchToSignup() {
        // Update form fields
        this.loginFields.style.display = 'none';
        this.signupFields.style.display = 'block';
        
        // Show sign-up button, hide sign-in button
        this.signUpBtn.style.display = 'flex';
        this.signInBtn.style.display = 'none';
        
        // Update subtitle
        this.formSubtitle.textContent = 'Create your account';
        
        // Update link text
        this.authText.innerHTML = 'Already have an account? <a href="#" class="toggle-form">Sign in</a>';
        
        // Re-bind toggle event
        this.toggleLink = document.querySelector('.toggle-form');
        this.toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleFormMode();
        });
        
        // Clear login fields
        this.clearLoginFields();
    }

    clearLoginFields() {
        const loginInputs = this.loginFields.querySelectorAll('input');
        loginInputs.forEach(input => {
            input.value = '';
        });
    }

    clearSignupFields() {
        const signupInputs = this.signupFields.querySelectorAll('input, select');
        signupInputs.forEach(input => {
            input.value = '';
        });
    }


} 


// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ParticleSystem();
    new AuthForm();
    
    // Add some interactive effects
    const glassForm = document.querySelector('.glass-form');
    
    // Only proceed if glassForm exists
    if (glassForm) {
        // Add smooth transition to the form
        glassForm.style.transition = 'transform 0.1s ease-out';
        
        // Throttle function to limit mousemove events
        let ticking = false;
        
        // Mouse move effect for glass form
        document.addEventListener('mousemove', (e) => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const { clientX, clientY } = e;
                    const { innerWidth, innerHeight } = window;
                    
                    // Calculate rotation based on mouse position (max 10 degrees)
                    const x = (clientX / innerWidth - 0.5) * 10;
                    const y = (clientY / innerHeight - 0.5) * 10;
                    
                    glassForm.style.transform = `perspective(1000px) rotateX(${y}deg) rotateY(${x}deg)`;
                    ticking = false;
                });
                ticking = true;
            }
        });
        
        // Reset transform on mouse leave
        document.addEventListener('mouseleave', () => {
            glassForm.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        });
    }
});
