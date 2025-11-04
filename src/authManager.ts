export enum Sex {
    Male = "Male",
    Female = "Female"
}

enum Objectives {
    WeightLoss = "Weight Loss",
    MuscleGain = "Muscle Gain",
    Maintenance = "Maintenance",

}

interface UserData {
    name: string;
    email: string;
    password: string;
    age: number;
    id?: number | null;
    sex: Sex;
    objective?: Objectives | null; 
    weight?: number | null;
    height?: number | null;

    allergies?: string | null;
    sportive_description?: string | null;
    medical_conditions?: string | null;
    food_preferences?: string | null;

    recommended_daily_calories?: number | null;
    recommended_water_intake?: number | null;
    recommended_protein_intake?: number | null;
    recommended_fats_intake?: number | null;
    recommended_carbohydrates_intake?: number | null;
    nutritional_deficiency_risks?: string | null;
    general_recommendation?: string | null;
    country?: string | null;

    weekly_calories?: string | null;
    weekly_protein?: string | null;
    weekly_fats?: string | null;
    weekly_carbohydrates?: string | null;
    imc?: number | null;
}

interface UserChangeEvent {
    type: 'login' | 'logout';
    userData: UserData | null;
    timestamp: number;
}

interface ApiResponse<T = any> {
    ok: boolean;
    status: number;
    json(): Promise<T>;
}

export class UserManager {
    private user: UserData | null;
    private isInitialized: boolean;
    private initPromise: Promise<UserData | null> | null;

    constructor() {
        this.user = null;
        this.isInitialized = false;
        this.initPromise = null;
    }

    // Call this after successful login/signup
    setUser(userData: UserData): void {
        this.user = userData;
        this.isInitialized = true;
        
        // Cache user data in localStorage for persistence
        localStorage.setItem('user_data', JSON.stringify(userData));  
        localStorage.setItem('user_logged_in', 'true');
        
        // Broadcast to other tabs/windows
        this.broadcastUserChange('login', userData);
        
        console.log('User set:', userData);
    }

    // Initialize user context (call on every page load)
    async initialize(): Promise<UserData | null> {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = this._doInitialize();
        return this.initPromise;
    }

    private async _doInitialize(): Promise<UserData | null> {
        if (this.isInitialized && this.user) {
            return this.user;
        }

        // First, try to get from localStorage (for page refreshes)
        const cachedUser = localStorage.getItem('user_data');
        const isLoggedIn = localStorage.getItem('user_logged_in') === 'true';
        
        if (cachedUser && isLoggedIn) {
            try {
                this.user = JSON.parse(cachedUser) as UserData;
                this.isInitialized = true;
                return this.user;
            } catch (error) {
                console.error('Error parsing cached user:', error);
                this.clearUserData();
            }
        }
        // No user found in localStorage or session expired
        this.user = null;
        this.isInitialized = true;
        return null;
    }

    // Verify user session with server (optional but recommended)
    async verifyUserSession(): Promise<void> {
        try {
            const response = await fetch('/api/verify-session', {
                method: 'GET',
                credentials: 'include', // Include cookies/session
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const userData: UserData = await response.json();
                this.user = userData;
                localStorage.setItem('user_data', JSON.stringify(userData));
            } else if (response.status === 401) {
                this.logout();
            }
        } catch (error) {
            console.warn('Could not verify session:', error);
            // Continue with cached data if network error
        }
    }

    // Get current user data
    getCurrentUser(): UserData | null {
        return this.user;
    }

    // Quick access methods for common user properties
    getUserId(): number | null | undefined {
        return this.user?.id;
    }

    getUserEmail(): string | undefined {
        return this.user?.email;
    }

    getUserName(): string | undefined {
        return this.user?.name;
    }

    getUserAge(): number | undefined {
        return this.user?.age;
    }

    // Check if user is logged in
    isLoggedIn(): boolean {
        return this.user !== null && localStorage.getItem('user_logged_in') === 'true';
    }

    // Update user data (for profile updates, etc.)
    async updateUser(updates: Partial<UserData>): Promise<UserData> {
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
                const updatedUser: UserData = await response.json();
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
    async refreshUser(): Promise<UserData | null> {
        if (!this.isLoggedIn()) {
            return null;
        }

        try {
            const response = await fetch('/api/user/me', {
                credentials: 'include'
            });

            if (response.ok) {
                const userData: UserData = await response.json();
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
        
        return null;
    }

    // Logout user
    logout(): void {
        this.user = null;
        this.isInitialized = false;
        this.clearUserData();
        
        // Broadcast logout to other tabs
        this.broadcastUserChange('logout', null);
        console.log('User logged out');
        // Optionally redirect to login page
        window.location.href = '/api/index.html';
    }

    // Clear all user data
    private clearUserData(): void {
        localStorage.removeItem('user_data');
        localStorage.removeItem('user_logged_in');
    }

    // Broadcast user changes to other tabs/windows
    private broadcastUserChange(type: 'login' | 'logout', userData: UserData | null): void {
        // Use localStorage event for cross-tab communication
        const changeEvent: UserChangeEvent = {
            type: type,
            userData: userData,
            timestamp: Date.now()
        };
        
        localStorage.setItem('user_change_event', JSON.stringify(changeEvent));
        
        // Remove the event item immediately (this triggers the storage event)
        localStorage.removeItem('user_change_event');
    }

    // Listen for user changes from other tabs
    setupCrossTabSync(): void {
        window.addEventListener('storage', (event: StorageEvent) => {
            if (event.key === 'user_change_event' && event.newValue) {
                try {
                    const change: UserChangeEvent = JSON.parse(event.newValue);
                    
                    if (change.type === 'login' && change.userData) {
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
    async apiCall(url: string, options: RequestInit = {}): Promise<Response> {
        if (!this.isLoggedIn()) {
            throw new Error('User not logged in');
        }

        const defaultOptions: RequestInit = {
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
            throw new Error('Session expired');
        }

        return response;
    }
}

// Create global instance
declare global {
    interface Window {
        userManager: UserManager;
    }
}

window.userManager = new UserManager();

// Setup cross-tab synchronization
window.userManager.setupCrossTabSync();

// Auto-initialize on DOM load
document.addEventListener('DOMContentLoaded', async () => {
    await window.userManager.initialize();
});

// Export for module usage (if using modules)
export default UserManager;