import os
import json
import google.generativeai as genai
from sqlalchemy.orm import Session
from sqlalchemy import func
import models

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


def get_city_recommendations(user_id: int, city_name: str, db: Session, limit: int = 5):
    try:
        # 1. Отримуємо лайки юзера
        liked_places = db.query(models.Place).join(
            models.UserLikedPlace, models.Place.id == models.UserLikedPlace.place_id
        ).filter(models.UserLikedPlace.user_id == user_id).all()

        if not liked_places:
            random_places = db.query(models.Place).filter(
                models.Place.description.like(f"%Місто: {city_name}%")
            ).order_by(func.random()).limit(limit).all()
            return _format_output(db, random_places)

        # 2. Шукаємо 40 кандидатів у місті (не лайкнутих)
        liked_ids = [p.id for p in liked_places]
        candidates = db.query(models.Place).filter(
            models.Place.description.like(f"%Місто: {city_name}%"),
            models.Place.id.not_in(liked_ids)
        ).order_by(func.random()).limit(40).all()

        if not candidates:
            print(f"⚠️ Кандидатів для міста {city_name} не знайдено в базі!")
            return []

        # --- БЛОК ШІ ---
        try:
            liked_context = ", ".join([f"{p.name} ({p.category})" for p in liked_places])
            candidates_context = "\n".join([f"ID:{p.id} | {p.name} ({p.category})" for p in candidates])

            prompt = f"""
            Ти експерт-гід. Користувач любить: {liked_context}.
            Доступні місця:
            {candidates_context}

            Вибери {limit} найкращих місць.
            Поверни ТІЛЬКИ масив ID у форматі JSON.
            """

            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )

            data = json.loads(response.text)
            recommended_ids = []

            # ЗАХИСТ ВІД ШІ: Якщо він повернув список [1, 2] або словник {"places": [1, 2]}
            if isinstance(data, list):
                recommended_ids = data
            elif isinstance(data, dict):
                # Шукаємо перший-ліпший список всередині словника
                for val in data.values():
                    if isinstance(val, list):
                        recommended_ids = val
                        break

            # Дістаємо місця з бази
            if recommended_ids:
                ai_recommendations = db.query(models.Place).filter(
                    models.Place.id.in_(recommended_ids)
                ).all()

                if len(ai_recommendations) > 0:
                    print(f"✅ AI успішно підібрав {len(ai_recommendations)} місць!")
                    return _format_output(db, ai_recommendations)

        except Exception as ai_error:
            print(f"⚠️ Помилка AI (йдемо за резервним планом): {ai_error}")

        # --- РЕЗЕРВНИЙ ПЛАН (Fallback) ---
        categories = [p.category for p in liked_places]
        top_category = max(set(categories), key=categories.count)

        fallback_recs = db.query(models.Place).filter(
            models.Place.description.like(f"%Місто: {city_name}%"),
            models.Place.category == top_category,
            models.Place.id.not_in(liked_ids)
        ).order_by(func.random()).limit(limit).all()

        # ЗАХИСТ ФОЛБЕКУ: Якщо місць потрібної категорії більше немає - беремо будь-які круті місця
        if not fallback_recs:
            print(f"⚠️ Увага: Топ-категорія порожня, беремо рандомні місця для {city_name}")
            fallback_recs = db.query(models.Place).filter(
                models.Place.description.like(f"%Місто: {city_name}%"),
                models.Place.id.not_in(liked_ids)
            ).order_by(func.random()).limit(limit).all()

        return _format_output(db, fallback_recs)

    except Exception as main_e:
        print(f"🚨 Критична помилка у рекомендаторі: {main_e}")
        return []


def _format_output(db, places_list):
    return [{
        "id": p.id,
        "name": p.name,
        "category": p.category,
        "latitude": db.scalar(func.ST_Y(p.location)),
        "longitude": db.scalar(func.ST_X(p.location)),
        "description": p.description
    } for p in places_list]