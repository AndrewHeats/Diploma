from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database, crud
from services import route_manager

app = FastAPI(title="Travel App API - Lviv Edition")

# Створюємо таблиці
models.Base.metadata.create_all(bind=database.engine)

# --- 1. АВТОРИЗАЦІЯ ---

@app.post("/users/", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    if crud.get_user_by_email(db, email=user.email):
        raise HTTPException(status_code=400, detail="Email вже зайнятий")
    return crud.create_user(db=db, user=user)

@app.post("/login/", response_model=schemas.User)
def login(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    # Спрощена перевірка пароля (notreallyhashed для тестування)
    if not db_user or db_user.hashed_password != user.password + "notreallyhashed":
        raise HTTPException(status_code=400, detail="Невірний email або пароль")
    return db_user

# --- 2. ГЕНЕРАЦІЯ МАРШРУТУ ---

@app.post("/generate-route/", response_model=schemas.RouteResponse)
async def generate_route(req: schemas.RouteRequest, db: Session = Depends(database.get_db)):
    result = await route_manager.create_full_route(db, req)
    if not result:
        raise HTTPException(status_code=404, detail="Маршрут не знайдено")
    return result

# --- 3. КЕРУВАННЯ ІСТОРІЄЮ ---

@app.get("/history/{user_id}", response_model=List[schemas.HistoryItem])
def get_history(user_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.SavedRoute).filter(models.SavedRoute.user_id == user_id).order_by(
        models.SavedRoute.created_at.desc()).all()

@app.delete("/history/{route_id}")
def delete_route(route_id: int, db: Session = Depends(database.get_db)):
    db_route = db.query(models.SavedRoute).filter(models.SavedRoute.id == route_id).first()
    if not db_route:
        raise HTTPException(status_code=404, detail="Маршрут не знайдено")
    db.delete(db_route)
    db.commit()
    return {"message": "Видалено"}

@app.patch("/history/{route_id}", response_model=schemas.HistoryItem)
def update_name(route_id: int, data: schemas.UpdateRouteName, db: Session = Depends(database.get_db)):
    db_route = db.query(models.SavedRoute).filter(models.SavedRoute.id == route_id).first()
    if not db_route:
        raise HTTPException(status_code=404, detail="Маршрут не знайдено")
    db_route.route_name = data.route_name
    db.commit()
    db.refresh(db_route)
    return db_route

# --- 4. ЧОРНИЙ СПИСОК (НОВЕ!) ---

@app.get("/blacklist/{user_id}")
def get_user_blacklist(user_id: int, db: Session = Depends(database.get_db)):
    # 1. Отримуємо дані з приєднанням таблиці місць
    blacklist_query = db.query(models.Place).join(
        models.UserBlacklist, models.Place.id == models.UserBlacklist.place_id
    ).filter(models.UserBlacklist.user_id == user_id).all()

    formatted_list = []

    for p in blacklist_query:
        # 2. Витягуємо координати з бінарного поля location
        # ST_X та ST_Y перетворюють геометрію в числа (lon/lat)
        lon = db.scalar(func.ST_X(p.location))
        lat = db.scalar(func.ST_Y(p.location))

        # 3. Формуємо чистий словник, який FastAPI зможе перетворити на JSON
        formatted_list.append({
            "id": int(p.id),
            "name": str(p.name or "Цікаве місце"),
            "category": str(p.category or "Пам'ятка"),
            "latitude": float(lat) if lat else 0.0,
            "longitude": float(lon) if lon else 0.0,
            "description": str(p.description or "")
        })

    return formatted_list

@app.post("/blacklist/add")
def add_to_blacklist(data: dict, db: Session = Depends(database.get_db)):
    new_ban = models.UserBlacklist(user_id=data['user_id'], place_id=data['place_id'])
    db.add(new_ban)
    db.commit()
    return {"status": "blocked"}

@app.delete("/blacklist/remove")
def remove_from_blacklist(data: dict, db: Session = Depends(database.get_db)):
    ban_record = db.query(models.UserBlacklist).filter(
        models.UserBlacklist.user_id == data['user_id'],
        models.UserBlacklist.place_id == data['place_id']
    ).first()
    if ban_record:
        db.delete(ban_record)
        db.commit()
    return {"status": "unblocked"}