from pydantic import BaseModel, Field, EmailStr
from enum import Enum

class Sex(str, Enum):
    male = "Male"
    female = "Female"
class Objectives(str, Enum):
    weight_loss = "Weight Loss"
    muscle_gain = "Muscle Gain"
    maintenance = "Maintenance"


class User(BaseModel):
    name: str =Field(default="User", min_length=6, max_length=35)
    email: EmailStr
    password: str = Field(min_length=8, max_length=30)
    age: int = Field(ge=18, le=100)
    id:int|None = Field(default=None)
    sex: Sex
    objective: Objectives|None = Field(default=None)
    weight: float|None = Field(default=None, ge=30.0)
    height: float|None = Field(default=None, ge=50.0)

    allergies: str|None = Field(default=None)
    sportive_description: str|None = Field(default=None)
    medical_conditions: str|None = Field(default=None)
    food_preferences: str|None = Field(default=None)

    recommended_daily_calories: float|None = Field(default=None)
    recommended_water_intake: float|None = Field(default=None)
    recommended_protein_intake: float|None = Field(default=None)
    recommended_fats_intake: float|None = Field(default=None)
    recommended_carbohydrates_intake: float|None = Field(default=None)
    nutritional_deficiency_risks: str|None = Field(default=None)
    general_recommendation:str|None = Field(default=None)
    country: str|None = Field(default=None)

    weekly_calories: str|None = Field(default=None)
    weekly_protein: str|None = Field(default=None)
    weekly_fats: str|None = Field(default=None)
    weekly_carbohydrates: str|None = Field(default=None)
    imc: float|None = Field(default=None)
    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "John Doe",
                "email": "JohnDoe@hotmail.com",
                "password": "JohnDoe123",
                "age": 30,
                "sex":"Male"}}
    }


class BasicInformationUser(BaseModel):
    name: str =Field(default="User", min_length=6, max_length=25)
    password: str = Field(min_length=8, max_length=30)
    age: int = Field(ge=18, le=100)
    id:int|None = Field(default=None)
    sex: Sex
    objective: Objectives|None = Field(default=None)
    weight: float|None = Field(default=None, ge=10.0)
    height: float|None = Field(default=None, ge=50.0)
    country: str|None = Field(default=None)
    
class AdditionalInformationUser(BaseModel):
    id: int|None = Field(default=None)
    allergies: list[str] |None = Field(default=None)
    sportive_description: list[str]|None = Field(default=None)
    medical_conditions: list[str]|None = Field(default=None)
    food_preferences: list[str]|None = Field(default=None)


class UserLogin(BaseModel):
    email: EmailStr
    password: str|None = Field(min_length=8, max_length=30)
    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "JohnDoe@hotmail.com",
                "password": "JohnDoe123"
            }
        }
    }

class ModifyDailyMenuRequest(BaseModel):
    id: int
    day: int
    userRequest: str
    