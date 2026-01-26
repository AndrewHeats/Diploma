from sqlalchemy.orm import Session
from sqlalchemy import func
import models, schemas

# --- Операції з Користувачами ---
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    # У реальному дипломі тут має бути хешування: pwd_context.hash(user.password)
    fake_hashed_password = user.password + "notreallyhashed"
    db_user = models.User(email=user.email, hashed_password=fake_hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Операції з Місцями ---
def create_place(db: Session, place: schemas.PlaceCreate):
    # Формуємо точку для PostGIS
    point = f'POINT({place.longitude} {place.latitude})'
    db_place = models.Place(
        name=place.name,
        description=place.description,
        category=place.category,
        rating=place.rating,
        location=point
    )
    db.add(db_place)
    db.commit()
    db.refresh(db_place)
    return db_place

def get_places(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Place).offset(skip).limit(limit).all()