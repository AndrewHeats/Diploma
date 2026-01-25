import httpx
import os
import time  # Додаємо для заміру часу


async def get_mapbox_route(coordinates: list, profile: str = "walking"):
    MAPBOX_TOKEN = os.getenv("MAPBOX_API_KEY")
    if not MAPBOX_TOKEN:
        print("❌ Помилка: Токен Mapbox відсутній!")
        return None

    coords_str = ";".join([f"{c[0]},{c[1]}" for c in coordinates])
    url = f"https://api.mapbox.com/directions/v5/mapbox/{profile}/{coords_str}"

    print(f"📡 Запит до Mapbox: {len(coordinates)} точок...")
    start_time = time.time()

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params={
                "access_token": MAPBOX_TOKEN,
                "geometries": "geojson",
                "overview": "full"
            }, timeout=15.0)  # Збільшуємо таймаут тут

            end_time = time.time()
            print(f"🕒 Mapbox відповів за {round(end_time - start_time, 2)} сек.")

            if response.status_code == 200:
                return response.json()
            else:
                print(f"❌ Mapbox Error: {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ Помилка Mapbox: {e}")
            return None