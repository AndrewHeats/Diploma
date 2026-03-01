from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, Field, EmailStr


# --- КОРИСТУВАЧІ ---
class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class User(UserBase):
    id: int

    class Config:
        from_attributes = True


# --- МІСЦЯ (Place) ---
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

    class Config:
        from_attributes = True


# --- МАРШРУТИ ТА НАВІГАЦІЯ ---
class RouteStep(BaseModel):
    from_name: str
    to_name: str
    duration_min: int
    distance_m: int
    stay_min: int


class RouteRequest(BaseModel):
    start_lat: float
    start_lon: float
    preferences: List[str]
    cuisine_prefs: List[str]
    duration_type: str = "medium"
    user_id: Optional[int] = None


class RouteResponse(BaseModel):
    points: List[Place]
    geometry: Any
    itinerary: List[dict]  # або List[RouteStep]
    total_duration_min: int


# --- ІСТОРІЯ ---
class HistoryItem(BaseModel):
    id: int
    route_name: str
    total_duration: int
    created_at: datetime
    points_summary: str
    route_data: Any  # JSON об'єкт маршруту
    is_liked: bool = False  # Поле для лайків маршрутів

    class Config:
        from_attributes = True


class UpdateRouteName(BaseModel):
    route_name: str


# --- ЧАТ (НОВЕ) ---
class MessageCreate(BaseModel):
    content: str
    city_name: str
    user_id: int


class MessageResponse(BaseModel):
    id: int
    content: str
    city_name: str
    created_at: datetime
    user_email: str

    class Config:
        from_attributes = True