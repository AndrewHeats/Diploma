from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Any
from datetime import datetime

# --- Користувачі ---
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class User(UserBase):
    id: int
    class Config:
        from_attributes = True

# --- Місця (Place) ---
class PlaceBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    rating: float = 0.0

class PlaceCreate(PlaceBase):
    """Цей клас виправляє вашу помилку AttributeError"""
    latitude: float
    longitude: float

class Place(PlaceBase):
    id: int
    latitude: float
    longitude: float
    class Config:
        from_attributes = True

# --- Маршрути та Навігація ---
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

# --- Історія подорожей ---
class HistoryItem(BaseModel):
    id: int
    route_name: Optional[str] = "Без назви"
    total_duration: Optional[int] = 0
    points_summary: Optional[str] = ""
    created_at: Optional[datetime] = None
    route_data: Optional[Any] = None
    class Config:
        from_attributes = True

class UpdateRouteName(BaseModel):
    route_name: str