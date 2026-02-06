import requests
import time
from sqlalchemy import func
from database import SessionLocal, engine
import models

# --- ГЕОГРАФІЯ УКРАЇНИ ---
CITIES = {
    "Lviv": "49.76,23.88,49.93,24.13",
    "Kyiv": "50.36,30.30,50.55,30.75",
    "Odesa": "46.35,30.60,46.60,30.85",
    "Kharkiv": "49.88,36.10,50.10,36.45",
    "Dnipro": "48.35,34.85,48.55,35.20",
    "Ivano-Frankivsk": "48.87,24.65,48.97,24.78",
    "Ternopil": "49.52,25.55,49.59,25.65",
    "Chernivtsi": "48.25,25.88,48.33,26.00",
    "Vinnytsia": "49.20, 28.38, 49.28, 28.54"
}

OSM_SERVERS = ["https://overpass-api.de/api/interpreter", "https://lz4.overpass-api.de/api/interpreter"]

QUERIES = {
    "culture": 'nwr["tourism"~"museum|gallery|attraction"]; nwr["historic"~"monument|memorial|statue|castle"];',
    "food": 'nwr["amenity"~"restaurant|cafe|bar|pub"];',
    "nature": 'nwr["leisure"~"park|garden"]; nwr["place"~"square|park"];',
}


def fetch_data(query_filter, bbox):
    query = f'[out:json][timeout:180][bbox:{bbox}];({query_filter});out center;'
    for server in OSM_SERVERS:
        try:
            resp = requests.post(server, data={'data': query}, timeout=200)
            if resp.status_code == 200: return resp.json().get('elements', [])
        except:
            continue
    return []


def seed_db(full_reset=False):
    if full_reset: models.Base.metadata.drop_all(bind=engine)
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    for city_name, bbox in CITIES.items():
        print(f"🌆 Обробка: {city_name}...")
        for cat, osm_filter in QUERIES.items():
            elements = fetch_data(osm_filter, bbox)
            for el in elements:
                tags = el.get('tags', {})
                name = tags.get('name:uk') or tags.get('name')
                if not name or db.query(models.Place).filter(models.Place.name == name).first(): continue

                lon = el.get('lon') or el.get('center', {}).get('lon')
                lat = el.get('lat') or el.get('center', {}).get('lat')

                place = models.Place(
                    name=name,
                    description=f"Категорія: {cat} | Місто: {city_name}",
                    category=cat,
                    location=func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)
                )
                db.add(place)
            db.commit()
    db.close()
    print("🏁 Усі міста в базі!")


if __name__ == "__main__":
    seed_db(full_reset=True)