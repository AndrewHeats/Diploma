import requests
import time
from sqlalchemy import func
from database import SessionLocal, engine
import models

# --- НАЛАШТУВАННЯ МІСТ ---
# Розширив рамки для Києва, щоб охопити весь центр і спальні райони
CITIES = {
    "Lviv": "49.76,23.88,49.93,24.13",
    "Kyiv": "50.36,30.30,50.55,30.75"
}

# Список серверів (якщо один перевантажений, спробуємо інший)
OSM_SERVERS = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
]

QUERIES = {
    "culture": 'nwr["tourism"~"museum|gallery|attraction"]; nwr["historic"~"monument|memorial|statue|castle"]; nwr["amenity"="theatre"];',
    "food": 'nwr["amenity"~"restaurant|cafe|bar|pub|fast_food"];',
    "nature": 'nwr["leisure"~"park|garden|nature_reserve"]; nwr["place"~"square|park"];',
    "religion": 'nwr["amenity"="place_of_worship"];'
}


def map_cuisine_tag(tags):
    c = tags.get('cuisine', '').lower()
    a = tags.get('amenity', '').lower()
    if 'ukrainian' in c: return 'ukrainian'
    if any(x in c for x in ['italian', 'pizza']): return 'italian'
    if any(x in c for x in ['asian', 'sushi', 'chinese', 'japanese']): return 'asian'
    if 'georgian' in c: return 'georgian'
    if a == 'cafe' or 'coffee' in c: return 'coffee_shop'
    if any(x in c for x in ['burger', 'american']): return 'burger'
    return None


def fetch_data(query_filter, bbox):
    # Використовуємо глобальний bbox Overpass
    query = f'[out:json][timeout:180][bbox:{bbox}];({query_filter});out center;'

    for server_url in OSM_SERVERS:
        try:
            print(f"    📡 Запит до {server_url}...")
            resp = requests.post(server_url, data={'data': query}, timeout=200)
            if resp.status_code == 200:
                data = resp.json().get('elements', [])
                if data: return data
            print(f"    ⚠️ Сервер повернув порожній результат або статус {resp.status_code}")
        except Exception as e:
            print(f"    ❌ Помилка сервера: {e}")
        time.sleep(2)  # Пауза перед наступною спробою
    return []


def seed_db(full_reset=False):
    if full_reset:
        print("🗑️ ПОВНЕ ОЧИЩЕННЯ БАЗИ...")
        models.Base.metadata.drop_all(bind=engine)

    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    total_added = 0

    for city_name, bbox in CITIES.items():
        print(f"🌆 ОБРОБКА МІСТА: {city_name}...")
        for cat_key, osm_filter in QUERIES.items():
            print(f"  🔍 Пошук: {cat_key}...")
            elements = fetch_data(osm_filter, bbox)

            added_in_cat = 0
            for el in elements:
                tags = el.get('tags', {})
                name = tags.get('name:uk') or tags.get('name') or tags.get('name:en')
                if not name: continue

                # Перевірка на дублікати
                if db.query(models.Place).filter(models.Place.name == name).first():
                    continue

                lon = el.get('lon') or el.get('center', {}).get('lon')
                lat = el.get('lat') or el.get('center', {}).get('lat')
                cuisine_id = map_cuisine_tag(tags)

                # Категоризація
                final_cat = "culture" if cat_key in ["culture", "religion"] else cat_key

                description = f"Категорія: {final_cat} | Місто: {city_name}"
                if cuisine_id: description += f" | CUISINE_TAG:{cuisine_id}"

                place = models.Place(
                    name=name,
                    description=description,
                    category=final_cat,
                    rating=4.5,
                    location=func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)
                )
                db.add(place)
                added_in_cat += 1
                total_added += 1

            db.commit()
            print(f"  ✅ Додано {added_in_cat} об'єктів у категорії {cat_key}")
            time.sleep(1)

    db.close()
    print(f"🏁 ФІНІШ! Всього в базі: {total_added} об'єктів.")


if __name__ == "__main__":
    seed_db(full_reset=True)