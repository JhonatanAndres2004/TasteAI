export class UserManager{
    constructor() {
        this.user = null;
        this.isInitialized = false;
        this.initPromise = null;
    }

    // Call this after successful login/signup
    setUser(userData) {
        this.user = userData;
        this.isInitialized = true;
        
        //eliminate if existing info
        // Cache user data in localStorage for persistence
        localStorage.setItem('user_data', JSON.stringify(userData));  
        localStorage.setItem('user_logged_in', 'true');
        
        // Broadcast to other tabs/windows
        this.broadcastUserChange('login', userData);
        
        console.log('User set:', userData);
    }

    // Initialize user context (call on every page load)
    async initialize() {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = this._doInitialize();
        return this.initPromise;
    }

    async _doInitialize() {
        if (this.isInitialized && this.user) {
            return this.user;
        }

        // First, try to get from localStorage (for page refreshes)
        const cachedUser = localStorage.getItem('user_data');
        const isLoggedIn = localStorage.getItem('user_logged_in') === 'true';
        
        if (cachedUser && isLoggedIn) {
            try {
                this.user = JSON.parse(cachedUser);
                this.isInitialized = true;
                return this.user;
            } catch (error) {
                console.error('Error parsing cached user:', error);
                this.clearUserData();
            }
        }
        //No user found in localStorage or session expired
        this.user = null;
        this.isInitialized = true;
        return null;
    }

    // Verify user session with server (optional but recommended)
    async verifyUserSession() {
        try {
            const response = await fetch('/api/verify-session', {
                method: 'GET',
                credentials: 'include', // Include cookies/session
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const userData = await response.json();
                // Update user data if server has newer info
                this.user = userData;
                localStorage.setItem('user_data', JSON.stringify(userData));
            } else if (response.status === 401) {
                // Session expired
                this.logout();
            }
        } catch (error) {
            console.warn('Could not verify session:', error);
            // Continue with cached data if network error
        }
    }

    // Get current user data
    getCurrentUser() {
        return this.user;
    }

    // Quick access methods for common user properties
    getUserId() {
        return this.user?.id;
    }

    getUserEmail() {
        return this.user?.email;
    }

    getUserName() {
        return this.user?.name || this.user?.username;
    }

    getUserAge() {
        return this.user?.age;
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.user !== null && localStorage.getItem('user_logged_in') === 'true';
    }

    // Update user data (for profile updates, etc.)
    async updateUser(updates) {
        if (!this.isLoggedIn()) {
            throw new Error('User not logged in');
        }

        try {
            const response = await fetch('/api/user/update', {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });

            if (response.ok) {
                const updatedUser = await response.json();
                this.setUser(updatedUser); // This will also update localStorage
                return updatedUser;
            } else {
                throw new Error('Failed to update user');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    // Refresh user data from server
    async refreshUser() {
        if (!this.isLoggedIn()) {
            return null;
        }

        try {
            const response = await fetch('/api/user/me', {
                credentials: 'include'
            });

            if (response.ok) {
                const userData = await response.json();
                this.setUser(userData);
                return userData;
            } else if (response.status === 401) {
                this.logout();
                return null;
            }
        } catch (error) {
            console.error('Error refreshing user:', error);
            return this.user; // Return cached data on error
        }
    }

    // Logout user
    logout() {
        this.user = null;
        this.isInitialized = false;
        this.clearUserData();
        
        // Broadcast logout to other tabs
        this.broadcastUserChange('logout', null);
        console.log('User logged out');
        // Optionally redirect to login page
        window.location.href = 'http://localhost:5500/static/index.html';
    }

    // Clear all user data
    clearUserData() {
        localStorage.removeItem('user_data');
        localStorage.removeItem('user_logged_in');
    }

    // Broadcast user changes to other tabs/windows
    broadcastUserChange(type, userData) {
        // Use localStorage event for cross-tab communication
        localStorage.setItem('user_change_event', JSON.stringify({
            type: type,
            userData: userData,
            timestamp: Date.now()
        }));
        
        // Remove the event item immediately (this triggers the storage event)
        localStorage.removeItem('user_change_event');
    }

    // Listen for user changes from other tabs
    setupCrossTabSync() {
        window.addEventListener('storage', (event) => {
            if (event.key === 'user_change_event' && event.newValue) {
                try {
                    const change = JSON.parse(event.newValue);
                    
                    if (change.type === 'login') {
                        this.setUser(change.userData);
                        // Optionally reload page or update UI
                        window.location.reload();
                    } else if (change.type === 'logout') {
                        this.logout();
                        window.location.href = '/login';
                    }
                } catch (error) {
                    console.error('Error processing cross-tab sync:', error);
                }
            }
        });
    }

    // Make API calls with user context
    async apiCall(url, options = {}) {
        if (!this.isLoggedIn()) {
            throw new Error('User not logged in');
        }

        const defaultOptions = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        const response = await fetch(url, { ...defaultOptions, ...options });
        
        if (response.status === 401) {
            // Session expired
            this.logout();
            window.location.href = '/login';
            return;
        }

        return response;
    }
}

// Create global instance
window.userManager = new UserManager();

// Setup cross-tab synchronization
window.userManager.setupCrossTabSync();

// Auto-initialize on DOM load
document.addEventListener('DOMContentLoaded', async () => {
    await window.userManager.initialize();
});

// Export for module usage (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserManager;
}