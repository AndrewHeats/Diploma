from pydantic import BaseModel, EmailStr
from typing import List, Optional

class PlaceBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    rating: float = 4.0

class PlaceCreate(PlaceBase):
    latitude: float
    longitude: float

class Place(PlaceBase):
    id: int
    latitude: float
    longitude: float
    class Config:
        from_attributes = True

class RouteRequest(BaseModel):
    start_lat: float
    start_lon: float
    preferences: List[str]
    duration_type: str = "medium"
    radius_km: Optional[int] = 5
    transport_type: Optional[str] = "walking"

class RouteResponse(BaseModel):
    points: List[Place]
    geometry: dict
    total_distance_meters: float
    estimated_time_minutes: int