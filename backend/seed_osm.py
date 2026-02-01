import requests
import time
from sqlalchemy import func
from database import SessionLocal, engine
import models

# --- ЧОРНИЙ СПИСОК (Сюди додаємо заклади, які закриті, але ще є в OSM) ---
BLACKLIST = ["У Мегрела", "U Megrela", "Мегрела"]

# Координати Львова для пошуку
BBOX = "49.76,23.88,49.93,24.13"

# Дзеркала для стабільності запитів
SERVERS = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter"
]

QUERIES = {
    "culture_arts": 'nwr["tourism"~"museum|gallery|arts_centre"]; nwr["amenity"="theatre"];',
    "culture_religion": 'nwr["amenity"="place_of_worship"];',
    "culture_history": 'nwr["historic"~"monument|memorial|statue|castle"]; nwr["tourism"~"viewpoint|attraction|artwork"];',
    "food_rest": 'nwr["amenity"="restaurant"];',
    "food_cafe": 'nwr["amenity"~"cafe|bar|pub|ice_cream"];',
    "nature": 'nwr["leisure"~"park|garden"]; nwr["place"="square"];'
}


def map_cuisine_tag(tags):
    """Синхронізація з профілем користувача та алгоритмом"""
    c = tags.get('cuisine', '').lower()
    a = tags.get('amenity', '').lower()

    if 'ukrainian' in c: return 'ukrainian'
    if 'italian' in c or 'pizza' in c: return 'italian'
    if 'jewish' in c: return 'jewish'
    if any(x in c for x in ['regional', 'galician', 'local', 'austrian']): return 'regional'
    if any(x in c for x in ['georgian', 'caucasian', 'khinkali']): return 'georgian'
    if any(x in c for x in ['greek', 'mediterranean']): return 'greek'
    if any(x in c for x in ['asian', 'chinese', 'japanese', 'sushi', 'thai', 'vietnamese', 'korean']): return 'asian'
    if a == 'cafe' or 'coffee' in c: return 'coffee_shop'
    if 'burger' in c or 'fast_food' in a: return 'burger'
    return None


def fetch_data(query_filter, server_index=0):
    query = f'[out:json][timeout:180][bbox:{BBOX}];({query_filter});out center;'
    headers = {'User-Agent': 'LvivTouristApp_Final_v12'}
    try:
        url = SERVERS[server_index]
        resp = requests.post(url, data={'data': query}, headers=headers, timeout=200)
        if resp.status_code == 429:
            time.sleep(10)
            return fetch_data(query_filter, (server_index + 1) % len(SERVERS))
        return resp.json().get('elements', []) if resp.status_code == 200 else []
    except:
        return []


def seed_db(full_reset=False):
    if full_reset:
        print("🗑️ ПОВНЕ ОЧИЩЕННЯ БАЗИ...")
        models.Base.metadata.drop_all(bind=engine)

    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    total_added = 0

    for key, osm_filter in QUERIES.items():
        final_cat = "culture" if "culture" in key else ("food" if "food" in key else key)
        elements = fetch_data(osm_filter)

        for el in elements:
            tags = el.get('tags', {})
            name = tags.get('name:uk') or tags.get('name') or tags.get('name:en')
            if not name: continue

            # ФІЛЬТРАЦІЯ: Чорний список та закриті заклади
            if any(b.lower() in name.lower() for b in BLACKLIST): continue

            is_closed = any([
                tags.get('disused') == 'yes',
                tags.get('abandoned') == 'yes',
                tags.get('closed') == 'yes',
                'closed' in tags.get('description', '').lower()
            ])
            if is_closed: continue

            if db.query(models.Place).filter(models.Place.name == name).first(): continue

            lon = el.get('lon') or el.get('center', {}).get('lon')
            lat = el.get('lat') or el.get('center', {}).get('lat')
            cuisine_id = map_cuisine_tag(tags)

            description = f"Категорія: {final_cat}"
            if cuisine_id: description += f" | CUISINE_TAG:{cuisine_id}"

            place = models.Place(
                name=name,
                description=description,
                category=final_cat,
                rating=4.5,
                location=func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)
            )
            db.add(place)
            total_added += 1

        db.commit()
        print(f"✅ Категорія {key} опрацьована")

    db.close()
    print(f"🏁 Фініш! Додано {total_added} активних об'єктів.")


if __name__ == "__main__":
    seed_db(full_reset=True)