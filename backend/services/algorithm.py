import random
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from geoalchemy2 import Geography
import models


def suggest_locations(db: Session, lat: float, lon: float, prefs: list, cuisines: list, limit: int,
                      user_id: int = None):
    user_point = func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)

    # Фільтр чорного списку користувача
    blacklisted_ids = []
    if user_id:
        blacklisted_ids = [r.place_id for r in
                           db.query(models.UserBlacklist).filter(models.UserBlacklist.user_id == user_id).all()]

    # Налаштування ритму та радіусу
    if limit <= 3:
        search_radius, pattern = 1200, ['attr', 'attr', 'food']
    elif limit <= 5:
        search_radius, pattern = 2500, ['attr', 'food', 'attr', 'attr', 'food']
    else:
        search_radius, pattern = 5000, ['food', 'attr', 'attr', 'food', 'attr', 'attr', 'food']

    def get_pool(categories, is_food=False):
        query = db.query(models.Place).filter(
            models.Place.category.in_(categories),
            ~models.Place.id.in_(blacklisted_ids) if blacklisted_ids else True,
            func.ST_DWithin(func.cast(models.Place.location, Geography), func.cast(user_point, Geography),
                            search_radius)
        )
        if is_food and cuisines:
            cuisine_filters = [models.Place.description.contains(f"CUISINE_TAG:{c}") for c in cuisines]
            res = query.filter(or_(*cuisine_filters)).all()
            if res: return res
        return query.order_by(func.ST_Distance(models.Place.location, user_point)).limit(50).all()

    food_pool = get_pool(['food'], is_food=True)
    attr_pool = get_pool([p for p in prefs if p != 'food'] or ['culture', 'nature'])

    ordered_itinerary, current_pos = [], user_point

    for step_type in pattern:
        target_pool = food_pool if step_type == 'food' else attr_pool
        if not target_pool: target_pool = attr_pool if step_type == 'food' else food_pool

        if target_pool:
            target_pool.sort(key=lambda p: db.scalar(func.ST_Distance(p.location, current_pos)))
            # Рандомізація: беремо одного з 5 найближчих
            lucky_idx = random.randint(0, min(len(target_pool), 5) - 1)
            next_point = target_pool.pop(lucky_idx)
            ordered_itinerary.append(next_point)
            current_pos = next_point.location
        if len(ordered_itinerary) >= limit: break

    return ordered_itinerary