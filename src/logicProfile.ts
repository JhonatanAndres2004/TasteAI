import { UserManager } from './authManager.js';

// Global variables to track dynamic fields
let allergyFields: any[] = [];
let sportiveFields: any[] = [];
let medicalFields: any[] = [];
let foodPreferenceFields: any[] = [];

// Track form states to detect changes
let basicFormInitialState: any = {};
let additionalFormInitialState: any = {};
let basicFormSubmitted = false;
let additionalFormSubmitted = false;

// DOM elements
const basicForm = document.getElementById('basicInformationForm') as HTMLFormElement;
const additionalForm = document.getElementById('additionalInformationForm') as HTMLFormElement;
const basicSubmitBtn = document.getElementById('basicSubmitBtn') as HTMLButtonElement;
const additionalSubmitBtn = document.getElementById('additionalSubmitBtn') as HTMLButtonElement;
declare const Swal: any;

interface ValidationResponse {
    allergies?: any[];
    sportive_description?: any[];
    medical_conditions?: any[];
    food_preferences?: any[];
    ready_to_go?: number;
}

interface UserData {
    id?: any ;
    name?: string;
    password?: string;
    age?: number;
    sex?: string;
    weight?: number;
    height?: number;
    country?: string;
    objective?: string;
    allergies?: string[] | string;
    sportive_description?: string[] | string;
    medical_conditions?: string[] | string;
    food_preferences?: string[] | string;
    recommended_daily_calories?: number;
    detailed_report?: any;
    general_recommendation?: string;
    ready_to_go?: number;
}
interface DetailedReport {
    recommended_daily_calories?: string;
    recommended_water_intake?: string;
    recommended_protein_intake?: string;
    recommended_fats_intake?: string;
    recommended_carbohydrates_intake?: string;
    nutritional_deficiency_risks?: string[];
    general_recommendation?: string[];
}


// Initialize the forms
document.addEventListener('DOMContentLoaded', function() {
    initializeForms();
    setupEventListeners();
    addSportiveField(); // Add one sportive field by default
    addMedicalField(); // Add one medical field by default
    addFoodPreferenceField(); // Add one food preference field by default
    obtainExistingData();
    captureInitialStates();
    validateBasicForm();
    validateAdditionalForm();
    checkForExistingInputsAndShowReportButton();
    checkForExistingReportData();
});

function initializeForms() {
    // Set up form submissions
    basicForm?.addEventListener('submit', handleBasicFormSubmission);
    additionalForm?.addEventListener('submit', handleAdditionalFormSubmission);
    
    // Set up real-time validation
    setupRealTimeValidation();
}

function captureInitialStates() {
    // Capture initial state of basic form
    const basicInputs = basicForm?.querySelectorAll('input, select');
    basicFormInitialState = {}; // Reset global variable
    basicInputs?.forEach((input: any) => {
        basicFormInitialState[input.name] = input.value;
    });
    
    
    // Capture initial state of additional form (will be updated when fields are added)
    updateAdditionalFormInitialState();
}

function updateAdditionalFormInitialState() {
    const additionalFormInitialState: any = {
        allergies: [],
        sportive: [],
        medical: [],
        foodPreferences: []
    };
    
    // Capture current dynamic fields
    document.querySelectorAll('input[name="allergies[]"]').forEach((input: any) => {
        additionalFormInitialState.allergies.push(input.value);
    });
    
    document.querySelectorAll('input[name="sportive_description[]"]').forEach((input: any) => {
        additionalFormInitialState.sportive.push(input.value);
    });
    
    document.querySelectorAll('input[name="medical_conditions[]"]').forEach((input: any) => {
        additionalFormInitialState.medical.push(input.value);
    });
    
    document.querySelectorAll('input[name="food_preferences[]"]').forEach((input: any) => {
        additionalFormInitialState.foodPreferences.push(input.value);
    });
}

let userId: any = null;
function obtainExistingData() {
    // Check if user data is available in localStorage
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    if (userData) {
        // Populate Basic Info section, including weight, height, objective,    
        (document.getElementById('name') as HTMLInputElement).value = userData.name || '';
        (document.getElementById('age') as HTMLInputElement).value = userData.age || '';  
        (document.getElementById('weight') as HTMLInputElement).value = userData.weight || '';
        (document.getElementById('sex') as HTMLInputElement).value=userData.sex || '';
        (document.getElementById('height') as HTMLInputElement).value = userData.height || '';
        (document.getElementById('objective') as HTMLInputElement).value = userData.objective || '';
        (document.getElementById('country') as HTMLInputElement).value = userData.country || '';
        userId = userData.id; // Store user ID if available
        
        // Populate additional information fields if they exist
        populateAdditionalFields(userData);
    }
}


function setupEventListeners() {
    // Add input event listeners for real-time validation
    const basicInputs = basicForm?.querySelectorAll('input, select');
    basicInputs?.forEach((input: any) => {
        input.addEventListener('input', validateBasicField);
        input.addEventListener('blur', validateBasicField);
        input.addEventListener('input', checkBasicFormChanges);
    });
}

function goToHomepage() {
    // Navigate to homepage - update this URL as needed
    window.location.href = './homePage.html';
}

function addAllergyField() {
    const container = document.getElementById('allergiesContainer');
    const fieldId = `allergy_${allergyFields.length}`;
    
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'dynamic-field';
    fieldDiv.innerHTML = `
        <div class="input-wrapper">
            <i class="fas fa-allergies"></i>
            <input type="text" id="${fieldId}" name="allergies[]" placeholder="Enter allergy">
        </div>
        <button type="button" class="remove-btn" onclick="removeField('${fieldId}', 'allergy')">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container?.appendChild(fieldDiv);
    allergyFields.push(fieldId);
    
    // Add validation listener
    const input = document.getElementById(fieldId) as HTMLInputElement;
    input?.addEventListener('input', validateAdditionalForm);
    input?.addEventListener('input', checkAdditionalFormChanges);
    input?.addEventListener('input', () => clearFeedbackOnInput(fieldId));
    
    // Mark that form has changed when new field is added
    additionalFormSubmitted = false;
}

function addSportiveField() {
    const container = document.getElementById('sportiveContainer');
    const fieldId = `sportive_${sportiveFields.length}`;
    
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'dynamic-field';
    fieldDiv.innerHTML = `
        <div class="input-wrapper">
            <i class="fas fa-running"></i>
            <input type="text" id="${fieldId}" name="sportive_description[]" placeholder="Enter sportive description: running every friday, swimming two times a week, etc">
        </div>
        <button type="button" class="remove-btn" onclick="removeField('${fieldId}', 'sportive')">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container?.appendChild(fieldDiv);
    sportiveFields.push(fieldId);
    
    // Add validation listener
    const input = document.getElementById(fieldId) as HTMLInputElement;
    input?.addEventListener('input', validateAdditionalForm);
    input?.addEventListener('blur', validateAdditionalForm);
    input?.addEventListener('input', checkAdditionalFormChanges);
    input?.addEventListener('input', () => clearFeedbackOnInput(fieldId));
    
    // Mark that form has changed when new field is added
    additionalFormSubmitted = false;
}

function addMedicalField() {
    const container = document.getElementById('medicalContainer');
    const fieldId = `medical_${medicalFields.length}`;
    
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'dynamic-field';
    fieldDiv.innerHTML = `
        <div class="input-wrapper">
            <i class="fas fa-heartbeat"></i>
            <input type="text" id="${fieldId}" name="medical_conditions[]" placeholder="Enter medical condition">
        </div>
        <button type="button" class="remove-btn" onclick="removeField('${fieldId}', 'medical')">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container?.appendChild(fieldDiv);
    medicalFields.push(fieldId);
    
    // Add validation listener
    const input = document.getElementById(fieldId) as HTMLInputElement;
    input?.addEventListener('input', validateAdditionalForm);
    input?.addEventListener('input', checkAdditionalFormChanges);
    input?.addEventListener('input', () => clearFeedbackOnInput(fieldId));
    
    // Mark that form has changed when new field is added
    additionalFormSubmitted = false;
}

function addFoodPreferenceField() {
    const container = document.getElementById('foodPreferencesContainer');
    const fieldId = `foodPreference_${foodPreferenceFields.length}`;
    
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'dynamic-field';
    fieldDiv.innerHTML = `
        <div class="input-wrapper">
            <i class="fas fa-utensils"></i>
            <input type="text" id="${fieldId}" name="food_preferences[]" placeholder="Enter food preferences or dislike: vegan diet, I don't like pork, etc">
        </div>
        <button type="button" class="remove-btn" onclick="removeField('${fieldId}', 'foodPreference')">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container?.appendChild(fieldDiv);
    foodPreferenceFields.push(fieldId);
    
    // Add validation listener
    const input = document.getElementById(fieldId) as HTMLInputElement;
    input?.addEventListener('input', validateAdditionalForm);
    input?.addEventListener('input', checkAdditionalFormChanges);
    input?.addEventListener('input', () => clearFeedbackOnInput(fieldId));
    
    // Mark that form has changed when new field is added
    additionalFormSubmitted = false;
}

function removeField(fieldId: any, type: any) {
    const fieldElement = document.getElementById(fieldId);
    if (fieldElement) {
        // Clear feedback for this specific field before removing
        clearFieldFeedback(fieldId);
        
        fieldElement.parentElement?.parentElement?.remove();
        
        // Remove from tracking arrays
        switch(type) {
            case 'allergy':
                allergyFields = allergyFields.filter(id => id !== fieldId);
                break;
            case 'sportive':
                sportiveFields = sportiveFields.filter(id => id !== fieldId);
                break;
            case 'medical':
                medicalFields = medicalFields.filter(id => id !== fieldId);
                break;
            case 'foodPreference':
                foodPreferenceFields = foodPreferenceFields.filter(id => id !== fieldId);
                break;
        }
        
        // Validate form after removal
        if (type === 'sportive') {
            validateAdditionalForm();
        }
        
        // Disable report button and enable AI suggestion when fields are removed
        disableReportButton();
        enableAISuggestionButton();
    }
}

function setupRealTimeValidation() {
    // Add validation for required fields in basic form
    const requiredFields = ['name', 'password', 'sex', 'age', 'weight', 'height', 'country', 'objective'];
    requiredFields.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (field) {
            field.addEventListener('input', validateBasicField);
            field.addEventListener('blur', validateBasicField);
        }
    });
}

function validateBasicField(event : any) {
    const field = event.target;
    const fieldName = field.name;
    const value = field.value.trim();
    
    // Remove existing error styling
    field.parentElement.parentElement.classList.remove('error');
    
    // Validate based on field type
    let isValid = true;
    let errorMessage = '';
    
    switch(fieldName) {
        case 'name':
            if (value.length < 6) {
                isValid = false;
                errorMessage = 'Name must be at least 6 characters long';
            } else if (value.length > 25) {
                isValid = false;
                errorMessage = 'Name must be less than 25 characters';
            }
            break;
            
        case 'password':
            if (value.length < 8) {
                isValid = false;
                errorMessage = 'Password must be at least 8 characters long';
            } else if (value.length > 30) {
                isValid = false;
                errorMessage = 'Password must be less than 30 characters';
            }
            break;
            
        case 'age':
            const age = parseInt(value);
            if (isNaN(age) || age < 18 || age > 100) {
                isValid = false;
                errorMessage = 'Age must be between 18 and 100';
            }
            break;
            
        case 'weight':
            if (!value || parseFloat(value) < 10) {
                isValid = false;
                errorMessage = 'Weight must be at least 10 kg';
            }
            break;
            
        case 'height':
            if (!value || parseFloat(value) < 50) {
                isValid = false;
                errorMessage = 'Height must be at least 50 cm';
            }
            break;
        case 'country':
            if (!value) {
                isValid = false;
                errorMessage = 'Country is required';
            }
            break;
        case 'objective':
            if (!value) {
                isValid = false;
                errorMessage = 'Objective is required';
            }
            break;
    }
    
    // Apply validation styling
    if (!isValid) {
        field.parentElement.parentElement.classList.add('error');
        showFieldError(field, errorMessage);
    } else {
        hideFieldError(field);
    }
    
    // Validate form overall
    validateBasicForm();
    
    return isValid;
}

function showFieldError(field: any, message: any) {
    // Remove existing error message
    hideFieldError(field);
    
    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    field.parentElement.parentElement.appendChild(errorDiv);
}

function hideFieldError(field: any) {
    const existingError = field.parentElement.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
}

function validateBasicForm() {
    let isValid = true;
    
    // Check required fields
    const requiredFields = ['name', 'password', 'sex', 'age', 'weight', 'height', 'country', 'objective'];
    requiredFields.forEach(fieldName => {
        const field = document.getElementById(fieldName) as HTMLInputElement;
        if (field && !field.value.trim()) {
            isValid = false;
            field.parentElement?.parentElement?.classList.add('error');
        } else if (field && field.value.trim()) {
            field.parentElement?.parentElement?.classList.remove('error');
        }
    });
  
    // Debug logging
    console.log('validateBasicForm:', {
        isValid,
        basicFormSubmitted,
        hasChanges: hasBasicFormChanges(),
        shouldDisable: !isValid || (basicFormSubmitted && !hasBasicFormChanges())
    });
  
    // Update submit button state
    basicSubmitBtn.disabled = !isValid || (basicFormSubmitted && !hasBasicFormChanges());
    
    return isValid;
}

function validateAdditionalForm() {
    let isValid = true;
      
    // Check if at least one sportive description has content
    const sportiveInputs = document.querySelectorAll('input[name="sportive_description[]"]');
    let hasSportiveContent = false;
    sportiveInputs.forEach((input: any) => {
        if (input.value.trim()) {
            hasSportiveContent = true;
        }
    });
    
    if (!hasSportiveContent) {
        isValid = false;
        // Show error for sportive description section
        const sportiveSection = document.querySelector('.form-group:has(#sportiveContainer)');
        if (sportiveSection) {
            sportiveSection.classList.add('error');
        }
    } else {
        // Remove error if sportive description is valid
        const sportiveSection = document.querySelector('.form-group:has(#sportiveContainer)');
        if (sportiveSection) {
            sportiveSection.classList.remove('error');
        }
    }
    
    // Update submit button state
    additionalSubmitBtn.disabled = !isValid || (additionalFormSubmitted && !hasAdditionalFormChanges());
    
    return isValid;
}

function hasBasicFormChanges() {
    const currentInputs = basicForm?.querySelectorAll('input, select');
    
    for (let input of currentInputs as NodeListOf<HTMLInputElement>) {
        const initialValue = basicFormInitialState[input.name as keyof typeof basicFormInitialState];
        const currentValue = input.value;
        
        if (initialValue !== currentValue) {
            console.log('hasBasicFormChanges: true (found changes)');
            return true;
        }
    }
    console.log('hasBasicFormChanges: false (no changes)');
    return false;
}

function hasAdditionalFormChanges() {
    const currentAllergies: any[] = [];
    const currentSportive: any[] = [];
    const currentMedical: any[] = [];
    const currentFoodPreferences: any[] = [];
    
    document.querySelectorAll('input[name="allergies[]"]').forEach((input: any) => {
        currentAllergies.push(input.value);
    });
    
    document.querySelectorAll('input[name="sportive_description[]"]').forEach((input: any) => {
        currentSportive.push(input.value);
    });
    
    document.querySelectorAll('input[name="medical_conditions[]"]').forEach((input: any) => {
        currentMedical.push(input.value);
    });
    
    document.querySelectorAll('input[name="food_preferences[]"]').forEach((input: any) => {
        currentFoodPreferences.push(input.value);
    });
    
    // Compare with initial state
    if (JSON.stringify(currentAllergies) !== JSON.stringify(additionalFormInitialState.allergies) ||
        JSON.stringify(currentSportive) !== JSON.stringify(additionalFormInitialState.sportive) ||
        JSON.stringify(currentMedical) !== JSON.stringify(additionalFormInitialState.medical) ||
        JSON.stringify(currentFoodPreferences) !== JSON.stringify(additionalFormInitialState.foodPreferences)) {
        return true;
    }
    
    return false;
}

function showNotification(message: string, type: 'success' | 'error'): void {
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

function checkBasicFormChanges() {
    if (basicFormSubmitted && hasBasicFormChanges()) {
        basicFormSubmitted = false;
        validateBasicForm();
    }
}

function checkAdditionalFormChanges() {
    if (additionalFormSubmitted && hasAdditionalFormChanges()) {
        additionalFormSubmitted = false;
        validateAdditionalForm();
        // Do not clear validation feedback on typing; keep suggestions visible
        // Disable report button and enable AI suggestion button when changes are made
        disableReportButton();
        enableAISuggestionButton();
    }
}

// Custom function for basic form submission
async function handleBasicFormSubmission(event: Event) {
    event.preventDefault();
    const formData = new FormData(basicForm as HTMLFormElement);
    
    // Create user object for basic information
    const basicUserData = {
        name: formData.get('name'),
        password: formData.get('password'),
        age: parseInt(formData.get('age') as string),
        sex: formData.get('sex'),
        weight: parseFloat(formData.get('weight') as string),
        height: parseFloat(formData.get('height') as string),
        country: formData.get('country'),
        objective: formData.get('objective'),
        id: userId
    };
    console.log("Basic user data to be saved:", basicUserData);
    
    // Validate user data
    if (!validateBasicUserData(basicUserData as UserData)) {
        return;
    }
    
    // Disable button and show loading state
    const originalButtonContent = basicSubmitBtn.innerHTML;
    basicSubmitBtn.disabled = true;
    basicSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    
    // Disable form inputs during loading
    const formInputs = basicForm.querySelectorAll('input, select, button');
    formInputs.forEach((input: any) => {
        input.disabled = true;
    });
    
    try {
        const response = await fetch('/api/updateBasicInformation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },  
            body: JSON.stringify(basicUserData)
        });
        
        const serverResponse = await response.json();
        
        if (!response.ok) {
            console.error('Error updating basic information:', serverResponse);
            showNotification("Failed to save basic information", "error");
            return;
        }
        
        // Save to localStorage
        const existingData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const updatedData = { ...existingData, ...basicUserData };
        localStorage.setItem('user_data', JSON.stringify(updatedData));
        
        // Mark form as submitted and update initial state
        basicFormSubmitted = true;
        captureInitialStates();
        
        // Show success message
        showNotification("Basic information saved successfully", "success");
        
        console.log('Basic user data saved:', basicUserData);
        
    } catch (error) {
        console.error('Error updating basic information:', error);
        showNotification("Failed to save basic information", "error");
    } finally {
        // Re-enable form inputs (exclude submit button - let validation handle it)
        const formInputs = basicForm.querySelectorAll('input, select');
        formInputs.forEach((input: any) => {
            input.disabled = false;
        });
        
        // Restore button content and re-evaluate its state
        basicSubmitBtn.innerHTML = originalButtonContent;
        validateBasicForm(); // This will set the correct disabled state
    }
}

// Custom function for additional form submission
async function handleAdditionalFormSubmission(event: Event) {
    event.preventDefault();
    
    // Collect dynamic fields data
    const allergies: any[] = [];
    const sportiveDescriptions: any[] = [];
    const medicalConditions: any[] = [];
    const foodPreferences: any[] = [];
    
    // Collect allergies
    document.querySelectorAll<HTMLInputElement>('input[name="allergies[]"]').forEach(input => {
        if (input.value.trim()) {
            allergies.push(input.value.trim());
        }
    });
    
    // Collect sportive descriptions
    document.querySelectorAll<HTMLInputElement>('input[name="sportive_description[]"]').forEach(input => {
        if (input.value.trim()) {
            sportiveDescriptions.push(input.value.trim());
        }
    });
    
    // Collect medical conditions
    document.querySelectorAll<HTMLInputElement>('input[name="medical_conditions[]"]').forEach(input => {
        if (input.value.trim()) {
            medicalConditions.push(input.value.trim());
        }
    });
    
    // Collect food preferences
    document.querySelectorAll<HTMLInputElement>('input[name="food_preferences[]"]').forEach(input => {
        if (input.value.trim()) {
            foodPreferences.push(input.value.trim());
        }
    });
    
    // Create additional user data
    const additionalUserData: any = {
        allergies: allergies.length > 0 ? allergies : null,
        sportive_description: sportiveDescriptions,
        medical_conditions: medicalConditions.length > 0 ? medicalConditions : null,
        food_preferences: foodPreferences.length > 0 ? foodPreferences : null
    };
    //Add the user ID if available
    if (userId) {
        additionalUserData.id = userId;
    }
    // Validate additional data
    if (!validateAdditionalUserData(additionalUserData)) {
        return;
    }

    console.log("Additional user data to be saved:", additionalUserData);
    
    // Show loading animation
    Swal.fire({
        title: 'Analyzing your information...',
        text: 'Please wait while we validate your health data',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    // Disable form inputs during loading
    const formInputs = additionalForm.querySelectorAll('input, button');
    formInputs.forEach((input: any) => {
        input.disabled = true;
    });
    
    try {
        const response = await fetch('/api/getAISuggestion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(additionalUserData)
        });
        
        const serverResponse = await response.json();
        
        if (!response.ok) {
            console.error('Error updating additional information:', serverResponse);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to save additional information'
            });
            return;
        } else {
            console.log(response);
            
            // Close loading animation
            Swal.close();
            
            // Re-enable form inputs (exclude submit button - let validation handle it)
            const formInputs = additionalForm.querySelectorAll('input');
            formInputs.forEach((input: any) => {
                input.disabled = false;
            });
            
            // Display validation feedback
            displayValidationFeedback(serverResponse);
            
            // Show "Get my report" button if ready_to_go is 1
            if (serverResponse.ready_to_go && serverResponse.ready_to_go === 1) {

                showGetReportButton(serverResponse);
                Swal.fire({
                    icon: 'success',
                    title: 'Validation Complete!',
                    text: 'All your information has been validated successfully. You can now generate your personalized report.',
                    confirmButtonText: 'Great!'
                });

            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Validation Complete',
                    text: 'Please review the suggestions below and make necessary corrections.',
                    confirmButtonText: 'OK'
                });
            }
        }
    } catch (error) {
        console.error("Something went wrong", error);
        
        // Re-enable form inputs on error (exclude submit button - let validation handle it)
        const formInputs = additionalForm.querySelectorAll('input');
        formInputs.forEach((input: any) => {
            input.disabled = false;
        });
        
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Something went wrong while processing your request'
        });
    }

    // Save to localStorage
    //const existingData = JSON.parse(localStorage.getItem('user_data') || '{}');
    //const updatedData = { ...existingData, ...additionalUserData };
    //localStorage.setItem('userData', JSON.stringify(updatedData));
    
    // Mark form as submitted and update initial state
    additionalFormSubmitted = true;
    updateAdditionalFormInitialState();
    
    // Disable button until new changes
    validateAdditionalForm();
}

// Function to display validation feedback for each field
function displayValidationFeedback(response: ValidationResponse) {
    // Clear any existing feedback
    clearValidationFeedback();
    
    // Display allergies feedback
    if (response && response.allergies && Array.isArray(response.allergies)) {
        response.allergies.forEach((allergy, index) => {
            const input = document.querySelectorAll('input[name="allergies[]"]')[index];
            if (input) {
                displayFieldFeedback(input, allergy);
            }
        });
    }
    
    // Display sportive descriptions feedback
    if (response && response.sportive_description && Array.isArray(response.sportive_description)) {
        response.sportive_description.forEach((sport, index) => {
            const input = document.querySelectorAll('input[name="sportive_description[]"]')[index];
            if (input) {
                displayFieldFeedback(input, sport);
            }
        });
    }
    
    // Display medical conditions feedback
    if (response && response.medical_conditions && Array.isArray(response.medical_conditions)) {
        response.medical_conditions.forEach((medical, index) => {
            const input = document.querySelectorAll('input[name="medical_conditions[]"]')[index];
            if (input) {
                displayFieldFeedback(input, medical);
            }
        });
    }
    
    // Display food preferences feedback
    if (response && response.food_preferences && Array.isArray(response.food_preferences)) {
        response.food_preferences.forEach((foodPref, index) => {
            const input = document.querySelectorAll('input[name="food_preferences[]"]')[index];
            if (input) {
                displayFieldFeedback(input, foodPref);
            }
        });
    }
}

// Function to display feedback for a single field
function displayFieldFeedback(input: any, feedback: any) {
    const fieldContainer = input.closest('.dynamic-field');
    if (!fieldContainer) return;
    
    // Remove existing feedback
    const existingFeedback = fieldContainer.querySelector('.validation-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }
    
    // Create feedback element
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = 'validation-feedback';
    
    let message = '';
    let feedbackClass = '';
    
    switch (feedback.coherence_score) {
        case 3:
            message = '<i class="fas fa-check-circle"></i> Valid entry';
            feedbackClass = 'valid';
            break;
        case 2:
            message = `<i class="fas fa-lightbulb"></i> Suggestion: ${feedback.suggested_version}`;
            feedbackClass = 'warning';
            break;
        case 1:
            message = `<i class="fas fa-exclamation-triangle"></i> ${feedback.suggested_version}`;
            feedbackClass = 'error';
            break;
    }
    
    feedbackDiv.innerHTML = `<span class="${feedbackClass}">${message}</span>`;
    fieldContainer.appendChild(feedbackDiv);
}

// Function to clear all validation feedback
function clearValidationFeedback() {
    document.querySelectorAll('.validation-feedback').forEach(feedback => {
        feedback.remove();
    });
    
    // Also remove the report button when clearing feedback
    const reportButton = document.getElementById('getReportBtn');
    if (reportButton) {
        reportButton.remove();
    }
}

// Function to clear validation feedback for a specific field
function clearFieldFeedback(fieldId: any) {
    const fieldElement = document.getElementById(fieldId);
    if (fieldElement) {
        const fieldContainer = fieldElement.closest('.dynamic-field');
        if (fieldContainer) {
            const feedback = fieldContainer.querySelector('.validation-feedback');
            if (feedback) {
                feedback.remove();
            }
        }
    }
}

// Function to clear feedback when user starts typing in a field
function clearFeedbackOnInput(fieldId: any) {
    // Do not remove per-field feedback while typing; keep suggestions paired and visible
    // Only handle button state here
    disableReportButton();
    enableAISuggestionButton();
}

// Function to disable the report button
function disableReportButton() {
    const reportButton = document.getElementById('getReportBtn');
    if (reportButton) {
        reportButton.remove();
    }
}

// Function to enable the AI suggestion button
function enableAISuggestionButton() {
    const additionalSubmitBtn = document.getElementById('additionalSubmitBtn') as HTMLButtonElement;
    if (additionalSubmitBtn) {
        additionalSubmitBtn.disabled = false;
    }
}

// Function to disable the AI suggestion button
function disableAISuggestionButton() {
    const additionalSubmitBtn = document.getElementById('additionalSubmitBtn') as HTMLButtonElement;
    if (additionalSubmitBtn) {
        additionalSubmitBtn.disabled = true;
    }
}

// Function to show "Get my report" button
async function showGetReportButton(validatedData: ValidationResponse) {
    // Remove existing button if any
    const existingButton = document.getElementById('getReportBtn');
    if (existingButton) {
        existingButton.remove();
    }
    
    // Create the button
    const button = document.createElement('button');
    button.id = 'getReportBtn';
    button.type = 'button';
    button.className = 'submit-btn report-btn';
    button.innerHTML = `
        <i class="fas fa-chart-line"></i>
        <span>Save Data and get my Report</span>
    `;
    
    // Add click event
    button.addEventListener('click', async () => {
        try {
            // Extract original user input text from validated data
            const userAllergies = validatedData && validatedData.allergies && Array.isArray(validatedData.allergies) ? validatedData.allergies.map(item => item.original_version) : [];
            const userSportiveDescriptions = validatedData && validatedData.sportive_description && Array.isArray(validatedData.sportive_description) ? validatedData.sportive_description.map(item => item.original_version) : [];
            const userMedicalConditions = validatedData && validatedData.medical_conditions && Array.isArray(validatedData.medical_conditions) ? validatedData.medical_conditions.map(item => item.original_version) : [];
            const userFoodPreferences = validatedData && validatedData.food_preferences && Array.isArray(validatedData.food_preferences) ? validatedData.food_preferences.map(item => item.original_version) : [];

            // Save user input data to localStorage
            const existingData = JSON.parse(localStorage.getItem('user_data') || '{}');
            const updatedData = { 
                ...existingData, 
                allergies: userAllergies,
                sportive_description: userSportiveDescriptions,
                medical_conditions: userMedicalConditions,
                food_preferences: userFoodPreferences
            };
            localStorage.setItem('user_data', JSON.stringify(updatedData));

            // Determine the user id to use for report fetching
            const idToUse = typeof userId === 'number' ? userId : (updatedData && updatedData.id ? updatedData.id : null);

            // Track loading state and buffered save toast
            let reportLoadingActive = false;
            let bufferedSaveToast = null; // { icon, title, text }

            // Helper to emit or buffer save toast safely
            const emitOrBufferSaveToast = (toastConfig: any) => {
                if (reportLoadingActive) {
                    bufferedSaveToast = toastConfig;
                } else {
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 1500,
                        ...toastConfig
                    });
                }
            };

            // Start save to database (independent)
            fetch('/api/updateAdditionalInformation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            })
            .then(async (res) => {
                if (!res.ok) throw new Error('Failed to save to database');
                await res.json().catch(() => null);
                emitOrBufferSaveToast({ icon: 'success', title: 'Saved!', text: 'Your data has been saved successfully!' });
            })
            .catch((err) => {
                console.error('Save error:', err);
                emitOrBufferSaveToast({ icon: 'error', title: 'Save failed', text: 'Could not save your data. Please try again.' });
            });

            // Show loading animation while fetching the report (blocking)
            reportLoadingActive = true;
            Swal.fire({
                title: 'Analyzing your information...',
                text: 'Please wait while we validate your health data',
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Fetch the detailed report (independent of save)
            try {
                if (idToUse == null) {
                    throw new Error('Missing user id for report generation');
                }

                const reportResponse = await fetch(`/api/getDetailedReport?id=${encodeURIComponent(idToUse)}`, {
                    method: 'POST'
                });

                if (!reportResponse.ok) {
                    throw new Error('Failed to fetch detailed report');
                }

                const reportData = await reportResponse.json();
                console.log('Detailed Report:', reportData);

                // Merge report data into top-level user_data, normalizing types
                try {
                    const existingDataStr = localStorage.getItem('user_data') || '{}';
                    const existingData = JSON.parse(existingDataStr);

                    const normalizedReport = {recommended_daily_calories:reportData.recommended_daily_calories,
                        recommended_carbohydrates_intake:reportData.recommended_carbohydrates_intake,
                        recommended_protein_intake:reportData.recommended_protein_intake,
                        recommended_fats_intake:reportData.recommended_fats_intake,
                        recommended_water_intake:reportData.recommended_water_intake,
                        general_recommendation:reportData.general_recommendation,
                        recommended_food:reportData.recommended_food,
                        nutritional_deficiency_risks:reportData.nutritional_deficiency_risks
                    };

                    const updatedUserData = { ...existingData, ...normalizedReport };
                    localStorage.setItem('user_data', JSON.stringify(updatedUserData));
                } catch (e) {
                    console.error('Failed to save report to localStorage:', e);
                }

                // Render the detailed report dashboard
                renderDetailedReport(reportData);

                // Close loading and emit buffered toast (if any)
                Swal.close();
                reportLoadingActive = false;
                if (bufferedSaveToast) {
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 1500,
                        ...bufferedSaveToast as any
                    });
                    bufferedSaveToast = null;
                }
            } catch (err) {
                console.error('Report error:', err);
                Swal.close();
                reportLoadingActive = false;
                // Emit buffered toast (if any) even on report error
                if (bufferedSaveToast) {
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 1500,
                        ...bufferedSaveToast as any
                    });
                    bufferedSaveToast = null;
                }
                Swal.fire({
                    icon: 'error',
                    title: 'Report error',
                    text: 'Failed to generate your report. Please try again.'
                });
            }


        } catch (error) {
            console.error('Error saving report data or fetching AI report:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to save report data of fetching AI report. Please try again.',
                confirmButtonText: 'OK'
            });
        }
    });
    
    // Add button to the form
    const additionalForm = document.getElementById('additionalInformationForm') as HTMLFormElement;
    additionalForm.appendChild(button);
}

function validateBasicUserData(userData: UserData) {
    // Validate name
    if (userData.name!.length < 6 || userData.name!.length > 25) {
        alert('Name must be between 6 and 25 characters.');
        return false;
    }
    
    // Validate password
    if (userData.password!.length < 8 || userData.password!.length > 30) {
        alert('Password must be between 8 and 30 characters.');
        return false;
    }
    
    // Validate age
    if (userData.age! < 18 || userData.age! > 100) {
        alert('Age must be between 18 and 100.');
        return false;
    }
    
    // Validate sex
    if (!['Male', 'Female'].includes(userData.sex!)) {
        alert('Please select a valid sex.');
        return false;
    }
    
    // Validate weight
    if (userData.weight! < 30) {
        alert('Weight must be at least 30 kg.');
        return false;
    }
    
    // Validate height
    if (userData.height! < 50) {
        alert('Height must be at least 50 cm.');
        return false;
    }
    
    // Validate country
    if (!userData.country || userData.country.trim() === '') {
        alert('Please select a country.');
        return false;
    }
    
    return true;
}

function validateAdditionalUserData(userData: UserData) {
    // Validate sportive description (must have at least one)
    if (!userData.sportive_description) {
        alert('At least one sportive description is required.');
        return false;
    }
    
    return true;
}

// Function to populate additional fields from localStorage data
function populateAdditionalFields(userData: UserData) {
    // Helper function to clean and parse JSON string
    function parseArrayFromString(data: any) {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (typeof data === 'string') {
            try {
                // Remove escaped quotes and parse
                const cleanString = data.replace(/\\"/g, '"');
                return JSON.parse(cleanString);
            } catch (e) {
                console.error('Error parsing JSON string:', e);
                return [];
            }
        }
        return [];
    }
    
    // Parse the data from localStorage/database
    const allergies = parseArrayFromString(userData.allergies);
    const sportiveDescriptions = parseArrayFromString(userData.sportive_description);
    const medicalConditions = parseArrayFromString(userData.medical_conditions);
    const foodPreferences = parseArrayFromString(userData.food_preferences);
    
    console.log('Parsed data:', { allergies, sportiveDescriptions, medicalConditions, foodPreferences });
    
    // Clear existing fields first
    clearExistingAdditionalFields();
    
    // Create and populate allergy fields
    createAndPopulateFields('allergies[]', allergies, addAllergyField);
    
    // Create and populate sportive description fields
    createAndPopulateFields('sportive_description[]', sportiveDescriptions, addSportiveField);
    
    // Create and populate medical condition fields
    createAndPopulateFields('medical_conditions[]', medicalConditions, addMedicalField);
    
    // Create and populate food preference fields
    createAndPopulateFields('food_preferences[]', foodPreferences, addFoodPreferenceField);
}

// Helper function to create and populate fields
function createAndPopulateFields(
    fieldName: string, 
    items: string[], 
    addFieldFunction: () => void
): void {
    if (!items || items.length === 0) return;

    // Ensure at least one field exists for this group
    let firstField = document.querySelector(`input[name="${fieldName}"]`) as HTMLInputElement | null;
    if (!firstField) {
        addFieldFunction();
        const fieldsNow = document.querySelectorAll<HTMLInputElement>(`input[name="${fieldName}"]`);
        firstField = fieldsNow.length > 0 ? fieldsNow[0] : null;
    }

    // Populate first field
    if (firstField) {
        firstField.value = items[0] ?? '';
    }

    // Create and populate remaining fields
    for (let i = 1; i < items.length; i++) {
        addFieldFunction();
        const fields = document.querySelectorAll<HTMLInputElement>(`input[name="${fieldName}"]`);
        const newField = fields[fields.length - 1];
        if (newField) {
            newField.value = items[i] ?? '';
        }
    }
}

// Function to clear existing additional fields
function clearExistingAdditionalFields() {
    // Clear allergies (keep first one if exists)
    const allergyFieldElements = document.querySelectorAll('input[name="allergies[]"]');
    for (let i = 1; i < allergyFieldElements.length; i++) {
        const fieldContainer = allergyFieldElements[i].closest('.dynamic-field');
        if (fieldContainer) {
            fieldContainer.remove();
        }
    }

    // Clear sportive descriptions (keep first one if exists)
    const sportiveFieldElements = document.querySelectorAll('input[name="sportive_description[]"]');
    for (let i = 1; i < sportiveFieldElements.length; i++) {
        const fieldContainer = sportiveFieldElements[i].closest('.dynamic-field');
        if (fieldContainer) {
            fieldContainer.remove();
        }
    }

    // Clear medical conditions (keep first one if exists)
    const medicalFieldElements = document.querySelectorAll('input[name="medical_conditions[]"]');
    for (let i = 1; i < medicalFieldElements.length; i++) {
        const fieldContainer = medicalFieldElements[i].closest('.dynamic-field');
        if (fieldContainer) {
            fieldContainer.remove();
        }
    }

    // Clear food preferences (keep first one if exists)
    const foodPreferenceFieldElements = document.querySelectorAll('input[name="food_preferences[]"]');
    for (let i = 1; i < foodPreferenceFieldElements.length; i++) {
        const fieldContainer = foodPreferenceFieldElements[i].closest('.dynamic-field');
        if (fieldContainer) {
            fieldContainer.remove();
        }
    }

    // Ensure at least one field exists for each category
    if (document.querySelectorAll('input[name="allergies[]"]').length === 0) {
        addAllergyField();
    }
    if (document.querySelectorAll('input[name="sportive_description[]"]').length === 0) {
        addSportiveField();
    }
    if (document.querySelectorAll('input[name="medical_conditions[]"]').length === 0) {
        addMedicalField();
    }
    if (document.querySelectorAll('input[name="food_preferences[]"]').length === 0) {
        addFoodPreferenceField();
    }

    // Reset tracking arrays
    allergyFields.length = 0;
    sportiveFields.length = 0;
    medicalFields.length = 0;
    foodPreferenceFields.length = 0;

    // Re-add the first fields to tracking arrays
    const firstAllergyField = document.querySelector('input[name="allergies[]"]');
    if (firstAllergyField) {
        allergyFields.push(firstAllergyField.id);
    }

    const firstSportiveField = document.querySelector('input[name="sportive_description[]"]');
    if (firstSportiveField) {
        sportiveFields.push(firstSportiveField.id);
    }

    const firstMedicalField = document.querySelector('input[name="medical_conditions[]"]');
    if (firstMedicalField) {
        medicalFields.push(firstMedicalField.id);
    }

    const firstFoodPreferenceField = document.querySelector('input[name="food_preferences[]"]');
    if (firstFoodPreferenceField) {
        foodPreferenceFields.push(firstFoodPreferenceField.id);
    }
}

// Function to check for existing input data and show the report button
function checkForExistingInputsAndShowReportButton() {
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    if (userData) {
        // Helper function to parse JSON strings or return arrays
        function parseArrayData(data: any) {
            if (!data) return [];
            if (Array.isArray(data)) return data;
            if (typeof data === 'string') {
                try {
                    return JSON.parse(data);
                } catch (e) {
                    return [];
                }
            }
            return [];
        }
        
        const allergies = parseArrayData(userData.allergies);
        const sportiveDescriptions = parseArrayData(userData.sportive_description);
        const medicalConditions = parseArrayData(userData.medical_conditions);
        const foodPreferences = parseArrayData(userData.food_preferences);
        
        // If we have any validated data, show the report button
        if (allergies.length > 0 || sportiveDescriptions.length > 0 || medicalConditions.length > 0 || foodPreferences.length > 0) {
            const mockValidatedData = {
                allergies: allergies.map((item: any) => ({ original_version: item })),
                sportive_description: sportiveDescriptions.map((item: any) => ({ original_version: item })),
                medical_conditions: medicalConditions.map((item: any) => ({ original_version: item })),
                food_preferences: foodPreferences.map((item: any) => ({ original_version: item }))
            };
            showGetReportButton(mockValidatedData);
            disableAISuggestionButton();
        }
    }
}

// Export functions for global access
(window as any).addAllergyField = addAllergyField;
(window as any).addSportiveField = addSportiveField;
(window as any).addMedicalField = addMedicalField;
(window as any).addFoodPreferenceField = addFoodPreferenceField;
(window as any).removeField = removeField;
(window as any).goToHomepage = goToHomepage;

// Create a modern dashboard for the detailed report under the additional information form
function renderDetailedReport(report: DetailedReport) {
    try {
        // Normalize arrays that may arrive as JSON strings
        const parseMaybeArray = (value: any) => {
            if (Array.isArray(value)) return value;
            if (typeof value === 'string') {
                const t = value.trim();
                if (t.startsWith('[') && t.endsWith(']')) {
                    try { return JSON.parse(t); } catch { return [value]; }
                }
            }
            return value == null ? [] : [String(value)];
        };

        const toNumber = (value: any) => {
            if (typeof value === 'number') return value;
            if (typeof value === 'string' && !Number.isNaN(Number(value))) return Number(value);
            return value;
        };

        // Remove existing dashboard if present
        const existing = document.getElementById('detailedReportCard');
        if (existing) existing.remove();

        // Build card
        const card = document.createElement('div');
        card.id = 'detailedReportCard';
        card.className = 'profile-card report-card';

        // Header
        const header = document.createElement('div');
        header.className = 'form-header';
        header.innerHTML = `
            <i class="fas fa-chart-line"></i>
            <h2>Your Health Report</h2>
            <div class="form-subtitle">Personalized recommendations based on your data</div>
        `;

        // Content container
        const content = document.createElement('div');
        content.className = 'section-content';

        const calories = toNumber(report.recommended_daily_calories);
        const water = toNumber(report.recommended_water_intake);
        const protein = toNumber(report.recommended_protein_intake);
        const fats = toNumber(report.recommended_fats_intake);
        const carbs = toNumber(report.recommended_carbohydrates_intake);
        const nutritionalDeficiencyRisks = parseMaybeArray(report.nutritional_deficiency_risks);
        const general = parseMaybeArray(report.general_recommendation);

        // Metrics grid
        const metrics = document.createElement('div');
        metrics.className = 'form-grid';
        metrics.style.marginBottom = '10px';
        metrics.innerHTML = `
            <div class="section-container">
                <div class="section-header-main report-section-header report-section-header--calories">
                    <h3><i class="fas fa-fire"></i> Daily Calories</h3>
                </div>
                <div class="section-content">
                    <div style="font-size:1.6rem;font-weight:700;color:#222">${calories ?? '-'} kcal</div>
                    <div style="color:#555;margin-top:6px">Recommended daily energy intake</div>
                </div>
            </div>
            <div class="section-container">
                <div class="section-header-main report-section-header report-section-header--water">
                    <h3><i class="fas fa-tint"></i> Water Intake</h3>
                </div>
                <div class="section-content">
                    <div style="font-size:1.6rem;font-weight:700;color:#222">${water ?? '-'} L</div>
                    <div style="color:#555;margin-top:6px">Recommended daily water intake</div>
                </div>
            </div>
        `;

        // Macros + Foods grid (2 columns)
        const macrosFoods = document.createElement('div');
        macrosFoods.className = 'form-grid report-subgrid';
        macrosFoods.innerHTML = `
            <div class="section-container">
                <div class="section-header-main report-section-header report-section-header--protein">
                    <h3><i class="fas fa-drumstick-bite"></i> Protein</h3>
                </div>
                <div class="section-content">
                    <div style="font-size:1.4rem;font-weight:700;color:#222">${protein ?? '-'} g</div>
                </div>
            </div>
            <div class="section-container">
                <div class="section-header-main report-section-header report-section-header--fats">
                    <h3><i class="fas fa-cheese"></i> Fats</h3>
                </div>
                <div class="section-content">
                    <div style="font-size:1.4rem;font-weight:700;color:#222">${fats ?? '-'} g</div>
                </div>
            </div>
            <div class="section-container">
                <div class="section-header-main report-section-header report-section-header--carbs">
                    <h3><i class="fas fa-bread-slice"></i> Carbohydrates</h3>
                </div>
                <div class="section-content">
                    <div style="font-size:1.4rem;font-weight:700;color:#222">${carbs ?? '-'} g</div>
                </div>
            </div>
            <div class="section-container">
                <div class="section-header-main report-section-header report-section-header--foods">
                    <h3><i class="fas fa-utensils"></i> Nutritional Deficiency Risks </h3>
                </div>
                <div class="section-content">
                    <ul class="report-list" style="text-align:left;color:#333">${nutritionalDeficiencyRisks.map((f: any) => `<li>${f}</li>`).join('') || '<li>No items</li>'}</ul>
                </div>
            </div>
        `;

        // General recommendations full width
        const generalSection = document.createElement('div');
        generalSection.className = 'section-container';
        generalSection.innerHTML = `
            <div class="section-header-main report-section-header report-section-header--general">
                <h3><i class="fas fa-notes-medical"></i> General Recommendations</h3>
            </div>
            <div class="section-content">
                <ul class="report-list report-list--tall" style="text-align:left;color:#333">${general.map((g: any) => `<li>${g}</li>`).join('') || '<li>No items</li>'}</ul>
            </div>
        `;

        content.appendChild(metrics);
        content.appendChild(macrosFoods);
        content.appendChild(generalSection);

        card.appendChild(header);
        card.appendChild(content);

        // Insert below the additional information form
        const additionalFormEl = document.getElementById('additionalInformationForm');
        if (additionalFormEl) {
            const parentCard = additionalFormEl.closest('.profile-card');
            if (parentCard && parentCard.parentElement) {
                parentCard.insertAdjacentElement('afterend', card);
            } else {
                // Fallback: insert after the form
                additionalFormEl.insertAdjacentElement('afterend', card);
            }
        } else {
            document.body.appendChild(card);
        }
    } catch (err) {
        console.error('Failed to render detailed report:', err);
    }
}

// Render report on load if data exists in localStorage
function checkForExistingReportData() {
    try {
        const userDataStr = localStorage.getItem('user_data');
        if (!userDataStr) return;
        const userData = JSON.parse(userDataStr);

        // Prefer top-level keys if present
        const keys = [
            'recommended_daily_calories',
            'recommended_water_intake',
            'recommended_protein_intake',
            'recommended_fats_intake',
            'recommended_carbohydrates_intake',
            'nutritional_deficiency_risks',
            'general_recommendation'
        ];

        const hasTopLevel = keys.some(k => userData[k] !== undefined && userData[k] !== null);

        let report = null;
        if (hasTopLevel) {
            report = keys.reduce((acc: any, k: any) => {
                if (userData[k] !== undefined) acc[k] = userData[k];
                return acc;
            }, {});
        } else if (userData.detailed_report) {
            report = userData.detailed_report;
        }

        if (report) {
            renderDetailedReport(report);
        }
    } catch (e) {
        console.error('Failed checking existing report data:', e);
    }
}
