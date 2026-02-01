from fastapi.encoders import jsonable_encoder
from sqlalchemy import func
from sqlalchemy.orm import Session

import models
import schemas
from services import algorithm, routing

# Налаштування часу перебування (у хвилинах)
STAY_TIME = {
    "food": 60,
    "culture": 45,
    "nature": 30,
    "historic": 20,
    "default": 15
}


async def create_full_route(db: Session, req: schemas.RouteRequest):
    # 1. Визначаємо ліміт точок
    limit_map = {"short": 3, "medium": 5, "long": 9}
    point_limit = limit_map.get(req.duration_type, 5)

    # 2. Отримуємо локації
    suggested = algorithm.suggest_locations(
        db, req.start_lat, req.start_lon,
        req.preferences, req.cuisine_prefs, point_limit
    )

    if not suggested:
        return None

    coords = [[req.start_lon, req.start_lat]]
    formatted_points = []
    total_stay_minutes = 0

    for p in suggested:
        # Безпечне отримання координат
        try:
            lon = db.scalar(func.ST_X(p.location))
            lat = db.scalar(func.ST_Y(p.location))
            coords.append([lon, lat])

            stay = STAY_TIME.get(p.category, STAY_TIME["default"])
            total_stay_minutes += stay

            # СТРОГИЙ ЗАХИСТ: Перетворюємо все в рядки, щоб уникнути None на iOS
            formatted_points.append(schemas.Place(
                id=int(p.id),
                name=str(p.name) if p.name else "Цікаве місце",
                description=str(p.description) if p.description else "Опис відсутній",
                category=str(p.category) if p.category else "Пам'ятка",
                rating=float(p.rating) if p.rating else 4.5,
                latitude=float(lat),
                longitude=float(lon)
            ))
        except Exception as e:
            print(f"⚠️ Skipping point due to data error: {e}")
            continue

    # 3. Навігація Mapbox
    nav_data = await routing.get_detailed_route(coords)
    if not nav_data or 'geometry' not in nav_data or not nav_data['geometry'].get('coordinates'):
        return None

    # 4. Формуємо кроки маршруту
    itinerary_list = []
    names = ["Ваша локація"] + [p.name for p in formatted_points]
    legs = nav_data.get('legs', [])

    for i in range(len(legs)):
        leg = legs[i]
        # Беремо категорію для визначення часу перебування
        current_cat = formatted_points[i].category if i < len(formatted_points) else "default"
        current_stay = STAY_TIME.get(current_cat, 15)

        itinerary_list.append(schemas.RouteStep(
            from_name=str(names[i]),
            to_name=str(names[i + 1]),
            duration_min=round(leg.get('duration', 0) / 60),
            distance_m=round(leg.get('distance', 0)),
            stay_min=int(current_stay)
        ))

    walking_time = round(nav_data.get('total_duration', 0) / 60)
    final_total_time = walking_time + total_stay_minutes

    final_result = {
        "points": formatted_points,
        "geometry": nav_data['geometry'],
        "itinerary": itinerary_list,
        "total_duration_min": final_total_time
    }

    # 5. Збереження в історію
    if req.user_id:
        try:
            new_history = models.SavedRoute(
                user_id=req.user_id,
                route_name=f"Львів: {final_total_time} хв",
                total_duration=final_result["total_duration_min"],
                points_summary=" -> ".join([p.name for p in formatted_points]),
                route_data=jsonable_encoder(final_result)
            )
            db.add(new_history)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"⚠️ History error: {e}")

    return final_result
