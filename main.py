from fastapi import FastAPI, Query,HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, EmailStr
from typing import Annotated
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from enum import Enum
from dotenv import load_dotenv

from dbQueries import DBConnect, signUpUser,signInUser, updateBasicInformation,getAISuggestion,updateAdditionalInformation, getDetailedReport, getWeeklyMenus, getDailyModifiedMenu, loadUserMenu, loadUserChatHistory
from models import User, UserLogin, BasicInformationUser,AdditionalInformationUser, ModifyDailyMenuRequest, UserFeedback

load_dotenv()
app=FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Initialize connection with the database
mydb=DBConnect()

@app.get("/")

@app.post("/signUp")
async def signUp(user: User):
    response=signUpUser(user)
    if response.get("user"):
        response.update({"status": 201})
        return response
    else:
        return  {"status": 400, "error": response.get("error")}
    

@app.post("/signIn")
async def signIn(userLogin: UserLogin):
    response=signInUser(userLogin)
    if response.get("user"):
        response.update({"status": 200})
        return response
    else:
        return  {"status": 400, "error": response.get("error")}
    
@app.post("/updateBasicInformation")
async def update_basic_information(basicUser: BasicInformationUser):
    response = updateBasicInformation(basicUser)
    if response.get("user"):
        response.update({"status": 200})
        return response
    else:
        return {"status": 400, "error": response.get("error")}
    
@app.post("/getAISuggestion")
async def get_AI_Suggestion(additionalInformationUser: AdditionalInformationUser):
    response= getAISuggestion(additionalInformationUser)
    if response:
        return response
    else:
        return None

@app.post("/updateAdditionalInformation")
async def update_additional_information(additionalInformationUser: AdditionalInformationUser):
    response = updateAdditionalInformation(additionalInformationUser)
    if response:
        print(response)
        return response
    else:
        return None
    
@app.post("/getDetailedReport")
async def get_detailed_report(id:int):
    response= getDetailedReport(id)
    if response:
        print(response)
        return response
    else:
        return None
    
@app.post("/getWeeklyMenus") 
async def get_weekly_menus(request: dict):
    id = request.get("id")
    userFeedback = request.get("userFeedback")
    response=getWeeklyMenus(id, userFeedback)
    if response:
        print(response)
        return response
    else:
        raise HTTPException(status_code=400, detail="Failed to obtain menus, please, try again")

@app.post("/modifyDailyMenu")
async def modify_daily_menu(modifyRequest: ModifyDailyMenuRequest):
    #Lets send id, day and request to the function
    response=getDailyModifiedMenu(modifyRequest.id, modifyRequest.day, modifyRequest.userRequest)
    if response:
        return response
    else:
        return None

@app.get("/loadUserMenu")
async def load_user_menu(id:int):
    result = loadUserMenu(id)
    if result:
        response, creationDate = result
        return response, creationDate
    else:
        return None

@app.get("/loadUserChatHistory")
async def load_user_chat_history(id:int):
    response=loadUserChatHistory(id)
    if response:
        return response
    else:
        return None

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)