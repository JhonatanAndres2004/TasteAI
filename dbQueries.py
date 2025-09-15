import mysql.connector
import os
from dotenv import load_dotenv
import bcrypt
from models import User, UserLogin,BasicInformationUser,AdditionalInformationUser
from pydantic import EmailStr
from openai import OpenAI
import json
from datetime import datetime
from typing import Optional, Dict, Any

load_dotenv()

"""
List of functions to interact with the database.
1. DBConnect: Connects to the database and creates a cursor.
2. createUsersTable: Creates the users table in the database.
3. deleteSpecificTable: Deletes a specific table from the database.
4. deleteAllElementsFromTable: Deletes all elements from a specific table.
5. checkIfTableExists: Checks if a specific table exists in the database.
6. signUpUser: Appends a new user to the users table.
7. signInUser: Logs in a user by verifying their email and password.
8. viewUserById: Views a user by their ID.
9. viewUserByEmail: Views a user by their email.
10. updateBasicInformation: Updates basic information of a user.
11. getAISuggestion: Gets an AI suggestion for a user.
12. updateAdditionalInformation: Updates additional information of a user.
13. getDetailedReport: Gets a detailed report of a user.
14. saveDetailedReport: Saves a detailed report of a user.
15. getWeeklyMenus: Gets the weekly menus of a user.
16. saveWeeklyMenus: Saves the weekly menus of a user.
17. gatherDataToAlterDailyMenu: Gathers data to alter the daily menu of a user.
18. getDailyModifiedMenu: Gets the modified daily menu of a user.
19. saveModifiedDailyMenu: Saves the modified daily menu of a user.
"""



def DBConnect():
    """
    Function to connect to the database and create a cursor.
    Returns:
        mydb: MySQL connection object
        cursor: MySQL cursor object
    """
    try:
        mydb = mysql.connector.connect(
            host=os.environ.get("DB_HOST"),
            user=os.environ.get("DB_USER"),
            password=os.environ.get("DB_PASSWORD"),
            database=os.environ.get("DB_DATABASE")
        )
        print(f"Database {os.environ.get('DB_DATABASE')} connected")
        return mydb
    except Exception as e:
        print(f"Error when connecting to {os.environ.get('DB_DATABASE')} and creating the cursor: {e}")
        return None



mydb= DBConnect()

# Check if database connection was successful before proceeding
if mydb is None:
    print("ERROR: Database connection failed. Please check your environment variables and database configuration.")



def createUsersTable():
    """
    Function to create the users table in the database.
    This function does not return any value.
    """
    
    global mydb
    
    # Check if database connection is valid
    if mydb is None or not mydb.is_connected():
        print("ERROR: Database connection is not available. Cannot create users table.")
        return
    
    cursor = mydb.cursor()

    if not checkIfTableExists("users"):
        print("Creating table 'users'...")
        try:
            user_initial_query = """
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(25) DEFAULT 'USER',
                email VARCHAR(50),
                password VARCHAR(60),
                sex VARCHAR(10),
                age INT,

                weight FLOAT DEFAULT NULL,
                height FLOAT DEFAULT NULL,
                allergies TEXT DEFAULT NULL,
                sportive_description TEXT DEFAULT NULL,
                medical_conditions TEXT DEFAULT NULL,
                objective VARCHAR(20) DEFAULT NULL,

                recommended_daily_calories FLOAT DEFAULT NULL,
                recommended_water_intake FLOAT DEFAULT NULL,
                recommended_protein_intake FLOAT DEFAULT NULL,
                recommended_fats_intake FLOAT DEFAULT NULL,
                recommended_carbohydrates_intake FLOAT DEFAULT NULL,
                recommended_food TEXT DEFAULT NULL,
                general_recommendation TEXT DEFAULT NULL,
                weekly_calories TEXT DEFAULT NULL,
                weekly_protein TEXT DEFAULT NULL,
                weekly_fats TEXT DEFAULT NULL,
                weekly_carbohydrates TEXT DEFAULT NULL,
                imc FLOAT DEFAULT NULL

            )
            """
            cursor.execute(user_initial_query)
            mydb.commit()
            print(f"Table 'users' created successfully")
            cursor.close()

        except Exception as e:
            print(f"Something went wrong when creating the user table: {e}")
            cursor.close()
    else:
        cursor.close()
        return None
    


def createMenusTable():
    """
    Function to create the table that contains the menus of the week.add()

    Args:
    None

    Returns:
    Raw text message describing the success or not of the query
    """
    global mydb
    
    # Check if database connection is valid
    if mydb is None or not mydb.is_connected():
        print("ERROR: Database connection is not available. Cannot create menus table.")
        return
    
    cursor = mydb.cursor()

    create_menus_table_query="""
    CREATE TABLE if NOT EXISTS user_menus (
        user_id INT PRIMARY KEY,
        day1    TEXT DEFAULT NULL,
        day2   TEXT DEFAULT NULL,
        day3 TEXT DEFAULT NULL,
        day4  TEXT DEFAULT NULL,
        day5    TEXT DEFAULT NULL,
        day6  TEXT DEFAULT NULL,
        day7    TEXT DEFAULT NULL,
        creationDate DATE DEFAULT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
            ON DELETE CASCADE
    );
    """
    try:
        cursor.execute(create_menus_table_query)
        mydb.commit()
        print("Menus table created successfully")
    except Exception as e:
        print("There was an error when creating the menus table", e)



def createChatHistoryTable():
    """
    This function creates a table with the seven days of the week as column.
    It stores a JSON describing the chat history. In this way, when the user
    makes a query to a menu, it is better adapted

    Args:
    None

    Return:
    Raw message of success or failure
    """
    global mydb
    cursor=mydb.cursor()

    create_chat_history_table_query="""
    CREATE TABLE if NOT EXISTS chat_history (
        user_id_history INT PRIMARY KEY,
        day1    TEXT DEFAULT NULL,
        day2   TEXT DEFAULT NULL,
        day3 TEXT DEFAULT NULL,
        day4  TEXT DEFAULT NULL,
        day5    TEXT DEFAULT NULL,
        day6  TEXT DEFAULT NULL,
        day7    TEXT DEFAULT NULL,
        FOREIGN KEY (user_id_history) REFERENCES users(id)
            ON DELETE CASCADE
    );
    """
    try:
        cursor.execute(create_chat_history_table_query)
        mydb.commit()
        print("Chat history table created successfully")
    except Exception as e:
        print("There was an error when creating the chat history table", e)




def deleteSpecificTable(tableName:str):
    """
    Function to delete a specific table from the database.
    Args:
        tableName (str): The name of the table to be deleted.
        
    returns:
        Doesn't return a value
    """
    global mydb
    cursor= mydb.cursor()

    if not checkIfTableExists(tableName):
        print(f"Table {tableName} does not exist, nothing to delete.")
        cursor.close()
    else:
        print(f"Deleting table {tableName}...")
        try:
            delete_specific_table_query=f"DROP TABLE IF EXISTS {tableName}"
            cursor.execute(delete_specific_table_query)
            mydb.commit()
            print(f"Successfully deleted table {tableName}")
            cursor.close()
        except Exception as e:
            cursor.close()
            print(f"Something went wrong when deleting table {tableName}: {e}")



def deleteAllElementsFromTable(tableName:str):
    """
    Function to delete all elements from a specific table.
    Args:
        tableName (str): The name of the table to be cleared.

    Returns:
        Doesn't return a value
    """
    global mydb
    cursor = mydb.cursor()
    if checkIfTableExists(tableName):
        delete_all_elements_from_table_query = f"TRUNCATE TABLE {tableName}"
        cursor.execute(delete_all_elements_from_table_query)
        mydb.commit()
        print(f"All elements from table {tableName} have been deleted.")
        cursor.close()
    else:
        print(f"Table {tableName} does not exist, nothing to delete.")
        cursor.close()
    return None



def checkIfTableExists(tableName: str):
    """Function to check if a specific table exists in the database.
    Args:
        tableName (str): The name of the table to check.
    Returns:
        bool: True if the table exists, False otherwise.
    """
    global mydb

    cursor = mydb.cursor()
    cursor.execute("SHOW TABLES")
    tables= [table[0] for table in cursor.fetchall()]
    cursor.close()
    if tableName in tables:
        return True
    else:
        return False



def signUpUser(user:User):
    """Function to append a new user to the users table.
    Args:
        user (User): An instance of the User model containing user details. 

    Returns:
        A dictionary containing a success message and the user details if the user was created successfully,
        or an error message if the user already exists or if there was an error during the creation process.
        """
    global mydb
    cursor = mydb.cursor()

    #Verify if the email already exists
    check_existing_email_query = f"""
    SELECT EXISTS (
        SELECT 1 FROM users WHERE email = %s
    );

    """
    cursor.execute(check_existing_email_query, (user.email,))
    email_exists = cursor.fetchone()[0]
    if not email_exists:
        try:
            # Hash the password before storing it
            salt = bcrypt.gensalt()
            hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), salt)

            create_new_user_query = """
            INSERT INTO users (name, email, password, sex, age) 
            VALUES (%s, %s, %s, %s, %s)
            """

            cursor.execute(create_new_user_query, (
            user.name,
            user.email,
            hashed_password.decode('utf-8'),  # Decode bytes to string for storage
            user.sex,
            user.age
            ))
            mydb.commit()

            print(f"Successfully added user {user.name}")

            cursor.close()
            return {"message": "User created successfully. Please, Login", "user": user}
        except Exception as e:
            print(f"Something went wrong when appending a new user: {e} ")
            cursor.close()
            return {"message": "Error when creating the user", "error": "Internal server error"}
    else:
        print(f"User with email {user.email} already exists.")
        cursor.close()
        return {"message": "User already exists", "email": user.email, "error": "User with this email already exists"}



def signInUser(user:UserLogin):
    """Function to log in a user by verifying their email and password.
    Args:
        user (User): An instance of the User model containing user details (email and password).
    Returns:
        A dictionary containing a success message and user details if login is successful,
        or an error message if the login fails.
    """
    global mydb
    cursor = mydb.cursor(dictionary=True)
    try:
        # Check if the user exists
        check_user_query = f"SELECT * FROM users WHERE email = %s"
        cursor.execute(check_user_query, (user.email,))
        user_data = cursor.fetchone()
        if user_data:
            stored_hashed_password = user_data['password'].encode('utf-8')
            if bcrypt.checkpw(user.password.encode('utf-8'), stored_hashed_password):
                print(f"User {user.email} logged in successfully.")
                user_whole_information= viewUserByEmail(user.email)
                user_data.update(user_whole_information)
                return {"message": "Login successful", "user": user_data}
            else:
                return {"message": "Incorrect password", "error": "Invalid password"}
        else:
            print(f"User with email {user.email} does not exist.")
            return {"message": "User does not exist", "error": "User with this email does not exist"}
    except Exception as e:
        print(f"Something went wrong when logging in user {user.email}: {e}")
        return {"message": "Unexpected error during login", "error": "Internal server error"}
    finally:
        cursor.close()



def viewUserById(user_id: int):
    """Function to view a user by their ID.
    Args:
        user_id (int): The ID of the user to be viewed.
    Returns:
        A dictionary containing user details if found, otherwise None.
    """
    global mydb
    cursor = mydb.cursor(dictionary=True)
    id_query= f"SELECT * FROM users WHERE id = %s"

    try:
        cursor.execute(id_query, (user_id,))
        user = cursor.fetchone()
        if user:
            print(f"User with ID {user_id} found: {user}")
            return user
        else:
            print(f"No user found with ID {user_id}")
            return None
    except Exception as e:
        print(f"Something went wrong when viewing user by ID {user_id}: {e}")
        return None
    finally:
        cursor.close()



def viewUserByEmail(email:EmailStr):
    """Function to view a user by their email.
    Args:
        email (str): The email of the user to be viewed.
    Returns:
        A dictionary containing user details if found, otherwise None.
    """
    global mydb
    cursor = mydb.cursor(dictionary=True)
    email_query = f"SELECT * FROM users WHERE email = %s"
    try:
        cursor.execute(email_query, (email,))
        user = cursor.fetchone()
        if user:
            print(f"User with email {email} found: {user}")
            return user
        else:
            print(f"No user found with email {email}")
            return None
    except Exception as e:
        print(f"Something went wrong when viewing user by email {email}: {e}")
        return None



def updateBasicInformation(user: BasicInformationUser):
    """Function to update basic information of a user.
    Args:
        user (User): An instance of the User model containing updated user details.
    Returns:
        A dictionary containing a success message and updated user details if the update is successful,
        or an error message if the update fails.
    """
    global mydb
    cursor = mydb.cursor()  
    try:
        # Check if the user exists
        existing_user = viewUserById(user.id)
        if not existing_user:
            print(f"User with ID {user.id} does not exist.")
            return {"message": "User does not exist", "error": "User with this ID does not exist"}
        if existing_user:
            # Update user information
            update_query = """
            UPDATE users 
            SET 
            name = %s,
            password = %s,
            sex = %s,
            age = %s,
            objective = %s,
            weight = %s,
            height = %s
            WHERE id = %s
            """
            # Hash the password before storing it
            salt = bcrypt.gensalt()
            hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), salt)

            cursor.execute(update_query, (
                user.name,
                hashed_password.decode('utf-8'),  # Decode bytes to string for storage
                user.sex,
                user.age,
                user.objective,
                user.weight,
                user.height,
                user.id,
            ))
            mydb.commit()
            print(f"User {user.id} updated successfully.")
            updated_user = viewUserById(user.id)
            return {"message": "User updated successfully", "user": updated_user}
    except Exception as e:
        print(f"Something went wrong when updating user {user.id}: {e}")
        return {"message": "Error when updating user", "error": "Internal server error"}
    finally:
        cursor.close()



def getAISuggestion(additionalInformationUser:AdditionalInformationUser):
    """
    Verify and transform JSON data using OpenAI API
    
    Args:
        additionalInformationUser: JSON data to verify and transform (dict or string)
        transformation_instructions: Instructions for how to transform the JSON
        api_key: OpenAI API key
    
    Returns:
        dict: Transformed JSON data
    """
    
    # Transformation instructions
    instructions = """
        # Medical Information Validation Prompt

        You are a medical specialist with expertise in allergies, health conditions, and exercise physiology. Your task is to validate user-provided health information for coherence and medical accuracy.

        ## Context
        You will receive JSON data from a health and nutrition web application containing user inputs about:
        - Allergies
        - Exercise/sports activities 
        - Medical conditions

        ## Task
        **IMPORTANT: You must evaluate EVERY SINGLE entry in each array and include ALL of them in your response.**

        Evaluate each entry for medical coherence and provide structured feedback with corrections where needed. Process all entries - do not skip any items from the input arrays.

        ## Input Format
        ```json
        {
        "id": "user_identifier",
        "allergies": ["entry1", "entry2", ...],
        "sportive_description": ["entry1", "entry2", ...],
        "medical_conditions": ["entry1", "entry2", ...]
        }
        ```

        ## Coherence Scoring System

        **Score 3 (Excellent):** Medically accurate, clear, and complete. Be permissive with natural language variations. Accept colloquial expressions, abbreviations, and informal medical terminology. Only correct if the meaning is genuinely unclear or medically inaccurate. Do not penalize for minor word order problems, stylistic issues or verb tenses.
        - Allergies: descriptions totally coherent, for example; "nuts", "shellfish", "pollen"
        - Sports:descriptions totally coherent, for example; "swimming 2 times per week", "running daily", "yoga 3x weekly"
        - Medical:descriptions totally coherent, for example; "asthma", "Type 2 diabetes", "hypertension"

        **Score 2 (Needs minor correction):** Understandable but has spelling errors, missing details, or unclear phrasing. 
        - Allergies: Description where something is missing, could be enhanced or corrected, for example things like; "nutz", "sea food" 
        - Sports: Description where something is missing, could be enhanced or corrected, for example things like; "I swim", "running sometimes", "weightlifting"
        - Medical: Description where something is missing, could be enhanced or corrected, for example things like; "I feel weird sometimes", "back problems", "stomach issues"

        **Score 1 (Critical error):** Medically nonsensical, impossible, or completely irrelevant
        - Allergies: "allergy to darkness", "allergic to Mondays"
        - Sports: "I feel like superman", "flying every day"
        - Medical: "I like bananas", "happiness deficiency"

        ## Required Output Format
        ```json
        {
        "id": "same_user_id_as_input",
        "allergies": [
            {
            "coherence_score": 1-3,
            "suggested_version": "corrected_version_or_brief_explanation_why_incoherent_if_no_correction_put_the_original_text",
            "original_version": "exact_user_input_unchanged"
            }
        ],
        "sportive_description": [
            {
            "coherence_score": 1-3,
            "suggested_version": "corrected_version_or_brief_explanation_why_incoherent_if_no_correction_put_the_original_text", 
            "original_version": "exact_user_input_unchanged"
            }
        ],
        "medical_conditions": [
            {
            "coherence_score": 1-3,
            "suggested_version": "corrected_version_or_brief_explanation_why_incoherent_if_no_correction_put_the_original_text",
            "original_version": "exact_user_input_unchanged"
            }
        ],
        "ready_to_go": 0 or 1
        }
        ```

        ## Specific Validation Rules

        **Allergies:** Must be medically recognized allergens (foods, environmental, medications, etc.)

        **Sports/Exercise:** Must include both:
        1. A recognizable physical activity
        2. Frequency information (times per week, daily, etc.)

        **Medical Conditions:** Must be legitimate medical conditions, symptoms, or health concerns

        ## Output Guidelines
        - **Score 3:** Leave `suggested_version` as the original text
        - **Score 2:** Provide corrected spelling/formatting in `suggested_version`
        - **Score 1:** Explain why the entry is medically incoherent in `suggested_version`
        - **ready_to_go:** Return 0 if ANY entry has score 1, otherwise return 1
        - **Preserve original text:** Never alter `original_version` - maintain exact spelling, punctuation, and capitalization

        ## Response Requirements
        - **CRITICAL: Process every single item** - Your output arrays must contain the same number of elements as the input arrays
        - Respond only with the JSON output. NO TEXT BEFORE OR AFTER THE JSON, IT IS THE MOST CRUCIAL PART.
        - Use medical terminology appropriately
        - Be concise but clear in explanations
        - Maintain professional medical perspective

        ## Example Processing
        If input contains:
        ```json
        {
        "allergies": ["nuts", "pollen", "lactose"],
        "sportive_description": ["swimming", "running daily"],
        "medical_conditions": ["asthma"]
        }
        ```

        Your output MUST contain exactly 3 allergy objects, 2 sportive objects, and 1 medical condition object.
    """
    

    # Initialize OpenAI client
    client=OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    # Convert input to string if it's a dict
    if isinstance(additionalInformationUser, dict):
        additionalInformationUser_str = json.dumps(additionalInformationUser, indent=2)
    else:
        additionalInformationUser_str = additionalInformationUser
    
    # Create prompt for verification and transformation
    prompt = f"""
    Please verify and transform the following JSON data according to the instructions below.
    
    INPUT JSON:
    {additionalInformationUser_str}
    
    TRANSFORMATION INSTRUCTIONS:
    {instructions}
    
    Please respond with ONLY the transformed JSON, no additional text or explanations.
    """
    
    try:
        # Make API call
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1  # Low temperature for consistent output
        )
        
        # Parse the response as JSON
        result = response.choices[0].message.content.strip()
        print(result)
        return json.loads(result)
        
    except Exception as e:
        print(f"Error: {e}")
        return None



def updateAdditionalInformation(additionalInformationUser:AdditionalInformationUser):
    """Function to update additional information of a user after AI suggestions.
    Args:
        additionalInformationUser (AdditionalInformationUser): An instance of the AdditionalInformationUser model containing updated user details.
    Returns:
        A dictionary containing a success message and updated user details if the update is successful,
        or an error message if the update fails.
    """
    global mydb
    cursor = mydb.cursor()
    try:
        # Check if the user exists
        existing_user = viewUserById(additionalInformationUser.id)
        if not existing_user:
            print(f"User with ID {additionalInformationUser.id} does not exist.")
            return {"message": "User does not exist", "error": "User with this ID does not exist"}
        if existing_user:
            # Update user information
            update_query = """
            UPDATE users 
            SET 
            allergies = %s,
            sportive_description = %s,
            medical_conditions = %s
            WHERE id = %s   
            """
            # Convert arrays to JSON strings for database storage
            allergies_json = json.dumps(additionalInformationUser.allergies) if additionalInformationUser.allergies else None
            sportive_json = json.dumps(additionalInformationUser.sportive_description) if additionalInformationUser.sportive_description else None
            medical_json = json.dumps(additionalInformationUser.medical_conditions) if additionalInformationUser.medical_conditions else None
            
            cursor.execute(update_query, (
                allergies_json,
                sportive_json,
                medical_json,
                additionalInformationUser.id
            ))
            mydb.commit()
            print(f"User {additionalInformationUser.id} updated successfully.")
    except Exception as e:
        print(f"Something went wrong when updating user {additionalInformationUser.id}: {e}")
        return {"message": "Error when updating user", "error": "Internal server error"}
    finally:
        cursor.close()



def getDetailedReport(id:int):
    """
    Verify and transform JSON data using OpenAI API
    
    Args:
        additionalInformationUser: JSON data to verify and transform (dict or string)
        transformation_instructions: Instructions for how to transform the JSON
        api_key: OpenAI API key
    
    Returns:
        dict: Transformed JSON data
    """
    #First get user data using the id
    userData= viewUserById(id)
    userAge=userData["age"]
    userSex=userData["sex"]
    userObjective=userData["objective"]
    userWeight=userData["weight"]
    userHeight=userData["height"]
    userAllergies=userData["allergies"]
    userSportiveDescription=userData["sportive_description"]
    userMedicalConditions=userData["medical_conditions"]


    prompt=f"""
    Your are a professional doctor specialized in nutrition and well-being. Your task for this context 
    is to take basic patient's data and give advice for their nutrition and general welfare. You must consider
    every parameter given and return all the required data in the format specified

    The patient is a {userSex} who is {userAge} years old. The objective of the patient is {userObjective} 
    The patient weighs {userWeight} and its height is {userHeight} in centimeters. Additionally, there are some special
    considerations before making any advice :

    {f"* The patient has the following allergies: {userAllergies} " if userAllergies else "The patient does not have any allergy"}.
    *The patient claimed to have the following sportive conditions: {userSportiveDescription}.
    {f"* The patient has the following medical conditions: {userMedicalConditions} " if userMedicalConditions else "The patient does not have any dangerous medical condition such as Asthma, high blood pressure, and so on"}.

    The patient would like to have a report using the following JSON schema

    ```
    {{
    "recommended_daily_calories":"Calories recommended per day considering the patient's profile, objective and conditions",
    "recommended_water_intake":"Amount of water per day that the patient should take. Use liters as unit",
    "recommended_protein_intake":"Amount of protein in grams the patient should take",
    "recommended_fats_intake":"Amount of fats in grams the patient should take",
    "recommended_carbohydrates_intake":"Amount of carbohydrates in grams the patient should take",
    "recommended_food":["According to the patient profile particular food that will be benefitial for him (for example, nuts, berries, any food), if there are more than 1, append elements to this list", "other food recommended", "rest of food recommended"],
    "general_recommendation":["General wellbeing advice according to the user profile", "Another advice", "Any other advices ... "]

    }}
    ``` 
    Adhere to the JSON schema expected. Additionally, there are some considerations:
    *Respect the units given (centimeters, liters, grams)
    *Consider everything in order to give any advice. Do not forget to consider strongly the objective of the user and the allergies, sportive/medical conditions
    *You are a professional. Do not recommend values that to not make any sense such as 0 calories, 2000 grams of protein, and so on
    *It is not necessary to have endless list of recommended_food or general_recommendation. For the foor stick to 3-5 items. For general recommendation 1-3 items are enough
    
    KEY ASPECT: Only return the JSON schema required. Do not add text before or after it. This is fundamental
    """
    
    # Initialize OpenAI client
    client=OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    
    try:
        # Make API call
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1  # Low temperature for consistent output
        )
        
        # Parse the response as JSON
        result = response.choices[0].message.content.strip()
        #If the LLM request succeeds, save it to the DB
        saveToDatabase=saveDetailedReport(json.loads(result),id)
        print(saveToDatabase)

        return json.loads(result)
        
    except Exception as e:
        print(f"Error: {e}")
        return None



def saveDetailedReport(jsonPayload:object,id:int):
    """
    Function to save detailed report to DB after AI corrections applied

    Args:

    jsonPayload: Data in JSON format
    id: Unique identifier for each user

    Returns:
    Success or failure message
    """
    global mydb
    cursor=mydb.cursor()

    detailedReportQuery="""
            UPDATE users 
            SET 
            recommended_daily_calories = %s,
            recommended_water_intake = %s,
            recommended_protein_intake = %s,
            recommended_fats_intake = %s,
            recommended_carbohydrates_intake = %s,
            recommended_food = %s,
            general_recommendation = %s
            WHERE id = %s
"""
    try:
        cursor.execute(detailedReportQuery,(
            jsonPayload["recommended_daily_calories"],
            jsonPayload["recommended_water_intake"],
            jsonPayload["recommended_protein_intake"],
            jsonPayload["recommended_fats_intake"],
            jsonPayload["recommended_carbohydrates_intake"],
            json.dumps(jsonPayload["recommended_food"]),
            json.dumps(jsonPayload["general_recommendation"]),
            id
        ))
        mydb.commit()

        print(f"Successfully updated detailed report for user {id}")
    except Exception as e:
        print(e)
        return {"Error":e}
    finally:
        cursor.close()


def getWeeklyMenus(id:int):
    """
    Function that converts the user data into a dictionary. It contains the menu of
    the whole week divided by days. It contains breakfast, lunch, dinner and snacks are optional.

    Args:
    id: the ID of the user whose data will be used to generate the response

    Returns: 
    Dict: the data of the menus in a JSON format
    """

    #First get user data using the id
    userData= viewUserById(id)
    
    if userData is None:
        print(f"No user found with ID {id}")
        return None

    # Check if the user has completed their nutritional assessment
    required_fields = ["recommended_daily_calories", "recommended_protein_intake", 
                      "recommended_fats_intake", "recommended_carbohydrates_intake"]
    
    missing_fields = [field for field in required_fields if field not in userData or userData[field] is None]
    
    if missing_fields:
        print(f"User {id} has not completed nutritional assessment. Missing fields: {missing_fields}")
        print("Please complete the nutritional assessment first by calling getDetailedReport()")
        return {
            "error": "Nutritional assessment not completed",
            "message": "Please complete your nutritional assessment before generating weekly menus",
            "missing_fields": missing_fields
        }

    #To-do: implement the drinking water functionality
    allergies=userData.get("allergies", "")
    SportiveDescription=userData.get("sportive_description", "")
    userMedicalConditions=userData.get("medical_conditions", "")
    recommendedDailyCalories=userData["recommended_daily_calories"]
    recommendedProteinIntake=userData["recommended_protein_intake"]
    recommendedFatsIntake=userData["recommended_fats_intake"]
    recommendedCarbohydratesIntake=userData["recommended_carbohydrates_intake"]
    recommendedFood=userData.get("recommended_food", "")
    
    #Trim unnecessary symbols
    allergies=allergies.translate(str.maketrans("", "", '[]"'))
    SportiveDescription=SportiveDescription.translate(str.maketrans("", "", '[]"'))
    userMedicalConditions=userMedicalConditions.translate(str.maketrans("", "", '[]"'))


    recommendedFood=recommendedFood.translate(str.maketrans("", "", '[]"'))

    prompt=f"""
        You are a specialized dietitian and expert cook that can explain cooking recipes to anyone.
        You have an endless list of recipes for breakfast, lunch, dinner and snacks. That skill
        combined with your medical knowledge make your diet recommendations very appropriate for anyone, even
        considering special constraints.

        Your task is to design a patient's weekly diet based on parameters that he/she must follow on a daily basis
        to accomplish the objective in calories, water, protein, fats and carbohydrates intake. You must construct
        the diet for the whole week (7 days, not more, nor less, do not add reference to the days of the week like monday, friday, etc.)

        CRITICAL REQUIREMENT: Each day's total nutrition must equal the daily targets within 5% accuracy:
        - Daily Calories Target: {recommendedDailyCalories} calories (must be between {int(recommendedDailyCalories * 0.95)} - {int(recommendedDailyCalories * 1.05)})
        - Daily Protein Target: {recommendedProteinIntake}g (must be between {int(recommendedProteinIntake * 0.95)} - {int(recommendedProteinIntake * 1.05)}g)
        - Daily Fats Target: {recommendedFatsIntake}g (must be between {int(recommendedFatsIntake * 0.95)} - {int(recommendedFatsIntake * 1.05)}g)
        - Daily Carbohydrates Target: {recommendedCarbohydratesIntake}g (must be between {int(recommendedCarbohydratesIntake * 0.95)} - {int(recommendedCarbohydratesIntake * 1.05)}g)

        IMPORTANT CALCULATION PROCESS:
        1. First, determine how to distribute daily calories across meals (e.g., breakfast 25%, lunch 35%, dinner 30%, snacks 10%). This is just an example, vary the distribution throughout the week.
        2. Calculate the nutritional content for each meal to reach the daily targets
        3. Verify that the sum of all meals per day meets the daily requirements within 5% tolerance
        4. Ensure variety across the 7 days - avoid repeating the same meals and ingredients as much as possible

        VARIETY REQUIREMENT: Each day should have different meals. The maximum amount of times a meal can be repeated throughout the week is 2. Hence, the same breakfast can only be repeated twice, the same logic applies for lunch, dinner and snacks

        You must specify not only the ingredients but also the recipe (how to make the dish) and the nutritional relevant value of each dish (calories, protein, fat and carbohydrates).
        All information must be structured following the output JSON schema provided.

        Furthermore, the user gave important additional data (allergies and sports/medical description) which was used to construct the macros
        in the diet. Consider these details when designing the diet:

        {f"Medical Conditions: {userMedicalConditions}" if userMedicalConditions else "Medical Conditions: no details found"}
        Sports description: {SportiveDescription}
        {f"Allergies: {allergies}" if allergies else "Allergies: no details found"}

        OUTPUT JSON SCHEMA:

        ```
        {{
            "day1":[
                {{
                "type":"breakfast/lunch/dinner/snack (always lowercase)",
                "hour": "Time in HH:MM format (be realistic: breakfast 6:00-9:00, lunch 11:30-14:00, dinner 18:00-21:00)",
                "ingredients": ["Ingredient with specific quantities (e.g., '200g chicken breast', '1 tbsp olive oil')", "second ingredient", "etc."],
                "instructions": ["Step 1 of preparation", "Step 2 of preparation", "etc. (3-8 steps total)"],
                "calories": "integer - estimated calories for this meal",
                "protein": "integer - grams of protein in this meal",
                "fats": "integer - grams of fats in this meal",
                "carbohydrates": "integer - grams of carbohydrates in this meal"
                }},
                {{
                "next meal of the day with same structure"
                }}, ... the rest of the meals for the day
            ],
            "day2": [...],
            "day3": [...],
            "day4": [...],
            "day5": [...],
            "day6": [...],
            "day7": [...]
        }}
        ```
        FUNDAMENTAL NOTES: 
        1. The JSON schema has only 1 day filled, but you must fill all 7 days. 
        2. It is vital that you respect the JSON schema and not return additional text before or after it.
        3. Furthermore, if for any reason you cannot generate the JSON schema, return an empty JSON schema.
        4. For every day, there should be at least one breakfast, one lunch and one dinner. Snacks are optional. The purpose of this prompt is to generate a personalized menu that fulfills the daily targets and is as diverse as possible. Before submitting your response, make sure that the menu is as diverse as possible and that the daily targets are fulfilled (sum the calories, protein, carbohydrates and fats of each day and make sure they are close to the daily targets within the 5% range).
        5. Do not create false nutritional data for food or recipes. This is illegal and can lead to serious health consequences for the user.
        6. If the breakfasts, dinner, lunches or snacks repeat or have authentical nutritional values, it seems as fake information. For that reason, ensure to vary the protein, fats, carbohydrates and calories of each meal as much as possible. 
        
        LEGAL CONSIDERATIONS:
        1. You are providing dietary suggestions that could impact health. It is crucial to avoid any potentially harmful advice. Do not suggest anything that could be dangerous for the user. 
        2. Most importantly, do not alter the nutritional values of any food or recipe. If you do not know the nutritional values, it is better to not include that food or recipe in the menu. Altering that kind of information is illegal and can lead to serious health consequences for the user.
        
        VERIFYING TOTALS:
        REMEMBER THE TOTAL OF CALORIES, PROTEIN, FATS AND CARBOHYDRATES FOR EACH DAY MUST BE WITHIN THE 5% RANGE OF THE DAILY TARGETS. IF THEY DO NOT COMPLY, THE USER COULD SUFFER HEALTH PROBLEMS. IT IS YOUR RESPONSIBILITY TO ENSURE THAT THE DAILY TOTALS ARE CORRECT. IF YOU CANNOT PROVIDE A MENU THAT COMPLIES WITH THIS REQUIREMENT, RETURN AN EMPTY JSON SCHEMA. ORGANIZE THE MEALS AND DO EVERYTHING TO ACCOMPLISH THIS REQUIREMENT, WITHOUT IT, THE RESPONSE IS USELESS.
        """

    
    
    # Initialize OpenAI client
    client=OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    print(prompt)
    try:
        # Make API call
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3  # Low temperature for consistent output
        )
        
        # Parse the response as JSON
        result = response.choices[0].message.content.strip()
        #If the LLM request succeeds, save it to the DB'

        #Save results as object. JSON format is useful to divide context by days
        saveToDatabase=saveWeeklyMenus(json.loads(result),id)
        print(saveToDatabase)

        return json.loads(result)
        
    except Exception as e:
        print(f"Error: {e}")
        return None

def saveWeeklyMenus(jsonPayload: object, id:int):
    """
    Function to save the menus as single days in the menus database

    Args:

    jsonPayload: Data in JSON format. It is a dictionary with 7 keys, one for each day of the week. Each key contains a list of dictionaries, one for each meal of the day.
    id: Unique identifier for each user

    Returns:
    Success or failure message
    """
    global mydb
    cursor=mydb.cursor()
    current_date = datetime.now().date()   # YYYY-MM-DD

    save_weekly_menus_query="""
        INSERT INTO user_menus (user_id, day1,
         day2, day3,
          day4, day5, 
          day6, day7, creationDate) 
          VALUES (%s, %s,
           %s, %s,
           %s, %s, 
           %s, %s, %s)
    """

    try:
        cursor.execute(save_weekly_menus_query, (id,json.dumps(jsonPayload["day1"]),
        json.dumps(jsonPayload["day2"]), json.dumps(jsonPayload["day3"]),
        json.dumps(jsonPayload["day4"]), json.dumps(jsonPayload["day5"]), 
        json.dumps(jsonPayload["day6"]), json.dumps(jsonPayload["day7"]),
        current_date
        ))
        mydb.commit()
        print("Weekly menus saved successfully")
        return {"status": "success", "message": "Weekly menus saved successfully"}
    
    except Exception as e:
        print(f"Error: {e}")
        return {"status": "error", "message":e}
    
    finally:
        cursor.close()

def gatherRelevantPastMessages(jsonPayload: object, id:int, day:int, userRequest:str):
    """
    Function to find relevant past messages to consider when altering the daily menu. It will use embeddings to find the most relevant messages.

    Args:

    jsonPayload: Menu for the day in JSON format
    id: Unique identifier for each user
    day: The day of the menu to alter

    Returns:
    Object with the new menu for the day
    """
    global mydb
    cursor=mydb.cursor()

    #First check if previous chat exist for the day and the user. This gives context to the AI.
    previousChatQuery="""
        SELECT * FROM chat_history WHERE user_id = %s AND day = %s
    """
    cursor.execute(previousChatQuery, (id, day))
    previousChat=cursor.fetchone()

    #Just call the function to get the daily modified menu. The additional logic is handled by that function
    if previousChat:
        previousChat=previousChat[0]
        print(f"Previous chat found for user {id} and day {day}: {previousChat}")
    else:
        previousChat=None
        print(f"No previous chat found for user {id} and day {day}")

    result=getDailyModifiedMenu(id, day, jsonPayload, previousChat, userRequest)



def getDailyModifiedMenu(id:int, day:int, userRequest:str):
    """
    Function to get the daily modified menu

    Args:
    id: Unique identifier for each user
    day: The day of the menu to get

    Returns:
    Object with the new menu for the day
    """

    global mydb
    cursor=mydb.cursor()

    #First lets get the user's data
    userData= viewUserById(id)
    
    if userData is None:
        print(f"No user found with ID {id}")
        return None

    # Check if the user has completed their nutritional assessment
    required_fields = ["recommended_daily_calories", "recommended_protein_intake", 
                      "recommended_fats_intake", "recommended_carbohydrates_intake"]
    
    missing_fields = [field for field in required_fields if field not in userData or userData[field] is None]
    
    if missing_fields:
        print(f"User {id} has not completed nutritional assessment. Missing fields: {missing_fields}")
        print("Please complete the nutritional assessment first by calling getDetailedReport()")
        return {
            "error": "Nutritional assessment not completed",
            "message": "Please complete your nutritional assessment before generating weekly menus",
            "missing_fields": missing_fields
        }

    allergies=userData.get("allergies", "")
    SportiveDescription=userData.get("sportive_description", "")
    userMedicalConditions=userData.get("medical_conditions", "")
    recommendedDailyCalories=userData["recommended_daily_calories"]
    recommendedProteinIntake=userData["recommended_protein_intake"]
    recommendedFatsIntake=userData["recommended_fats_intake"]
    recommendedCarbohydratesIntake=userData["recommended_carbohydrates_intake"]
    
    #Now get the menu of the day from the DB
    menuOfTheDayQuery=f"""
        SELECT day{day} FROM user_menus WHERE user_id = %s
    """
    cursor.execute(menuOfTheDayQuery, (id,))
    menuOfTheDay=cursor.fetchone()
    if menuOfTheDay:
        menuOfTheDay=menuOfTheDay[0]
    else:
        menuOfTheDay=None
        print(f"No menu of the day found for user {id} and day {day}")

    #Get the user name to personalize a bit the prompt
    userName=userData["name"]

    #To-Do get relevant past messages using embeddings, for now just empty---------------------------------------------------
    chatHistory=None

    prompt=f"""

    **YOUR ROLE**
    You are a specialized dietitian and expert cook that can explain cooking recipes to anyone.
    You have an endless list of recipes for breakfast, lunch, dinner and snacks. That skill
    combined with your medical knowledge make your diet recommendations very appropriate for anyone, even
    considering special constraints.

    **YOUR TASK**
    In fact, your task is to modify the menu of the day based on the user's preferences and sometimes the chat history or user's request. A menu was
    already given to the user, however, the user wants to modify it. There are many possible scenarios. For example, the user may want to add a new meal, remove a meal, change the time of a meal, change the ingredients of a meal, etc. The user could even just throw a random comment like "Awesome","I want to eat something different today" or "Good job". You must consider all these possibilities and modify (or not) the menu accordingly.

    IMPORTANT: The user daily diet must align with the daily targets in calories, protein, fats and carbohydrates. The targets are:
    - Daily Calories Target: {recommendedDailyCalories} calories (must be between {int(recommendedDailyCalories * 0.95)} - {int(recommendedDailyCalories * 1.05)})
    - Daily Protein Target: {recommendedProteinIntake}g (must be between {int(recommendedProteinIntake * 0.95)} - {int(recommendedProteinIntake * 1.05)}g)
    - Daily Fats Target: {recommendedFatsIntake}g (must be between {int(recommendedFatsIntake * 0.95)} - {int(recommendedFatsIntake * 1.05)}g)
    - Daily Carbohydrates Target: {recommendedCarbohydratesIntake}g (must be between {int(recommendedCarbohydratesIntake * 0.95)} - {int(recommendedCarbohydratesIntake * 1.05)}g)

    **LOGIC OF THE CALCULATION PROCESS**
    1. First, determine how to distribute daily calories across meals (e.g., breakfast 25%, lunch 35%, dinner 30%, snacks 10%). This distribution is just an example, it could vary according to the user's needs.
    2. Calculate the nutritional content for each meal to reach the daily targets
    3. Verify that the sum of all meals per day meets the daily requirements within 5% tolerance

    Furthermore, the user gave important additional data (allergies and sports/medical description) which was used to construct the macros
    in the diet. Consider these details when designing the diet:

    {f"Medical Conditions: {userMedicalConditions}" if userMedicalConditions else "Medical Conditions: no details found"}
    Sports description: {SportiveDescription}
    {f"Allergies: {allergies}" if allergies else "Allergies: no details found"}

    IMPORTANT: The user daily diet must be as diverse as possible. Avoid repeating the same meals and ingredients as much as possible unless the user asks to do so.
    
    CURRENT USER MENU:
    {menuOfTheDay}

    Given the current menu, the user wants to modify it. The user's request is:
    {userRequest}

    {f"In previous chats, the user asked to: {chatHistory}" if chatHistory else "No previous chat history found, hence, no additional context to consider"}

    **REQUEST TYPES**
    1. The user may want to add a new meal. In that case, add the meal and adjust the rest of the meals to meet the daily targets.
    2. The user may want to remove a meal. In that case, remove the meal and adjust the rest of the meals to meet the daily targets.
    3. The user may want to change the time of a meal. In that case, change the time and keep the rest of the meals as they are.
    4. The user may want to change the ingredients of a meal. In that case, change the ingredients and adjust the rest of the meals to meet the daily targets.
    5. The user may want to change the quantity of a meal. In that case, change the quantity and adjust the rest of the meals to meet the daily targets.
    6. The user may want to change the nutritional values of a meal (for example, I want more protein for breakfast). In that case, change the nutritional values and adjust the rest of the meals to meet the daily targets. You can do so by adjusting quantity or ingredients.
    7. The user may just want to give a random comment that does not require any modification of the menu. In that case, keep the menu as it is, return the menu key empty and in the "notes" section just add a proper friendly comment.
    8. The user may specify an additional meal that he ate outside the diet. However, the user information might be vague and only say something like "I ate a hot dog". If no additional information about the time, ingredients, nutritional values, etc. is given, assume the nutritional values of that meal searching in internet. If the user is more specific and gives details about the quantities, ingredients, time, etc. use that information to adjust the menu. In any case, adjust the rest of the meals to meet the daily targets.

    OUTPUT JSON SCHEMA:

    
    ```
    {{
        "day{day}": [
            {{
                "type":"breakfast/lunch/dinner/snack (always lowercase)",
                "hour": "Time in HH:MM format",
                "ingredients": ["Ingredient with specific quantities (e.g., '200g chicken breast', '1 tbsp olive oil')", "second ingredient", "etc."],
                "instructions": ["Step 1 of preparation", "Step 2 of preparation", "etc. (3-8 steps total)"],
                "calories": "integer - estimated calories for this meal",
                "protein": "integer - grams of protein in this meal",
                "fats": "integer - grams of fats in this meal",
                "carbohydrates": "integer - grams of carbohydrates in this meal"
            }},
            {{
                "next meal of the day with same structure"
            }}, ... the rest of the meals for the day
        ],
        "notes": "Explain in this string to the user the changes you made to the daily menu. If you consider any warning or important note, append it to this string. 
        For example, if it is not possible to preserve the range of the daily targets, explain it here. Another example is if you have to remove a meal, change the time, ingredients, quantity, etc. Explain it here. 
        This is an open text field, maximum of 200 words but be concise and give advices if necessary. This section must be an unique string, not an array of strings. Remember the message is addressed to the user, so use a friendly tone and avoid technical jargon, the name of the user is {userName}, you can just use the first name of the person."
    }}
    ```


    **WHEN TO RETURN EMPTY day{day} key**
    This key should be empty (an empty array) in the following scenarios:
    1. The user request is vague and you don't have enough information to make a modification. Some examples of vague requests are : "I want to eat something different today", "I want to add a meal", "I want to remove a meal", "I want to change a meal", etc. 
    2. The user request does not require any modification of the menu. For example, the user says "Awesome", "Good job", "Thank you", or simply something unrelated like "I love programming". In that case, return the day{day} key empty and in the notes section a proper friendly comment.
    3. The user request is incoherent or does not make any sense.
    
    **FUNDAMENTAL OUTPUT NOTES**
    1. It is vital that you respect the JSON schema and not return additional text before or after it. Not even greetings, explanations, punctuation signs, symbols like ` . - etc. Just the requested JSON schema
    2. Furthermore, if for any reason you cannot generate the JSON schema, return an empty JSON schema.
    3. For every day, there should be at least one breakfast, one lunch and one dinner. Snacks are optional. The purpose of this prompt is to generate a personalized menu that fulfills the daily targets and is as diverse as possible. Before submitting your response, make sure that the menu is as diverse as possible and that the daily targets are fulfilled (sum the calories, protein, carbohydrates and fats of each day and make sure they are close to the daily targets within the 5% range).
    4. The notes section is required. There must always be a description of the changes you made to the daily menu and, if necessary, the reasons why you made those changes. Finally, if necessary add any advice you consider important.
    5. Don't forget to check the previous chat history (if given) and to consider the user's preferences and past conversations. Maybe the user has already mentioned something that is related to the modification of the menu. Considering that data is essential.
    6. Do not create false nutritional data for food or recipes. This is illegal and can lead to serious health consequences for the user.
    7. Don't forget that the user may say something random that doesn't require a modification of the menu. In that case, return the day{day} key empty and in the notes section a proper message.
    8. If a user request makes it impossible to preserve the daily targets, try to adjust the menu as much as possible and explain the situation in the notes section. For example, if a user wants to add a dessert with 1000 calories, it is impossible to preserve the daily targets. In that case, try to adjust the rest of the meals to be as close as possible to the daily targets and explain the situation in the notes section. It will not be your falt but the user's fault, if it is impossible to preserve the 5% margin, explain why in the notes section.
    9. If the user request is vague and you don't have enough information to make a modification, return the day{day} key empty and explain in the notes section what information is mising so the user can provide it. Some examples of vague requests are : "I want to eat something different today", "I want to add a meal", "I want to remove a meal", "I want to change a meal", etc. These requests are too vague and you don't have enough information to make a modification. In that case, return an empty day{day} key and explain the situation in the notes section.
    """

    #Initialize OpenAI client
    client=OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

    #Make API call
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3  # Low temperature for consistent output
        )
        
        #Parse the response as JSON
        result = response.choices[0].message.content.strip()
        print(result)
        #Check if the day{day} key is empty
        result_json=json.loads(result)
        if result_json[f"day{day}"]:
            #If the LLM request succeeds, save it to the DB
            saveModifiedDailyMenu(id, day, json.loads(result))
        else:
            print(f"No changes made to the menu for user {id} and day {day} due to vague user request")
        return json.loads(result)
    
    except Exception as e:
        print(f"Error: {e}")
        return None



def saveModifiedDailyMenu(id:int, day:int, jsonPayload:object):
    """
    Function to save the modified daily menu

    Args:
    id: Unique identifier for each user
    day: The day of the menu to save
    jsonPayload: Menu for the day in JSON format

    Returns:
    Success or failure message
    """

    #It is necessary to cut data and only obtain the data of the day and not the notes
    global mydb
    cursor=mydb.cursor()

    save_modified_daily_menu_query=f"""
        UPDATE user_menus SET day{day} = %s WHERE user_id = %s
    """
    try:
        cursor.execute(save_modified_daily_menu_query, (json.dumps(jsonPayload[f"day{day}"]), id))
        mydb.commit()
        print(f"Modified daily menu for user {id} and day {day} saved successfully")
        return {"status": "success", "message": f"Modified daily menu for user {id} and day {day} saved successfully"}
    
    except Exception as e:
        print(f"Error: {e}")
        return {"status": "error", "message":e}
    
    finally:
        cursor.close()
    
    
"""
To-do

1. Create a function to call a general LLM in case it is necessary to switch engine or even add multi-provider support or fallbacks
2. Create a function to store chat history for each day
3. Add a small re-try icon that allows to generate the whole weekly menu based on a user prompt. It would be
better to validate the reason with AI before accepting it
"""

    