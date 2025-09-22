// Import the UserManager class from your authManager.ts
import { UserManager, Sex } from './authManager.js';

interface signUpParams {
    name: string;
    email: string;
    password: string;
    age: number;
    sex: Sex
}

// Create an instance (or use the global one)
export const userManager = new UserManager();

const signInButton = document.getElementById('sendFormSignIn');
const signUpButton = document.getElementById('sendFormSignUp');

signInButton?.addEventListener('click', async (event) => { // Fix 3: Add event parameter
    event?.preventDefault();
    const email: string = (document.getElementById('signInEmail') as HTMLInputElement).value;
    const password: string = (document.getElementById('signInPassword') as HTMLInputElement).value;

    // If no email or password, return none
    if (!email || !password) {
        showNotification('Please enter both email and password.', 'error');
        return;
    }
    try {
        await signIn(email, password);
    } catch (error) {
        console.error('Error during sign-in:', error);
    }
});


signUpButton?.addEventListener('click', async (event) => {
    event?.preventDefault();
    const params: signUpParams = {
        name: (document.getElementById('signUpName') as HTMLInputElement).value,
        email: (document.getElementById('signUpEmail') as HTMLInputElement).value,
        password:(document.getElementById('signUpPassword') as HTMLInputElement).value,
        age: parseInt((document.getElementById('signUpAge') as HTMLInputElement).value),
        sex: (document.getElementById('signUpSex') as HTMLInputElement).value as Sex,
    };

    if (!params.name || !params.email || !params.password || !params.age || !params.sex) {
        showNotification("Please fill in all fields", "error");
        return;
    }

    try {
        await signUp(params);
    } catch (error) {
        showNotification("An error occurred during sign-up", "error");
        console.error('Sign-up error:', error);
    }
}
);


function showNotification(message: string, type: 'success' | 'error'): void { // Fix 4: Remove Promise<void> - this function doesn't return a promise
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification') as HTMLElement;
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

// Fix 5: Add colon before return type
export async function signIn(signInEmail: string, signInPassword: string): Promise<void> {
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
        
        // Fix 6: Add type annotation and use the correct UserData interface
        const authorized: { status: number; user?: any; error?: string } = await response.json();
        
        // Fix 7: Use the setUser method from your UserManager class
        if (authorized.user) {
            userManager.setUser(authorized.user);
        }
        
        if (authorized.status === 200) {
            showNotification("Sign in successful!", "success");
            setTimeout(() => {
                window.location.href = "/static/homePage.html";
            }, 1000);
        } else {
            showNotification(authorized.error || "Sign in failed", "error");
        }
    }
    catch (error) {
        console.error('Error during sign-in:', error);
        showNotification("An error occurred during sign-in", "error");
    }
}

export async function signUp(params: signUpParams): Promise<void> {
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

class ParticleSystem {
    private particles: HTMLElement[];
    private container: HTMLElement
    private particleSize: number;
    private minDistance: number
    private foodImages: string[];
    private activeImages: Set<string>;
    constructor() {
        this.particles = [];
        this.container = document.getElementById('particles') as HTMLElement;
        this.particleSize = 48;
        this.minDistance = 60; 
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

    startSpawning(): void {
        const spawn = () => {
            this.spawnParticle();
            // Next spawn in 200ms to 900ms
            const nextIn = Math.random() * 700 + 200;
            setTimeout(spawn, nextIn);
        };
        spawn();
    }

    findNonOverlappingPosition(): { x: string, y: string} {
        const maxAttempts: number = 50;
        let attempts: number = 0;
        
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

    spawnParticle() : void{
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
    private form: HTMLElement;
    private isLoginMode: boolean
    private loginFields: HTMLElement;
    private signupFields: HTMLElement;   
    private signInBtn: HTMLElement;
    private signUpBtn: HTMLElement;
    private formSubtitle: HTMLElement
    private authLink: HTMLElement;
    private authText: HTMLElement
    private toggleLink: HTMLElement;

    constructor() {
        this.form = document.getElementById('authForm')!;
        this.isLoginMode = true;
        this.loginFields = document.querySelector('.login-fields')!;
        this.signupFields = document.querySelector('.signup-fields')!;
        this.signInBtn = document.getElementById('sendFormSignIn')!;
        this.signUpBtn = document.getElementById('sendFormSignUp')!;
        this.formSubtitle = document.querySelector('.form-subtitle')!;
        this.authLink = document.querySelector('.auth-link')!;
        this.authText = document.querySelector('.auth-text')!;
        this.toggleLink = document.querySelector('.toggle-form')!;
        this.init();
    }

    init() : void {
        this.setupEventListeners();
        this.addInputAnimations();
    }

    setupEventListeners(): void {
        this.toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleFormMode();
        });

        const allInputs = this.form.querySelectorAll('input, select') as NodeListOf<HTMLInputElement | HTMLSelectElement>;
        allInputs.forEach(input => {
            input.addEventListener('focus', (e) => {
                this.addFocusEffect(e.target as HTMLElement);
            });

            input.addEventListener('blur', (e) => {
                this.removeFocusEffect(e.target as HTMLElement);
            });
        });
    }

    addInputAnimations(): void {
        const allInputs = Array.from(this.form.querySelectorAll('input, select')) as (HTMLInputElement | HTMLSelectElement)[];
        allInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const target = e.target as HTMLInputElement | HTMLSelectElement;
                if (target && target.value.length > 0) {
                    target.parentElement?.classList.add('has-value');
                } else {
                    target.parentElement?.classList.remove('has-value');
                }
            });
        });
    }

    addFocusEffect(input: HTMLElement) : void{
        const wrapper = input.parentElement;
        if (wrapper) {
            wrapper.style.transform = 'scale(1.02)';
            wrapper.style.transition = 'transform 0.3s ease';
        }
    }

    removeFocusEffect(input: HTMLElement) : void{
        const wrapper = input.parentElement;
        if (wrapper) {
            wrapper.style.transform = 'scale(1)';
        }
    }

    toggleFormMode() : void {
        const glassForm = document.querySelector('.glass-form') as HTMLElement;
        
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

    switchToLogin() : void {
        // Update form fields
        this.loginFields.style.display = 'block';
        this.signupFields.style.display = 'none';
        
        // Enable required attributes for login fields
        const loginInputs = this.loginFields.querySelectorAll('input, select');
        loginInputs.forEach(input => {
            (input as HTMLInputElement | HTMLSelectElement).setAttribute('required', '');
        });
        
        // Disable required attributes for signup fields (hidden)
        const signupInputs = this.signupFields.querySelectorAll('input, select');
        signupInputs.forEach(input => {
            (input as HTMLInputElement | HTMLSelectElement).removeAttribute('required');
        });
        
        // Show sign-in button, hide sign-up button
        this.signInBtn.style.display = 'flex';
        this.signUpBtn.style.display = 'none';
        
        // Update subtitle
        this.formSubtitle.textContent = 'Sign in to your account';
        
        // Update link text
        this.authText.innerHTML = 'Don\'t have an account? <a href="#" class="toggle-form">Sign up</a>';
        
        // Re-bind toggle event
        this.toggleLink = document.querySelector('.toggle-form')!;
        this.toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleFormMode();
        });
        
        // Clear signup fields
        this.clearSignupFields();
    }

    switchToSignup() : void{
        // Update form fields
        this.loginFields.style.display = 'none';
        this.signupFields.style.display = 'block';
        
        // Disable required attributes for login fields (hidden)
        const loginInputs = this.loginFields.querySelectorAll('input, select');
        loginInputs.forEach(input => {
            (input as HTMLInputElement | HTMLSelectElement).removeAttribute('required');
        });
        
        // Enable required attributes for signup fields
        const signupInputs = this.signupFields.querySelectorAll('input, select');
        signupInputs.forEach(input => {
            (input as HTMLInputElement | HTMLSelectElement).setAttribute('required', '');
        });
        
        // Show sign-up button, hide sign-in button
        this.signUpBtn.style.display = 'flex';
        this.signInBtn.style.display = 'none';
        
        // Update subtitle
        this.formSubtitle.textContent = 'Create your account';
        
        // Update link text
        this.authText.innerHTML = 'Already have an account? <a href="#" class="toggle-form">Sign in</a>';
        
        // Re-bind toggle event
        this.toggleLink = document.querySelector('.toggle-form')!;
        this.toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleFormMode();
        });
        
        // Clear login fields
        this.clearLoginFields();
    }

    clearLoginFields() {
        const loginInputs = Array.from(this.loginFields.querySelectorAll('input')) as HTMLInputElement[]
        loginInputs.forEach(input => {
            input.value = '';
        });
    }

    clearSignupFields() {
        const signupInputs = this.signupFields.querySelectorAll('input, select');
        signupInputs.forEach(input => {
            (input as HTMLInputElement | HTMLSelectElement).value = '';
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
        (glassForm as HTMLElement).style.transition = 'transform 0.1s ease-out';
        
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
                    
                    (glassForm as HTMLElement).style.transform = `perspective(1000px) rotateX(${y}deg) rotateY(${x}deg)`;
                    ticking = false;
                });
                ticking = true;
            }
        });
        
        // Reset transform on mouse leave
        document.addEventListener('mouseleave', () => {
            (glassForm as HTMLElement).style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        });
    }
});
