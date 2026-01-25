from sqlalchemy import Column, Integer, String, Float, ARRAY, ForeignKey
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    preferences = Column(ARRAY(String), default=[])

    saved_routes = relationship("SavedRoute", back_populates="owner")


class Place(Base):
    __tablename__ = "places"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    category = Column(String)  # 'shopping', 'culture', 'nature', 'food'
    rating = Column(Float, default=0.0)
    # Географія PostGIS
    location = Column(Geometry(geometry_type='POINT', srid=4326))


class SavedRoute(Base):
    __tablename__ = "saved_routes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    places_ids = Column(ARRAY(Integer))  # Зберігаємо ID місць у порядку відвідування

    owner = relationship("User", back_populates="saved_routes")