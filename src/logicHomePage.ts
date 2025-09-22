import {UserManager} from './authManager.js';

// Declare SweetAlert2 global variable
declare const Swal: any;

const userManager = new UserManager();

// Utility function to safely get menu data from localStorage
function getSafeMenuData() {
    try {
        const menuData = localStorage.getItem('user_menus');
        return menuData ? JSON.parse(menuData) : null;
    } catch (error) {
        console.error('Error parsing menu data from localStorage:', error);
        // Clear corrupted data
        localStorage.removeItem('user_menus');
        return null;
    }
}

// Function to calculate daily nutrition totals
function calculateDailyTotals(dayMeals: any) {
    const totals = {
        calories: 0,
        protein: 0,
        fats: 0,
        carbohydrates: 0
    };

    dayMeals.forEach((meal: any) => {
        totals.calories += parseInt(meal.calories) || 0;
        totals.protein += parseInt(meal.protein) || 0;
        totals.fats += parseInt(meal.fats) || 0;
        totals.carbohydrates += parseInt(meal.carbohydrates) || 0;
    });

    return totals;
}

// Function to create meal component
function createMealComponent(meal: any) {
    const mealTypeIcons: any = {
        breakfast: 'fas fa-sun',
        lunch: 'fas fa-cloud-sun',
        dinner: 'fas fa-moon',
        snack: 'fas fa-cookie-bite'
    };

    return `
        <div class="meal-card ${meal.type}">
            <div class="meal-header">
                <div class="meal-type">
                    <i class="${mealTypeIcons[meal.type]  || 'fas fa-utensils'}"></i>
                    <h3>${meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}</h3>
                </div>
                <div class="meal-time">
                    <i class="fas fa-clock"></i>
                    <span>${meal.hour}</span>
                </div>
            </div>
            
            <div class="meal-content">
                <div class="meal-sections-grid">
                    <div class="meal-section">
                        <h4><i class="fas fa-shopping-basket"></i> Ingredients</h4>
                        <ul class="ingredients-list">
                            ${meal.ingredients.map((ingredient: any) => `<li>${ingredient}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="meal-section">
                        <h4><i class="fas fa-list-ol"></i> Instructions</h4>
                        <ol class="instructions-list">
                            ${meal.instructions.map((instruction: any) => `<li>${instruction}</li>`).join('')}
                        </ol>
                    </div>
                </div>
                
                <div class="meal-nutrition">
                    <div class="nutrition-item">
                        <span class="nutrition-label">Calories</span>
                        <span class="nutrition-value">${meal.calories}</span>
                    </div>
                    <div class="nutrition-item">
                        <span class="nutrition-label">Protein</span>
                        <span class="nutrition-value">${meal.protein}g</span>
                    </div>
                    <div class="nutrition-item">
                        <span class="nutrition-label">Fats</span>
                        <span class="nutrition-value">${meal.fats}g</span>
                    </div>
                    <div class="nutrition-item">
                        <span class="nutrition-label">Carbs</span>
                        <span class="nutrition-value">${meal.carbohydrates}g</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Function to create daily summary
function createDailySummary(totals: any) {
    return `
        <div class="daily-summary">
            <h3><i class="fas fa-chart-pie"></i> Daily Nutrition Summary</h3>
            <div class="summary-grid">
                <div class="summary-item calories">
                    <div class="summary-icon">
                        <i class="fas fa-fire"></i>
                    </div>
                    <div class="summary-content">
                        <span class="summary-value">${totals.calories}</span>
                        <span class="summary-label">Calories</span>
                    </div>
                </div>
                <div class="summary-item protein">
                    <div class="summary-icon">
                        <i class="fas fa-dumbbell"></i>
                    </div>
                    <div class="summary-content">
                        <span class="summary-value">${totals.protein}g</span>
                        <span class="summary-label">Protein</span>
                    </div>
                </div>
                <div class="summary-item fats">
                    <div class="summary-icon">
                        <i class="fas fa-tint"></i>
                    </div>
                    <div class="summary-content">
                        <span class="summary-value">${totals.fats}g</span>
                        <span class="summary-label">Fats</span>
                    </div>
                </div>
                <div class="summary-item carbs">
                    <div class="summary-icon">
                        <i class="fas fa-bread-slice"></i>
                    </div>
                    <div class="summary-content">
                        <span class="summary-value">${totals.carbohydrates}g</span>
                        <span class="summary-label">Carbs</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Main function to create menu dashboard
function createMenuDashboard(menuData: any) {
    const days = ['day1', 'day2', 'day3', 'day4', 'day5', 'day6', 'day7'];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const dashboardHTML = `
        <div class="menu-dashboard">
            <div class="dashboard-header">
                <h1><i class="fas fa-calendar-week"></i>Your Weekly Menu</h1>
            </div>
            
            <div class="tabs-container">
                <div class="tabs-nav">
                    ${days.map((day, index) => `
                        <button class="tab-btn ${index === 0 ? 'active' : ''}" data-day="${day}">
                            <span class="tab-day">${dayNames[index]}</span>
                            <span class="tab-date">Day ${index + 1}</span>
                        </button>
                    `).join('')}
                </div>
                
                <div class="tabs-content">
                    ${days.map((day, index) => {
                        const dayMeals = menuData[day] || [];
                        const totals = calculateDailyTotals(dayMeals);
                        
                        return `
                            <div class="tab-panel ${index === 0 ? 'active' : ''}" data-day="${day}" data-day-number="${index + 1}">
                                <div class="day-content">
                                    <div class="day-header">
                                        <h2>${dayNames[index]} - Day ${index + 1}</h2>
                                        <div class="meal-count">
                                            <i class="fas fa-utensils"></i>
                                            <span>${dayMeals.length} meals planned</span>
                                        </div>
                                    </div>
                                    
                                    <div class="meals-container">
                                        ${dayMeals.map((meal: any) => createMealComponent(meal)).join('')}
                                    </div>
                                    
                                    ${createDailySummary(totals)}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;

    // Insert dashboard into container
    document.getElementById('container')?.insertAdjacentHTML('beforeend', dashboardHTML);

    // Create and insert chat interface
    createChatInterface();
    
    // Add body class for sidebar layout
    document.body.classList.add('has-chat-sidebar');

    // Add tab switching functionality
    setupTabSwitching();
    
    // Setup chat functionality
    setupChatFunctionality();
}

// Function to create chat interface
function createChatInterface() {
    const chatHTML = `
        <div class="chat-sidebar" id="chatSidebar">
            <div class="chat-interface">
                <div class="chat-header">
                    <h3><i class="fas fa-comments"></i> Menu Assistant</h3>
                    <div class="current-day-indicator">
                        <span id="currentDayText">Day 1 - Monday</span>
                    </div>
                </div>
                <div class="chat-messages" id="chatMessages">
                    <div class="default-message">
                        <div class="message-avatar">
                            <i class="fas fa-robot"></i>
                        </div>
                        <div class="message-content">
                            <p>Here you can chat with your daily menu in order to add/remove meals, change ingredients or food distribution. How can I help you today?</p>
                        </div>
                    </div>
                </div>
                <div class="chat-input-container">
                    <div class="chat-input-group">
                        <textarea class="chat-input" id="chatInput" placeholder="Type your message here..." rows="2"></textarea>
                        <button class="chat-send-btn" id="chatSendBtn" type="button">
                            <i class="fas fa-paper-plane"></i>
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Create wrapper for mobile layout
    const wrapper = document.createElement('div');
    wrapper.className = 'main-wrapper';
    
    // Wrap the existing container
    const container: HTMLElement | null = document.getElementById('container');
    container?.parentNode?.insertBefore(wrapper, container);
    wrapper.appendChild(container!);
    
    // Insert chat interface as a sibling to the container within wrapper
    wrapper.insertAdjacentHTML('beforeend', chatHTML);
}

// Function to setup tab switching
function setupTabSwitching() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    tabBtns.forEach((btn: any, index: number) => {
        btn.addEventListener('click', () => {
            const targetDay = btn.dataset.day;

            // Remove active class from all tabs and panels
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));

            // Add active class to clicked tab and corresponding panel
            btn.classList.add('active');
            document.querySelector(`.tab-panel[data-day="${targetDay}"]`)?.classList.add('active');
            
            // Update current day indicator in chat
            const currentDayText = document.getElementById('currentDayText');
            if (currentDayText) {
                currentDayText.textContent = `Day ${index + 1} - ${dayNames[index]}`;
            }
        });
    });
}

// Function to setup chat functionality
function setupChatFunctionality() {
    const chatSendBtn = document.getElementById('chatSendBtn') as HTMLButtonElement;
    const chatInput = document.getElementById('chatInput') as HTMLTextAreaElement;

    if (!chatSendBtn || !chatInput) return;
        
    // Send message function
    const sendMessage = async () => {
        const message = chatInput.value.trim();
        if (!message) return;

        // Get current active day
        const activeTabPanel = document.querySelector('.tab-panel.active') as HTMLElement;
        if (!activeTabPanel) return;
        
        const dayNumber = parseInt(activeTabPanel.dataset.dayNumber as string);
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const userId = userData.id;

        if (!userId) {
            Swal.fire({
                title: 'Error',
                text: 'User not found. Please log in again.',
                icon: 'error'
            });
            return;
        }

        // Disable input and button during request
        chatInput.disabled = true;
        chatSendBtn.disabled = true;
        chatSendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        
        //Set the data to send
        const informationToSend = {
            id: userId,
            day: dayNumber,
            userRequest: message
        };
        
        // Add user message to chat and clear input before fetching data
        addMessageToChat(message, 'user');
        chatInput.value = '';
        console.log('Information to send:', JSON.stringify(informationToSend));
        try {
            const response = await fetch('http://localhost:8000/modifyDailyMenu', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(informationToSend)
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const result = await response.json();
            console.log('Response from server:', result);
            
            // Add response message to chat
            if (result && result.notes) {
                addMessageToChat(result.notes, 'assistant');
            } else {
                addMessageToChat('Message received! Your menu is being updated.', 'assistant');
            }


        } catch (error) {
            console.error('Error sending message:', error);
            Swal.fire({
                title: 'Error',
                text: 'Failed to send message. Please try again.',
                icon: 'error'
            });
        } finally {
            // Re-enable input and button
            chatInput.disabled = false;
            chatSendBtn.disabled = false;
            chatSendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send';

            //Now save to the local storage the updated chat history for each day TODO--------------------------------
        }
    };

    // Click event
    chatSendBtn.addEventListener('click', sendMessage);

    // Enter key event (with Shift+Enter for new line)
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

// Function to add message to chat
function addMessageToChat(message: string, sender: string) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}-message`;
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageElement.innerHTML = `
        <div class="message-avatar">
            <i class="fas ${sender === 'user' ? 'fa-user' : 'fa-robot'}"></i>
        </div>
        <div class="message-content">
            <p>${message}</p>
            <span class="message-time">${timestamp}</span>
        </div>
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
document.addEventListener('DOMContentLoaded', function() {
    const userIcon = document.getElementById('userIcon');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const addDetailsBtn = document.getElementById('addDetails');
    const logOutBtn = document.getElementById('logOut');
    const userData=userManager.getCurrentUser();

    // Toggle dropdown menu when user icon is clicked
    userIcon?.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu?.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!userIcon?.contains(e.target as Node) && !dropdownMenu?.contains(e.target as Node)) {
            dropdownMenu?.classList.remove('show');
        }
    });

    // Handle "Add Details" click
    addDetailsBtn?.addEventListener('click', function() {
        if(localStorage.getItem('user_data')){
        window.location.href = 'profile.html';
        }
        else{
            Swal.fire({
                title:"No user found",
                text:"Please, log-in again",
                icon:'question',
            })
        }
    });

    // Handle "Log Out" click with SweetAlert confirmation
    logOutBtn?.addEventListener('click', function() {
        Swal.fire({
            title: 'Logout Confirmation',
            text: 'Are you sure you want to log out?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, Logout',
            cancelButtonText: 'Cancel',
            reverseButtons: true,
            customClass: {
                popup: 'swal-custom-popup',
                confirmButton: 'swal-confirm-btn',
                cancelButton: 'swal-cancel-btn'
            }
        }).then((result: any) => {
            if (result.isConfirmed) {
               userManager.logout();
                Swal.fire({
                    title: 'Logged Out',
                    text: 'You have been logged out successfully.',
                    icon: 'success',
                    confirmButtonColor: '#28a745',
                    customClass: {
                        popup: 'swal-custom-popup',
                        confirmButton: 'swal-confirm-btn'   
                    }
            })}
        });
    });

    // Add hover effect for logout button (additional visual feedback)
    logOutBtn?.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.02)';
    });

    logOutBtn?.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });

    // Landing visibility vs. post-report placeholder
    try {
        const userDataParsed = JSON.parse(localStorage.getItem('user_data') || 'null');
        const hasReport = Boolean(userDataParsed && userDataParsed['recommended_daily_calories']);
        const landingEl = document.querySelector('.main-content.landing') as HTMLElement;
        const hasMenus = getSafeMenuData()
        const userId= userDataParsed.id
        if (hasReport && landingEl && !hasMenus) {
            landingEl.style.display = 'none';

            const placeholder = document.createElement('div');
            placeholder.className = 'report-placeholder';
            placeholder.innerHTML = `
                <div class="placeholder-card">
                    <div class="placeholder-icon"><i class="fas fa-clipboard-list"></i></div>
                    <h2>Your personalized content will appear here</h2>
                    <p>We detected your recommended daily calories. This area will soon show your personalized menu and insights.</p>
                    <button id="getMenusButton" class="getMenusButton"> Get my weekly menus! </button>
                </div>
            `;
            document.getElementById('container')?.appendChild(placeholder);
            const getMenusButton=document.getElementById('getMenusButton') as HTMLButtonElement;

            getMenusButton?.addEventListener('click',async (event: any)=>{
                event.preventDefault();
                // Get loading and success elements
                const loadingIndicator = document.getElementById('loadingIndicator') as HTMLElement;
                const successMessage = document.getElementById('successMessage') as HTMLElement;
                
                // Disable button and show loading
                getMenusButton.disabled = true;
                loadingIndicator.classList.add('show');

                try {
                    const response = await fetch(`http://localhost:8000/getWeeklyMenus?id=${encodeURIComponent(userId)}`, {
                    method: 'POST'
                });
                    if (!response.ok) {
                        throw new Error('Failed to fetch weekly menus');
                    }

                    const menuData = await response.json();

                    // Handle successful response
                    console.log('Weekly menus:', menuData);
                    
                    // Save menu data to localStorage with proper handling of special characters
                    try {
                        // Ensure data is properly serializable
                        const serializedData = JSON.stringify(menuData);
                        localStorage.setItem('user_menus', serializedData);
                    } catch (storageError) {
                        console.error('Error saving to localStorage:', storageError);
                        
                        // Fallback: sanitize and try again
                        try {
                            // Create a deep clone to remove any non-serializable properties
                            const sanitizedData = JSON.parse(JSON.stringify(menuData));
                            localStorage.setItem('user_menus', JSON.stringify(sanitizedData));
                        } catch (fallbackError) {
                            console.error('Fallback storage also failed:', fallbackError);
                            throw new Error('Failed to save menu data to localStorage');
                        }
                    }

                    const creationDate= new Date().toISOString().split('T')[0];
                    localStorage.setItem('creation_date', creationDate);

                    loadingIndicator.classList.remove('show');
                    successMessage.classList.add('show');
                    // Hide success message after 1 second and reload page
                    setTimeout(() => {
                        successMessage.classList.remove('show');
                        setTimeout(() => {
                            window.location.reload();
                        }, 400); // Wait for animation to complete
                    }, 1000);

                } catch (error) {
                    console.error('Error fetching weekly menus:', error);
                    
                    // Hide loading indicator
                    loadingIndicator.classList.remove('show');
                    
                    // Re-enable button
                    getMenusButton.disabled = false;
                    
                    // Show error message using SweetAlert (for errors only)
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to generate your weekly menus. Please try again.',
                        confirmButtonText: 'OK'
                    });
                }
            });

        }else if(hasReport && landingEl && hasMenus){
            landingEl.style.display = 'none';
            createMenuDashboard(hasMenus);
        }


    } catch (err) {
        console.error(err)
    }

    // CTA button → profile page
    const cta1 = document.getElementById('ctaCompleteProfile');
    if (cta1) {
        cta1.addEventListener('click', (e) => {
            e.preventDefault();
            if(localStorage.getItem('user_data')){
                window.location.href = 'profile.html';
            }
            else{
            Swal.fire({
                title:"No user found",
                text:"Please, log-in again",
                icon:'question',
            })
            }
        });
    }
});
