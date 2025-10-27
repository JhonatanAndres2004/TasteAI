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
    
    // Load day 1 chat history by default since day 1 is active initially
    loadInitialChatHistory();
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
                            <span>Send</span>
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

            clearChatMessages();
            
            //Load existing messages from local storage, draw both system and user messages
            const chatHistory = JSON.parse(localStorage.getItem('chat_history') || '{}');
            const dayChatHistory = chatHistory["day"+(index+1)];
            if (dayChatHistory) {
                dayChatHistory.forEach((message: any) => {
                    addMessageToChat(message.userRequest, 'user');
                    addMessageToChat(message.response, 'assistant');
                });
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
                if(result["day"+dayNumber]) {
                    modifyLocalStorageDailyMenu(dayNumber, result["day"+dayNumber],message,result.notes);
                }
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

function modifyLocalStorageDailyMenu(dayNumber: number, menu: Array<any>, message: string, response: string) {
    const menuData = JSON.parse(localStorage.getItem('user_menus') || '{}');
    //Check if that day's menu is not empty
    if(menu.length > 0){
        menuData["day"+dayNumber] = menu;
        localStorage.setItem('user_menus', JSON.stringify(menuData));
        // Refresh the dashboard for this specific day
        refreshDashboardDay(dayNumber, menu);
    }else{
        console.log(`No changes made to the menu for day ${dayNumber} due to vague user request`);
    }
    //Now update the chat history in local storage
    const currentChatHistory = JSON.parse(localStorage.getItem('chat_history') || '{}');
    
    //Initialize the chat history for the day if it doesn't exist
    if (!currentChatHistory["day"+dayNumber]) {
        currentChatHistory["day"+dayNumber] = [];
      }

    currentChatHistory["day"+dayNumber].push({
        userRequest: message,
        response: response
    });
    localStorage.setItem('chat_history', JSON.stringify(currentChatHistory));


}

// Function to refresh dashboard content for a specific day
function refreshDashboardDay(dayNumber: number, updatedMenu: Array<any>) {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayKey = `day${dayNumber}`;
    
    // Find the specific day panel
    const dayPanel = document.querySelector(`.tab-panel[data-day="${dayKey}"]`) as HTMLElement;
    if (!dayPanel) {
        console.error(`Day panel not found for ${dayKey}`);
        return;
    }

    // Calculate new totals for the updated menu
    const totals = calculateDailyTotals(updatedMenu);
    
    // Update the day content
    const dayIndex = dayNumber - 1;
    const dayContent = `
        <div class="day-content">
            <div class="day-header">
                <h2>${dayNames[dayIndex]} - Day ${dayNumber}</h2>
                <div class="meal-count">
                    <i class="fas fa-utensils"></i>
                    <span>${updatedMenu.length} meals planned</span>
                </div>
            </div>
            
            <div class="meals-container">
                ${updatedMenu.map((meal: any) => createMealComponent(meal)).join('')}
            </div>
            
            ${createDailySummary(totals)}
        </div>
    `;
    
    // Add a subtle refresh animation
    dayPanel.style.transition = 'opacity 0.3s ease-in-out';
    dayPanel.style.opacity = '0.7';
    
    // Replace the content after a brief delay to show the animation
    setTimeout(() => {
        dayPanel.innerHTML = dayContent;
        dayPanel.style.opacity = '1';
        
        // Also update the tab button to show it's been updated (optional visual feedback)
        const tabButton = document.querySelector(`.tab-btn[data-day="${dayKey}"]`) as HTMLElement;
        if (tabButton && tabButton.classList.contains('active')) {
            // Add a brief highlight effect to the active tab
            tabButton.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.5)';
            setTimeout(() => {
                tabButton.style.boxShadow = '';
            }, 1000);
        }
    }, 150);
    
    console.log(`Dashboard refreshed for Day ${dayNumber}`);
}

// Function to clear chat messages (keeping only the default message)
function clearChatMessages() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    // Remove all messages except the default message
    const messages = chatMessages.querySelectorAll('.message:not(.default-message)');
    messages.forEach(message => message.remove());
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

// Function to load initial chat history for day 1
function loadInitialChatHistory() {
    // Load existing messages from local storage for day 1
    const chatHistory = JSON.parse(localStorage.getItem('chat_history') || '{}');
    const day1ChatHistory = chatHistory["day1"];
    
    if (day1ChatHistory) {
        day1ChatHistory.forEach((message: any) => {
            addMessageToChat(message.userRequest, 'user');
            addMessageToChat(message.response, 'assistant');
        });
    }
}

// Function to check if menu has expired (7+ days)
function checkMenuExpiration() {
    const creationDateStr = localStorage.getItem('user_menus_creation_date');
    
    if (!creationDateStr) {
        console.log('No menu creation date found');
        return;
    }
    
    try {
        const creationDate = new Date(creationDateStr);
        const currentDate = new Date();
        
        // Calculate the difference in days
        const timeDiff = currentDate.getTime() - creationDate.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
        
        console.log(`Menu age: ${daysDiff} days`);
        
        // If 7 or more days have passed, show expiration feedback form
        if (daysDiff >= 7) {
            showMenuExpirationForm(daysDiff);
        }
    } catch (error) {
        console.error('Error checking menu expiration:', error);
    }
}

// Function to show menu expiration feedback form
function showMenuExpirationForm(daysDiff: number) {
    Swal.fire({
        title: 'Weekly Menu Feedback',
        width: '650px',
        html: `
            <div style="text-align: left; max-height: 520px; overflow-y: auto; padding: 15px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; scrollbar-width: none; -ms-overflow-style: none;">
                <style>
                    .feedback-scroll-container::-webkit-scrollbar {
                        display: none;
                    }
                </style>
                <p style="text-align: center; color:rgb(8, 99, 189); font-weight: 600; margin-bottom: 15px; font-size: 0.95rem;">
                    Your menu was created ${daysDiff} days ago and has expired.
                </p>
                <p style="text-align: center; margin-bottom: 25px; color: #555; font-size: 0.9rem;">
                    Please share your feedback to help us improve your next menu!
                </p>
                
                <div style="margin-bottom: 25px;">
                    <label style="display: block; font-weight: 600; margin-bottom: 12px; color: #333; font-size: 0.95rem;">
                        1. Overall, how satisfied were you with this week's meals?
                    </label>
                    <div style="display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 10px;">
                        ${[1, 2, 3, 4, 5].map((num, idx) => {
                            const colors = ['#dc2626', '#f59e0b', '#eab308', '#84cc16', '#10b981'];
                            return `
                                <input type="radio" name="satisfaction" value="${num}" id="satisfaction${num}" style="display: none;" ${num === 3 ? 'checked' : ''}>
                                <label for="satisfaction${num}" class="rating-square" data-group="satisfaction" data-rating="${num}" style="
                                    width: 40px;
                                    height: 40px;
                                    background: ${colors[idx]};
                                    border-radius: 8px;
                                    cursor: pointer;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-weight: 700;
                                    color: white;
                                    font-size: 0.95rem;
                                    transition: all 0.2s ease;
                                    border: 3px solid transparent;
                                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                                " onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.2)'" 
                                   onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 8px rgba(0, 0, 0, 0.1)'"
                                   onclick="document.querySelectorAll('[data-group=satisfaction]').forEach(el => el.style.border='3px solid transparent'); this.style.border='3px solid #009FE2';">
                                    ${num}
                                </label>
                            `;
                        }).join('')}
                    </div>
                </div>

                <div style="margin-bottom: 25px;">
                    <label style="display: block; font-weight: 600; margin-bottom: 12px; color: #333; font-size: 0.95rem;">
                        2. Did the portion sizes feel appropriate?
                    </label>
                    <div style="position: relative;">
                        <select id="portionSize" class="feedback-custom-select" style="
                            width: 100%;
                            padding: 12px 15px;
                            background: rgba(255,255,255,0.9);
                            border: 1px solid rgba(0,0,0,0.08);
                            border-radius: 12px;
                            color: #222;
                            font-size: 0.95rem;
                            font-family: inherit;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            appearance: base-select;
                        " onfocus="this.style.borderColor='#009FE2'; this.style.boxShadow='0 0 0 3px rgba(0, 159, 226, 0.08)'"
                           onblur="this.style.borderColor='rgba(0,0,0,0.08)'; this.style.boxShadow='none'">
                            <button type="button" style="
                                width: 100%;
                                padding: 12px 15px;
                                background: rgba(255,255,255,0.9);
                                border: 1px solid rgba(0,0,0,0.08);
                                border-radius: 12px;
                                color: #222;
                                font-size: 0.95rem;
                                transition: all 0.3s ease;
                                backdrop-filter: blur(5px);
                                font-family: inherit;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                                text-align: left;
                            ">
                                <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                                    <selectedcontent></selectedcontent>
                                    <svg width="24" height="24" viewBox="0 0 24 24" style="color: #009FE2; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
                                        <path fill="currentColor" d="m7 10l5 5l5-5z"/>
                                    </svg>
                                </div>
                            </button>
                            <div>
                                <option value="just-right" selected>
                                    <div style="display: flex; gap: 12px; align-items: center; width: 100%;">
                                        <span style="flex: 1;">Just right</span>
                                    </div>
                                </option>
                                <option value="too-small">
                                    <div style="display: flex; gap: 12px; align-items: center; width: 100%;">
                                        <span style="flex: 1;">Too small</span>
                                    </div>
                                </option>
                                <option value="too-large">
                                    <div style="display: flex; gap: 12px; align-items: center; width: 100%;">
                                        <span style="flex: 1;">Too large</span>
                                    </div>
                                </option>
                            </div>
                        </select>
                    </div>
                </div>

                <div style="margin-bottom: 25px;">
                    <label style="display: block; font-weight: 600; margin-bottom: 12px; color: #333; font-size: 0.95rem;">
                        3. Which meals or ingredients would you prefer not to see again? (Optional)
                    </label>
                    <textarea id="avoidIngredients" placeholder="E.g., salmon, broccoli, spicy foods..." style="
                        width: 100%;
                        height: 70px;
                        padding: 12px 15px;
                        background: rgba(255,255,255,0.9);
                        border: 1px solid rgba(0,0,0,0.08);
                        border-radius: 12px;
                        color: #222;
                        font-size: 0.9rem;
                        font-family: inherit;
                        resize: vertical;
                        transition: all 0.3s ease;
                    " onfocus="this.style.borderColor='#009FE2'; this.style.boxShadow='0 0 0 3px rgba(0, 159, 226, 0.08)'"
                       onblur="this.style.borderColor='rgba(0,0,0,0.08)'; this.style.boxShadow='none'"></textarea>
                </div>

                <div style="margin-bottom: 25px;">
                    <label style="display: block; font-weight: 600; margin-bottom: 12px; color: #333; font-size: 0.95rem;">
                        4. Did you notice any changes in how you feel?
                    </label>
                    <textarea id="feelingChanges" placeholder="More energy, better sleep, digestive comfort, etc..." style="
                        width: 100%;
                        height: 70px;
                        padding: 12px 15px;
                        background: rgba(255,255,255,0.9);
                        border: 1px solid rgba(0,0,0,0.08);
                        border-radius: 12px;
                        color: #222;
                        font-size: 0.9rem;
                        font-family: inherit;
                        resize: vertical;
                        transition: all 0.3s ease;
                    " onfocus="this.style.borderColor='#009FE2'; this.style.boxShadow='0 0 0 3px rgba(0, 159, 226, 0.08)'"
                       onblur="this.style.borderColor='rgba(0,0,0,0.08)'; this.style.boxShadow='none'"></textarea>
                </div>

                <div style="margin-bottom: 25px;">
                    <label style="display: block; font-weight: 600; margin-bottom: 12px; color: #333; font-size: 0.95rem;">
                        5. How would you rate the variety of the menu?
                    </label>
                    <div style="display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 10px;">
                        ${[1, 2, 3, 4, 5].map((num, idx) => {
                            const colors = ['#dc2626', '#f59e0b', '#eab308', '#84cc16', '#10b981'];
                            return `
                                <input type="radio" name="variety" value="${num}" id="variety${num}" style="display: none;" ${num === 3 ? 'checked' : ''}>
                                <label for="variety${num}" class="rating-square" data-group="variety" data-rating="${num}" style="
                                    width: 40px;
                                    height: 40px;
                                    background: ${colors[idx]};
                                    border-radius: 8px;
                                    cursor: pointer;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-weight: 700;
                                    color: white;
                                    font-size: 0.95rem;
                                    transition: all 0.2s ease;
                                    border: 3px solid transparent;
                                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                                " onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.2)'" 
                                   onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 8px rgba(0, 0, 0, 0.1)'"
                                   onclick="document.querySelectorAll('[data-group=variety]').forEach(el => el.style.border='3px solid transparent'); this.style.border='3px solid #009FE2';">
                                    ${num}
                                </label>
                            `;
                        }).join('')}
                    </div>
                </div>

                <div style="margin-bottom: 25px;">
                    <label style="display: block; font-weight: 600; margin-bottom: 12px; color: #333; font-size: 0.95rem;">
                        6. Did you notice any physical changes this week?
                    </label>
                    <div style="position: relative;">
                        <select id="physicalChanges" class="feedback-custom-select" style="
                            width: 100%;
                            padding: 12px 15px;
                            background: rgba(255,255,255,0.9);
                            border: 1px solid rgba(0,0,0,0.08);
                            border-radius: 12px;
                            color: #222;
                            font-size: 0.95rem;
                            font-family: inherit;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            appearance: base-select;
                        " onfocus="this.style.borderColor='#009FE2'; this.style.boxShadow='0 0 0 3px rgba(0, 159, 226, 0.08)'"
                           onblur="this.style.borderColor='rgba(0,0,0,0.08)'; this.style.boxShadow='none'">
                            <button type="button" style="
                                width: 100%;
                                padding: 12px 15px;
                                background: rgba(255,255,255,0.9);
                                border: 1px solid rgba(0,0,0,0.08);
                                border-radius: 12px;
                                color: #222;
                                font-size: 0.95rem;
                                transition: all 0.3s ease;
                                backdrop-filter: blur(5px);
                                font-family: inherit;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                                text-align: left;
                            ">
                                <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                                    <selectedcontent></selectedcontent>
                                    <svg width="24" height="24" viewBox="0 0 24 24" style="color: #009FE2; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
                                        <path fill="currentColor" d="m7 10l5 5l5-5z"/>
                                    </svg>
                                </div>
                            </button>
                            <div>
                                <option value="maintained" selected>
                                    <div style="display: flex; gap: 12px; align-items: center; width: 100%;">
                                        <span style="flex: 1;">Maintained</span>
                                    </div>
                                </option>
                                <option value="lost-weight">
                                    <div style="display: flex; gap: 12px; align-items: center; width: 100%;">
                                        <span style="flex: 1;">Lost weight</span>
                                    </div>
                                </option>
                                <option value="gained-muscle">
                                    <div style="display: flex; gap: 12px; align-items: center; width: 100%;">
                                        <span style="flex: 1;">Gained muscle</span>
                                    </div>
                                </option>
                            </div>
                        </select>
                    </div>
                </div>

                <div id="loadingContainer" style="display: none; text-align: center; margin-top: 25px; padding: 20px; background: rgba(0, 159, 226, 0.05); border-radius: 12px; border: 1px solid rgba(0, 159, 226, 0.1);">
                    <div style="border: 4px solid rgba(0, 159, 226, 0.2); border-top: 4px solid #009FE2; border-radius: 50%; width: 50px; height: 50px; animation: feedbackSpin 1s linear infinite; margin: 0 auto;"></div>
                    <p style="margin-top: 15px; color: #009FE2; font-weight: 600; font-size: 0.95rem;">Generating your new menu...</p>
                </div>
            </div>
            <style>
                @keyframes feedbackSpin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .swal2-popup {
                    border-radius: 20px !important;
                    padding: 25px !important;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
                }
                .swal2-title {
                    color: #222 !important;
                    font-size: 1.5rem !important;
                    font-weight: 600 !important;
                    margin-bottom: 15px !important;
                }
                /* Hide scrollbar for Webkit browsers */
                .swal2-html-container::-webkit-scrollbar {
                    display: none;
                }
                /* Hide scrollbar for Firefox */
                .swal2-html-container {
                    scrollbar-width: none;
                }
                /* Hide scrollbar for IE and Edge */
                .swal2-html-container {
                    -ms-overflow-style: none;
                }
                
                /* Custom Select Styling */
                .feedback-custom-select {
                    appearance: base-select !important;
                    background: none !important;
                    padding: 0 !important;
                    border: none !important;
                    box-shadow: none !important;
                }
                
                /* Picker icon hiding */
                .feedback-custom-select::picker-icon {
                    display: none;
                }
                
                /* Picker transitions */
                .feedback-custom-select::picker(select) {
                    appearance: base-select;
                    transition: opacity .2s ease, transform .2s cubic-bezier(0.4, 0, 0.2, 1), display .2s allow-discrete, overlay .2s allow-discrete;
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 12px;
                    padding: 0;
                    margin-block: 5px;
                    box-shadow: 0 25px 45px rgba(0, 0, 0, 0.08);
                    border: 1px solid rgba(0, 0, 0, 0.05);
                    backdrop-filter: blur(8px);
                }
                
                .feedback-custom-select:not(:open)::picker(select) {
                    opacity: 0;
                    transform: scale(.95);
                }
                
                .feedback-custom-select:open::picker(select) {
                    opacity: 1;
                    transform: scale(1);
                }
                
                /* Rotate arrow on open */
                .feedback-custom-select:open > button svg {
                    transform: rotate(0.5turn);
                }
                
                /* Custom button focus styles */
                .feedback-custom-select > button:focus-visible {
                    outline: none;
                    border-color: #009FE2;
                    box-shadow: 0 0 0 3px rgba(0, 159, 226, 0.08);
                    background: rgba(255,255,255,0.9);
                }
                
                /* Option styling */
                .feedback-custom-select > div {
                    min-inline-size: calc(anchor-size(self-inline) + 20px);
                    scroll-behavior: smooth;
                    max-block-size: 20lh;
                    scrollbar-width: thin;
                }
                
                .feedback-custom-select > div option {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 15px;
                    font-size: 0.95rem;
                    cursor: pointer;
                    outline-offset: -1px;
                    transition: all 0.2s ease;
                }
                
                .feedback-custom-select > div option:is(:focus, :hover) {
                    background: rgba(0, 159, 226, 0.1);
                    color: inherit;
                }
                
                .feedback-custom-select > div option:is(:checked) {
                    background: linear-gradient(135deg, #009FE2 0%, #86e3ce 100%);
                    color: white;
                    font-weight: 600;
                }
                
                /* Fallback for browsers that don't support appearance: base-select */
                @supports not (appearance: base-select) {
                    .feedback-custom-select {
                        appearance: none !important;
                        -webkit-appearance: none !important;
                        -moz-appearance: none !important;
                        background: rgba(255,255,255,0.9) !important;
                        border: 1px solid rgba(0,0,0,0.08) !important;
                        border-radius: 12px !important;
                        padding: 12px 45px 12px 15px !important;
                        color: #222 !important;
                        font-size: 0.95rem !important;
                        cursor: pointer !important;
                        background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23009FE2%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276,9 12,15 18,9%27%3e%3c/polyline%3e%3c/svg%3e') !important;
                        background-repeat: no-repeat !important;
                        background-position: right 12px center !important;
                        background-size: 16px !important;
                    }
                    
                    .feedback-custom-select > button,
                    .feedback-custom-select > div {
                        display: none !important;
                    }
                    
                    .feedback-custom-select option {
                        background-color: #ebf5fd !important;
                        color: #222 !important;
                        padding: 8px 12px !important;
                    }
                }
            </style>
        `,
        showCancelButton: false,
        showConfirmButton: true,
        confirmButtonText: 'Generate Next Week\'s Menu',
        allowOutsideClick: false,
        customClass: {
            popup: 'swal-custom-popup',
            confirmButton: 'swal-feedback-confirm-btn'
        },
        didOpen: () => {
            // Apply custom styling to the confirm button
            const confirmBtn = document.querySelector('.swal-feedback-confirm-btn') as HTMLElement;
            if (confirmBtn) {
                confirmBtn.style.background = 'linear-gradient(135deg, #009FE2 0%, #86e3ce 100%)';
                confirmBtn.style.borderRadius = '12px';
                confirmBtn.style.padding = '12px 24px';
                confirmBtn.style.fontSize = '1rem';
                confirmBtn.style.fontWeight = '600';
                confirmBtn.style.transition = 'all 0.3s ease';
                confirmBtn.style.border = 'none';
                confirmBtn.style.boxShadow = '0 8px 25px rgba(0, 159, 226, 0.15)';
                confirmBtn.onmouseover = () => {
                    confirmBtn.style.background = 'linear-gradient(135deg, #0089c7 0%, #6dd6b8 100%)';
                    confirmBtn.style.transform = 'translateY(-2px)';
                    confirmBtn.style.boxShadow = '0 12px 35px rgba(0, 159, 226, 0.25)';
                };
                confirmBtn.onmouseout = () => {
                    confirmBtn.style.background = 'linear-gradient(135deg, #009FE2 0%, #86e3ce 100%)';
                    confirmBtn.style.transform = 'translateY(0)';
                    confirmBtn.style.boxShadow = '0 8px 25px rgba(0, 159, 226, 0.15)';
                };
            }
            
            // Set initial checked state for rating squares
            const satisfaction3 = document.getElementById('satisfaction3');
            const variety3 = document.getElementById('variety3');
            if (satisfaction3 && satisfaction3.nextElementSibling) {
                (satisfaction3.nextElementSibling as HTMLElement).style.border = '3px solid #009FE2';
            }
            if (variety3 && variety3.nextElementSibling) {
                (variety3.nextElementSibling as HTMLElement).style.border = '3px solid #009FE2';
            }
        },
        preConfirm: async () => {
            // Collect feedback data
            const satisfactionRadio = document.querySelector('input[name="satisfaction"]:checked') as HTMLInputElement;
            const portionSizeSelect = document.getElementById('portionSize') as HTMLSelectElement;
            const avoidIngredientsTextarea = document.getElementById('avoidIngredients') as HTMLTextAreaElement;
            const feelingChangesTextarea = document.getElementById('feelingChanges') as HTMLTextAreaElement;
            const varietyRadio = document.querySelector('input[name="variety"]:checked') as HTMLInputElement;
            const physicalChangesSelect = document.getElementById('physicalChanges') as HTMLSelectElement;

            // Store feedback values (for future use)
            const feedbackData = {
                satisfactionScore: parseInt(satisfactionRadio?.value || '3'),
                portionSizeFeedback: portionSizeSelect?.value || 'just-right',
                ingredientsFeedback: avoidIngredientsTextarea?.value || '',
                moodFeedback: feelingChangesTextarea?.value || '',
                varietyFeedback: parseInt(varietyRadio?.value || '3'),
                physicalChangesFeedback: physicalChangesSelect?.value || 'maintained'
            };

            console.log('Feedback data collected:', feedbackData);

            // Hide the confirm button and show loading
            const confirmButton = Swal.getConfirmButton();
            if (confirmButton) {
                confirmButton.style.display = 'none';
            }
            
            const loadingContainer = document.getElementById('loadingContainer');
            if (loadingContainer) {
                loadingContainer.style.display = 'block';
            }

            // Get user ID
            const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
            const userId = userData.id;

            if (!userId) {
                Swal.fire({
                    title: 'Error',
                    text: 'User not found. Please log in again.',
                    icon: 'error'
                });
                return false;
            }

            try {
                // Call the menu generation endpoint with feedback data
                const response = await fetch('http://localhost:8000/getWeeklyMenus', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: userId,
                        userFeedback: feedbackData
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch weekly menus');
                }

                const menuData = await response.json();
                console.log('New weekly menus:', menuData);

                // Save menu data to localStorage
                try {
                    const serializedData = JSON.stringify(menuData);
                    localStorage.setItem('user_menus', serializedData);
                    
                    // Save the new creation date
                    const creationDate = new Date().toISOString();
                    localStorage.setItem('user_menus_creation_date', creationDate);
                    
                    // Clear chat history from localStorage
                    localStorage.removeItem('chat_history');
                    console.log('Chat history cleared from localStorage');
                } catch (storageError) {
                    console.error('Error saving to localStorage:', storageError);
                    
                    // Fallback: sanitize and try again
                    const sanitizedData = JSON.parse(JSON.stringify(menuData));
                    localStorage.setItem('user_menus', JSON.stringify(sanitizedData));
                    
                    const creationDate = new Date().toISOString();
                    localStorage.setItem('user_menus_creation_date', creationDate);
                    
                    // Clear chat history from localStorage
                    localStorage.removeItem('chat_history');
                    console.log('Chat history cleared from localStorage');
                }

                return true;
            } catch (error) {
                console.error('Error generating new menu:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to generate your weekly menus. Please try again.',
                    confirmButtonText: 'OK'
                });
                return false;
            }
        }
    }).then((result: any) => {
        if (result.isConfirmed && result.value === true) {
            // Show success message and reload
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Your new weekly menu has been generated.',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                window.location.reload();
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Show initial loading indicator
    const initialLoadingIndicator = document.getElementById('initialLoadingIndicator') as HTMLElement;
    
    // Function to handle the page logic after loading delay
    function handlePageLogic() {
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
                    Swal.fire({
                        title: 'Logged Out',
                        text: 'You have been logged out successfully.',
                        icon: 'success',
                        confirmButtonColor: '#28a745',
                        timer: 1000,
                        showConfirmButton: false,
                        customClass: {
                            popup: 'swal-custom-popup',
                            confirmButton: 'swal-confirm-btn'   
                        }
                    }).then(() => {
                        // Log out after the success message has been shown for 1 second
                        userManager.logout();
                    });
                }
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
                        const response = await fetch('http://localhost:8000/getWeeklyMenus', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            id: userId,
                            userFeedback: null
                        })
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
                            
                            // Save the creation date
                            const creationDate = new Date().toISOString();
                            localStorage.setItem('user_menus_creation_date', creationDate);
                            
                            // Clear chat history from localStorage
                            localStorage.removeItem('chat_history');
                            console.log('Chat history cleared from localStorage');
                        } catch (storageError) {
                            console.error('Error saving to localStorage:', storageError);
                            
                            // Fallback: sanitize and try again
                            try {
                                // Create a deep clone to remove any non-serializable properties
                                const sanitizedData = JSON.parse(JSON.stringify(menuData));
                                localStorage.setItem('user_menus', JSON.stringify(sanitizedData));
                                
                                // Save the creation date
                                const creationDate = new Date().toISOString();
                                localStorage.setItem('user_menus_creation_date', creationDate);
                                
                                // Clear chat history from localStorage
                                localStorage.removeItem('chat_history');
                                console.log('Chat history cleared from localStorage');
                            } catch (fallbackError) {
                                console.error('Fallback storage also failed:', fallbackError);
                                throw new Error('Failed to save menu data to localStorage');
                            }
                        }


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
                // Check if menu has expired
                checkMenuExpiration();
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

        // Hide initial loading indicator after page logic is complete
        if (initialLoadingIndicator) {
            initialLoadingIndicator.classList.remove('show');
        }
    }

    // Wait for 0.5 seconds before processing the page logic
    setTimeout(() => {
        handlePageLogic();
    }, 500);
});
