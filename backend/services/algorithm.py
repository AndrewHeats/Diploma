from sqlalchemy.orm import Session
from sqlalchemy import func
import models


def suggest_locations(db: Session, lat: float, lon: float, prefs: list, limit: int):
    """
    Пошук пам'яток у радіусі 20 км з врахуванням категорій.
    """
    # Створюємо точку користувача у системі координат WGS84
    user_point = func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)

    query = db.query(models.Place)

    # Фільтр за вподобаннями, якщо вони вибрані
    if prefs:
        query = query.filter(models.Place.category.in_(prefs))

    # Географічний фільтр (радіус 20000 метрів)
    query = query.filter(
        func.ST_DWithin(models.Place.location, user_point, 20000)
    ).order_by(models.Place.rating.desc()).limit(limit)

    return query.all()