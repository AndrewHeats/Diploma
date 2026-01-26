from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime
import models, schemas, database, crud
from services import algorithm, routing

app = FastAPI(title="Travel App API")

models.Base.metadata.create_all(bind=database.engine)


@app.post("/users/", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email вже зайнятий")
    return crud.create_user(db=db, user=user)


@app.post("/generate-route/", response_model=schemas.RouteResponse)
async def generate_route(req: schemas.RouteRequest, db: Session = Depends(database.get_db)):
    # 1. Визначаємо кількість точок
    limit_map = {"short": 3, "medium": 5, "long": 9}
    point_limit = limit_map.get(req.duration_type, 5)

    # 2. Пошук місць (Львів - 1311 точок у вас в базі)
    suggested = algorithm.suggest_locations(
        db, req.start_lat, req.start_lon, req.preferences, point_limit
    )

    if not suggested:
        raise HTTPException(status_code=404, detail="Місць не знайдено поруч")

    # 3. Координати для Mapbox
    coords = [[req.start_lon, req.start_lat]]
    formatted_points = []

    for p in suggested:
        lon = db.scalar(func.ST_X(p.location))
        lat = db.scalar(func.ST_Y(p.location))
        coords.append([lon, lat])
        formatted_points.append(schemas.Place(
            id=p.id, name=p.name, category=p.category,
            rating=p.rating, latitude=lat, longitude=lon
        ))

    # 4. Побудова маршруту
    nav_data = await routing.get_detailed_route(coords)
    if not nav_data:
        raise HTTPException(status_code=500, detail="Mapbox не зміг побудувати шлях")

    total_min = round(nav_data['total_duration'] / 60)

    # 5. Збереження в історію
    if req.user_id:
        try:
            summary = " -> ".join([p.name for p in suggested])
            new_history = models.SavedRoute(
                user_id=req.user_id,
                route_name=f"Маршрут {datetime.now().strftime('%H:%M')}",
                total_duration=total_min,
                points_summary=summary
            )
            db.add(new_history)
            db.commit()
            print(f"SUCCESS: Збережено для юзера {req.user_id}")
        except Exception as e:
            db.rollback()
            print(f"DATABASE ERROR: {e}")

    # 6. Кроки ітинерарію
    itinerary = []
    names = ["Мій Готель"] + [p.name for p in suggested]
    for i, leg in enumerate(nav_data['legs']):
        itinerary.append(schemas.RouteStep(
            from_name=names[i], to_name=names[i + 1],
            duration_min=round(leg['duration'] / 60),
            distance_m=round(leg['distance'])
        ))

    return {
        "points": formatted_points,
        "geometry": nav_data['geometry'],
        "itinerary": itinerary,
        "total_duration_min": total_min
    }


@app.get("/history/{user_id}", response_model=List[schemas.HistoryItem])
def get_history(user_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.SavedRoute).filter(models.SavedRoute.user_id == user_id).order_by(
        models.SavedRoute.created_at.desc()).all()