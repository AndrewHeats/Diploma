import random
from sqlalchemy import func
from sqlalchemy.orm import Session
from geoalchemy2 import Geography
import models


def suggest_locations(db: Session, lat: float, lon: float, prefs: list, cuisines: list, limit: int,
                      user_id: int = None):
    # Точка старту користувача
    user_point = func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)

    # 1. Завантажуємо чорний список
    blacklisted_ids = []
    if user_id:
        blacklist_records = db.query(models.UserBlacklist).filter(models.UserBlacklist.user_id == user_id).all()
        blacklisted_ids = [r.place_id for r in blacklist_records]

    # 2. Визначаємо патерн (ритм маршруту)
    if limit <= 3:
        pattern = ['attr', 'attr', 'food']
    elif limit <= 5:
        pattern = ['attr', 'food', 'attr', 'attr', 'food']
    else:
        pattern = ['food', 'attr', 'attr', 'food', 'attr', 'attr', 'food']

    # 3. Універсальна функція пошуку НАЙБЛИЖЧИХ місць (БЕЗ жорсткого радіусу)
    def get_closest_places(categories):
        query = db.query(models.Place).filter(models.Place.category.in_(categories))

        # Фільтруємо заблоковані місця
        if blacklisted_ids:
            query = query.filter(~models.Place.id.in_(blacklisted_ids))

        # Просто сортуємо за відстанню і беремо 20 найближчих
        # Використання Geography гарантує точний розрахунок у метрах
        return query.order_by(
            func.ST_Distance(
                func.cast(models.Place.location, Geography),
                func.cast(user_point, Geography)
            )
        ).limit(20).all()

    # 4. Формуємо списки (пули)
    attr_categories = [p for p in prefs if p != 'food']
    # Запобіжник: якщо юзер зняв усі галочки в налаштуваннях
    if not attr_categories:
        attr_categories = ['culture', 'nature']

    food_pool = get_closest_places(['food'])
    attr_pool = get_closest_places(attr_categories)

    ordered_itinerary = []

    # 5. Будуємо маршрут за нашим патерном
    for step_type in pattern:
        # Визначаємо, з якого пулу брати локацію
        if step_type == 'food':
            target_pool = food_pool if food_pool else attr_pool
        else:
            target_pool = attr_pool if attr_pool else food_pool

        if target_pool:
            # Беремо випадкове місце з 3-х найближчих, щоб маршрут був непередбачуваним, але логічним
            lucky_idx = random.randint(0, min(len(target_pool), 3) - 1)
            next_point = target_pool.pop(lucky_idx)
            ordered_itinerary.append(next_point)

        if len(ordered_itinerary) >= limit:
            break

    return ordered_itinerary