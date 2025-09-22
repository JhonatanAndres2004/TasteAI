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
from processingAgent import MultiLLMService
from string import Template
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

#Now initialize the processing agent
AIAgent = MultiLLMService([])
AIAgent.providers = [
    AIAgent.gemini_provider,
    AIAgent.openai_provider,
    AIAgent.anthropic_provider
]

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
                objective VARCHAR(20) DEFAULT NULL,
                age INT,

                weight FLOAT DEFAULT NULL,
                height FLOAT DEFAULT NULL,
                allergies TEXT DEFAULT NULL,
                sportive_description TEXT DEFAULT NULL,
                medical_conditions TEXT DEFAULT NULL,
                food_preferences TEXT DEFAULT NULL,

                recommended_daily_calories FLOAT DEFAULT NULL,
                recommended_water_intake FLOAT DEFAULT NULL,
                recommended_protein_intake FLOAT DEFAULT NULL,
                recommended_fats_intake FLOAT DEFAULT NULL,
                recommended_carbohydrates_intake FLOAT DEFAULT NULL,
                nutritional_deficiency_risks TEXT DEFAULT NULL,
                general_recommendation TEXT DEFAULT NULL,
                country TEXT DEFAULT NULL,
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
            height = %s,
            country = %s
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
                user.country,
                user.id
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

    # Convert input to string if it's a dict
    if isinstance(additionalInformationUser, dict):
        additionalInformationUser_str = json.dumps(additionalInformationUser, indent=2)
    else:
        additionalInformationUser_str = additionalInformationUser
    
    #Read the prompt template from file
    with open("prompts/getAISuggestion.md", "r", encoding="utf-8") as f:
        template = Template(f.read())

    prompt = template.substitute(additionalInformationUser_str=str(additionalInformationUser_str))
    print(prompt)
    try:
        # Make API call
        response = AIAgent.getLLMResponse(prompt)
        return response
        
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
            medical_conditions = %s,
            food_preferences = %s
            WHERE id = %s   
            """
            # Convert arrays to JSON strings for database storage
            allergies_json = json.dumps(additionalInformationUser.allergies) if additionalInformationUser.allergies else None
            sportive_json = json.dumps(additionalInformationUser.sportive_description) if additionalInformationUser.sportive_description else None
            medical_json = json.dumps(additionalInformationUser.medical_conditions) if additionalInformationUser.medical_conditions else None
            food_preferences_json = json.dumps(additionalInformationUser.food_preferences) if additionalInformationUser.food_preferences else None
            cursor.execute(update_query, (
                allergies_json,
                sportive_json,
                medical_json,
                food_preferences_json,
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
    foodPreferences=userData["food_preferences"]
    userSportiveDescription=userData["sportive_description"]
    userMedicalConditions=userData["medical_conditions"]

    #Read the prompt template from file
    with open("prompts/getDetailedReport.md", "r", encoding="utf-8") as f:
        template = Template(f.read())

    prompt = template.substitute(
        userSex=userSex,
        userAge=userAge,
        userObjective=userObjective,
        userWeight=userWeight,
        userHeight=userHeight,
        userAllergies=userAllergies if userAllergies else "The patient does not have any allergy",
        userSportiveDescription=userSportiveDescription if userSportiveDescription else "The patient does not have any sportive condition",
        userMedicalConditions=userMedicalConditions if userMedicalConditions else "The patient does not have any dangerous medical condition such as Asthma, high blood pressure, and so on",
        foodPreferences=foodPreferences if foodPreferences else "The patient does not have any food preference that must be considered"
        )
    
    print(prompt)

    try:
        # Make API call
        response = AIAgent.getLLMResponse(prompt)
        saveToDatabase=saveDetailedReport(response,id)
        print(saveToDatabase)

        return response
        
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
            nutritional_deficiency_risks = %s,
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
            json.dumps(jsonPayload["nutritional_deficiency_risks"]),
            json.dumps(jsonPayload["general_recommendation"]),
            id
        ))
        mydb.commit()

        print(f"Successfully updated detailed report for user {id}")
        return {"message": f"Successfully updated detailed report for user {id}"}
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
    nutritionalDeficiencyRisks=userData.get("nutritional_deficiency_risks", "")
    foodPreferences=userData.get("food_preferences", "")
    country=userData["country"]
    #Trim unnecessary symbols
    allergies=allergies.translate(str.maketrans("", "", '[]"'))
    SportiveDescription=SportiveDescription.translate(str.maketrans("", "", '[]"'))
    userMedicalConditions=userMedicalConditions.translate(str.maketrans("", "", '[]"'))


    nutritionalDeficiencyRisks=nutritionalDeficiencyRisks.translate(str.maketrans("", "", '[]"'))

    #Read the prompt template from file
    with open("prompts/getWeeklyMenus.md", "r", encoding="utf-8") as f:
        template = Template(f.read())

    prompt = template.substitute(
        recommendedDailyCalories=recommendedDailyCalories,
            lowerRecommendedDailyCalories=int(recommendedDailyCalories*0.95),
            upperRecommendedDailyCalories=int(recommendedDailyCalories*1.05),
            recommendedProteinIntake=recommendedProteinIntake,
            lowerRecommendedProteinIntake=int(recommendedProteinIntake*0.9),
            upperRecommendedProteinIntake=int(recommendedProteinIntake*1.1),
            recommendedFatsIntake=recommendedFatsIntake,
            lowerRecommendedFatsIntake=int(recommendedFatsIntake*0.85),
            upperRecommendedFatsIntake=int(recommendedFatsIntake*1.15),
            recommendedCarbohydratesIntake=recommendedCarbohydratesIntake,
            lowerRecommendedCarbohydratesIntake=int(recommendedCarbohydratesIntake*0.8),
            upperRecommendedCarbohydratesIntake=int(recommendedCarbohydratesIntake*1.2),
            userMedicalConditions= ("Medical conditions: " + userMedicalConditions) if userMedicalConditions else "The patient does not have any dangerous medical condition such as Asthma, high blood pressure, and so on",
            userSportiveDescription=("Sportive description: "+SportiveDescription)if SportiveDescription else "The patient does not have any sportive condition",
            userAllergies=("Allergies: " + allergies) if allergies else "The patient does not have any allergy",
            foodPreferences=("Food preferences: " + foodPreferences) if foodPreferences else "The patient does not have any food preference that must be considered",
            country=country if country else "United States"
            )
    print(prompt)
    try:
        # Make API call
        response = AIAgent.getLLMResponse(prompt)
        #If the LLM request succeeds, save it to the DB. Save results as object. JSON format is useful to divide context by days
        saveToDatabase=saveWeeklyMenus(response,id)
        print(saveToDatabase)

        return response
        
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
    foodPreferences=userData.get("food_preferences", "")
    recommendedDailyCalories=userData["recommended_daily_calories"]
    recommendedProteinIntake=userData["recommended_protein_intake"]
    recommendedFatsIntake=userData["recommended_fats_intake"]
    recommendedCarbohydratesIntake=userData["recommended_carbohydrates_intake"]
    country=userData["country"]
    
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

    #Read the prompt template from file
    with open("prompts/modifyDailyMenu.md", "r", encoding="utf-8") as f:
        template = Template(f.read())
    prompt = template.substitute(
            recommendedDailyCalories=recommendedDailyCalories,
            lowerRecommendedDailyCalories=int(recommendedDailyCalories*0.95),
            upperRecommendedDailyCalories=int(recommendedDailyCalories*1.05),
            recommendedProteinIntake=recommendedProteinIntake,
            lowerRecommendedProteinIntake=int(recommendedProteinIntake*0.95),
            upperRecommendedProteinIntake=int(recommendedProteinIntake*1.05),
            recommendedFatsIntake=recommendedFatsIntake,
            lowerRecommendedFatsIntake=int(recommendedFatsIntake*0.95),
            upperRecommendedFatsIntake=int(recommendedFatsIntake*1.05),
            recommendedCarbohydratesIntake=recommendedCarbohydratesIntake,
            lowerRecommendedCarbohydratesIntake=int(recommendedCarbohydratesIntake*0.95),
            upperRecommendedCarbohydratesIntake=int(recommendedCarbohydratesIntake*1.05),
            userMedicalConditions= ("Medical conditions: " + userMedicalConditions) if userMedicalConditions else "The patient does not have any dangerous medical condition such as Asthma, high blood pressure, and so on",
            userSportiveDescription=("Sportive description: "+SportiveDescription)if SportiveDescription else "The patient does not have any sportive condition",
            userAllergies=("Allergies: " + allergies) if allergies else "The patient does not have any allergy",
            foodPreferences=("Food preferences: "+ foodPreferences) if foodPreferences else "The patient does not have any food preference that must be considered",
            country=country if country else "United States",
            menuOfTheDay=menuOfTheDay if menuOfTheDay else "No menu found for the day, hence, create a new one from scratch",
            userRequest=userRequest,
            chatHistory=chatHistory if chatHistory else "No previous chat history found, hence, no additional context needed to understand the request",
            userName=userName,
            daySelected= f"day{day}"
    )
    print(prompt)
    #Make API call
    try:
        response = AIAgent.getLLMResponse(prompt)
        #Check if the day{day} key is empty
        result_json=response
        if result_json[f"day{day}"]:
            #If the LLM request succeeds, save it to the DB
            saveModifiedDailyMenu(id, day, response)
        else:
            print(f"No changes made to the menu for user {id} and day {day} due to vague user request")
        return response
    
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

