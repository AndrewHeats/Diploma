from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Any
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class User(UserBase):
    id: int
    class Config: from_attributes = True

class PlaceBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    rating: float = 0.0

class PlaceCreate(PlaceBase):
    latitude: float
    longitude: float

class Place(PlaceBase):
    id: int
    latitude: float
    longitude: float
    class Config: from_attributes = True

class RouteStep(BaseModel):
    from_name: str
    to_name: str
    duration_min: int
    distance_m: int

class RouteRequest(BaseModel):
    start_lat: float
    start_lon: float
    preferences: List[str]
    duration_type: str = "medium"
    user_id: Optional[int] = None

class RouteResponse(BaseModel):
    points: List[Place]
    geometry: Any
    itinerary: List[RouteStep]
    total_duration_min: int

class HistoryItem(BaseModel):
    id: int
    route_name: str
    total_duration: int
    points_summary: str
    created_at: datetime
    class Config: from_attributes = True