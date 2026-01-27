from sqlalchemy.orm import Session
from sqlalchemy import func
import models


def suggest_locations(db: Session, lat: float, lon: float, prefs: list, limit: int):
    """
    Пошук місць з автоматичним розширенням радіусу та категорій.
    """
    user_point = func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)

    # 1. Спроба знайти саме те, що просив користувач
    query = db.query(models.Place).filter(
        models.Place.category.in_(prefs),
        func.ST_DWithin(models.Place.location, user_point, 5000)  # 5 км
    ).order_by(models.Place.rating.desc()).limit(limit)

    results = query.all()

    # 2. ФОЛБЕК (якщо нічого не знайдено, напр. Шопінг у лісі)
    if not results:
        print("DEBUG: За категоріями нічого не знайдено. Розширюємо пошук...")
        query = db.query(models.Place).filter(
            func.ST_DWithin(models.Place.location, user_point, 10000)  # 10 км
        ).order_by(models.Place.rating.desc()).limit(limit)
        results = query.all()

    return results