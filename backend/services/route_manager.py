import random
import httpx
import os
import models, schemas
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from geoalchemy2 import Geography
from fastapi.encoders import jsonable_encoder
from dotenv import load_dotenv

load_dotenv()
MAPBOX_TOKEN = os.getenv("MAPBOX_API_KEY")


# --- 1. Твій алгоритм вибору локацій (PU) ---
def suggest_locations(db: Session, lat: float, lon: float, prefs: list, cuisines: list, limit: int,
                      user_id: int = None):
    user_point = func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)

    blacklisted_ids = []
    if user_id:
        blacklisted_ids = [r.place_id for r in
                           db.query(models.UserBlacklist).filter(models.UserBlacklist.user_id == user_id).all()]

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
            lucky_idx = random.randint(0, min(len(target_pool), 5) - 1)
            next_point = target_pool.pop(lucky_idx)
            ordered_itinerary.append(next_point)
            current_pos = next_point.location
        if len(ordered_itinerary) >= limit: break

    return ordered_itinerary


# --- 2. Твій роутінг через Mapbox ---
async def get_detailed_route(coordinates: list, profile: str = "walking"):
    if not MAPBOX_TOKEN:
        print("ERROR: MAPBOX_TOKEN не знайдено!")
        return None

    coords_str = ";".join([f"{c[0]},{c[1]}" for c in coordinates])
    url = f"https://api.mapbox.com/directions/v5/mapbox/{profile}/{coords_str}"
    params = {
        "access_token": MAPBOX_TOKEN,
        "geometries": "geojson",
        "overview": "full",
        "steps": "true"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params)
            data = response.json()
            if response.status_code != 200 or not data.get('routes'):
                return None

            route = data['routes'][0]
            return {
                "geometry": route['geometry'],
                "legs": route['legs'],
                "total_duration": route['duration'],
                "total_distance": route['distance']
            }
        except Exception as e:
            print(f"Routing Exception: {e}")
            return None


# --- 3. Основна функція, яка все об'єднує ---
async def create_full_route(db: Session, req: schemas.RouteRequest):
    # А) Вибираємо місця за твоїм алгоритмом
    suggested_places = suggest_locations(
        db, req.start_lat, req.start_lon, req.preferences,
        req.cuisine_prefs, limit=(3 if req.duration_type == "short" else 5),
        user_id=req.user_id
    )

    if not suggested_places:
        return None

    # Б) Готуємо точки для Mapbox: [Старт, Точка 1, Точка 2...]
    mapbox_coords = [[req.start_lon, req.start_lat]]
    for p in suggested_places:
        lon = db.scalar(func.ST_X(p.location))
        lat = db.scalar(func.ST_Y(p.location))
        mapbox_coords.append([lon, lat])

    # В) Отримуємо реальну геометрію та дані про кроки
    route_data = await get_detailed_route(mapbox_coords)
    if not route_data:
        return None

    # Г) Формуємо список точок для фронтенду ( schemas.Place )
    final_points = []
    for p in suggested_places:
        lon = db.scalar(func.ST_X(p.location))
        lat = db.scalar(func.ST_Y(p.location))
        final_points.append({
            "id": p.id, "name": p.name, "category": p.category,
            "latitude": lat, "longitude": lon, "description": p.description,
            "rating": p.rating or 0.0
        })

    # Д) Будуємо Itinerary (кроки маршруту) на основі 'legs' від Mapbox
    itinerary = []
    prev_name = "Ваша локація"
    stay_time = 30  # хвилин на кожній зупинці

    for i, leg in enumerate(route_data['legs']):
        itinerary.append({
            "from_name": prev_name,
            "to_name": final_points[i]['name'],
            "duration_min": int(leg['duration'] / 60),
            "distance_m": int(leg['distance']),
            "stay_min": stay_time
        })
        prev_name = final_points[i]['name']

    # Е) Фінальна відповідь (згідно зі schemas.RouteResponse)
    total_travel_time = int(route_data['total_duration'] / 60)
    total_stay_time = len(final_points) * stay_time

    response_payload = {
        "points": final_points,
        "geometry": route_data['geometry'],
        "itinerary": itinerary,
        "total_duration_min": total_travel_time + total_stay_time
    }

    # Є) Зберігаємо в історію
    if req.user_id:
        city_display = "Місто"
        desc = suggested_places[0].description or ""
        if "Місто: " in desc:
            city_raw = desc.split("Місто: ")[1].split(" |")[0]
            translations = {"Kyiv": "Київ", "Lviv": "Львів", "Chernivtsi": "Чернівці", "Ternopil": "Тернопіль"}
            city_display = translations.get(city_raw, city_raw)

        try:
            new_history = models.SavedRoute(
                user_id=req.user_id,
                route_name=f"{city_display}: {response_payload['total_duration_min']} хв",
                total_duration=response_payload['total_duration_min'],
                points_summary=" -> ".join([p["name"] for p in final_points]),
                route_data=jsonable_encoder(response_payload)
            )
            db.add(new_history)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"History Save Error: {e}")

    return response_payload