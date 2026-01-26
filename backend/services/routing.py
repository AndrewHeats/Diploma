import httpx
import os
from dotenv import load_dotenv

load_dotenv()
MAPBOX_TOKEN = os.getenv("MAPBOX_API_KEY")


async def get_detailed_route(coordinates: list, profile: str = "walking"):
    """
    Запит до Mapbox для отримання геометрії та кроків.
    coordinates: [[lon, lat], [lon, lat], ...]
    """
    if not MAPBOX_TOKEN:
        print("ERROR: MAPBOX_TOKEN не знайдено!")
        return None

    # Формуємо рядок координат: lon,lat;lon,lat
    coords_str = ";".join([f"{c[0]},{c[1]}" for c in coordinates])

    # ВАЖЛИВО: додаємо geometries=geojson
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
                print(f"Mapbox Error: {data.get('message', 'Unknown error')}")
                return None

            route = data['routes'][0]
            return {
                "geometry": route['geometry'],  # Тепер це об'єкт з координатами
                "legs": route['legs'],
                "total_duration": route['duration'],
                "total_distance": route['distance']
            }
        except Exception as e:
            print(f"Routing Exception: {e}")
            return None