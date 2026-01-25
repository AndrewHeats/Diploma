from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import models, schemas, services.algorithm as algorithm,  services.routing as routing
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)
app = FastAPI()


@app.post("/generate-route/", response_model=schemas.RouteResponse)
async def generate_route(request: schemas.RouteRequest, db: Session = Depends(get_db)):
    suggested_places = algorithm.get_personalized_route(
        db, lat=request.start_lat, lon=request.start_lon,
        preferences=request.preferences, duration_type=request.duration_type,
        radius_km=request.radius_km
    )

    if not suggested_places:
        raise HTTPException(status_code=404, detail="Місць не знайдено.")

    route_coords = [[request.start_lon, request.start_lat]]
    response_points = []

    for p in suggested_places:
        lon = db.scalar(func.ST_X(p.location))
        lat = db.scalar(func.ST_Y(p.location))
        response_points.append(schemas.Place(
            id=p.id, name=p.name, category=p.category,
            rating=p.rating, latitude=lat, longitude=lon
        ))
        route_coords.append([lon, lat])

    navigation_data = await routing.get_mapbox_route(route_coords, request.transport_type)
    if not navigation_data or 'routes' not in navigation_data:
        raise HTTPException(status_code=500, detail="Помилка Mapbox.")

    route_info = navigation_data['routes'][0]
    return {
        "points": response_points,
        "geometry": route_info.get("geometry"),
        "total_distance_meters": route_info.get("distance"),
        "estimated_time_minutes": int(route_info.get("duration") / 60)
    }