import sys
import os
import requests
from sqlalchemy import func
# Додаємо імпорт engine для керування таблицями
from database import SessionLocal, engine
import models

# --- НАЛАШТУВАННЯ ---
CITY_NAME = "Львів"
OVERPASS_URL = "http://overpass-api.de/api/interpreter"

# Запит до OSM (додано historic та бари)
OSM_QUERY = f"""
[out:json][timeout:60];
area["name:uk"="{CITY_NAME}"]->.searchArea;
(
  node["tourism"~"museum|attraction"](area.searchArea);
  node["historic"~"monument|memorial"](area.searchArea);
  node["amenity"~"cafe|restaurant|bar|pub"](area.searchArea);
  way["leisure"="park"](area.searchArea);
);
out center;
"""


def map_category(tags):
    """Мапування тегів OSM на категорії додатка"""
    if "historic" in tags or "tourism" in tags: return "culture"
    if "amenity" in tags: return "food"
    if "leisure" in tags: return "nature"
    return "other"


def seed_db():
    # --- КРОК 1: ПЕРЕЗАВАНТАЖЕННЯ ТАБЛИЦЬ ---
    print("🗑️ Очищення бази даних та перестворення таблиць...")
    # Видаляємо всі існуючі таблиці, описані в models
    models.Base.metadata.drop_all(bind=engine)
    # Створюємо їх заново з чистого аркуша
    models.Base.metadata.create_all(bind=engine)
    print("✅ Таблиці перестворено.")

    # --- КРОК 2: ОТРИМАННЯ ДАНИХ ---
    print(f"📡 Запит до OpenStreetMap для міста {CITY_NAME}...")
    try:
        response = requests.post(OVERPASS_URL, data={'data': OSM_QUERY}, timeout=60)
        elements = response.json().get('elements', [])
    except Exception as e:
        print(f"❌ Помилка мережі: {e}")
        return

    if not elements:
        print("📭 Об'єктів не знайдено.")
        return

    # --- КРОК 3: ЗАПОВНЕННЯ БАЗИ ---
    db = SessionLocal()
    print(f"📥 Знайдено {len(elements)} локацій. Починаємо імпорт...")

    try:
        added_count = 0
        for el in elements:
            tags = el.get('tags', {})
            name = tags.get('name') or tags.get('name:uk') or tags.get('name:en')

            # Визначаємо координати (враховуємо центри для парків)
            lon = el.get('lon') or el.get('center', {}).get('lon')
            lat = el.get('lat') or el.get('center', {}).get('lat')

            if not (name and lon and lat):
                continue

            # Створюємо об'єкт місця з правильним SRID 4326
            place = models.Place(
                name=name,
                description=tags.get('description', f"Категорія: {map_category(tags)}"),
                category=map_category(tags),
                rating=4.5,  # Базовий рейтинг
                location=func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)
            )
            db.add(place)
            added_count += 1

        db.commit()
        print(f"🚀 Успішно додано {added_count} нових точок!")

    except Exception as e:
        print(f"❌ Помилка запису: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_db()