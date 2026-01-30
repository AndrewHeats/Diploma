from sqlalchemy import func, or_
from sqlalchemy.orm import Session

import models


def suggest_locations(db: Session, lat: float, lon: float, prefs: list, cuisines: list, limit: int):
    user_point = func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)
    radius = 6000  # 6 км

    # --- КРОК 1: ВИЗНАЧАЄМО ПРОПОРЦІЮ ---
    if limit <= 3:
        food_count = 1
        attr_count = 2
    elif limit <= 5:
        food_count = 2
        attr_count = 3
    else:
        food_count = 3
        attr_count = limit - 3

    # --- КРОК 2: ШУКАЄМО ЇЖУ ---
    food_query = db.query(models.Place).filter(
        models.Place.category == 'food',
        func.ST_DWithin(models.Place.location, user_point, radius)
    )

    if cuisines:
        # Фільтр по конкретних кухнях через теги, які ми додали в сідері
        cuisine_filters = [models.Place.description.contains(f"CUISINE_TAG:{c}") for c in cuisines]
        food_query = food_query.filter(or_(*cuisine_filters))

    # Беремо їжу випадковим чином серед найкращих
    restaurants = food_query.order_by(func.random()).limit(food_count).all()

    # --- КРОК 3: ШУКАЄМО ПАМ'ЯТКИ (Культура, Природа) ---
    # Виключаємо категорію food, щоб не було дублів
    active_prefs = [p for p in prefs if p != 'food']
    if not active_prefs:
        active_prefs = ['culture', 'nature']  # фолбек, якщо нічого не обрано

    attractions = db.query(models.Place).filter(
        models.Place.category.in_(active_prefs),
        func.ST_DWithin(models.Place.location, user_point, radius)
    ).order_by(func.random()).limit(attr_count).all()

    # --- КРОК 4: ПЕРЕМІШУЄМО В ЛОГІЧНИЙ МАРШРУТ ---
    itinerary = []

    if limit <= 3:
        # План: Пам'ятка -> Їжа -> Пам'ятка
        if len(attractions) > 0: itinerary.append(attractions[0])
        if len(restaurants) > 0: itinerary.append(restaurants[0])
        if len(attractions) > 1: itinerary.append(attractions[1])
    else:
        # План для довших маршрутів: почергово
        # Сніданок (Food 1) -> Прогулянка (Attr 1, 2) -> Обід (Food 2) -> ...
        attr_idx = 0
        food_idx = 0

        while len(itinerary) < (len(restaurants) + len(attractions)):
            # Додаємо їжу кожні дві-три точки
            if food_idx < len(restaurants):
                itinerary.append(restaurants[food_idx])
                food_idx += 1

            # Додаємо пару пам'яток після їжі
            for _ in range(2):
                if attr_idx < len(attractions):
                    itinerary.append(attractions[attr_idx])
                    attr_idx += 1

    return itinerary
