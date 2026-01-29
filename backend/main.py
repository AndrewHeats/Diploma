from fastapi import FastAPI, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime
import models, schemas, database, crud
from services import algorithm, routing

app = FastAPI(title="Travel App API")

# Автоматичне створення таблиць при старті
models.Base.metadata.create_all(bind=database.engine)

# Реєстрація користувача
@app.post("/users/", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Цей Email вже зареєстровано")
    return crud.create_user(db=db, user=user)

# Генерація нового маршруту
@app.post("/generate-route/", response_model=schemas.RouteResponse)
async def generate_route(req: schemas.RouteRequest, db: Session = Depends(database.get_db)):
    limit_map = {"short": 3, "medium": 5, "long": 9}
    point_limit = limit_map.get(req.duration_type, 5)

    suggested = algorithm.suggest_locations(db, req.start_lat, req.start_lon, req.preferences, point_limit)
    if not suggested:
        raise HTTPException(status_code=404, detail="Місць не знайдено")

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

    nav_data = await routing.get_detailed_route(coords)
    if not nav_data:
        raise HTTPException(status_code=500, detail="Mapbox error")

    # Побудова детального плану (itinerary)
    itinerary = []
    names = ["Мій Готель"] + [p.name for p in suggested]
    for i, leg in enumerate(nav_data['legs']):
        itinerary.append(schemas.RouteStep(
            from_name=names[i],
            to_name=names[i+1],
            duration_min=round(leg['duration'] / 60),
            distance_m=round(leg['distance'])
        ))

    final_result = {
        "points": formatted_points,
        "geometry": nav_data['geometry'],
        "itinerary": itinerary,
        "total_duration_min": round(nav_data['total_duration'] / 60)
    }

    if req.user_id:
        try:
            new_history = models.SavedRoute(
                user_id=req.user_id,
                route_name=f"Маршрут {datetime.now().strftime('%H:%M')}",
                total_duration=final_result["total_duration_min"],
                points_summary=" -> ".join([p.name for p in suggested]),
                route_data=jsonable_encoder(final_result)
            )
            db.add(new_history)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"ERROR: Не вдалося зберегти історію: {e}")

    return final_result

# Отримання історії
@app.get("/history/{user_id}", response_model=List[schemas.HistoryItem])
def get_history(user_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.SavedRoute).filter(models.SavedRoute.user_id == user_id).order_by(models.SavedRoute.created_at.desc()).all()

# Видалення з історії
@app.delete("/history/{route_id}")
def delete_route(route_id: int, db: Session = Depends(database.get_db)):
    db_route = db.query(models.SavedRoute).filter(models.SavedRoute.id == route_id).first()
    if not db_route:
        raise HTTPException(status_code=404, detail="Не знайдено")
    db.delete(db_route)
    db.commit()
    return {"message": "Видалено"}

# Редагування назви
@app.patch("/history/{route_id}", response_model=schemas.HistoryItem)
def update_name(route_id: int, data: schemas.UpdateRouteName, db: Session = Depends(database.get_db)):
    db_route = db.query(models.SavedRoute).filter(models.SavedRoute.id == route_id).first()
    if not db_route:
        raise HTTPException(status_code=404, detail="Не знайдено")
    db_route.route_name = data.route_name
    db.commit()
    db.refresh(db_route)
    return db_route