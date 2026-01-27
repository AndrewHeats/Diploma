from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

class Place(Base):
    __tablename__ = "places"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    category = Column(String)
    rating = Column(Float, default=0.0)
    location = Column(Geometry(geometry_type='POINT', srid=4326))

class SavedRoute(Base):
    __tablename__ = "saved_routes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    route_name = Column(String)
    total_duration = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    points_summary = Column(String)
    # Зберігаємо весь об'єкт маршруту для відтворення на мапі
    route_data = Column(JSON)