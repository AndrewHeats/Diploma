from sqlalchemy.orm import Session
from sqlalchemy import func
import models
import schemas
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_place(db: Session, place: schemas.PlaceCreate):
    db_place = models.Place(
        name=place.name,
        description=place.description,
        category=place.category,
        rating=place.rating,
        # Завжди встановлюємо 4326 при створенні
        location=func.ST_SetSRID(func.ST_MakePoint(place.longitude, place.latitude), 4326)
    )
    db.add(db_place)
    db.commit()
    db.refresh(db_place)
    return db_place

def get_places(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Place).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user