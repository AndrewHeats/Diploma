import requests
import time
from sqlalchemy import func
from database import SessionLocal, engine
import models

# --- НАЛАШТУВАННЯ ---
# Координати Львова: South, West, North, East (найстабільніша зона)
BBOX = "49.76,23.88,49.93,24.13"

# Список робочих дзеркал Overpass API для ротації (захист від блокувань)
SERVERS = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
]

# РОЗПОДІЛЕНІ ЗАПИТИ (захист від помилки 504 Timeout)
QUERIES = {
    "culture_arts": 'nwr["tourism"~"museum|gallery|arts_centre"]; nwr["amenity"="theatre"];',
    "culture_religion": 'nwr["amenity"="place_of_worship"];',
    "culture_history": 'nwr["historic"~"monument|memorial|statue|castle"]; nwr["tourism"~"viewpoint|attraction|artwork"];',
    "food_rest": 'nwr["amenity"="restaurant"];',
    "food_cafe": 'nwr["amenity"~"cafe|bar|pub|ice_cream"];',
    "nature": 'nwr["leisure"~"park|garden"]; nwr["place"="square"];'
}


def map_cuisine_tag(tags):
    """Синхронізація з ProfileScreen: ukrainian, italian, jewish, regional, coffee_shop, burger"""
    c = tags.get('cuisine', '').lower()
    a = tags.get('amenity', '').lower()
    if 'ukrainian' in c: return 'ukrainian'
    if 'italian' in c or 'pizza' in c: return 'italian'
    if 'jewish' in c: return 'jewish'
    if any(x in c for x in ['regional', 'galician', 'local', 'austrian']): return 'regional'
    if a == 'cafe' or 'coffee' in c: return 'coffee_shop'
    if 'burger' in c or 'fast_food' in a: return 'burger'
    return None


def fetch_data(query_filter, server_index=0):
    """Функція для отримання даних з обробкою помилок та зміною серверів"""
    query = f'[out:json][timeout:180][bbox:{BBOX}];({query_filter});out center;'
    headers = {'User-Agent': 'LvivTouristApp_Diploma_v7'}

    try:
        url = SERVERS[server_index]
        print(f"📡 Запит до: {url.split('/')[2]}...")
        resp = requests.post(url, data={'data': query}, headers=headers, timeout=200)

        if resp.status_code == 429:
            print("⚠️ Помилка 429 (Забагато запитів). Чекаємо 30с та міняємо дзеркало...")
            time.sleep(30)
            return fetch_data(query_filter, (server_index + 1) % len(SERVERS))

        if resp.status_code == 200:
            return resp.json().get('elements', [])

        print(f"⚠️ Помилка {resp.status_code}. Пробуємо інше дзеркало...")
        if server_index < len(SERVERS) - 1:
            return fetch_data(query_filter, server_index + 1)

    except Exception as e:
        print(f"❌ Помилка з'єднання: {e}")
    return []


def seed_db(full_reset=False):
    """
    Основна функція завантаження.
    full_reset=True видалить всі старі дані.
    full_reset=False (за замовчуванням) просто довантажить нові точки.
    """
    if full_reset:
        print("🗑️ ПОВНЕ ОЧИЩЕННЯ БАЗИ ДАНИХ...")
        models.Base.metadata.drop_all(bind=engine)

    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    total_added = 0

    print(f"🚀 Починаємо {'перестворення' if full_reset else 'довантаження'} локацій...")

    for key, osm_filter in QUERIES.items():
        # Визначаємо категорію для твого додатка
        final_cat = "culture" if "culture" in key else ("food" if "food" in key else key)
        print(f"\n🔍 Опрацювання підкатегорії: {key.upper()}")

        elements = fetch_data(osm_filter)
        if not elements:
            print(f"📭 Не вдалося отримати дані для {key}.")
            continue

        added_this_round = 0
        for el in elements:
            tags = el.get('tags', {})
            name = tags.get('name:uk') or tags.get('name') or tags.get('name:en')
            if not name: continue

            # ЗАХИСТ ВІД ДУБЛІКАТІВ: Перевіряємо, чи є місце з такою назвою
            exists = db.query(models.Place).filter(models.Place.name == name).first()
            if exists: continue

            lon = el.get('lon') or el.get('center', {}).get('lon')
            lat = el.get('lat') or el.get('center', {}).get('lat')

            cuisine_id = map_cuisine_tag(tags)
            # Формуємо опис з міткою для твого алгоритму маршрутів
            description = f"Категорія: {final_cat}"
            if cuisine_id:
                description += f" | CUISINE_TAG:{cuisine_id}"

            place = models.Place(
                name=name,
                description=description,
                category=final_cat,
                rating=4.5,
                location=func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)
            )
            db.add(place)
            added_this_round += 1
            total_added += 1

        db.commit()
        print(f"✅ Додано нових об'єктів: {added_this_round}")
        time.sleep(5)  # Пауза для стабільності

    db.close()
    print(f"\n🏁 ФІНІШ! Всього додано {total_added} нових точок.")


if __name__ == "__main__":
    # Якщо хочеш стерти все і почати з нуля - постав True
    seed_db(full_reset=False)