from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database, crud
from services import route_manager, recommender

app = FastAPI(title="Travel App API - Full Edition")

# Створюємо таблиці (включаючи chat_messages)
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
    if not db_user or db_user.hashed_password != user.password + "notreallyhashed":
        raise HTTPException(status_code=400, detail="Невірний email або пароль")
    return db_user


# --- 2. ГЕНЕРАЦІЯ МАРШРУТУ ---
@app.post("/generate-route/", response_model=schemas.RouteResponse)
async def generate_route(req: schemas.RouteRequest, db: Session = Depends(database.get_db)):
    result = await route_manager.create_full_route(db, req)
    if not result or not result.get("points"):
        raise HTTPException(status_code=404, detail="Не знайдено місць поруч.")
    return result


# --- 3. ІСТОРІЯ ---
@app.get("/history/{user_id}", response_model=List[schemas.HistoryItem])
def get_history(user_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.SavedRoute).filter(models.SavedRoute.user_id == user_id).order_by(
        models.SavedRoute.created_at.desc()).all()


@app.delete("/history/{route_id}")
def delete_route(route_id: int, db: Session = Depends(database.get_db)):
    db.query(models.SavedRoute).filter(models.SavedRoute.id == route_id).delete()
    db.commit()
    return {"message": "Видалено"}


@app.patch("/history/{route_id}/like")
def toggle_like_route(route_id: int, db: Session = Depends(database.get_db)):
    # Це поле треба додати в SavedRoute (is_liked), якщо його немає - можна пропустити
    pass


# --- 4. ЧОРНИЙ СПИСОК ---
@app.get("/blacklist/{user_id}")
def get_user_blacklist(user_id: int, db: Session = Depends(database.get_db)):
    blacklist_query = db.query(models.Place).join(
        models.UserBlacklist, models.Place.id == models.UserBlacklist.place_id
    ).filter(models.UserBlacklist.user_id == user_id).all()

    return [{
        "id": int(p.id),
        "name": str(p.name),
        "category": str(p.category),
        "latitude": db.scalar(func.ST_Y(p.location)),
        "longitude": db.scalar(func.ST_X(p.location)),
        "description": str(p.description)
    } for p in blacklist_query]


@app.post("/blacklist/add")
def add_to_blacklist(data: dict, db: Session = Depends(database.get_db)):
    db.add(models.UserBlacklist(user_id=data['user_id'], place_id=data['place_id']))
    db.commit()
    return {"status": "blocked"}


@app.delete("/blacklist/remove")
def remove_from_blacklist(data: dict, db: Session = Depends(database.get_db)):
    db.query(models.UserBlacklist).filter(
        models.UserBlacklist.user_id == data['user_id'],
        models.UserBlacklist.place_id == data['place_id']
    ).delete()
    db.commit()
    return {"status": "unblocked"}


# --- 5. ЛАЙКИ ТА AI РЕКОМЕНДАЦІЇ ---
@app.post("/places/{place_id}/like")
def toggle_place_like(place_id: int, user_id: int, db: Session = Depends(database.get_db)):
    existing = db.query(models.UserLikedPlace).filter(
        models.UserLikedPlace.user_id == user_id, models.UserLikedPlace.place_id == place_id
    ).first()
    if existing:
        db.delete(existing);
        db.commit()
        return {"status": "unliked"}

    db.add(models.UserLikedPlace(user_id=user_id, place_id=place_id))
    db.commit()
    return {"status": "liked"}


@app.get("/recommendations/{user_id}/{city_name}")
def get_ai_recommendations(user_id: int, city_name: str, db: Session = Depends(database.get_db)):
    return recommender.get_city_recommendations(user_id=user_id, city_name=city_name, db=db)


# --- 6. ЧАТ (ФОРУМ) ---
@app.get("/chat/{city_name}", response_model=List[schemas.MessageResponse])
def get_chat_messages(city_name: str, db: Session = Depends(database.get_db)):
    messages = db.query(models.ChatMessage).filter(
        models.ChatMessage.city_name == city_name
    ).order_by(models.ChatMessage.created_at.asc()).all()

    return [schemas.MessageResponse(
        id=m.id, content=m.content, city_name=m.city_name,
        created_at=m.created_at, user_email=m.user.email if m.user else "Anon"
    ) for m in messages]


@app.post("/chat/", response_model=schemas.MessageResponse)
def send_message(msg: schemas.MessageCreate, db: Session = Depends(database.get_db)):
    new_msg = models.ChatMessage(user_id=msg.user_id, city_name=msg.city_name, content=msg.content)
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)

    user_email = db.query(models.User).filter(models.User.id == msg.user_id).first().email
    return schemas.MessageResponse(
        id=new_msg.id, content=new_msg.content, city_name=new_msg.city_name,
        created_at=new_msg.created_at, user_email=user_email
    )